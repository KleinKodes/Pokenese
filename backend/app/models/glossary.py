from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class GlossaryEntry(Base):
    __tablename__ = "glossary_entries"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    pokemon_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    unlocked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    times_seen: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    user = relationship("User", back_populates="glossary_entries")
