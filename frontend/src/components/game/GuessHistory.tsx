'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X } from 'lucide-react';
import { PokemonType } from '../../types/pokemon';
import { findPokemonByName } from '../../lib/pokemon';

interface GuessHistoryProps {
  guesses: string[];
  correctPokemon: PokemonType;
  allPokemon: PokemonType[];
}

export function GuessHistory({
  guesses,
  correctPokemon,
  allPokemon,
}: GuessHistoryProps) {
  if (guesses.length === 0) return null;

  // Show most recent first
  const reversedGuesses = [...guesses].reverse();

  return (
    <div
      className="space-y-2"
      aria-live="polite"
      aria-label="Previous guesses"
    >
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest">
        Wrong Guesses
      </h3>
      <AnimatePresence initial={false} mode="popLayout">
        {reversedGuesses.map((guess, i) => {
          const guessedPokemon = findPokemonByName(allPokemon, guess);
          return (
            <motion.div
              key={guess}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              className="flex items-center gap-3 px-4 py-2.5 bg-bg-elevated rounded-xl border border-color-error/30"
              role="listitem"
            >
              <X size={16} className="text-color-error flex-shrink-0" aria-hidden="true" />

              {guessedPokemon ? (
                <>
                  <Image
                    src={guessedPokemon.sprite_url}
                    alt={guessedPokemon.name_en}
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain opacity-70"
                    unoptimized
                  />
                  <span className="text-text-secondary text-sm font-medium">
                    {guess}
                  </span>
                  <span className="ml-auto text-xs text-text-muted font-chinese">
                    {guessedPokemon.name_zh}
                  </span>
                </>
              ) : (
                <span className="text-text-secondary text-sm font-medium">
                  {guess}
                </span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
