from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.challenge import ChallengeState
    from app.models.daily import DailyResult
    from app.models.challenge import ChallengeResult
    from app.models.glossary import GlossaryEntry


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    email: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    username: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships (use string references to avoid circular imports)
    refresh_tokens: Mapped[List[RefreshToken]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    daily_results: Mapped[List[DailyResult]] = relationship(
        "DailyResult", back_populates="user", cascade="all, delete-orphan"
    )
    challenge_state: Mapped[Optional[ChallengeState]] = relationship(
        "ChallengeState", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    challenge_results: Mapped[List[ChallengeResult]] = relationship(
        "ChallengeResult", back_populates="user", cascade="all, delete-orphan"
    )
    glossary_entries: Mapped[List[GlossaryEntry]] = relationship(
        "GlossaryEntry", back_populates="user", cascade="all, delete-orphan"
    )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    token_hash: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped[User] = relationship("User", back_populates="refresh_tokens")
