from __future__ import annotations

import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, SmallInteger, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ChallengeState(Base):
    __tablename__ = "challenge_state"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    seen_ids: Mapped[list[int]] = mapped_column(
        ARRAY(Integer), nullable=False, server_default="{}"
    )
    total_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    run_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship("User", back_populates="challenge_state")


class ChallengeResult(Base):
    __tablename__ = "challenge_results"

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
    pokemon_id: Mapped[int] = mapped_column(Integer, nullable=False)
    guesses: Mapped[list[str]] = mapped_column(ARRAY(sa.Text()), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    hints_used: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    run_number: Mapped[int] = mapped_column(Integer, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user = relationship("User", back_populates="challenge_results")
