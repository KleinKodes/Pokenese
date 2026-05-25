from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.models.etymology import EtymologyOverride

router = APIRouter(prefix="/api/v1/pokemon", tags=["pokemon"])


@router.get("/etymology-overrides")
async def get_all_etymology_overrides(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Public endpoint — returns all active etymology overrides keyed by pokemon_id."""
    result = await db.execute(select(EtymologyOverride))
    overrides = result.scalars().all()
    return {str(o.pokemon_id): o.etymology for o in overrides}
