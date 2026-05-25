from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.models.glossary import GlossaryEntry


async def unlock_or_increment(
    db: AsyncSession,
    user_id: uuid.UUID,
    pokemon_id: int,
) -> GlossaryEntry:
    """
    Insert a glossary entry for (user_id, pokemon_id) if it doesn't exist,
    or increment times_seen if it does.
    Returns the updated/created entry.
    """
    stmt = (
        pg_insert(GlossaryEntry)
        .values(user_id=user_id, pokemon_id=pokemon_id, times_seen=1)
        .on_conflict_do_update(
            index_elements=["user_id", "pokemon_id"],
            set_={"times_seen": GlossaryEntry.times_seen + 1},
        )
        .returning(GlossaryEntry)
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.scalars().first()


async def get_glossary(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> list[GlossaryEntry]:
    result = await db.execute(
        select(GlossaryEntry)
        .where(GlossaryEntry.user_id == user_id)
        .order_by(GlossaryEntry.unlocked_at.desc())
    )
    return list(result.scalars().all())
