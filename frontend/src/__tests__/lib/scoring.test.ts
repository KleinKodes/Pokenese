import { describe, it, expect } from 'vitest';
import {
  calculateScore,
  calculateProximityScore,
  getScoreLabel,
  getScoreColor,
} from '../../lib/scoring';
import type { PokemonType } from '../../types/pokemon';

// ── Minimal Pokemon fixtures ──────────────────────────────────────────────────

function makePokemon(overrides: Partial<PokemonType>): PokemonType {
  return {
    id: 1,
    name_en: 'TestMon',
    name_zh: '测试怪',
    name_zh_simplified: '测试怪',
    pinyin: 'Cè Shì Guài',
    pinyin_numbered: 'Ce4 Shi4 Guai4',
    ipa: '/ts/e/ʃi/kwaj/',
    etymology: [],
    generation: 1,
    type1: 'Normal',
    type2: null,
    category: 'Test Pokémon',
    evolution_line: [1],
    sprite_url: '',
    audio_filename: null,
    ...overrides,
  };
}

// ── calculateScore ─────────────────────────────────────────────────────────────

describe('calculateScore', () => {
  it('returns 3000 for correct with 0 hints', () => {
    expect(calculateScore(0, true)).toBe(3000);
  });

  it('returns 2400 for correct with 1 hint', () => {
    expect(calculateScore(1, true)).toBe(2400);
  });

  it('returns 1800 for correct with 2 hints', () => {
    expect(calculateScore(2, true)).toBe(1800);
  });

  it('returns 1200 for correct with 3 hints', () => {
    expect(calculateScore(3, true)).toBe(1200);
  });

  it('returns 600 for correct with 4 hints', () => {
    expect(calculateScore(4, true)).toBe(600);
  });

  it('returns 0 for incorrect regardless of hints', () => {
    expect(calculateScore(0, false)).toBe(0);
    expect(calculateScore(2, false)).toBe(0);
    expect(calculateScore(4, false)).toBe(0);
  });
});

// ── calculateProximityScore ───────────────────────────────────────────────────

describe('calculateProximityScore', () => {
  it('returns 300 for same evolution line', () => {
    const bulbasaur = makePokemon({ id: 1, evolution_line: [1, 2, 3], type1: 'Grass', type2: 'Poison', name_zh: '妙蛙种子' });
    const correct = makePokemon({ id: 2, evolution_line: [1, 2, 3], type1: 'Grass', type2: 'Poison', name_zh: '妙蛙草' });
    expect(calculateProximityScore(bulbasaur, correct)).toBe(300);
  });

  it('returns 200 when all types match (single type)', () => {
    const guess = makePokemon({ id: 10, evolution_line: [10], type1: 'Water', type2: null, name_zh: '甲' });
    const correct = makePokemon({ id: 20, evolution_line: [20], type1: 'Water', type2: null, name_zh: '乙' });
    expect(calculateProximityScore(guess, correct)).toBe(200);
  });

  it('returns 200 when all types match (dual type)', () => {
    const guess = makePokemon({ id: 30, evolution_line: [30], type1: 'Fire', type2: 'Flying', name_zh: '甲' });
    const correct = makePokemon({ id: 40, evolution_line: [40], type1: 'Fire', type2: 'Flying', name_zh: '乙' });
    expect(calculateProximityScore(guess, correct)).toBe(200);
  });

  it('returns 100 when one type matches', () => {
    const guess = makePokemon({ id: 50, evolution_line: [50], type1: 'Fire', type2: 'Flying', name_zh: '甲' });
    const correct = makePokemon({ id: 60, evolution_line: [60], type1: 'Fire', type2: null, name_zh: '乙' });
    expect(calculateProximityScore(guess, correct)).toBe(100);
  });

  it('returns 50 when sharing a Chinese character', () => {
    const guess = makePokemon({ id: 70, evolution_line: [70], type1: 'Water', type2: null, name_zh: '妙甲' });
    const correct = makePokemon({ id: 80, evolution_line: [80], type1: 'Fire', type2: null, name_zh: '妙乙' });
    expect(calculateProximityScore(guess, correct)).toBe(50);
  });

  it('returns 0 when no match at all', () => {
    const guess = makePokemon({ id: 90, evolution_line: [90], type1: 'Water', type2: null, name_zh: '甲丙' });
    const correct = makePokemon({ id: 100, evolution_line: [100], type1: 'Fire', type2: null, name_zh: '乙丁' });
    expect(calculateProximityScore(guess, correct)).toBe(0);
  });
});

// ── getScoreLabel ─────────────────────────────────────────────────────────────

describe('getScoreLabel', () => {
  it('returns Perfect! for 3000', () => {
    expect(getScoreLabel(3000)).toBe('Perfect!');
  });

  it('returns Excellent! for 2400', () => {
    expect(getScoreLabel(2400)).toBe('Excellent!');
  });

  it('returns Great! for 1800', () => {
    expect(getScoreLabel(1800)).toBe('Great!');
  });

  it('returns Good for 1200', () => {
    expect(getScoreLabel(1200)).toBe('Good');
  });

  it('returns OK for 600', () => {
    expect(getScoreLabel(600)).toBe('OK');
  });

  it('returns Missed for 0', () => {
    expect(getScoreLabel(0)).toBe('Missed');
  });

  it('returns Missed for scores below 600', () => {
    expect(getScoreLabel(300)).toBe('Missed');
  });
});

// ── getScoreColor ─────────────────────────────────────────────────────────────

describe('getScoreColor', () => {
  it('returns gold class for 3000', () => {
    expect(getScoreColor(3000)).toBe('text-accent-gold');
  });

  it('returns success class for 2400', () => {
    expect(getScoreColor(2400)).toBe('text-color-success');
  });

  it('returns blue class for 1800', () => {
    expect(getScoreColor(1800)).toBe('text-accent-blue');
  });

  it('returns primary class for 1200', () => {
    expect(getScoreColor(1200)).toBe('text-text-primary');
  });

  it('returns warning class for 600', () => {
    expect(getScoreColor(600)).toBe('text-color-warning');
  });

  it('returns error class for 0', () => {
    expect(getScoreColor(0)).toBe('text-color-error');
  });
});
