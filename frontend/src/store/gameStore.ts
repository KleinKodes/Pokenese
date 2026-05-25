'use client';

import { create } from 'zustand';
import { GameState } from '../types/game';
import { PokemonType } from '../types/pokemon';

interface GameStore {
  currentGame: GameState;
  challengeScore: number;
  challengePokemonCount: number;

  initGame: (pokemon: PokemonType) => void;
  addGuess: (guess: string) => void;
  revealHint: () => void;
  completeGame: (isCorrect: boolean, score: number) => void;
  resetGame: () => void;
  addToChallengeScore: (score: number) => void;
  incrementChallengeCount: () => void;
  resetChallenge: () => void;
}

const initialGameState: GameState = {
  pokemon: null,
  guesses: [],
  hints_revealed: 0,
  is_complete: false,
  is_correct: false,
  score: null,
};

export const useGameStore = create<GameStore>((set) => ({
  currentGame: { ...initialGameState },
  challengeScore: 0,
  challengePokemonCount: 0,

  initGame: (pokemon) =>
    set({
      currentGame: {
        ...initialGameState,
        pokemon,
      },
    }),

  addGuess: (guess) =>
    set((state) => ({
      currentGame: {
        ...state.currentGame,
        guesses: [...state.currentGame.guesses, guess],
      },
    })),

  revealHint: () =>
    set((state) => ({
      currentGame: {
        ...state.currentGame,
        hints_revealed: state.currentGame.hints_revealed + 1,
      },
    })),

  completeGame: (isCorrect, score) =>
    set((state) => ({
      currentGame: {
        ...state.currentGame,
        is_complete: true,
        is_correct: isCorrect,
        score,
      },
    })),

  resetGame: () =>
    set({
      currentGame: { ...initialGameState },
    }),

  addToChallengeScore: (score) =>
    set((state) => ({
      challengeScore: state.challengeScore + score,
    })),

  incrementChallengeCount: () =>
    set((state) => ({
      challengePokemonCount: state.challengePokemonCount + 1,
    })),

  resetChallenge: () =>
    set({
      challengeScore: 0,
      challengePokemonCount: 0,
      currentGame: { ...initialGameState },
    }),
}));
