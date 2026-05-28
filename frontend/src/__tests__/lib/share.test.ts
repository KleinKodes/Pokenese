import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateShareText } from '../../lib/share';
import type { PokemonType } from '../../types/pokemon';
import type { GameState } from '../../types/game';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makePokemon(overrides: Partial<PokemonType> = {}): PokemonType {
  return {
    id: 1,
    name_en: 'Bulbasaur',
    name_zh: '妙蛙種子',
    name_zh_simplified: '妙蛙种子',
    pinyin: 'Miào Wā Zhǒng Zǐ',
    pinyin_numbered: 'Miao4 Wa1 Zhong3 Zi3',
    ipa: '/mjɑʊ˥˩/',
    etymology: [],
    generation: 1,
    type1: 'Grass',
    type2: 'Poison',
    category: 'Seed Pokémon',
    evolution_line: [1, 2, 3],
    sprite_url: '',
    audio_filename: null,
    ...overrides,
  };
}

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    pokemon: null,
    guesses: [],
    hints_revealed: 0,
    is_complete: true,
    is_correct: true,
    score: 3000,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('generateShareText', () => {
  it('includes pokemon Chinese name and score on correct guess', async () => {
    const text = await generateShareText({
      pokemon: makePokemon(),
      gameState: makeGameState({ is_correct: true, score: 3000 }),
      mode: 'daily',
      date: '2026-05-27',
    });
    expect(text).toContain('妙蛙種子');
    expect(text).toContain('3,000');
    expect(text).toContain('pokenese.com');
  });

  it('includes score 0 on failed guess', async () => {
    const text = await generateShareText({
      pokemon: makePokemon(),
      gameState: makeGameState({ is_correct: false, score: 0, guesses: ['Ivysaur', 'Charmander', 'Squirtle', 'Pikachu', 'Eevee'] }),
      mode: 'daily',
      date: '2026-05-27',
    });
    expect(text).toContain('0');
  });

  it('includes Daily and date in header for daily mode', async () => {
    const text = await generateShareText({
      pokemon: makePokemon(),
      gameState: makeGameState(),
      mode: 'daily',
      date: '2026-05-27',
    });
    expect(text).toContain('Daily');
    expect(text).toContain('2026-05-27');
  });

  it('includes Challenge in header for challenge mode', async () => {
    const text = await generateShareText({
      pokemon: makePokemon(),
      gameState: makeGameState(),
      mode: 'challenge',
    });
    expect(text).toContain('Challenge');
  });

  it('produces green block for correct with 0 hints', async () => {
    const text = await generateShareText({
      pokemon: makePokemon(),
      gameState: makeGameState({ is_correct: true, hints_revealed: 0 }),
      mode: 'daily',
      date: '2026-05-27',
    });
    // scoreBlocks[0] = 🟩, rest = ⬛
    expect(text).toContain('🟩⬛⬛⬛⬛');
  });

  it('produces yellow then green blocks for correct with 2 hints', async () => {
    const text = await generateShareText({
      pokemon: makePokemon(),
      gameState: makeGameState({ is_correct: true, hints_revealed: 2 }),
      mode: 'daily',
      date: '2026-05-27',
    });
    // scoreBlocks[0]=🟨, [1]=🟨, [2]=🟩, [3]=⬛, [4]=⬛
    expect(text).toContain('🟨🟨🟩⬛⬛');
  });

  it('produces all black blocks for failed guess', async () => {
    const text = await generateShareText({
      pokemon: makePokemon(),
      gameState: makeGameState({ is_correct: false, hints_revealed: 4, score: 0 }),
      mode: 'daily',
      date: '2026-05-27',
    });
    // All ⬛ because is_correct is false
    expect(text).toContain('⬛⬛⬛⬛⬛');
  });
});
