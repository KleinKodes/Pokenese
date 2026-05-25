'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { POKEMON_DATA } from '../../data/pokemon';
import { useLocalState } from '../../hooks/useLocalState';
import { filterPokemon, sortPokemon } from '../../lib/pokemon';
import { PokemonCard } from '../../components/glossary/PokemonCard';
import { GlossaryFilters } from '../../components/glossary/GlossaryFilters';
import { PokemonTypeName } from '../../types/pokemon';

type SortOption = 'id' | 'name' | 'generation';

export default function GlossaryPage() {
  const { state } = useLocalState();

  const [search, setSearch] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<PokemonTypeName | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('id');
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);

  const filteredAndSorted = useMemo(() => {
    let data = POKEMON_DATA;

    if (showOnlyUnlocked) {
      data = data.filter((p) => state.glossary.includes(p.id));
    }

    data = filterPokemon(data, {
      generation: selectedGeneration ?? undefined,
      type: selectedType ?? undefined,
      search: search || undefined,
    });

    return sortPokemon(data, sortBy);
  }, [
    search,
    selectedGeneration,
    selectedType,
    sortBy,
    showOnlyUnlocked,
    state.glossary,
  ]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <BookOpen size={20} className="text-accent-blue" aria-hidden="true" />
        <h1 className="text-lg font-bold text-text-primary">Glossary</h1>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <GlossaryFilters
          search={search}
          onSearchChange={setSearch}
          selectedGeneration={selectedGeneration}
          onGenerationChange={setSelectedGeneration}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          sortBy={sortBy}
          onSortChange={setSortBy}
          showOnlyUnlocked={showOnlyUnlocked}
          onShowOnlyUnlockedChange={setShowOnlyUnlocked}
          totalCount={POKEMON_DATA.length}
          unlockedCount={state.glossary.length}
        />
      </div>

      {/* Grid */}
      {filteredAndSorted.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 text-text-muted"
        >
          <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p>No Pokémon found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </motion.div>
      ) : (
        <div
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3"
          role="list"
          aria-label={`${filteredAndSorted.length} Pokémon`}
        >
          {filteredAndSorted.map((pokemon, index) => (
            <div key={pokemon.id} role="listitem">
              <PokemonCard
                pokemon={pokemon}
                isUnlocked={state.glossary.includes(pokemon.id)}
                seenCount={state.glossary_seen_count[pokemon.id] ?? 0}
                index={index}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
