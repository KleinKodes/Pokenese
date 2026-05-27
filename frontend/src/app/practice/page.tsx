'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, ChevronRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import { POKEMON_DATA } from '../../data/pokemon';
import { useLocalState } from '../../hooks/useLocalState';
import { useGame } from '../../hooks/useGame';
import { ChineseName } from '../../components/game/ChineseName';
import { GuessInput } from '../../components/game/GuessInput';
import { HintList } from '../../components/game/HintList';
import { GuessHistory } from '../../components/game/GuessHistory';
import { Button } from '../../components/ui/Button';
import { TypeBadge } from '../../components/ui/TypeBadge';
import type { PokemonType, PokemonTypeName } from '../../types/pokemon';

const ChallengeComplete = dynamic(
  () =>
    import('../../components/game/ChallengeComplete').then(
      (m) => m.ChallengeComplete
    ),
  { ssr: false }
);

const ALL_TYPES: PokemonTypeName[] = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

const ALL_GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function pickRandom<T>(pool: T[]): T | null {
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function normalizePin(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '');
}

export default function PracticePage() {
  const { addToGlossary } = useLocalState();

  const [filterMode, setFilterMode] = useState<'all' | 'generation' | 'type'>('all');
  const [selectedGen, setSelectedGen] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<'guess' | 'pinyin'>('guess');
  const [currentPokemon, setCurrentPokemon] = useState<PokemonType | null>(null);
  const [showComplete, setShowComplete] = useState(false);

  // Pinyin mode state
  const [pinyinInput, setPinyinInput] = useState('');
  const [pinyinResult, setPinyinResult] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const filteredPool = useMemo(() => {
    if (filterMode === 'generation' && selectedGen !== null) {
      return POKEMON_DATA.filter((p) => p.generation === selectedGen);
    }
    if (filterMode === 'type' && selectedType !== null) {
      return POKEMON_DATA.filter(
        (p) => p.type1 === selectedType || p.type2 === selectedType
      );
    }
    return POKEMON_DATA;
  }, [filterMode, selectedGen, selectedType]);

  const pickNext = useCallback(() => {
    const next = pickRandom(filteredPool);
    setCurrentPokemon(next);
    setPinyinInput('');
    setPinyinResult('idle');
    setShowComplete(false);
  }, [filteredPool]);

  // Pick initial pokemon
  useEffect(() => {
    pickNext();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-pick when filter changes
  useEffect(() => {
    pickNext();
  }, [filterMode, selectedGen, selectedType]); // eslint-disable-line react-hooks/exhaustive-deps

  const { gameState, submitGuess, isWrongGuess } = useGame(currentPokemon, {
    mode: 'practice',
    onAddToGlossary: addToGlossary,
  });

  const handleGuess = (guess: string) => {
    submitGuess(guess);
  };

  // Watch for completion in guess mode
  useEffect(() => {
    if (gameState.is_complete && !showComplete) {
      setTimeout(() => setShowComplete(true), 400);
    }
  }, [gameState.is_complete]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = () => {
    setShowComplete(false);
    pickNext();
  };

  const handlePinyinSubmit = () => {
    if (!currentPokemon || pinyinResult !== 'idle') return;
    const normalized = normalizePin(pinyinInput);
    const correct = normalizePin(currentPokemon.pinyin_numbered);
    if (normalized === correct) {
      setPinyinResult('correct');
    } else {
      setPinyinResult('wrong');
    }
  };

  const handleFilterMode = (mode: 'all' | 'generation' | 'type') => {
    setFilterMode(mode);
    setSelectedGen(null);
    setSelectedType(null);
  };

  if (!currentPokemon) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-text-muted">
          <Dumbbell size={40} className="mx-auto mb-3 opacity-40" />
          <p>Loading practice mode...</p>
        </div>
      </div>
    );
  }

  const guessedIds = gameState.guesses
    .map((g) => POKEMON_DATA.find((p) => p.name_en.toLowerCase() === g.toLowerCase())?.id)
    .filter((id): id is number => id !== undefined);

  return (
    <div className="page-container" aria-label="Practice mode">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Dumbbell size={20} className="text-accent-blue" aria-hidden="true" />
        <h1 className="text-lg font-bold text-text-primary">Practice</h1>
      </div>

      {/* Filter bar */}
      <div className="space-y-3 mb-5">
        <div className="flex gap-1 bg-bg-elevated rounded-xl p-1">
          {(['all', 'generation', 'type'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleFilterMode(mode)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                filterMode === mode
                  ? 'bg-bg-surface text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {mode === 'all' ? 'All' : mode === 'generation' ? 'By Generation' : 'By Type'}
            </button>
          ))}
        </div>

        {/* Generation selector */}
        {filterMode === 'generation' && (
          <div className="flex flex-wrap gap-2">
            {ALL_GENS.map((gen) => (
              <button
                key={gen}
                onClick={() => setSelectedGen(selectedGen === gen ? null : gen)}
                className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${
                  selectedGen === gen
                    ? 'bg-accent-blue text-white'
                    : 'bg-bg-elevated text-text-secondary hover:bg-bg-surface'
                }`}
              >
                {gen}
              </button>
            ))}
          </div>
        )}

        {/* Type selector */}
        {filterMode === 'type' && (
          <div className="flex flex-wrap gap-2">
            {ALL_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(selectedType === type ? null : type)}
                className={`transition-all ${selectedType === type ? 'opacity-100 ring-2 ring-white/40' : 'opacity-70 hover:opacity-100'}`}
              >
                <TypeBadge type={type} size="sm" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 bg-bg-elevated rounded-xl p-1 mb-6">
        {(['guess', 'pinyin'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => { setGameMode(mode); pickNext(); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              gameMode === mode
                ? 'bg-bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {mode === 'guess' ? 'Guess Name' : 'Guess Pinyin'}
          </button>
        ))}
      </div>

      {/* Pool info */}
      <p className="text-text-muted text-xs text-center mb-4">
        {filteredPool.length} Pokémon in pool
      </p>

      {gameMode === 'guess' ? (
        <>
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

          {/* Next button after dismiss */}
          {gameState.is_complete && !showComplete && (
            <div className="mt-6">
              <Button variant="primary" size="lg" fullWidth onClick={handleNext}>
                Next Pokémon
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
        </>
      ) : (
        /* Pinyin mode */
        <PinyinPractice
          pokemon={currentPokemon}
          pinyinInput={pinyinInput}
          onInputChange={setPinyinInput}
          pinyinResult={pinyinResult}
          onSubmit={handlePinyinSubmit}
          onNext={pickNext}
        />
      )}
    </div>
  );
}

interface PinyinPracticeProps {
  pokemon: PokemonType;
  pinyinInput: string;
  onInputChange: (v: string) => void;
  pinyinResult: 'idle' | 'correct' | 'wrong';
  onSubmit: () => void;
  onNext: () => void;
}

function PinyinPractice({
  pokemon,
  pinyinInput,
  onInputChange,
  pinyinResult,
  onSubmit,
  onNext,
}: PinyinPracticeProps) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pinyinResult === 'idle') onSubmit();
  };

  return (
    <div className="space-y-5">
      {/* Sprite + name */}
      <div className="flex flex-col items-center gap-3 p-6 bg-bg-surface border border-border-default rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pokemon.sprite_url}
          alt={pokemon.name_en}
          className="w-28 h-28 object-contain"
        />
        <p className="font-chinese text-5xl font-bold text-text-primary">
          {pokemon.name_zh_simplified}
        </p>
      </div>

      {/* Input */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Type the pinyin (e.g. miao4 wa1 zhong3 zi)
        </label>
        <input
          type="text"
          value={pinyinInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder="e.g. pi2 ka3 qiu1"
          disabled={pinyinResult !== 'idle'}
          className="w-full px-4 py-3 rounded-xl border border-border-default bg-bg-input text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus disabled:opacity-60 min-h-[48px]"
        />
      </div>

      {/* Result feedback */}
      {pinyinResult !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border ${
            pinyinResult === 'correct'
              ? 'bg-color-success/10 border-color-success/30'
              : 'bg-color-error/10 border-color-error/30'
          }`}
        >
          <p className={`font-semibold mb-1 ${pinyinResult === 'correct' ? 'text-color-success' : 'text-color-error'}`}>
            {pinyinResult === 'correct' ? 'Correct!' : 'Not quite...'}
          </p>
          <p className="text-text-secondary text-sm">
            Correct pinyin: <span className="font-mono text-accent-blue">{pokemon.pinyin}</span>
          </p>
          <p className="text-text-muted text-xs mt-1">
            (numbered: <span className="font-mono">{pokemon.pinyin_numbered}</span>)
          </p>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {pinyinResult === 'idle' ? (
          <Button variant="primary" size="lg" fullWidth onClick={onSubmit}>
            Check
          </Button>
        ) : (
          <Button variant="primary" size="lg" fullWidth onClick={onNext}>
            Next Pokémon
            <ChevronRight size={16} />
          </Button>
        )}
        {pinyinResult === 'idle' && (
          <Button variant="secondary" size="lg" onClick={onNext}>
            Skip
          </Button>
        )}
      </div>
    </div>
  );
}
