from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.glossary import GlossaryEntryResponse, GlossaryResponse
from app.services.glossary import get_glossary

router = APIRouter(prefix="/api/v1/glossary", tags=["glossary"])


@router.get("", response_model=GlossaryResponse)
async def get_user_glossary(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Any:
    entries = await get_glossary(db, user.id)
    return GlossaryResponse(
        entries=[
            GlossaryEntryResponse(
                pokemon_id=e.pokemon_id,
                times_seen=e.times_seen,
                unlocked_at=e.unlocked_at,
            )
            for e in entries
        ]
    )
