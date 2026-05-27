'use client';

import { useState, useEffect, useCallback } from 'react';
import { LocalState, ChallengeResult, MasterRunRecord, StreakState } from '../types/game';
import { format, subDays, parseISO, differenceInCalendarDays } from 'date-fns';

const LOCAL_STATE_KEY = 'pokenese-local-state';
const STATE_VERSION = 2;

const defaultStreak: StreakState = {
  current: 0,
  longest: 0,
  last_completed_date: '',
  freeze_tokens: 0,
  freeze_equipped: false,
};

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
    show_traditional: false,
  },
  streak: defaultStreak,
};

function computeStreakFromDaily(
  daily: LocalState['daily']
): { current: number; longest: number; lastDate: string } {
  // Find all dates with all 3 challenges completed
  const completedDates = Object.entries(daily)
    .filter(([, results]) => results.challenge_1 && results.challenge_2 && results.challenge_3)
    .map(([date]) => date)
    .sort(); // ascending

  if (completedDates.length === 0) {
    return { current: 0, longest: 0, lastDate: '' };
  }

  // Find longest consecutive run
  let longest = 1;
  let run = 1;
  for (let i = 1; i < completedDates.length; i++) {
    const prev = parseISO(completedDates[i - 1]);
    const curr = parseISO(completedDates[i]);
    const diff = differenceInCalendarDays(curr, prev);
    if (diff === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Count current streak from most recent date backward
  const lastDate = completedDates[completedDates.length - 1];
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  let current = 0;
  if (lastDate === today || lastDate === yesterday) {
    current = 1;
    for (let i = completedDates.length - 2; i >= 0; i--) {
      const curr = parseISO(completedDates[i + 1]);
      const prev = parseISO(completedDates[i]);
      const diff = differenceInCalendarDays(curr, prev);
      if (diff === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  return { current, longest, lastDate };
}

function migrateState(raw: unknown): LocalState {
  const parsed = raw as Partial<LocalState> & { version?: number };
  // v1 → v2: add streak field, compute from daily history
  const streakData = computeStreakFromDaily(parsed.daily ?? {});
  return {
    ...defaultLocalState,
    ...(parsed as LocalState),
    version: STATE_VERSION,
    streak: {
      current: streakData.current,
      longest: streakData.longest,
      last_completed_date: streakData.lastDate,
      freeze_tokens: (parsed as Partial<LocalState>).streak?.freeze_tokens ?? 0,
      freeze_equipped: (parsed as Partial<LocalState>).streak?.freeze_equipped ?? false,
    },
  };
}

function loadState(): LocalState {
  if (typeof window === 'undefined') return defaultLocalState;
  try {
    const raw = localStorage.getItem(LOCAL_STATE_KEY);
    if (!raw) return defaultLocalState;
    const parsed = JSON.parse(raw) as LocalState;
    if (parsed.version !== STATE_VERSION) {
      return migrateState(parsed);
    }
    // Ensure streak field exists even in version 2 states that might be missing it
    if (!parsed.streak) {
      return migrateState(parsed);
    }
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

  const saveCompletedRun = useCallback(
    (run: MasterRunRecord) => {
      updateState((prev) => ({
        ...prev,
        master_runs: [...(prev.master_runs ?? []), run],
      }));
    },
    [updateState]
  );

  const resetAllData = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LOCAL_STATE_KEY);
    setState(defaultLocalState);
  }, []);

  const updateStreak = useCallback(
    (today: string) => {
      updateState((prev) => {
        const streak = prev.streak ?? defaultStreak;

        // Already counted today
        if (streak.last_completed_date === today) return prev;

        const yesterday = format(subDays(parseISO(today), 1), 'yyyy-MM-dd');
        let newCurrent = streak.current;
        let newLongest = streak.longest;
        let newFreezeEquipped = streak.freeze_equipped;
        let newFreezeTokens = streak.freeze_tokens;

        if (streak.last_completed_date === yesterday) {
          // Consecutive day
          newCurrent = streak.current + 1;
        } else if (
          streak.last_completed_date !== '' &&
          streak.last_completed_date !== yesterday &&
          streak.freeze_equipped === true
        ) {
          // Missed a day but freeze equipped — preserve streak
          newCurrent = streak.current + 1;
          newFreezeEquipped = false;
        } else {
          // Reset streak
          newCurrent = 1;
        }

        newLongest = Math.max(newLongest, newCurrent);

        // Earn a freeze token every 7-day multiple
        if (newCurrent % 7 === 0 && newFreezeTokens < 3) {
          newFreezeTokens = Math.min(newFreezeTokens + 1, 3);
        }

        return {
          ...prev,
          streak: {
            ...streak,
            current: newCurrent,
            longest: newLongest,
            last_completed_date: today,
            freeze_tokens: newFreezeTokens,
            freeze_equipped: newFreezeEquipped,
          },
        };
      });
    },
    [updateState]
  );

  const consumeFreeze = useCallback(() => {
    updateState((prev) => {
      const streak = prev.streak ?? defaultStreak;
      if (streak.freeze_tokens <= 0) return prev;
      return {
        ...prev,
        streak: {
          ...streak,
          freeze_tokens: streak.freeze_tokens - 1,
          freeze_equipped: false,
        },
      };
    });
  }, [updateState]);

  const equipFreeze = useCallback(() => {
    updateState((prev) => {
      const streak = prev.streak ?? defaultStreak;
      if (streak.freeze_tokens <= 0 || streak.freeze_equipped) return prev;
      return {
        ...prev,
        streak: {
          ...streak,
          freeze_tokens: streak.freeze_tokens - 1,
          freeze_equipped: true,
        },
      };
    });
  }, [updateState]);

  return {
    state,
    hydrated,
    addToGlossary,
    saveDailyResult,
    getDailyResults,
    updateChallengeState,
    resetChallenge,
    saveCompletedRun,
    resetAllData,
    updateState,
    updateStreak,
    consumeFreeze,
    equipFreeze,
  };
}
