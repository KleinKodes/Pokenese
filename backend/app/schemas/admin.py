from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class AdminCreateUserRequest(BaseModel):
    email: str = Field(..., description="User email address")
    username: str = Field(..., min_length=3, max_length=30)
    password: str = Field(..., min_length=8)
    is_admin: bool = False

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        import re
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError("Username must contain only letters, digits, underscores, or hyphens")
        return v


class AdminUserResponse(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminSetRoleRequest(BaseModel):
    is_admin: bool


class EtymologyEntry(BaseModel):
    character: str
    pinyin: str
    meaning: str


class EtymologyOverrideRequest(BaseModel):
    etymology: List[EtymologyEntry]


class EtymologyOverrideResponse(BaseModel):
    pokemon_id: int
    etymology: List[Dict[str, Any]]
    updated_at: datetime
    updated_by_id: Optional[uuid.UUID]

    model_config = {"from_attributes": True}
