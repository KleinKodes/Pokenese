#!/usr/bin/env python3
"""
Seed the daily_challenges table for the next 365 days.

Algorithm:
  - For each date from today through today + 365 days:
    1. Use random.seed(f"{date_str}-{SEED_SALT}") for deterministic selection
    2. Pick 3 unique Pokemon IDs from available IDs
    3. Ensure no Pokemon repeats within a 7-day window
    4. Upsert into daily_challenges (safe to re-run)

Usage:
    python scripts/seed_daily.py [--days 365] [--start-date 2026-05-25]
"""
from __future__ import annotations

import argparse
import asyncio
import os
import random
import sys
from collections import deque
from datetime import date, timedelta
from typing import Deque, List, Optional, Set

# Add backend root to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import asyncpg
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.models.daily import DailyChallenge
from app.pokemon_data import get_all_pokemon_ids

settings = get_settings()
WINDOW_SIZE = 7  # no repeat within 7 days


def pick_daily_pokemon(
    target_date: date,
    all_ids: List[int],
    recent_window: Deque[int],
    salt: str,
) -> List[int]:
    """
    Pick 3 unique Pokemon IDs for a given date, avoiding the recent_window.
    Uses a deterministic seed so the function is idempotent.
    """
    date_str = target_date.isoformat()
    rng = random.Random(f"{date_str}-{salt}")

    available = [pid for pid in all_ids if pid not in recent_window]

    # Fallback: if available pool is too small (e.g., tiny sample data), use full pool
    if len(available) < 3:
        available = all_ids[:]

    chosen: List[int] = []
    pool = available[:]
    while len(chosen) < 3 and pool:
        pick = rng.choice(pool)
        pool.remove(pick)
        chosen.append(pick)

    return chosen


async def seed_daily_challenges(
    start_date: date,
    num_days: int = 365,
) -> None:
    all_ids = get_all_pokemon_ids()
    if not all_ids:
        print("[seed] ERROR: No Pokemon data found. Run scrape_pokemon.py first.")
        sys.exit(1)

    print(f"[seed] Seeding {num_days} days from {start_date} using {len(all_ids)} Pokemon IDs")
    print(f"[seed] SEED_SALT = {settings.seed_salt!r}")

    # Build a rolling window of recently used IDs to enforce 7-day uniqueness
    # We initialize this by looking at what was already seeded for dates before start_date
    recent_window: Deque[int] = deque(maxlen=WINDOW_SIZE * 3)  # 3 IDs per day × 7 days

    inserted = 0
    skipped = 0

    async with AsyncSessionLocal() as db:
        # Pre-fill window from the 7 days before start_date
        for offset in range(WINDOW_SIZE, 0, -1):
            past_date = start_date - timedelta(days=offset)
            result = await db.execute(
                text(
                    "SELECT pokemon_id_1, pokemon_id_2, pokemon_id_3 "
                    "FROM daily_challenges WHERE date = :d"
                ),
                {"d": past_date},
            )
            row = result.fetchone()
            if row:
                recent_window.extend([row[0], row[1], row[2]])

        for day_offset in range(num_days):
            target_date = start_date + timedelta(days=day_offset)
            chosen = pick_daily_pokemon(target_date, all_ids, recent_window, settings.seed_salt)

            # Upsert
            await db.execute(
                text(
                    """
                    INSERT INTO daily_challenges (date, pokemon_id_1, pokemon_id_2, pokemon_id_3)
                    VALUES (:date, :p1, :p2, :p3)
                    ON CONFLICT (date) DO UPDATE SET
                        pokemon_id_1 = EXCLUDED.pokemon_id_1,
                        pokemon_id_2 = EXCLUDED.pokemon_id_2,
                        pokemon_id_3 = EXCLUDED.pokemon_id_3
                    """
                ),
                {
                    "date": target_date,
                    "p1": chosen[0],
                    "p2": chosen[1],
                    "p3": chosen[2],
                },
            )

            recent_window.extend(chosen)
            inserted += 1

            if day_offset % 30 == 0:
                print(f"[seed] ... seeded up to {target_date} ({day_offset + 1}/{num_days})")

        await db.commit()

    print(f"[seed] Done. Seeded {inserted} days.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed daily challenges")
    parser.add_argument("--days", type=int, default=365, help="Number of days to seed")
    parser.add_argument(
        "--start-date",
        type=str,
        default=None,
        help="Start date in YYYY-MM-DD format (default: today)",
    )
    args = parser.parse_args()

    start = date.today() if args.start_date is None else date.fromisoformat(args.start_date)
    asyncio.run(seed_daily_challenges(start, args.days))


if __name__ == "__main__":
    main()
