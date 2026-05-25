'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Volume2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PokemonType, EtymologyEntry } from '../../types/pokemon';
import { TypeBadge } from '../ui/TypeBadge';
import { Button } from '../ui/Button';
import { useAudio } from '../../hooks/useAudio';
import { useUserStore } from '../../store/userStore';
import { useSettingsStore } from '../../store/settingsStore';
import { EtymologyEditor } from '../admin/EtymologyEditor';
import apiClient from '../../lib/api';

interface PokemonDetailProps {
  pokemon: PokemonType;
}

export function PokemonDetail({ pokemon }: PokemonDetailProps) {
  const router = useRouter();
  const { playPokemonName } = useAudio();
  const [isPlaying, setIsPlaying] = useState(false);
  const { isAdmin } = useUserStore();
  const { show_traditional } = useSettingsStore();
  const [etymology, setEtymology] = useState<EtymologyEntry[]>(pokemon.etymology);
  const [activeOverride, setActiveOverride] = useState<EtymologyEntry[] | null>(null);

  // Fetch override for this Pokémon (all users see overrides, admin can also edit)
  useEffect(() => {
    apiClient.getEtymologyOverrides().then((overrides) => {
      const key = String(pokemon.id);
      if (overrides[key]) {
        setEtymology(overrides[key]);
        setActiveOverride(overrides[key]);
      }
    }).catch(() => {/* backend not running — use static data */});
  }, [pokemon.id]);

  const handlePlay = async () => {
    setIsPlaying(true);
    await playPokemonName(pokemon);
    setTimeout(() => setIsPlaying(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto space-y-5"
    >
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="-ml-2"
      >
        <ArrowLeft size={16} />
        Back
      </Button>

      {/* Hero card */}
      <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden shadow-card">
        <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
          {/* Sprite */}
          <div className="w-36 h-36 bg-bg-elevated rounded-2xl flex items-center justify-center flex-shrink-0">
            <Image
              src={pokemon.sprite_url}
              alt={pokemon.name_en}
              width={120}
              height={120}
              className="w-28 h-28 object-contain"
              unoptimized
            />
          </div>

          {/* Names */}
          <div className="flex-1 text-center sm:text-left">
            <p className="font-mono text-text-muted text-sm mb-1">
              #{String(pokemon.id).padStart(3, '0')}
            </p>
            <h1 className="text-3xl font-bold text-text-primary mb-1">
              {pokemon.name_en}
            </h1>
            <p className="font-chinese text-3xl text-text-secondary mb-1">
              {pokemon.name_zh_simplified}
            </p>
            {show_traditional && pokemon.name_zh !== pokemon.name_zh_simplified && (
              <p className="font-chinese text-lg text-text-muted mb-2">
                {pokemon.name_zh}
              </p>
            )}
            <p className="text-accent-blue text-lg font-medium mb-1">
              {pokemon.pinyin}
            </p>
            <p className="font-mono text-text-muted text-sm mb-3">{pokemon.ipa}</p>

            {/* Play button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePlay}
              aria-pressed={isPlaying}
            >
              <Volume2 size={16} className={isPlaying ? 'animate-pulse' : ''} />
              {isPlaying ? 'Playing...' : 'Pronounce'}
            </Button>
          </div>
        </div>

        {/* Type + category row */}
        <div className="px-6 pb-5 flex flex-wrap items-center gap-3">
          <TypeBadge type={pokemon.type1} size="lg" />
          {pokemon.type2 && <TypeBadge type={pokemon.type2} size="lg" />}
          <span className="text-text-muted text-sm ml-auto">
            {pokemon.category}
          </span>
          <span className="text-text-muted text-sm">
            Gen {pokemon.generation}
          </span>
        </div>
      </div>

      {/* Etymology */}
      <div className="bg-bg-surface border border-border-default rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest mb-4">
          Etymology
        </h2>
        <div className="space-y-3">
          {etymology.map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-3 bg-bg-elevated rounded-xl"
            >
              <span className="font-chinese text-4xl text-text-primary w-12 text-center flex-shrink-0">
                {entry.character}
              </span>
              <div>
                <p className="text-accent-blue font-medium">{entry.pinyin}</p>
                <p className="text-text-secondary text-sm">{entry.meaning}</p>
              </div>
            </motion.div>
          ))}
        </div>
        {isAdmin && (
          <EtymologyEditor
            pokemonId={pokemon.id}
            baseEtymology={pokemon.etymology}
            activeOverride={activeOverride}
            onSaved={(newEtymology) => {
              setEtymology(newEtymology);
              setActiveOverride(newEtymology);
            }}
            onReset={() => {
              setEtymology(pokemon.etymology);
              setActiveOverride(null);
            }}
          />
        )}
      </div>

      {/* Evolution line info */}
      {pokemon.evolution_line.length > 1 && (
        <div className="bg-bg-surface border border-border-default rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest mb-3">
            Evolution Line
          </h2>
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            {pokemon.evolution_line.map((id, i) => (
              <span key={id} className="flex items-center gap-2">
                {i > 0 && <span className="text-text-muted">→</span>}
                <span
                  className={
                    id === pokemon.id ? 'text-accent-gold font-bold' : ''
                  }
                >
                  #{String(id).padStart(3, '0')}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
