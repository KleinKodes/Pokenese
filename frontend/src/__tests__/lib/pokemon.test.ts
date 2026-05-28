import { describe, it, expect } from 'vitest';
import { filterPokemon, searchPokemon } from '../../lib/pokemon';
import type { PokemonType } from '../../types/pokemon';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makePokemon(overrides: Partial<PokemonType>): PokemonType {
  return {
    id: 1,
    name_en: 'TestMon',
    name_zh: '测试怪',
    name_zh_simplified: '测试怪',
    pinyin: 'Ce4 Shi4 Guai4',
    pinyin_numbered: 'Ce4 Shi4 Guai4',
    ipa: '',
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

const sampleData: PokemonType[] = [
  makePokemon({ id: 1, name_en: 'Bulbasaur', name_zh: '妙蛙種子', name_zh_simplified: '妙蛙种子', generation: 1, type1: 'Grass', type2: 'Poison' }),
  makePokemon({ id: 4, name_en: 'Charmander', name_zh: '小火龍', name_zh_simplified: '小火龙', generation: 1, type1: 'Fire', type2: null }),
  makePokemon({ id: 7, name_en: 'Squirtle', name_zh: '傑尼龜', name_zh_simplified: '杰尼龟', generation: 1, type1: 'Water', type2: null }),
  makePokemon({ id: 25, name_en: 'Pikachu', name_zh: '皮卡丘', name_zh_simplified: '皮卡丘', generation: 1, type1: 'Electric', type2: null }),
  makePokemon({ id: 152, name_en: 'Chikorita', name_zh: '菊草葉', name_zh_simplified: '菊草叶', generation: 2, type1: 'Grass', type2: null }),
  makePokemon({ id: 155, name_en: 'Cyndaquil', name_zh: '火球鼠', name_zh_simplified: '火球鼠', generation: 2, type1: 'Fire', type2: null }),
];

// ── filterPokemon ─────────────────────────────────────────────────────────────

describe('filterPokemon', () => {
  it('filters by generation', () => {
    const result = filterPokemon(sampleData, { generation: 2 });
    expect(result.every((p) => p.generation === 2)).toBe(true);
    expect(result.length).toBe(2);
  });

  it('returns all pokemon when generation filter is not set', () => {
    const result = filterPokemon(sampleData, {});
    expect(result.length).toBe(sampleData.length);
  });

  it('filters by type (type1 match)', () => {
    const result = filterPokemon(sampleData, { type: 'Fire' });
    expect(result.every((p) => p.type1 === 'Fire' || p.type2 === 'Fire')).toBe(true);
    expect(result.length).toBe(2); // Charmander + Cyndaquil
  });

  it('filters by type (type2 match)', () => {
    const result = filterPokemon(sampleData, { type: 'Poison' });
    expect(result.length).toBe(1);
    expect(result[0].name_en).toBe('Bulbasaur');
  });

  it('can combine generation and type filters', () => {
    const result = filterPokemon(sampleData, { generation: 1, type: 'Fire' });
    expect(result.length).toBe(1);
    expect(result[0].name_en).toBe('Charmander');
  });
});

// ── searchPokemon ─────────────────────────────────────────────────────────────

describe('searchPokemon', () => {
  it('returns empty array for empty query', () => {
    expect(searchPokemon(sampleData, '')).toEqual([]);
    expect(searchPokemon(sampleData, '   ')).toEqual([]);
  });

  it('finds pokemon by prefix (case insensitive)', () => {
    const result = searchPokemon(sampleData, 'bul');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name_en).toBe('Bulbasaur');
  });

  it('finds pokemon by partial name match', () => {
    const result = searchPokemon(sampleData, 'aur');
    // Bulbasaur contains "aur"
    const names = result.map((p) => p.name_en);
    expect(names).toContain('Bulbasaur');
  });

  it('prefix matches rank higher than contains matches', () => {
    // Add a pokemon whose name contains "char" but doesn't start with it
    const extendedData = [
      ...sampleData,
      makePokemon({ id: 999, name_en: 'Extrachar', name_zh: '额外', name_zh_simplified: '额外', generation: 1, type1: 'Normal' }),
    ];
    const result = searchPokemon(extendedData, 'char');
    // Charmander starts with "Char", should come before "Extrachar"
    const charmanderIdx = result.findIndex((p) => p.name_en === 'Charmander');
    const extracharIdx = result.findIndex((p) => p.name_en === 'Extrachar');
    if (charmanderIdx !== -1 && extracharIdx !== -1) {
      expect(charmanderIdx).toBeLessThan(extracharIdx);
    }
  });

  it('returns at most maxResults results', () => {
    const result = searchPokemon(sampleData, 'a', [], 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('excludes pokemon in excludeIds', () => {
    const result = searchPokemon(sampleData, 'char', [4]);
    const ids = result.map((p) => p.id);
    expect(ids).not.toContain(4);
  });

  it('is case insensitive', () => {
    const lower = searchPokemon(sampleData, 'bulbasaur');
    const upper = searchPokemon(sampleData, 'BULBASAUR');
    expect(lower.length).toBe(upper.length);
    if (lower.length > 0 && upper.length > 0) {
      expect(lower[0].name_en).toBe(upper[0].name_en);
    }
  });
});
