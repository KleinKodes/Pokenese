'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { POKEMON_DATA } from '../../data/pokemon';
import { useLocalState } from '../../hooks/useLocalState';
import { useGame } from '../../hooks/useGame';
import { ChineseName } from '../../components/game/ChineseName';
import { GuessInput } from '../../components/game/GuessInput';
import { HintList } from '../../components/game/HintList';
import { GuessHistory } from '../../components/game/GuessHistory';
import { Button } from '../../components/ui/Button';
import type { PokemonType } from '../../types/pokemon';

const ChallengeComplete = dynamic(
  () =>
    import('../../components/game/ChallengeComplete').then(
      (m) => m.ChallengeComplete
    ),
  { ssr: false }
);

const SESSION_SIZE = 10;

export default function ReviewPage() {
  const { state, addToGlossary, hydrated } = useLocalState();

  const reviewQueue = useMemo(() => {
    return state.glossary
      .map((id) => POKEMON_DATA.find((p) => p.id === id))
      .filter((p): p is PokemonType => p !== undefined)
      .sort((a, b) => {
        const countA = state.glossary_seen_count[a.id] ?? 0;
        const countB = state.glossary_seen_count[b.id] ?? 0;
        return countA - countB;
      });
  }, [state.glossary, state.glossary_seen_count]);

  const [sessionQueue, setSessionQueue] = useState<PokemonType[]>([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);

  // Initialize session on mount
  useEffect(() => {
    if (hydrated && reviewQueue.length > 0) {
      const queue = reviewQueue.slice(0, SESSION_SIZE);
      setSessionQueue(queue);
      setSessionIndex(0);
      setCorrect(0);
      setTotal(0);
      setSessionDone(false);
      setSessionScore(0);
    }
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentPokemon = sessionQueue[sessionIndex] ?? null;

  const { gameState, submitGuess, isWrongGuess } = useGame(currentPokemon, {
    mode: 'review',
    onAddToGlossary: addToGlossary,
  });

  const handleGuess = (guess: string) => {
    submitGuess(guess);
  };

  // Watch for completion
  useEffect(() => {
    if (gameState.is_complete && !showComplete) {
      setTimeout(() => setShowComplete(true), 400);
    }
  }, [gameState.is_complete]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = useCallback(() => {
    setShowComplete(false);
    if (currentPokemon) {
      addToGlossary(currentPokemon.id);
      const score = gameState.score ?? 0;
      setSessionScore((prev) => prev + score);
      if (gameState.is_correct) setCorrect((c) => c + 1);
      setTotal((t) => t + 1);
    }

    const nextIndex = sessionIndex + 1;
    if (nextIndex >= sessionQueue.length) {
      setSessionDone(true);
    } else {
      setSessionIndex(nextIndex);
    }
  }, [currentPokemon, gameState, sessionIndex, sessionQueue.length, addToGlossary]);

  if (!hydrated) return null;

  // Empty glossary
  if (hydrated && reviewQueue.length === 0) {
    return (
      <div className="page-container">
        <div className="flex items-center gap-2 mb-6">
          <GraduationCap size={22} className="text-color-success" />
          <h1 className="text-2xl font-bold text-text-primary">Review</h1>
        </div>
        <div className="text-center py-16 space-y-4">
          <GraduationCap size={48} className="mx-auto text-text-muted opacity-40" />
          <p className="text-text-secondary font-semibold">Your glossary is empty</p>
          <p className="text-text-muted text-sm max-w-xs mx-auto">
            Complete some daily challenges or practice to build your glossary!
          </p>
          <Link href="/daily">
            <Button variant="primary" size="lg">
              Go to Daily
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Session summary
  if (sessionDone) {
    return (
      <div className="page-container">
        <div className="flex items-center gap-2 mb-6">
          <GraduationCap size={22} className="text-color-success" />
          <h1 className="text-2xl font-bold text-text-primary">Review</h1>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 py-8"
        >
          <GraduationCap size={48} className="mx-auto text-color-success" />
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Session Complete!</h2>
            <p className="text-text-muted">You reviewed {total} Pokémon</p>
          </div>
          <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Correct</span>
              <span className="font-bold text-color-success">{correct}/{total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Session Score</span>
              <span className="font-bold text-accent-gold">{sessionScore.toLocaleString()} pts</span>
            </div>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              const newQueue = reviewQueue.slice(0, SESSION_SIZE);
              setSessionQueue(newQueue);
              setSessionIndex(0);
              setCorrect(0);
              setTotal(0);
              setSessionDone(false);
              setSessionScore(0);
            }}
          >
            Review Again
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!currentPokemon) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-text-muted">
          <GraduationCap size={40} className="mx-auto mb-3 opacity-40" />
          <p>Loading review session...</p>
        </div>
      </div>
    );
  }

  const guessedIds = gameState.guesses
    .map((g) => POKEMON_DATA.find((p) => p.name_en.toLowerCase() === g.toLowerCase())?.id)
    .filter((id): id is number => id !== undefined);

  return (
    <div className="page-container" aria-label="Review mode">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <GraduationCap size={20} className="text-color-success" aria-hidden="true" />
          <h1 className="text-lg font-bold text-text-primary">Review</h1>
        </div>
        <div className="text-sm text-text-muted">
          {sessionIndex + 1} / {sessionQueue.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-bg-elevated rounded-full h-1.5 mb-6">
        <motion.div
          className="h-1.5 bg-color-success rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((sessionIndex) / sessionQueue.length) * 100}%` }}
        />
      </div>

      {/* Chinese name */}
      <ChineseName pokemon={currentPokemon} />

      {/* Hints */}
      <div className="mt-4">
        <HintList
          pokemon={currentPokemon}
          hintsRevealed={gameState.hints_revealed}
        />
      </div>

      {/* Guess history */}
      {gameState.guesses.length > 0 && !gameState.is_correct && (
        <div className="mt-4">
          <GuessHistory
            guesses={gameState.guesses}
            correctPokemon={currentPokemon}
            allPokemon={POKEMON_DATA}
          />
        </div>
      )}

      {/* Input */}
      {!gameState.is_complete && (
        <div className="mt-6">
          <GuessInput
            onGuess={handleGuess}
            guessedIds={guessedIds}
            isDisabled={gameState.is_complete}
            isWrongGuess={isWrongGuess}
            allPokemon={POKEMON_DATA}
          />
        </div>
      )}

      {/* Next button */}
      {gameState.is_complete && !showComplete && (
        <div className="mt-6">
          <Button variant="primary" size="lg" fullWidth onClick={handleNext}>
            Next
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Complete overlay */}
      <AnimatePresence>
        {showComplete && (
          <ChallengeComplete
            pokemon={currentPokemon}
            gameState={gameState}
            mode="challenge"
            onNext={handleNext}
            onDismiss={() => setShowComplete(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
