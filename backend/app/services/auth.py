from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_token(token: str) -> str:
    """SHA-256 hash of a token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def create_access_token(user_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(user_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "refresh",
        "jti": str(uuid.uuid4()),  # unique per token for revocation
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> Optional[uuid.UUID]:
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        if payload.get("type") != "access":
            return None
        sub = payload.get("sub")
        if sub is None:
            return None
        return uuid.UUID(sub)
    except (JWTError, ValueError):
        return None


def decode_refresh_token(token: str) -> Optional[uuid.UUID]:
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        if payload.get("type") != "refresh":
            return None
        sub = payload.get("sub")
        if sub is None:
            return None
        return uuid.UUID(sub)
    except (JWTError, ValueError):
        return None


def get_refresh_token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )
