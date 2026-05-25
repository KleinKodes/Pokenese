from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ChallengeResultData(BaseModel):
    guesses: List[str]
    score: int
    hints_used: int
    completed_at: datetime


class DailyChallengeInfo(BaseModel):
    pokemon_id: int
    unlocked: bool
    result: Optional[ChallengeResultData] = None


class DailyTodayResponse(BaseModel):
    date: date
    challenge_1: DailyChallengeInfo
    challenge_2: DailyChallengeInfo
    challenge_3: DailyChallengeInfo
    next_daily_at: datetime


class GuessRequest(BaseModel):
    date: date
    challenge_num: int = Field(..., ge=1, le=3)
    guess: str = Field(..., min_length=1, max_length=100)


class HintRevealed(BaseModel):
    type: str  # "etymology" | "generation" | "typing" | "category"
    data: Any


class GuessResponse(BaseModel):
    correct: bool
    hint_revealed: Optional[HintRevealed] = None
    guesses_so_far: List[str]
    score: Optional[int] = None
    failed: bool = False
    proximity_score: Optional[int] = None


class DailyHistoryChallenge(BaseModel):
    challenge_num: int
    score: int
    hints_used: int


class DailyHistoryDay(BaseModel):
    date: date
    total_score: int
    challenges: List[DailyHistoryChallenge]


class DailyHistoryResponse(BaseModel):
    history: List[DailyHistoryDay]


class ShareChallengeData(BaseModel):
    guesses: int
    score: int


class DailyShareResponse(BaseModel):
    date: date
    username: str
    total_score: int
    challenges: List[ShareChallengeData]
    streak: int
