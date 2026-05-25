'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, RotateCcw, Trophy, Zap } from 'lucide-react';
import dynamic from 'next/dynamic';
import { POKEMON_DATA } from '../../data/pokemon';
import { useLocalState } from '../../hooks/useLocalState';
import { useGame } from '../../hooks/useGame';
import { ChineseName } from '../../components/game/ChineseName';
import { GuessInput } from '../../components/game/GuessInput';
import { HintList } from '../../components/game/HintList';
import { GuessHistory } from '../../components/game/GuessHistory';
import { ScoreDisplay } from '../../components/game/ScoreDisplay';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { PokemonType } from '../../types/pokemon';

const ChallengeComplete = dynamic(
  () =>
    import('../../components/game/ChallengeComplete').then(
      (m) => m.ChallengeComplete
    ),
  { ssr: false }
);

function pickRandomPokemon(
  allPokemon: PokemonType[],
  seenIds: number[]
): PokemonType | null {
  const remaining = allPokemon.filter((p) => !seenIds.includes(p.id));
  if (remaining.length === 0) return null;
  return remaining[Math.floor(Math.random() * remaining.length)];
}

export default function ChallengePage() {
  const { state, updateChallengeState, resetChallenge, addToGlossary, saveCompletedRun } = useLocalState();

  const [runScore, setRunScore] = useState(0);
  const [pokemonCount, setPokemonCount] = useState(0);
  const [seenIds, setSeenIds] = useState<number[]>([]);
  const [currentPokemon, setCurrentPokemon] = useState<PokemonType | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showRunComplete, setShowRunComplete] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from local state
  useEffect(() => {
    if (isInitialized) return;
    setIsInitialized(true);

    const savedSeen = state.challenge.seen_ids ?? [];
    const savedScore = state.challenge.total_score ?? 0;
    setSeenIds(savedSeen);
    setRunScore(savedScore);
    setPokemonCount(savedSeen.length);

    // Pick a pokemon not yet seen
    const next = pickRandomPokemon(POKEMON_DATA, savedSeen);
    setCurrentPokemon(next);
  }, [state.challenge, isInitialized]);

  const { gameState, submitGuess, isWrongGuess } = useGame(
    currentPokemon,
    { mode: 'challenge', onAddToGlossary: addToGlossary }
  );

  const handleGuess = useCallback(
    (guess: string) => {
      if (!currentPokemon) return;
      const correct = submitGuess(guess);

      if (correct || gameState.guesses.length + 1 >= 5) {
        setTimeout(() => setShowComplete(true), 400);
      }
    },
    [currentPokemon, submitGuess, gameState.guesses.length]
  );

  // Watch for game completion
  useEffect(() => {
    if (gameState.is_complete && !showComplete) {
      setTimeout(() => setShowComplete(true), 400);
    }
  }, [gameState.is_complete]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = useCallback(() => {
    if (!currentPokemon) return;
    setShowComplete(false);

    const score = gameState.score ?? 0;

    // If 0 score (failed completely) → reset run
    if (score === 0 && !gameState.is_correct) {
      setShowResetModal(true);
      return;
    }

    const newScore = runScore + score;
    const newSeen = [...seenIds, currentPokemon.id];
    setRunScore(newScore);
    setSeenIds(newSeen);
    setPokemonCount((c) => c + 1);

    updateChallengeState({
      seen_ids: newSeen,
      total_score: newScore,
      is_active: true,
    });

    // Pick next
    const next = pickRandomPokemon(POKEMON_DATA, newSeen);
    if (!next) {
      saveCompletedRun({
        run_number: state.challenge.run_number,
        total_score: newScore,
        pokemon_count: newSeen.length,
        ended_at: new Date().toISOString(),
        ended_by: 'complete',
      });
      setShowRunComplete(true);
      return;
    }
    setCurrentPokemon(next);
  }, [
    currentPokemon,
    gameState,
    runScore,
    seenIds,
    updateChallengeState,
    saveCompletedRun,
    state.challenge.run_number,
  ]);

  const handleReset = useCallback(() => {
    setShowResetModal(false);
    if (runScore > 0 || pokemonCount > 0) {
      saveCompletedRun({
        run_number: state.challenge.run_number,
        total_score: runScore,
        pokemon_count: pokemonCount,
        ended_at: new Date().toISOString(),
        ended_by: 'reset',
      });
    }
    resetChallenge();
    setRunScore(0);
    setSeenIds([]);
    setPokemonCount(0);
    const next = pickRandomPokemon(POKEMON_DATA, []);
    setCurrentPokemon(next);
  }, [resetChallenge, saveCompletedRun, runScore, pokemonCount, state.challenge.run_number]);

  if (!currentPokemon) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-text-muted">
          <Swords size={40} className="mx-auto mb-3 opacity-40" />
          <p>Loading challenge...</p>
        </div>
      </div>
    );
  }

  const guessedIds = gameState.guesses
    .map((g) => POKEMON_DATA.find((p) => p.name_en.toLowerCase() === g.toLowerCase())?.id)
    .filter((id): id is number => id !== undefined);

  return (
    <div className="page-container" aria-label="Challenge mode">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Swords size={20} className="text-accent-red" aria-hidden="true" />
          <h1 className="text-lg font-bold text-text-primary">Master Mode</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-accent-gold" />
            <span className="text-accent-gold font-bold">
              {runScore.toLocaleString()}
            </span>
          </div>
          <div className="text-text-muted">
            #{pokemonCount + 1} / {POKEMON_DATA.length}
          </div>
        </div>
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

      {/* Complete overlay */}
      <AnimatePresence>
        {showComplete && (
          <ChallengeComplete
            pokemon={currentPokemon}
            gameState={gameState}
            mode="challenge"
            onNext={handleNext}
          />
        )}
      </AnimatePresence>

      {/* Reset modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Run Over"
      >
        <div className="text-center space-y-4">
          <RotateCcw size={40} className="text-color-error mx-auto" />
          <p className="text-text-secondary">
            You scored 0 points on this Pokémon. Your run has ended.
          </p>
          <div className="bg-bg-elevated rounded-xl p-4">
            <p className="text-3xl font-bold text-accent-gold">
              {runScore.toLocaleString()}
            </p>
            <p className="text-text-muted text-sm">Final score</p>
            <p className="text-text-muted text-sm">{pokemonCount} Pokémon</p>
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={handleReset}>
            Start New Run
          </Button>
        </div>
      </Modal>

      {/* Run complete modal */}
      <Modal
        isOpen={showRunComplete}
        onClose={() => setShowRunComplete(false)}
        title="Amazing!"
      >
        <div className="text-center space-y-4">
          <Trophy size={40} className="text-accent-gold mx-auto" />
          <p className="text-text-secondary">
            You've seen all {POKEMON_DATA.length} Pokémon in this dataset!
          </p>
          <div className="bg-bg-elevated rounded-xl p-4">
            <p className="text-3xl font-bold text-accent-gold">
              {(runScore + (gameState.score ?? 0)).toLocaleString()}
            </p>
            <p className="text-text-muted text-sm">Final score</p>
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={handleReset}>
            Play Again
          </Button>
        </div>
      </Modal>
    </div>
  );
}
