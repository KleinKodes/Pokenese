'use client';

import { motion } from 'framer-motion';
import { BookOpen, Zap, Dna, Tag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PokemonType } from '../../types/pokemon';

type HintType = 'etymology' | 'generation' | 'evolution' | 'category';

interface HintCardProps {
  type: HintType;
  pokemon: PokemonType;
  index: number;
}

const HINT_CONFIG: Record<
  HintType,
  { label: string; icon: LucideIcon }
> = {
  etymology: { label: 'Etymology', icon: BookOpen },
  generation: { label: 'Generation', icon: Zap },
  evolution: { label: 'Evolution', icon: Dna },
  category: { label: 'Category', icon: Tag },
};

export function HintCard({ type, pokemon, index }: HintCardProps) {
  const config = HINT_CONFIG[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: 'easeOut' }}
      className="bg-hint-bg border border-border-default rounded-xl p-4"
      role="region"
      aria-label={`Hint: ${config.label}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} aria-hidden="true" />
        <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">
          {config.label}
        </span>
      </div>

      {/* Content */}
      <HintContent type={type} pokemon={pokemon} />
    </motion.div>
  );
}

function HintContent({ type, pokemon }: { type: HintType; pokemon: PokemonType }) {
  switch (type) {
    case 'etymology':
      return (
        <div className="space-y-2">
          {pokemon.etymology.map((entry, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="font-chinese text-2xl text-text-primary w-8 text-center">
                {entry.character}
              </span>
              <div>
                <span className="text-accent-blue text-sm font-medium mr-2">
                  {entry.pinyin}
                </span>
                <span className="text-text-secondary text-sm">{entry.meaning}</span>
              </div>
            </div>
          ))}
        </div>
      );

    case 'generation':
      return (
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-text-primary">
            Gen {pokemon.generation}
          </span>
          <span className="text-text-muted text-sm">
            ({generationRegion(pokemon.generation)})
          </span>
        </div>
      );

    case 'evolution': {
      const canEvolve = pokemon.can_evolve ?? false;
      return (
        <div className="flex items-center gap-2">
          <span className={`text-lg font-semibold ${canEvolve ? 'text-accent-green' : 'text-text-muted'}`}>
            {canEvolve ? 'Can evolve further' : 'Fully evolved'}
          </span>
        </div>
      );
    }

    case 'category':
      return (
        <p className="text-text-primary font-medium">{pokemon.category}</p>
      );
  }
}

function generationRegion(gen: number): string {
  const regions: Record<number, string> = {
    1: 'Kanto',
    2: 'Johto',
    3: 'Hoenn',
    4: 'Sinnoh',
    5: 'Unova',
    6: 'Kalos',
    7: 'Alola',
    8: 'Galar',
    9: 'Paldea',
  };
  return regions[gen] ?? 'Unknown';
}
