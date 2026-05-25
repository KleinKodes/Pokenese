#!/usr/bin/env python3
"""
Run Alembic migrations programmatically.

Usage:
    python scripts/migrate.py [upgrade|downgrade] [revision]

Defaults to: upgrade head
"""
from __future__ import annotations

import sys
import os

# Ensure the backend/ root is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from alembic.config import Config
from alembic import command


def run_migrations(direction: str = "upgrade", revision: str = "head") -> None:
    alembic_cfg = Config(
        os.path.join(os.path.dirname(__file__), "..", "alembic.ini")
    )
    alembic_cfg.set_main_option(
        "script_location",
        os.path.join(os.path.dirname(__file__), "..", "alembic"),
    )

    if direction == "upgrade":
        command.upgrade(alembic_cfg, revision)
        print(f"[migrate] Upgraded to: {revision}")
    elif direction == "downgrade":
        command.downgrade(alembic_cfg, revision)
        print(f"[migrate] Downgraded to: {revision}")
    elif direction == "current":
        command.current(alembic_cfg)
    elif direction == "history":
        command.history(alembic_cfg)
    else:
        print(f"Unknown direction: {direction}. Use upgrade/downgrade/current/history.")
        sys.exit(1)


if __name__ == "__main__":
    args = sys.argv[1:]
    direction = args[0] if args else "upgrade"
    revision = args[1] if len(args) > 1 else "head"
    run_migrations(direction, revision)
