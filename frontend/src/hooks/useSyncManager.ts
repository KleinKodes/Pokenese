'use client';
import { useEffect, useCallback } from 'react';
import { useUserStore } from '../store/userStore';
import { apiClient } from '../lib/api';
import { useLocalState } from './useLocalState';

export function useSyncManager() {
  const { isAuthenticated } = useUserStore();
  const { state, updateState } = useLocalState();

  const syncToServer = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const result = await apiClient.post<{
        glossary: Array<{ pokemon_id: number; times_seen: number }>;
        daily: Record<string, {
          challenge_1?: { score: number; hints_used: number; guesses: string[] } | null;
          challenge_2?: { score: number; hints_used: number; guesses: string[] } | null;
          challenge_3?: { score: number; hints_used: number; guesses: string[] } | null;
        }>;
        streak_current: number;
        streak_longest: number;
      }>('/api/v1/sync', {
        glossary: state.glossary,
        daily: state.daily,
      });

      // Merge server state back
      updateState((prev) => {
        const mergedGlossary = Array.from(new Set([
          ...prev.glossary,
          ...result.glossary.map((e) => e.pokemon_id),
        ]));
        const mergedSeenCount = { ...prev.glossary_seen_count };
        for (const e of result.glossary) {
          mergedSeenCount[e.pokemon_id] = Math.max(
            mergedSeenCount[e.pokemon_id] ?? 0,
            e.times_seen
          );
        }

        // Merge daily results (server is authoritative for completed challenges)
        const mergedDaily = { ...prev.daily };
        for (const [dateStr, dayData] of Object.entries(result.daily)) {
          if (!mergedDaily[dateStr]) mergedDaily[dateStr] = {};
          for (const [key, res] of Object.entries(dayData)) {
            if (res && !mergedDaily[dateStr][key as keyof typeof mergedDaily[string]]) {
              mergedDaily[dateStr] = { ...mergedDaily[dateStr], [key]: res };
            }
          }
        }

        // Update streak if server streak is higher
        const newStreak = { ...(prev.streak ?? { current: 0, longest: 0, last_completed_date: '', freeze_tokens: 0, freeze_equipped: false }) };
        if (result.streak_current > newStreak.current) newStreak.current = result.streak_current;
        if (result.streak_longest > newStreak.longest) newStreak.longest = result.streak_longest;

        return {
          ...prev,
          glossary: mergedGlossary,
          glossary_seen_count: mergedSeenCount,
          daily: mergedDaily,
          streak: newStreak,
        };
      });
    } catch {
      // Sync failures are silent
    }
  }, [isAuthenticated, state.glossary, state.daily, updateState]);

  // Sync on login
  useEffect(() => {
    if (isAuthenticated) {
      syncToServer();
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  return { syncToServer };
}
