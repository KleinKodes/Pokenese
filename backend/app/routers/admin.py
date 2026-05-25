from __future__ import annotations

import json
import uuid
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_admin
from app.models.user import User, UserRole
from app.models.etymology import EtymologyOverride
from app.schemas.admin import (
    AdminCreateUserRequest,
    AdminSetRoleRequest,
    AdminUserResponse,
    EtymologyOverrideRequest,
    EtymologyOverrideResponse,
)
from app.services.auth import hash_password

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


# ── User management ────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[AdminUserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Any:
    result = await db.execute(select(User).order_by(User.created_at))
    return result.scalars().all()


@router.post("/users", response_model=AdminUserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: AdminCreateUserRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Any:
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    result = await db.execute(select(User).where(User.username == body.username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=body.email,
        username=body.username,
        password_hash=hash_password(body.password),
        role=UserRole.admin if body.is_admin else UserRole.user,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/users/{user_id}/role", response_model=AdminUserResponse)
async def set_user_role(
    user_id: uuid.UUID,
    body: AdminSetRoleRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Any:
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = UserRole.admin if body.is_admin else UserRole.user
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> None:
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account here")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(user)
    await db.commit()


# ── Etymology overrides ────────────────────────────────────────────────────────

@router.get("/etymology", response_model=List[EtymologyOverrideResponse])
async def list_etymology_overrides(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Any:
    result = await db.execute(select(EtymologyOverride).order_by(EtymologyOverride.pokemon_id))
    return result.scalars().all()


@router.get("/etymology/export")
async def export_etymology_overrides(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Response:
    """Download all DB etymology overrides as etymology_overrides.json (scraper format)."""
    result = await db.execute(
        select(EtymologyOverride).order_by(EtymologyOverride.pokemon_id)
    )
    overrides = result.scalars().all()

    payload: Dict[str, Any] = {
        "_comment": "Exported from DB. Drop this file at backend/data/etymology_overrides.json and re-run the scraper.",
    }
    for o in overrides:
        payload[str(o.pokemon_id)] = o.etymology

    return Response(
        content=json.dumps(payload, ensure_ascii=False, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=etymology_overrides.json"},
    )


@router.get("/etymology/{pokemon_id}", response_model=EtymologyOverrideResponse)
async def get_etymology_override(
    pokemon_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Any:
    result = await db.execute(
        select(EtymologyOverride).where(EtymologyOverride.pokemon_id == pokemon_id)
    )
    override = result.scalars().first()
    if not override:
        raise HTTPException(status_code=404, detail="No override for this Pokémon")
    return override


@router.put("/etymology/{pokemon_id}", response_model=EtymologyOverrideResponse)
async def upsert_etymology_override(
    pokemon_id: int,
    body: EtymologyOverrideRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> Any:
    result = await db.execute(
        select(EtymologyOverride).where(EtymologyOverride.pokemon_id == pokemon_id)
    )
    override = result.scalars().first()
    etymology_data = [e.model_dump() for e in body.etymology]

    if override:
        override.etymology = etymology_data
        override.updated_by_id = admin.id
    else:
        override = EtymologyOverride(
            pokemon_id=pokemon_id,
            etymology=etymology_data,
            updated_by_id=admin.id,
        )
        db.add(override)

    await db.commit()
    await db.refresh(override)
    return override


@router.delete("/etymology/{pokemon_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_etymology_override(
    pokemon_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> None:
    result = await db.execute(
        select(EtymologyOverride).where(EtymologyOverride.pokemon_id == pokemon_id)
    )
    override = result.scalars().first()
    if not override:
        raise HTTPException(status_code=404, detail="No override for this Pokémon")
    await db.delete(override)
    await db.commit()
