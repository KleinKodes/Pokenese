from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel


class GlossaryEntryResponse(BaseModel):
    pokemon_id: int
    times_seen: int
    unlocked_at: datetime

    model_config = {"from_attributes": True}


class GlossaryResponse(BaseModel):
    entries: List[GlossaryEntryResponse]
