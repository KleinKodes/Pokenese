export type PokemonTypeName =
  | 'Normal'
  | 'Fire'
  | 'Water'
  | 'Electric'
  | 'Grass'
  | 'Ice'
  | 'Fighting'
  | 'Poison'
  | 'Ground'
  | 'Flying'
  | 'Psychic'
  | 'Bug'
  | 'Rock'
  | 'Ghost'
  | 'Dragon'
  | 'Dark'
  | 'Steel'
  | 'Fairy';

export interface EtymologyEntry {
  character: string;
  pinyin: string;
  meaning: string;
}

export interface PokemonType {
  id: number;
  name_en: string;
  name_zh: string;
  name_zh_simplified: string;
  pinyin: string;
  pinyin_numbered: string;
  ipa: string;
  etymology: EtymologyEntry[];
  generation: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  type1: PokemonTypeName;
  type2: PokemonTypeName | null;
  category: string;
  evolution_line: number[];
  can_evolve?: boolean;
  sprite_url: string;
  audio_filename: string | null;
}
