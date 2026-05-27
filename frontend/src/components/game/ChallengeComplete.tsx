'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { CheckCircle, XCircle, Share2, ChevronRight, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PokemonType } from '../../types/pokemon';
import { GameState } from '../../types/game';
import { ScoreDisplay } from './ScoreDisplay';
import { TypeBadge } from '../ui/TypeBadge';
import { Button } from '../ui/Button';
import { generateShareText, shareResult } from '../../lib/share';

interface ChallengeCompleteProps {
  pokemon: PokemonType;
  gameState: GameState;
  mode: 'daily' | 'challenge';
  onNext?: () => void;
  onShare?: () => void;
  onDismiss?: () => void;
  date?: string;
}

export function ChallengeComplete({
  pokemon,
  gameState,
  mode,
  onNext,
  onShare,
  onDismiss,
  date,
}: ChallengeCompleteProps) {
  const isCorrect = gameState.is_correct;
  const score = gameState.score ?? 0;

  useEffect(() => {
    if (!isCorrect) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (!prefersReducedMotion) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#E8334A', '#F5C842', '#4488FF', '#F0F0FF'],
      });
    }
  }, [isCorrect]);

  const handleShare = async () => {
    const text = await generateShareText({
      pokemon,
      gameState,
      mode,
      date,
    });
    const copied = await shareResult(text);
    if (copied && onShare) onShare();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-complete-title"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="w-full max-w-md bg-bg-surface border border-border-default rounded-2xl shadow-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-5 flex items-center gap-3 ${
            isCorrect
              ? 'bg-color-success/10 border-b border-color-success/20'
              : 'bg-color-error/10 border-b border-color-error/20'
          }`}
        >
          {isCorrect ? (
            <CheckCircle size={24} className="text-color-success" />
          ) : (
            <XCircle size={24} className="text-color-error" />
          )}
          <h2
            id="challenge-complete-title"
            className="text-lg font-bold text-text-primary flex-1"
          >
            {isCorrect ? 'Correct!' : 'Not quite...'}
          </h2>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-text-muted hover:text-text-primary transition-colors"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Pokemon reveal */}
        <div className="p-5 flex items-center gap-4 border-b border-border-default">
          <Image
            src={pokemon.sprite_url}
            alt={pokemon.name_en}
            width={80}
            height={80}
            className="w-20 h-20 object-contain"
            unoptimized
          />
          <div>
            <h3 className="text-2xl font-bold text-text-primary">
              {pokemon.name_en}
            </h3>
            <p className="font-chinese text-xl text-text-secondary">
              {pokemon.name_zh_simplified}
            </p>
            <p className="text-text-muted text-sm">{pokemon.pinyin}</p>
            <div className="flex gap-2 mt-2">
              <TypeBadge type={pokemon.type1} size="sm" />
              {pokemon.type2 && <TypeBadge type={pokemon.type2} size="sm" />}
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="p-5 border-b border-border-default">
          <ScoreDisplay score={score} isCorrect={isCorrect} animate />
          <p className="text-center text-text-muted text-sm mt-2">
            {gameState.guesses.length} guess
            {gameState.guesses.length !== 1 ? 'es' : ''} •{' '}
            {gameState.hints_revealed} hint
            {gameState.hints_revealed !== 1 ? 's' : ''} used
          </p>
        </div>

        {/* Actions */}
        <div className="p-5 flex gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleShare}
            className="flex-1"
          >
            <Share2 size={16} />
            Share
          </Button>

          {onNext && (
            <Button
              variant="primary"
              size="md"
              onClick={onNext}
              className="flex-1"
            >
              Next
              <ChevronRight size={16} />
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
