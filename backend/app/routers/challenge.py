from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.pokemon_data import get_all_pokemon_ids
from app.schemas.challenge import (
    ChallengeGuessRequest,
    ChallengeGuessResponse,
    ChallengeNextResponse,
    ChallengeStateResponse,
    HintRevealed,
)
from app.services.challenge import (
    get_next_pokemon_id,
    get_or_create_state,
    process_challenge_guess,
)
from app.services.glossary import unlock_or_increment

router = APIRouter(prefix="/api/v1/challenge", tags=["challenge"])

TOTAL_POKEMON = len(get_all_pokemon_ids()) or 1025


@router.get("/state", response_model=ChallengeStateResponse)
async def get_state(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Any:
    state = await get_or_create_state(db, user.id)
    return ChallengeStateResponse(
        is_active=state.is_active,
        total_score=state.total_score,
        seen_count=len(state.seen_ids or []),
        total_pokemon=TOTAL_POKEMON,
        run_number=state.run_number,
    )


@router.get("/next", response_model=ChallengeNextResponse)
async def get_next(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Any:
    state = await get_or_create_state(db, user.id)
    next_id = await get_next_pokemon_id(db, user.id)

    if next_id is None:
        # Run complete!
        return ChallengeNextResponse(
            run_complete=True,
            final_score=state.total_score,
        )

    seen_count = len(state.seen_ids or [])
    return ChallengeNextResponse(
        pokemon_id=next_id,
        challenge_number_in_run=seen_count + 1,
    )


@router.post("/guess", response_model=ChallengeGuessResponse)
async def submit_guess(
    body: ChallengeGuessRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Any:
    try:
        (
            correct,
            hint_revealed,
            guesses_so_far,
            score,
            failed,
            run_reset,
        ) = await process_challenge_guess(db, user.id, body.pokemon_id, body.guess)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # Unlock Pokemon in glossary on any completion
    if correct or failed:
        await unlock_or_increment(db, user.id, body.pokemon_id)

    # Update total_score in state on success/failure
    if score is not None and score >= 0:
        state = await get_or_create_state(db, user.id)
        if not run_reset:
            state.total_score = (state.total_score or 0) + score
            db.add(state)
            await db.commit()

    hint = (
        HintRevealed(type=hint_revealed["type"], data=hint_revealed["data"])
        if hint_revealed
        else None
    )

    return ChallengeGuessResponse(
        correct=correct,
        hint_revealed=hint,
        guesses_so_far=guesses_so_far,
        score=score,
        failed=failed,
        run_reset=run_reset,
    )
