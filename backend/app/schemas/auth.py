from __future__ import annotations

import uuid
from typing import Any, Dict, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    email: str = Field(..., description="User email address")
    username: str = Field(..., min_length=3, max_length=30, description="Display username")
    password: str = Field(..., min_length=8, description="Password (min 8 chars)")
    migrate_local_state: Optional[Dict[str, Any]] = Field(
        default=None, description="Optional localStorage state to migrate on registration"
    )

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        import re
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError("Username must contain only letters, digits, underscores, or hyphens")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    user: UserInfo
    access_token: str
    refresh_token: str


class RefreshRequest(BaseModel):
    refresh_token: Optional[str] = None


class RefreshResponse(BaseModel):
    access_token: str


class UserInfo(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    is_admin: bool = False

    model_config = {"from_attributes": True}
