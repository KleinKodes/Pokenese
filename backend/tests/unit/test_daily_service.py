"""Unit tests for pure/sync functions in the daily service."""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import List
from unittest.mock import MagicMock

import pytest

from app.services.daily import is_challenge_unlocked, next_daily_reset


# ── is_challenge_unlocked ─────────────────────────────────────────────────────

def _make_result(challenge_num: int) -> MagicMock:
    """Create a mock DailyResult with the given challenge_num."""
    r = MagicMock()
    r.challenge_num = challenge_num
    return r


def test_challenge_1_always_unlocked_no_results():
    assert is_challenge_unlocked(1, []) is True


def test_challenge_1_always_unlocked_with_results():
    results = [_make_result(1)]
    assert is_challenge_unlocked(1, results) is True


def test_challenge_2_locked_when_challenge_1_not_completed():
    assert is_challenge_unlocked(2, []) is False


def test_challenge_2_unlocked_when_challenge_1_completed():
    results = [_make_result(1)]
    assert is_challenge_unlocked(2, results) is True


def test_challenge_3_locked_when_only_challenge_1_completed():
    results = [_make_result(1)]
    assert is_challenge_unlocked(3, results) is False


def test_challenge_3_locked_when_nothing_completed():
    assert is_challenge_unlocked(3, []) is False


def test_challenge_3_unlocked_when_challenge_2_completed():
    results = [_make_result(1), _make_result(2)]
    assert is_challenge_unlocked(3, results) is True


def test_challenge_2_unlocked_ignores_challenge_3():
    """Having challenge 3 done shouldn't unlock challenge 2 if challenge 1 not done."""
    results = [_make_result(3)]
    # challenge_num-1 = 1 not in {3}
    assert is_challenge_unlocked(2, results) is False


# ── next_daily_reset ──────────────────────────────────────────────────────────

def test_next_daily_reset_is_in_future():
    reset_time = next_daily_reset()
    now = datetime.now(timezone.utc)
    assert reset_time > now


def test_next_daily_reset_is_midnight_utc():
    reset_time = next_daily_reset()
    assert reset_time.hour == 0
    assert reset_time.minute == 0
    assert reset_time.second == 0


def test_next_daily_reset_is_tomorrow():
    reset_time = next_daily_reset()
    today = date.today()
    tomorrow = today.replace(day=today.day)
    # The reset date should be tomorrow
    from datetime import timedelta
    expected_date = date.today() + timedelta(days=1)
    assert reset_time.date() == expected_date


def test_next_daily_reset_has_timezone():
    reset_time = next_daily_reset()
    assert reset_time.tzinfo is not None
