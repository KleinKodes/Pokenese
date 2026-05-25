'use client';

import { AnimatePresence } from 'framer-motion';
import { PokemonType } from '../../types/pokemon';
import { HintCard } from './HintCard';

type HintType = 'etymology' | 'generation' | 'typing' | 'category';

const HINT_ORDER: HintType[] = ['etymology', 'generation', 'typing', 'category'];

interface HintListProps {
  pokemon: PokemonType;
  hintsRevealed: number;
}

export function HintList({ pokemon, hintsRevealed }: HintListProps) {
  const visibleHints = HINT_ORDER.slice(0, hintsRevealed);

  if (visibleHints.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-text-muted text-sm">
          Make a guess to reveal hints
        </p>
      </div>
    );
  }

  return (
    <div
      className="space-y-3"
      aria-live="polite"
      aria-label={`${visibleHints.length} hint${visibleHints.length !== 1 ? 's' : ''} revealed`}
    >
      <AnimatePresence initial={false}>
        {visibleHints.map((hintType, i) => (
          <HintCard
            key={hintType}
            type={hintType}
            pokemon={pokemon}
            index={i}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
