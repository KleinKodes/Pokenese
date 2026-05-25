from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class UserStats(BaseModel):
    daily_streak: int
    daily_longest_streak: int
    total_daily_score: int
    challenge_high_score: int
    glossary_count: int


class UserMeResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    created_at: datetime
    stats: UserStats

    model_config = {"from_attributes": True}
