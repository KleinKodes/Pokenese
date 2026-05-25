'use client';

import Image from 'next/image';
import { PokemonType } from '../../types/pokemon';
import { GameState } from '../../types/game';
import { TypeBadge } from '../ui/TypeBadge';
import { getScoreLabel } from '../../lib/scoring';

interface ShareGraphicProps {
  id?: string;
  pokemon: PokemonType;
  gameState: GameState;
  date?: string;
}

export function ShareGraphic({
  id = 'share-graphic',
  pokemon,
  gameState,
  date,
}: ShareGraphicProps) {
  const score = gameState.score ?? 0;
  const label = getScoreLabel(score);

  return (
    <div
      id={id}
      className="w-[400px] bg-bg-base p-6 rounded-2xl border border-border-default"
      aria-hidden="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Pokenese</h1>
          {date && (
            <p className="text-text-muted text-xs">{date}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-accent-gold">
            {score.toLocaleString()}
          </p>
          <p className="text-text-muted text-xs">{label}</p>
        </div>
      </div>

      {/* Pokemon */}
      <div className="flex items-center gap-4 p-4 bg-bg-surface rounded-xl mb-4">
        <Image
          src={pokemon.sprite_url}
          alt={pokemon.name_en}
          width={64}
          height={64}
          className="w-16 h-16 object-contain"
          unoptimized
        />
        <div>
          <p className="text-xl font-bold text-text-primary">{pokemon.name_en}</p>
          <p className="font-chinese text-lg text-text-secondary">{pokemon.name_zh_simplified}</p>
          <p className="text-accent-blue text-sm">{pokemon.pinyin}</p>
          <div className="flex gap-2 mt-1">
            <TypeBadge type={pokemon.type1} size="sm" />
            {pokemon.type2 && <TypeBadge type={pokemon.type2} size="sm" />}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-bg-elevated rounded-xl p-3">
          <p className="text-2xl font-bold text-text-primary">
            {gameState.guesses.length}
          </p>
          <p className="text-xs text-text-muted">Guesses</p>
        </div>
        <div className="bg-bg-elevated rounded-xl p-3">
          <p className="text-2xl font-bold text-text-primary">
            {gameState.hints_revealed}
          </p>
          <p className="text-xs text-text-muted">Hints</p>
        </div>
        <div className="bg-bg-elevated rounded-xl p-3">
          <p className="text-2xl font-bold text-color-success">
            {gameState.is_correct ? '✓' : '✗'}
          </p>
          <p className="text-xs text-text-muted">Result</p>
        </div>
      </div>

      <p className="text-center text-text-muted text-xs mt-4">
        pokenese.app — Learn Mandarin through Pokémon
      </p>
    </div>
  );
}
