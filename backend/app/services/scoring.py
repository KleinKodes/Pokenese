"""
Scoring service — mirrors the frontend scoring logic.

Success scoring: score = 3000 - (hints_shown * 600)
Failure scoring (highest applicable wins, not cumulative):
  - Same evolution line       → 300
  - All types match           → 200
  - One type matches          → 100
  - Shares a Chinese char     → 50
  - None                      → 0
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.pokemon_data import get_pokemon_by_name, get_pokemon_by_id


MAX_GUESSES = 5
MAX_HINTS = 4  # revealed after wrong guess 1–4
BASE_SCORE = 3000
HINT_PENALTY = 600


def calculate_success_score(hints_shown: int) -> int:
    """Score for a correct guess given number of hints already shown."""
    return max(0, BASE_SCORE - hints_shown * HINT_PENALTY)


def calculate_failure_score(
    guesses: List[str],
    correct_pokemon: Dict[str, Any],
) -> int:
    """
    Calculate proximity score on complete failure (all 5 guesses wrong).
    Evaluates each guess and returns the highest applicable score.
    """
    best = 0
    for guess_name in guesses:
        candidate = get_pokemon_by_name(guess_name)
        if candidate is None:
            continue
        score = _proximity_score(candidate, correct_pokemon)
        if score > best:
            best = score
    return best


def _proximity_score(
    guess_pokemon: Dict[str, Any],
    correct_pokemon: Dict[str, Any],
) -> int:
    """Return the proximity score for a single guess against the correct answer."""
    # 1. Same evolution line
    guess_evo = set(guess_pokemon.get("evolution_line", []))
    correct_evo = set(correct_pokemon.get("evolution_line", []))
    if guess_evo & correct_evo:
        return 300

    # 2. All types match
    guess_types = _get_types(guess_pokemon)
    correct_types = _get_types(correct_pokemon)
    if guess_types == correct_types:
        return 200

    # 3. One type matches (at least one type in common)
    if guess_types & correct_types:
        return 100

    # 4. Shares a Chinese character
    guess_zh = guess_pokemon.get("name_zh_simplified", "") or guess_pokemon.get("name_zh", "")
    correct_zh = correct_pokemon.get("name_zh_simplified", "") or correct_pokemon.get("name_zh", "")
    if set(guess_zh) & set(correct_zh):
        return 50

    return 0


def _get_types(pokemon: Dict[str, Any]) -> frozenset:
    types = set()
    t1 = pokemon.get("type1")
    t2 = pokemon.get("type2")
    if t1:
        types.add(t1)
    if t2:
        types.add(t2)
    return frozenset(types)


def hints_shown_from_guess_count(guess_count: int) -> int:
    """
    Number of hints that have been revealed based on how many wrong guesses
    have been made so far (before the current guess).
    Hints are revealed after wrong guesses 1-4.
    """
    return max(0, min(guess_count, MAX_HINTS))


def get_hint_for_wrong_guess(
    wrong_guess_number: int,
    pokemon: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """
    Return the hint revealed after `wrong_guess_number` wrong guesses.
    wrong_guess_number is 1-indexed (1 = after first wrong guess).
    Returns None if no hint at this position.
    """
    if wrong_guess_number == 1:
        return {
            "type": "etymology",
            "data": pokemon.get("etymology", []),
        }
    elif wrong_guess_number == 2:
        return {
            "type": "generation",
            "data": pokemon.get("generation"),
        }
    elif wrong_guess_number == 3:
        return {
            "type": "typing",
            "data": {
                "type1": pokemon.get("type1"),
                "type2": pokemon.get("type2"),
            },
        }
    elif wrong_guess_number == 4:
        return {
            "type": "category",
            "data": pokemon.get("category"),
        }
    return None
