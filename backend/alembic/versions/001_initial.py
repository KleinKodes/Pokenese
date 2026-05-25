"""Initial migration — create all tables

Revision ID: 001
Revises:
Create Date: 2026-05-25

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pgcrypto for gen_random_uuid()
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    # users
    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("email", sa.Text(), nullable=False, unique=True),
        sa.Column("username", sa.Text(), nullable=False, unique=True),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    # daily_challenges
    op.create_table(
        "daily_challenges",
        sa.Column("date", sa.Date(), primary_key=True),
        sa.Column("pokemon_id_1", sa.Integer(), nullable=False),
        sa.Column("pokemon_id_2", sa.Integer(), nullable=False),
        sa.Column("pokemon_id_3", sa.Integer(), nullable=False),
    )

    # daily_results
    op.create_table(
        "daily_results",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("challenge_num", sa.SmallInteger(), nullable=False),
        sa.Column("guesses", postgresql.ARRAY(sa.Text()), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("hints_used", sa.SmallInteger(), nullable=False),
        sa.Column(
            "completed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.CheckConstraint("challenge_num IN (1, 2, 3)", name="ck_challenge_num"),
        sa.UniqueConstraint("user_id", "date", "challenge_num", name="uq_daily_result"),
    )
    op.create_index("ix_daily_results_user_date", "daily_results", ["user_id", "date"])

    # challenge_state
    op.create_table(
        "challenge_state",
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "seen_ids",
            postgresql.ARRAY(sa.Integer()),
            nullable=False,
            server_default="{}",
        ),
        sa.Column("total_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("run_number", sa.Integer(), nullable=False, server_default="1"),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
    )

    # challenge_results
    op.create_table(
        "challenge_results",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("pokemon_id", sa.Integer(), nullable=False),
        sa.Column("guesses", postgresql.ARRAY(sa.Text()), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("hints_used", sa.SmallInteger(), nullable=False),
        sa.Column("run_number", sa.Integer(), nullable=False),
        sa.Column(
            "completed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_challenge_results_user_run",
        "challenge_results",
        ["user_id", "run_number"],
    )

    # glossary_entries
    op.create_table(
        "glossary_entries",
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("pokemon_id", sa.Integer(), primary_key=True),
        sa.Column(
            "unlocked_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column("times_seen", sa.Integer(), nullable=False, server_default="1"),
    )

    # refresh_tokens
    op.create_table(
        "refresh_tokens",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.Text(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index("ix_refresh_tokens_hash", "refresh_tokens", ["token_hash"])


def downgrade() -> None:
    op.drop_table("refresh_tokens")
    op.drop_table("glossary_entries")
    op.drop_table("challenge_results")
    op.drop_table("challenge_state")
    op.drop_table("daily_results")
    op.drop_table("daily_challenges")
    op.drop_table("users")
