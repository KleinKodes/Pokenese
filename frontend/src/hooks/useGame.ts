'use client';

import { useState, useCallback, useEffect } from 'react';
import { PokemonType } from '../types/pokemon';
import { GameState, GameMode, ChallengeResult } from '../types/game';
import { calculateScore } from '../lib/scoring';
import { useLocalState } from './useLocalState';
import { useAudio } from './useAudio';
import { useSettingsStore } from '../store/settingsStore';
import { format } from 'date-fns';

const MAX_HINTS = 4;

interface UseGameOptions {
  mode: GameMode;
  challengeNumber?: 1 | 2 | 3;
  date?: string;
}

interface UseGameReturn {
  gameState: GameState;
  submitGuess: (guess: string) => boolean;
  revealNextHint: () => void;
  isLoading: boolean;
  isWrongGuess: boolean;
}

export function useGame(
  pokemon: PokemonType | null,
  options: UseGameOptions
): UseGameReturn {
  const { mode, challengeNumber, date } = options;
  const { addToGlossary, saveDailyResult } = useLocalState();
  const { auto_play_audio } = useSettingsStore();
  const { playPokemonName } = useAudio();

  const [gameState, setGameState] = useState<GameState>({
    pokemon: null,
    guesses: [],
    hints_revealed: 0,
    is_complete: false,
    is_correct: false,
    score: null,
  });
  const [isWrongGuess, setIsWrongGuess] = useState(false);

  // Initialize game when pokemon changes
  useEffect(() => {
    if (!pokemon) return;
    setGameState({
      pokemon,
      guesses: [],
      hints_revealed: 0,
      is_complete: false,
      is_correct: false,
      score: null,
    });
    setIsWrongGuess(false);

    // Auto-play audio if enabled
    if (auto_play_audio) {
      playPokemonName(pokemon);
    }

    // Add to glossary whenever pokemon is encountered
    addToGlossary(pokemon.id);
  }, [pokemon?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitGuess = useCallback(
    (guess: string): boolean => {
      if (!pokemon || gameState.is_complete) return false;

      const isCorrect =
        guess.toLowerCase() === pokemon.name_en.toLowerCase();

      if (isCorrect) {
        const score = calculateScore(gameState.hints_revealed, true);
        const result: ChallengeResult = {
          guesses: [...gameState.guesses, guess],
          score,
          hints_used: gameState.hints_revealed,
          completed_at: new Date().toISOString(),
        };

        setGameState((prev) => ({
          ...prev,
          guesses: [...prev.guesses, guess],
          is_complete: true,
          is_correct: true,
          score,
        }));

        // Save result
        if (mode === 'daily' && challengeNumber) {
          const dateKey = date ?? format(new Date(), 'yyyy-MM-dd');
          saveDailyResult(dateKey, challengeNumber, result);
        }

        return true;
      } else {
        // Wrong guess — reveal next hint if available
        const newGuesses = [...gameState.guesses, guess];
        const newHintsRevealed = Math.min(
          gameState.hints_revealed + 1,
          MAX_HINTS
        );

        const isExhausted = newHintsRevealed >= MAX_HINTS && newGuesses.length > MAX_HINTS;

        setGameState((prev) => ({
          ...prev,
          guesses: newGuesses,
          hints_revealed: newHintsRevealed,
          is_complete: isExhausted,
          is_correct: false,
          score: isExhausted ? 0 : prev.score,
        }));

        // Trigger shake animation
        setIsWrongGuess(true);
        setTimeout(() => setIsWrongGuess(false), 500);

        // Save failed result if exhausted
        if (isExhausted && mode === 'daily' && challengeNumber) {
          const dateKey = date ?? format(new Date(), 'yyyy-MM-dd');
          saveDailyResult(dateKey, challengeNumber, {
            guesses: newGuesses,
            score: 0,
            hints_used: newHintsRevealed,
            completed_at: new Date().toISOString(),
          });
        }

        return false;
      }
    },
    [pokemon, gameState, mode, challengeNumber, date, saveDailyResult]
  );

  const revealNextHint = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      hints_revealed: Math.min(prev.hints_revealed + 1, MAX_HINTS),
    }));
  }, []);

  return {
    gameState,
    submitGuess,
    revealNextHint,
    isLoading: false,
    isWrongGuess,
  };
}
