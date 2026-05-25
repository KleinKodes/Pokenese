from __future__ import annotations

from typing import Any, List, Optional

from pydantic import BaseModel, Field


class ChallengeStateResponse(BaseModel):
    is_active: bool
    total_score: int
    seen_count: int
    total_pokemon: int
    run_number: int


class ChallengeNextResponse(BaseModel):
    pokemon_id: Optional[int] = None
    challenge_number_in_run: Optional[int] = None
    run_complete: Optional[bool] = None
    final_score: Optional[int] = None


class ChallengeGuessRequest(BaseModel):
    pokemon_id: int
    guess: str = Field(..., min_length=1, max_length=100)


class HintRevealed(BaseModel):
    type: str
    data: Any


class ChallengeGuessResponse(BaseModel):
    correct: bool
    hint_revealed: Optional[HintRevealed] = None
    guesses_so_far: List[str]
    score: Optional[int] = None
    failed: bool = False
    run_reset: bool = False
