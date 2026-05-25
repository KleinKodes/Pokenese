'use client';

import { PokemonTypeName } from '../../types/pokemon';
import { TYPE_COLORS } from '../../lib/pokemon';
import { Search } from 'lucide-react';
import { clsx } from 'clsx';

type SortOption = 'id' | 'name' | 'generation';

interface GlossaryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedGeneration: number | null;
  onGenerationChange: (gen: number | null) => void;
  selectedType: PokemonTypeName | null;
  onTypeChange: (type: PokemonTypeName | null) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  showOnlyUnlocked: boolean;
  onShowOnlyUnlockedChange: (value: boolean) => void;
  totalCount: number;
  unlockedCount: number;
}

const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const TYPES: PokemonTypeName[] = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

export function GlossaryFilters({
  search,
  onSearchChange,
  selectedGeneration,
  onGenerationChange,
  selectedType,
  onTypeChange,
  sortBy,
  onSortChange,
  showOnlyUnlocked,
  onShowOnlyUnlockedChange,
  totalCount,
  unlockedCount,
}: GlossaryFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search + stats row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Pokémon..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-default bg-bg-input text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors min-h-[44px]"
            aria-label="Search Pokémon"
          />
        </div>

        <div className="flex items-center gap-3 text-sm text-text-muted ml-auto">
          <span className="text-accent-gold font-semibold">
            {unlockedCount}
          </span>
          <span>/ {totalCount} discovered</span>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="px-3 py-2 rounded-xl border border-border-default bg-bg-input text-text-primary text-sm focus:outline-none focus:border-border-focus min-h-[44px] cursor-pointer"
          aria-label="Sort by"
        >
          <option value="id">Sort: Dex #</option>
          <option value="name">Sort: Name</option>
          <option value="generation">Sort: Generation</option>
        </select>

        {/* Generation filter */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => onGenerationChange(null)}
            className={clsx(
              'px-3 py-2 rounded-xl text-xs font-medium transition-colors min-h-[44px] border',
              selectedGeneration === null
                ? 'bg-accent-red text-white border-accent-red'
                : 'border-border-default text-text-muted hover:border-border-focus hover:text-text-primary'
            )}
          >
            All Gens
          </button>
          {GENERATIONS.map((gen) => (
            <button
              key={gen}
              onClick={() =>
                onGenerationChange(selectedGeneration === gen ? null : gen)
              }
              className={clsx(
                'px-3 py-2 rounded-xl text-xs font-medium transition-colors min-h-[44px] border',
                selectedGeneration === gen
                  ? 'bg-accent-red text-white border-accent-red'
                  : 'border-border-default text-text-muted hover:border-border-focus hover:text-text-primary'
              )}
              aria-pressed={selectedGeneration === gen}
            >
              {gen}
            </button>
          ))}
        </div>

        {/* Unlocked filter */}
        <button
          onClick={() => onShowOnlyUnlockedChange(!showOnlyUnlocked)}
          className={clsx(
            'px-3 py-2 rounded-xl text-xs font-medium transition-colors min-h-[44px] border',
            showOnlyUnlocked
              ? 'bg-accent-gold text-bg-base border-accent-gold'
              : 'border-border-default text-text-muted hover:border-border-focus hover:text-text-primary'
          )}
          aria-pressed={showOnlyUnlocked}
        >
          Discovered Only
        </button>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-1.5">
        {TYPES.map((type) => {
          const isSelected = selectedType === type;
          const color = TYPE_COLORS[type];
          return (
            <button
              key={type}
              onClick={() => onTypeChange(isSelected ? null : type)}
              className={clsx(
                'px-2.5 py-1 rounded-full text-xs font-semibold transition-all min-h-[28px]',
                isSelected ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-90'
              )}
              style={{
                backgroundColor: isSelected ? color : `${color}33`,
                color: isSelected ? (isLightColor(color) ? '#111128' : '#F0F0FF') : color,
                border: `1px solid ${color}66`,
              }}
              aria-pressed={isSelected}
            >
              {type}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}
