"""Unit tests for scoring service."""
from __future__ import annotations

import pytest

from app.services.scoring import (
    MAX_HINTS,
    calculate_failure_score,
    calculate_success_score,
    get_hint_for_wrong_guess,
    hints_shown_from_guess_count,
    _proximity_score,
)
from app.pokemon_data import get_pokemon_by_name


# ── calculate_success_score ───────────────────────────────────────────────────

def test_success_score_no_hints():
    assert calculate_success_score(0) == 3000


def test_success_score_1_hint():
    assert calculate_success_score(1) == 2400


def test_success_score_2_hints():
    assert calculate_success_score(2) == 1800


def test_success_score_3_hints():
    assert calculate_success_score(3) == 1200


def test_success_score_4_hints():
    assert calculate_success_score(4) == 600


def test_success_score_negative_edge():
    # More hints than possible — should clamp to 0, not go negative
    assert calculate_success_score(10) == 0


# ── hints_shown_from_guess_count ──────────────────────────────────────────────

def test_hints_shown_zero():
    assert hints_shown_from_guess_count(0) == 0


def test_hints_shown_one():
    assert hints_shown_from_guess_count(1) == 1


def test_hints_shown_four():
    assert hints_shown_from_guess_count(4) == 4


def test_hints_shown_five_capped():
    assert hints_shown_from_guess_count(5) == MAX_HINTS


def test_hints_shown_ten_capped():
    assert hints_shown_from_guess_count(10) == MAX_HINTS


# ── _proximity_score ──────────────────────────────────────────────────────────

def test_proximity_same_evolution_line():
    # Bulbasaur (id=1) and Ivysaur (id=2) share evolution_line [1,2,3]
    bulbasaur = {"evolution_line": [1, 2, 3], "type1": "Grass", "type2": "Poison", "name_zh_simplified": "妙蛙种子"}
    ivysaur = {"evolution_line": [1, 2, 3], "type1": "Grass", "type2": "Poison", "name_zh_simplified": "妙蛙草"}
    assert _proximity_score(bulbasaur, ivysaur) == 300


def test_proximity_all_types_match_single_type():
    # Both pure Water
    squirtle = {"evolution_line": [7, 8, 9], "type1": "Water", "type2": None, "name_zh_simplified": "杰尼龟"}
    wartortle = {"evolution_line": [7, 8, 9], "type1": "Water", "type2": None, "name_zh_simplified": "卡咪龟"}
    # Same evolution line takes precedence, so use different evo lines
    p1 = {"evolution_line": [101], "type1": "Water", "type2": None, "name_zh_simplified": "甲"}
    p2 = {"evolution_line": [102], "type1": "Water", "type2": None, "name_zh_simplified": "乙"}
    assert _proximity_score(p1, p2) == 200


def test_proximity_all_types_match_dual_type():
    # Both Fire/Flying
    p1 = {"evolution_line": [201], "type1": "Fire", "type2": "Flying", "name_zh_simplified": "甲"}
    p2 = {"evolution_line": [202], "type1": "Fire", "type2": "Flying", "name_zh_simplified": "乙"}
    assert _proximity_score(p1, p2) == 200


def test_proximity_one_type_matches():
    # Bulbasaur: Grass/Poison, Charmander: Fire — no match
    # Use one shared type
    p1 = {"evolution_line": [301], "type1": "Fire", "type2": "Flying", "name_zh_simplified": "甲"}
    p2 = {"evolution_line": [302], "type1": "Fire", "type2": None, "name_zh_simplified": "乙"}
    assert _proximity_score(p1, p2) == 100


def test_proximity_shared_chinese_char():
    # Share a Chinese character but no type overlap, no evo line overlap
    p1 = {"evolution_line": [401], "type1": "Water", "type2": None, "name_zh_simplified": "妙甲"}
    p2 = {"evolution_line": [402], "type1": "Fire", "type2": None, "name_zh_simplified": "妙乙"}
    assert _proximity_score(p1, p2) == 50


def test_proximity_no_match():
    p1 = {"evolution_line": [501], "type1": "Water", "type2": None, "name_zh_simplified": "甲丙"}
    p2 = {"evolution_line": [502], "type1": "Fire", "type2": None, "name_zh_simplified": "乙丁"}
    assert _proximity_score(p1, p2) == 0


# ── get_hint_for_wrong_guess ──────────────────────────────────────────────────

def test_hint_wrong_guess_1_etymology():
    pokemon = {"etymology": [{"character": "妙", "pinyin": "miào", "meaning": "wonderful"}], "generation": 1, "type1": "Grass", "type2": "Poison", "category": "Seed Pokémon"}
    hint = get_hint_for_wrong_guess(1, pokemon)
    assert hint is not None
    assert hint["type"] == "etymology"
    assert hint["data"] == pokemon["etymology"]


def test_hint_wrong_guess_2_generation():
    pokemon = {"etymology": [], "generation": 1, "type1": "Grass", "type2": "Poison", "category": "Seed Pokémon"}
    hint = get_hint_for_wrong_guess(2, pokemon)
    assert hint is not None
    assert hint["type"] == "generation"
    assert hint["data"] == 1


def test_hint_wrong_guess_3_typing():
    pokemon = {"etymology": [], "generation": 1, "type1": "Grass", "type2": "Poison", "category": "Seed Pokémon"}
    hint = get_hint_for_wrong_guess(3, pokemon)
    assert hint is not None
    assert hint["type"] == "typing"
    assert hint["data"]["type1"] == "Grass"
    assert hint["data"]["type2"] == "Poison"


def test_hint_wrong_guess_4_category():
    pokemon = {"etymology": [], "generation": 1, "type1": "Grass", "type2": "Poison", "category": "Seed Pokémon"}
    hint = get_hint_for_wrong_guess(4, pokemon)
    assert hint is not None
    assert hint["type"] == "category"
    assert hint["data"] == "Seed Pokémon"


def test_hint_wrong_guess_5_none():
    pokemon = {"etymology": [], "generation": 1, "type1": "Grass", "type2": "Poison", "category": "Seed Pokémon"}
    hint = get_hint_for_wrong_guess(5, pokemon)
    assert hint is None


def test_hint_wrong_guess_10_none():
    pokemon = {"etymology": [], "generation": 1, "type1": "Grass", "type2": "Poison", "category": "Seed Pokémon"}
    hint = get_hint_for_wrong_guess(10, pokemon)
    assert hint is None


# ── calculate_failure_score ───────────────────────────────────────────────────

def test_failure_score_same_evolution_line():
    # Bulbasaur and Ivysaur are same evo line → 300
    bulbasaur = get_pokemon_by_name("Bulbasaur")
    assert bulbasaur is not None
    score = calculate_failure_score(["Ivysaur"], bulbasaur)
    assert score == 300


def test_failure_score_all_guesses_wrong_no_match():
    # Charmander (Fire) vs Squirtle (Water) — no type overlap, no evo line, no shared Chinese
    charmander = get_pokemon_by_name("Charmander")
    assert charmander is not None
    # Squirtle has name_zh_simplified "杰尼龟", Charmander has "小火龙" — no shared chars
    score = calculate_failure_score(["Squirtle"], charmander)
    # Squirtle is Water, Charmander is Fire — no type overlap — should be 0
    assert score == 0


def test_failure_score_unknown_guess_name():
    bulbasaur = get_pokemon_by_name("Bulbasaur")
    assert bulbasaur is not None
    # Unknown names are skipped
    score = calculate_failure_score(["NotAPokemon"], bulbasaur)
    assert score == 0


def test_failure_score_picks_best():
    # Mix: one unknown, one same evo line guess
    bulbasaur = get_pokemon_by_name("Bulbasaur")
    assert bulbasaur is not None
    score = calculate_failure_score(["NotAPokemon", "Ivysaur"], bulbasaur)
    assert score == 300
