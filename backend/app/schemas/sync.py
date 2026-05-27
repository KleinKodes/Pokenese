from typing import Dict, List, Optional, Any
from pydantic import BaseModel


class DailyChallengeResultSync(BaseModel):
    guesses: List[str]
    score: int
    hints_used: int
    completed_at: str


class DailyDaySync(BaseModel):
    challenge_1: Optional[DailyChallengeResultSync] = None
    challenge_2: Optional[DailyChallengeResultSync] = None
    challenge_3: Optional[DailyChallengeResultSync] = None


class SyncRequest(BaseModel):
    glossary: List[int] = []
    daily: Dict[str, DailyDaySync] = {}


class SyncGlossaryEntry(BaseModel):
    pokemon_id: int
    times_seen: int


class SyncDailyResult(BaseModel):
    score: int
    hints_used: int
    guesses: List[str]


class SyncDailyDay(BaseModel):
    challenge_1: Optional[SyncDailyResult] = None
    challenge_2: Optional[SyncDailyResult] = None
    challenge_3: Optional[SyncDailyResult] = None


class SyncResponse(BaseModel):
    glossary: List[SyncGlossaryEntry]
    daily: Dict[str, SyncDailyDay]
    streak_current: int
    streak_longest: int
