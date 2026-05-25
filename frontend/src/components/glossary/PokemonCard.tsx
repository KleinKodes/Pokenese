'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { PokemonType } from '../../types/pokemon';
import { TypeBadge } from '../ui/TypeBadge';
import { clsx } from 'clsx';

interface PokemonCardProps {
  pokemon: PokemonType;
  isUnlocked: boolean;
  seenCount?: number;
  index?: number;
}

export function PokemonCard({
  pokemon,
  isUnlocked,
  seenCount = 0,
  index = 0,
}: PokemonCardProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      className={clsx(
        'relative bg-bg-surface border border-border-default rounded-xl p-3 transition-all duration-250',
        isUnlocked
          ? 'hover:border-border-focus hover:shadow-card cursor-pointer'
          : 'opacity-60 cursor-default'
      )}
    >
      {/* Sprite */}
      <div className="aspect-square flex items-center justify-center mb-2 bg-bg-elevated rounded-lg overflow-hidden">
        {isUnlocked ? (
          <Image
            src={pokemon.sprite_url}
            alt={pokemon.name_en}
            width={72}
            height={72}
            className="w-full h-full object-contain p-1"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image
              src={pokemon.sprite_url}
              alt=""
              width={72}
              height={72}
              className="w-full h-full object-contain p-1 brightness-0"
              unoptimized
              aria-hidden="true"
            />
            <Lock
              size={20}
              className="absolute text-text-muted"
              aria-label="Locked"
            />
          </div>
        )}
      </div>

      {/* Info */}
      {isUnlocked ? (
        <>
          <p className="text-xs font-mono text-text-muted text-center mb-0.5">
            #{String(pokemon.id).padStart(3, '0')}
          </p>
          <p className="text-sm font-semibold text-text-primary text-center leading-tight mb-1">
            {pokemon.name_en}
          </p>
          <p className="font-chinese text-xs text-text-secondary text-center mb-2">
            {pokemon.name_zh}
          </p>
          <div className="flex flex-wrap justify-center gap-1">
            <TypeBadge type={pokemon.type1} size="sm" />
            {pokemon.type2 && <TypeBadge type={pokemon.type2} size="sm" />}
          </div>
        </>
      ) : (
        <>
          <p className="text-xs font-mono text-text-muted text-center mb-0.5">
            #{String(pokemon.id).padStart(3, '0')}
          </p>
          <p className="text-sm text-text-muted text-center">???</p>
        </>
      )}

      {/* Seen count badge */}
      {isUnlocked && seenCount > 1 && (
        <span className="absolute top-2 right-2 bg-accent-gold text-bg-base text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {seenCount > 9 ? '9+' : seenCount}
        </span>
      )}
    </motion.div>
  );

  if (!isUnlocked) return content;

  return (
    <Link
      href={`/glossary/${pokemon.id}`}
      aria-label={`View ${pokemon.name_en} details`}
    >
      {content}
    </Link>
  );
}
