import { PokemonType, PokemonTypeName } from '../types/pokemon';

export function findPokemonById(
  data: PokemonType[],
  id: number
): PokemonType | undefined {
  return data.find((p) => p.id === id);
}

export function findPokemonByName(
  data: PokemonType[],
  name: string
): PokemonType | undefined {
  return data.find((p) => p.name_en.toLowerCase() === name.toLowerCase());
}

export function searchPokemon(
  data: PokemonType[],
  query: string,
  excludeIds: number[] = [],
  maxResults: number = 8
): PokemonType[] {
  if (!query.trim()) return [];

  const q = query.toLowerCase().trim();

  const filtered = data.filter(
    (p) =>
      !excludeIds.includes(p.id) &&
      (p.name_en.toLowerCase().startsWith(q) ||
        p.name_en.toLowerCase().includes(q) ||
        p.name_zh.includes(q) ||
        p.name_zh_simplified.includes(q))
  );

  // Sort: prefix matches first, then contains
  filtered.sort((a, b) => {
    const aPrefix = a.name_en.toLowerCase().startsWith(q);
    const bPrefix = b.name_en.toLowerCase().startsWith(q);
    if (aPrefix && !bPrefix) return -1;
    if (!aPrefix && bPrefix) return 1;
    return a.id - b.id;
  });

  return filtered.slice(0, maxResults);
}

export function filterPokemon(
  data: PokemonType[],
  filters: {
    generation?: number;
    type?: PokemonTypeName;
    search?: string;
    unlockedIds?: number[];
  }
): PokemonType[] {
  let result = [...data];

  if (filters.generation !== undefined) {
    result = result.filter((p) => p.generation === filters.generation);
  }

  if (filters.type) {
    result = result.filter(
      (p) => p.type1 === filters.type || p.type2 === filters.type
    );
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name_en.toLowerCase().includes(q) ||
        p.name_zh.includes(filters.search!) ||
        p.name_zh_simplified.includes(filters.search!)
    );
  }

  return result;
}

export function sortPokemon(
  data: PokemonType[],
  sortBy: 'id' | 'name' | 'generation'
): PokemonType[] {
  return [...data].sort((a, b) => {
    switch (sortBy) {
      case 'id':
        return a.id - b.id;
      case 'name':
        return a.name_en.localeCompare(b.name_en);
      case 'generation':
        return a.generation - b.generation || a.id - b.id;
      default:
        return a.id - b.id;
    }
  });
}

export const TYPE_COLORS: Record<PokemonTypeName, string> = {
  Normal: '#A8A878',
  Fire: '#F08030',
  Water: '#6890F0',
  Electric: '#F8D030',
  Grass: '#78C850',
  Ice: '#98D8D8',
  Fighting: '#C03028',
  Poison: '#A040A0',
  Ground: '#E0C068',
  Flying: '#A890F0',
  Psychic: '#F85888',
  Bug: '#A8B820',
  Rock: '#B8A038',
  Ghost: '#705898',
  Dragon: '#7038F8',
  Dark: '#705848',
  Steel: '#B8B8D0',
  Fairy: '#EE99AC',
};
