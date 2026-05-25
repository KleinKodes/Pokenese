"""Add user roles and etymology_overrides table

Revision ID: 002
Revises: 001
Create Date: 2026-05-25

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE TYPE userrole AS ENUM ('user', 'admin')")

    op.add_column(
        "users",
        sa.Column(
            "role",
            postgresql.ENUM("user", "admin", name="userrole", create_type=False),
            nullable=False,
            server_default="user",
        ),
    )

    op.create_table(
        "etymology_overrides",
        sa.Column("pokemon_id", sa.Integer(), primary_key=True),
        sa.Column(
            "etymology",
            postgresql.JSON(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_by_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_table("etymology_overrides")
    op.drop_column("users", "role")
    op.execute("DROP TYPE userrole")
