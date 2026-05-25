from __future__ import annotations

import uuid
from datetime import date, datetime

import sqlalchemy as sa
from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    SmallInteger,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DailyChallenge(Base):
    __tablename__ = "daily_challenges"

    date: Mapped[date] = mapped_column(Date, primary_key=True)
    pokemon_id_1: Mapped[int] = mapped_column(Integer, nullable=False)
    pokemon_id_2: Mapped[int] = mapped_column(Integer, nullable=False)
    pokemon_id_3: Mapped[int] = mapped_column(Integer, nullable=False)


class DailyResult(Base):
    __tablename__ = "daily_results"

    __table_args__ = (
        UniqueConstraint("user_id", "date", "challenge_num", name="uq_daily_result"),
        CheckConstraint("challenge_num IN (1, 2, 3)", name="ck_challenge_num"),
    )

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
    date: Mapped[date] = mapped_column(Date, nullable=False)
    challenge_num: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    guesses: Mapped[list[str]] = mapped_column(ARRAY(sa.Text()), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    hints_used: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user = relationship("User", back_populates="daily_results")
