'use client';

import { useState, useEffect, useCallback } from 'react';
import { LocalState, ChallengeResult } from '../types/game';
import { format } from 'date-fns';

const LOCAL_STATE_KEY = 'pokenese-local-state';
const STATE_VERSION = 1;

const defaultLocalState: LocalState = {
  version: STATE_VERSION,
  glossary: [],
  glossary_seen_count: {},
  daily: {},
  challenge: {
    seen_ids: [],
    total_score: 0,
    is_active: false,
    run_number: 0,
  },
  settings: {
    show_pinyin: true,
    show_ipa: false,
    extreme_mode: false,
    auto_play_audio: false,
    theme: 'dark',
  },
};

function loadState(): LocalState {
  if (typeof window === 'undefined') return defaultLocalState;
  try {
    const raw = localStorage.getItem(LOCAL_STATE_KEY);
    if (!raw) return defaultLocalState;
    const parsed = JSON.parse(raw) as LocalState;
    if (parsed.version !== STATE_VERSION) return defaultLocalState;
    return parsed;
  } catch {
    return defaultLocalState;
  }
}

function saveState(state: LocalState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function useLocalState() {
  const [state, setState] = useState<LocalState>(defaultLocalState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  const updateState = useCallback((updater: (prev: LocalState) => LocalState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const addToGlossary = useCallback(
    (pokemonId: number) => {
      updateState((prev) => {
        if (prev.glossary.includes(pokemonId)) {
          return {
            ...prev,
            glossary_seen_count: {
              ...prev.glossary_seen_count,
              [pokemonId]: (prev.glossary_seen_count[pokemonId] ?? 0) + 1,
            },
          };
        }
        return {
          ...prev,
          glossary: [...prev.glossary, pokemonId],
          glossary_seen_count: {
            ...prev.glossary_seen_count,
            [pokemonId]: 1,
          },
        };
      });
    },
    [updateState]
  );

  const saveDailyResult = useCallback(
    (
      date: string,
      challengeNumber: 1 | 2 | 3,
      result: ChallengeResult
    ) => {
      updateState((prev) => ({
        ...prev,
        daily: {
          ...prev.daily,
          [date]: {
            ...prev.daily[date],
            [`challenge_${challengeNumber}`]: result,
          },
        },
      }));
    },
    [updateState]
  );

  const getDailyResults = useCallback(
    (date?: string) => {
      const key = date ?? format(new Date(), 'yyyy-MM-dd');
      return state.daily[key] ?? {};
    },
    [state]
  );

  const updateChallengeState = useCallback(
    (update: Partial<LocalState['challenge']>) => {
      updateState((prev) => ({
        ...prev,
        challenge: { ...prev.challenge, ...update },
      }));
    },
    [updateState]
  );

  const resetChallenge = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      challenge: {
        seen_ids: [],
        total_score: 0,
        is_active: true,
        run_number: prev.challenge.run_number + 1,
      },
    }));
  }, [updateState]);

  return {
    state,
    hydrated,
    addToGlossary,
    saveDailyResult,
    getDailyResults,
    updateChallengeState,
    resetChallenge,
    updateState,
  };
}
