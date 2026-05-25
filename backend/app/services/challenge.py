from __future__ import annotations

import random
import uuid
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.challenge import ChallengeResult, ChallengeState
from app.pokemon_data import get_all_pokemon_ids, get_pokemon_by_id, get_pokemon_by_name
from app.services.scoring import (
    MAX_GUESSES,
    calculate_failure_score,
    calculate_success_score,
    get_hint_for_wrong_guess,
    hints_shown_from_guess_count,
)


TOTAL_POKEMON = 1025  # target Pokédex coverage


async def get_or_create_state(
    db: AsyncSession, user_id: uuid.UUID
) -> ChallengeState:
    result = await db.execute(
        select(ChallengeState).where(ChallengeState.user_id == user_id)
    )
    state = result.scalars().first()
    if state is None:
        state = ChallengeState(
            user_id=user_id,
            seen_ids=[],
            total_score=0,
            is_active=True,
            run_number=1,
        )
        db.add(state)
        await db.commit()
        await db.refresh(state)
    return state


async def get_next_pokemon_id(
    db: AsyncSession, user_id: uuid.UUID
) -> Optional[int]:
    """
    Pick the next unseen Pokemon ID for this run.
    Uses a seeded RNG based on (user_id, run_number, seen_count).
    Returns None if the entire Pokédex has been covered (run complete).
    """
    state = await get_or_create_state(db, user_id)
    all_ids = get_all_pokemon_ids()
    seen = set(state.seen_ids or [])
    remaining = [pid for pid in all_ids if pid not in seen]

    if not remaining:
        return None  # run complete

    # Deterministic but varied selection
    seed = f"{user_id}-{state.run_number}-{len(seen)}"
    rng = random.Random(seed)
    return rng.choice(remaining)


async def get_in_progress_challenge(
    db: AsyncSession, user_id: uuid.UUID, pokemon_id: int
) -> Optional[List[str]]:
    """
    Returns in-progress guesses for the current challenge pokemon.
    In-progress is stored as a ChallengeResult with score=-1.
    """
    result = await db.execute(
        select(ChallengeResult).where(
            ChallengeResult.user_id == user_id,
            ChallengeResult.pokemon_id == pokemon_id,
            ChallengeResult.score == -1,
        )
    )
    row = result.scalars().first()
    if row is None:
        return None
    return list(row.guesses or [])


async def process_challenge_guess(
    db: AsyncSession,
    user_id: uuid.UUID,
    pokemon_id: int,
    guess: str,
) -> Tuple[bool, Optional[Dict], List[str], Optional[int], bool, bool]:
    """
    Returns: (correct, hint_revealed, guesses_so_far, score, failed, run_reset)
    """
    state = await get_or_create_state(db, user_id)
    pokemon = get_pokemon_by_id(pokemon_id)
    if pokemon is None:
        raise ValueError(f"Pokemon {pokemon_id} not found")

    # Load or create in-progress row
    pending = await _get_pending_challenge_result(db, user_id, pokemon_id, state.run_number)
    guesses_so_far: List[str] = list(pending.guesses or []) if pending else []

    if len(guesses_so_far) >= MAX_GUESSES:
        raise ValueError("No more guesses available for this challenge")

    guess_normalized = guess.strip()
    correct_name = pokemon["name_en"]
    correct = guess_normalized.lower() == correct_name.lower()
    guesses_so_far.append(guess_normalized)
    wrong_count = len(guesses_so_far)

    hint_revealed = None
    score = None
    failed = False
    run_reset = False

    if correct:
        hints_shown = hints_shown_from_guess_count(wrong_count - 1)
        score = calculate_success_score(hints_shown)
        await _finalize_challenge_result(
            db, user_id, pokemon_id, state, guesses_so_far, score, hints_shown, pending
        )
        await _mark_pokemon_seen(db, state, pokemon_id)
    elif wrong_count >= MAX_GUESSES:
        failed = True
        hints_shown = MAX_GUESSES - 1
        proximity_score = calculate_failure_score(guesses_so_far, pokemon)
        score = proximity_score
        await _finalize_challenge_result(
            db, user_id, pokemon_id, state, guesses_so_far, score, hints_shown, pending
        )
        await _mark_pokemon_seen(db, state, pokemon_id)

        # Trigger reset if score is 0 (complete failure, no proximity)
        if score == 0:
            await _reset_challenge_state(db, state)
            run_reset = True
    else:
        hint_revealed = get_hint_for_wrong_guess(wrong_count, pokemon)
        await _upsert_pending_challenge_result(
            db, user_id, pokemon_id, state, guesses_so_far, pending
        )

    return correct, hint_revealed, guesses_so_far, score, failed, run_reset


async def _get_pending_challenge_result(
    db: AsyncSession,
    user_id: uuid.UUID,
    pokemon_id: int,
    run_number: int,
) -> Optional[ChallengeResult]:
    result = await db.execute(
        select(ChallengeResult).where(
            ChallengeResult.user_id == user_id,
            ChallengeResult.pokemon_id == pokemon_id,
            ChallengeResult.run_number == run_number,
            ChallengeResult.score == -1,
        )
    )
    return result.scalars().first()


async def _upsert_pending_challenge_result(
    db: AsyncSession,
    user_id: uuid.UUID,
    pokemon_id: int,
    state: ChallengeState,
    guesses: List[str],
    existing: Optional[ChallengeResult],
) -> None:
    if existing is None:
        row = ChallengeResult(
            user_id=user_id,
            pokemon_id=pokemon_id,
            guesses=guesses,
            score=-1,
            hints_used=len(guesses),
            run_number=state.run_number,
        )
        db.add(row)
    else:
        existing.guesses = guesses
        existing.hints_used = len(guesses)
        db.add(existing)
    await db.commit()


async def _finalize_challenge_result(
    db: AsyncSession,
    user_id: uuid.UUID,
    pokemon_id: int,
    state: ChallengeState,
    guesses: List[str],
    score: int,
    hints_used: int,
    pending: Optional[ChallengeResult],
) -> None:
    if pending is not None:
        pending.guesses = guesses
        pending.score = score
        pending.hints_used = hints_used
        db.add(pending)
    else:
        row = ChallengeResult(
            user_id=user_id,
            pokemon_id=pokemon_id,
            guesses=guesses,
            score=score,
            hints_used=hints_used,
            run_number=state.run_number,
        )
        db.add(row)
    await db.commit()


async def _mark_pokemon_seen(
    db: AsyncSession, state: ChallengeState, pokemon_id: int
) -> None:
    seen = list(state.seen_ids or [])
    if pokemon_id not in seen:
        seen.append(pokemon_id)
    state.seen_ids = seen
    state.total_score = (state.total_score or 0)
    db.add(state)
    await db.commit()


async def _reset_challenge_state(
    db: AsyncSession, state: ChallengeState
) -> None:
    state.seen_ids = []
    state.total_score = 0
    state.run_number = (state.run_number or 1) + 1
    state.is_active = True
    db.add(state)
    await db.commit()


async def get_challenge_high_score(
    db: AsyncSession, user_id: uuid.UUID
) -> int:
    """Return highest total_score ever achieved across all runs."""
    result = await db.execute(
        select(ChallengeResult.run_number, ChallengeResult.score)
        .where(
            ChallengeResult.user_id == user_id,
            ChallengeResult.score >= 0,
        )
    )
    rows = result.all()
    if not rows:
        return 0

    from collections import defaultdict
    run_scores: dict[int, int] = defaultdict(int)
    for run_number, score in rows:
        run_scores[run_number] += score

    return max(run_scores.values(), default=0)
