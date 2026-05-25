'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Eye } from 'lucide-react';
import { PokemonType } from '../../types/pokemon';
import { useAudio } from '../../hooks/useAudio';
import { useSettingsStore } from '../../store/settingsStore';
import { clsx } from 'clsx';

interface ChineseNameProps {
  pokemon: PokemonType;
}

export function ChineseName({ pokemon }: ChineseNameProps) {
  const { show_pinyin, show_ipa, extreme_mode } = useSettingsStore();
  const { playPokemonName } = useAudio();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const handlePlay = useCallback(async () => {
    setIsPlaying(true);
    await playPokemonName(pokemon);
    setTimeout(() => setIsPlaying(false), 2000);
  }, [pokemon, playPokemonName]);

  const showContent = !extreme_mode || isRevealed;

  return (
    <div className="flex flex-col items-center gap-3 p-6 bg-bg-surface rounded-xl border border-border-default shadow-card">
      {/* Chinese characters */}
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={clsx(
            'font-chinese text-[64px] leading-tight font-bold text-text-primary select-none transition-all duration-300',
            extreme_mode && !isRevealed && 'blur-lg select-none'
          )}
          aria-label={showContent ? pokemon.name_zh : 'Hidden Chinese name'}
        >
          {pokemon.name_zh}
        </motion.div>

        {extreme_mode && !isRevealed && (
          <button
            onClick={() => setIsRevealed(true)}
            className="absolute inset-0 flex items-center justify-center gap-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
            aria-label="Reveal Chinese name"
          >
            <Eye size={20} />
            <span className="text-sm font-medium">Reveal</span>
          </button>
        )}
      </div>

      {/* Simplified Chinese (if different) */}
      {pokemon.name_zh !== pokemon.name_zh_simplified && showContent && (
        <p className="text-text-muted text-sm font-chinese">
          {pokemon.name_zh_simplified}
        </p>
      )}

      {/* Pinyin */}
      <AnimatePresence>
        {show_pinyin && showContent && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-accent-blue text-lg font-medium tracking-wide"
            aria-label={`Pinyin: ${pokemon.pinyin}`}
          >
            {pokemon.pinyin}
          </motion.p>
        )}
      </AnimatePresence>

      {/* IPA */}
      <AnimatePresence>
        {show_ipa && showContent && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-text-muted text-sm font-mono"
            aria-label={`IPA: ${pokemon.ipa}`}
          >
            {pokemon.ipa}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Audio button */}
      <button
        onClick={handlePlay}
        className={clsx(
          'flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-250 min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
          isPlaying
            ? 'border-accent-blue text-accent-blue bg-accent-blue/10'
            : 'border-border-default text-text-secondary hover:border-border-focus hover:text-text-primary'
        )}
        aria-label={isPlaying ? 'Playing audio' : 'Play Chinese pronunciation'}
        aria-pressed={isPlaying}
      >
        <motion.span
          animate={isPlaying ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ repeat: isPlaying ? Infinity : 0, duration: 0.6 }}
        >
          <Volume2 size={18} />
        </motion.span>
        <span className="text-sm">
          {isPlaying ? 'Playing...' : 'Pronounce'}
        </span>
      </button>
    </div>
  );
}
