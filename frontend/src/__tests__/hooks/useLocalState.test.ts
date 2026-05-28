import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { format, subDays } from 'date-fns';
import { useLocalState } from '../../hooks/useLocalState';
import type { LocalState } from '../../types/game';

const LOCAL_STATE_KEY = 'pokenese-local-state';

function setLocalState(state: Partial<LocalState> & { version?: number }): void {
  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
}

async function renderAndHydrate() {
  const rendered = renderHook(() => useLocalState());
  // Wait for useEffect to hydrate from localStorage
  await act(async () => {});
  return rendered;
}

describe('useLocalState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initial state has zero streak', async () => {
    const { result } = await renderAndHydrate();
    expect(result.current.state.streak.current).toBe(0);
  });

  it('updateStreak increments on first completion', async () => {
    const { result } = await renderAndHydrate();
    const today = format(new Date(), 'yyyy-MM-dd');

    await act(async () => {
      result.current.updateStreak(today);
    });

    expect(result.current.state.streak.current).toBe(1);
  });

  it('updateStreak increments on consecutive days', async () => {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    setLocalState({
      version: 2,
      glossary: [],
      glossary_seen_count: {},
      daily: {},
      challenge: { seen_ids: [], total_score: 0, is_active: false, run_number: 0 },
      settings: { show_pinyin: true, show_ipa: false, extreme_mode: false, auto_play_audio: false, theme: 'dark', show_traditional: false },
      streak: { current: 5, longest: 5, last_completed_date: yesterday, freeze_tokens: 0, freeze_equipped: false },
      master_runs: [],
    });

    const { result } = await renderAndHydrate();
    const today = format(new Date(), 'yyyy-MM-dd');

    await act(async () => {
      result.current.updateStreak(today);
    });

    expect(result.current.state.streak.current).toBe(6);
  });

  it('updateStreak resets on missed day (no freeze)', async () => {
    const threeDaysAgo = format(subDays(new Date(), 3), 'yyyy-MM-dd');
    setLocalState({
      version: 2,
      glossary: [],
      glossary_seen_count: {},
      daily: {},
      challenge: { seen_ids: [], total_score: 0, is_active: false, run_number: 0 },
      settings: { show_pinyin: true, show_ipa: false, extreme_mode: false, auto_play_audio: false, theme: 'dark', show_traditional: false },
      streak: { current: 10, longest: 10, last_completed_date: threeDaysAgo, freeze_tokens: 0, freeze_equipped: false },
      master_runs: [],
    });

    const { result } = await renderAndHydrate();
    const today = format(new Date(), 'yyyy-MM-dd');

    await act(async () => {
      result.current.updateStreak(today);
    });

    expect(result.current.state.streak.current).toBe(1);
  });

  it('updateStreak is idempotent for same day', async () => {
    const { result } = await renderAndHydrate();
    const today = format(new Date(), 'yyyy-MM-dd');

    await act(async () => {
      result.current.updateStreak(today);
    });
    await act(async () => {
      result.current.updateStreak(today);
    });

    expect(result.current.state.streak.current).toBe(1);
  });

  it('updateStreak earns freeze token at 7-day milestone', async () => {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    setLocalState({
      version: 2,
      glossary: [],
      glossary_seen_count: {},
      daily: {},
      challenge: { seen_ids: [], total_score: 0, is_active: false, run_number: 0 },
      settings: { show_pinyin: true, show_ipa: false, extreme_mode: false, auto_play_audio: false, theme: 'dark', show_traditional: false },
      streak: { current: 6, longest: 6, last_completed_date: yesterday, freeze_tokens: 0, freeze_equipped: false },
      master_runs: [],
    });

    const { result } = await renderAndHydrate();
    const today = format(new Date(), 'yyyy-MM-dd');

    await act(async () => {
      result.current.updateStreak(today);
    });

    expect(result.current.state.streak.current).toBe(7);
    expect(result.current.state.streak.freeze_tokens).toBe(1);
  });

  it('equipFreeze does nothing when no tokens', async () => {
    const { result } = await renderAndHydrate();

    await act(async () => {
      result.current.equipFreeze();
    });

    expect(result.current.state.streak.freeze_equipped).toBe(false);
    expect(result.current.state.streak.freeze_tokens).toBe(0);
  });

  it('equipFreeze consumes a token and sets equipped', async () => {
    setLocalState({
      version: 2,
      glossary: [],
      glossary_seen_count: {},
      daily: {},
      challenge: { seen_ids: [], total_score: 0, is_active: false, run_number: 0 },
      settings: { show_pinyin: true, show_ipa: false, extreme_mode: false, auto_play_audio: false, theme: 'dark', show_traditional: false },
      streak: { current: 7, longest: 7, last_completed_date: '', freeze_tokens: 1, freeze_equipped: false },
      master_runs: [],
    });

    const { result } = await renderAndHydrate();

    await act(async () => {
      result.current.equipFreeze();
    });

    expect(result.current.state.streak.freeze_tokens).toBe(0);
    expect(result.current.state.streak.freeze_equipped).toBe(true);
  });

  it('migrates v1 state to v2 with streak field', async () => {
    // v1 state: no streak field
    localStorage.setItem(
      LOCAL_STATE_KEY,
      JSON.stringify({
        version: 1,
        glossary: [1, 4],
        glossary_seen_count: { '1': 1, '4': 1 },
        daily: {},
        challenge: { seen_ids: [], total_score: 0, is_active: false, run_number: 0 },
        settings: { show_pinyin: true, show_ipa: false, extreme_mode: false, auto_play_audio: false, theme: 'dark', show_traditional: false },
      })
    );

    const { result } = await renderAndHydrate();

    expect(result.current.state.version).toBe(2);
    expect(result.current.state.streak).toBeDefined();
    expect(typeof result.current.state.streak.current).toBe('number');
    expect(typeof result.current.state.streak.longest).toBe('number');
    expect(typeof result.current.state.streak.freeze_tokens).toBe('number');
  });

  it('addToGlossary adds a new pokemon', async () => {
    const { result } = await renderAndHydrate();

    await act(async () => {
      result.current.addToGlossary(25);
    });

    expect(result.current.state.glossary).toContain(25);
    expect(result.current.state.glossary_seen_count[25]).toBe(1);
  });

  it('addToGlossary increments seen count for existing pokemon', async () => {
    const { result } = await renderAndHydrate();

    await act(async () => {
      result.current.addToGlossary(25);
    });
    await act(async () => {
      result.current.addToGlossary(25);
    });

    // Should only appear once in the glossary array
    const occurrences = result.current.state.glossary.filter((id) => id === 25).length;
    expect(occurrences).toBe(1);
    // But seen count should be 2
    expect(result.current.state.glossary_seen_count[25]).toBe(2);
  });
});
