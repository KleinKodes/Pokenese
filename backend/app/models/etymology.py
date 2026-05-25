from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, List, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EtymologyOverride(Base):
    __tablename__ = "etymology_overrides"

    pokemon_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    etymology: Mapped[List[Any]] = mapped_column(JSON, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    updated_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
