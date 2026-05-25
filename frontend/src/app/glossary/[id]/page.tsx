import { notFound } from 'next/navigation';
import POKEMON_DATA from '../../../data/pokemon';
import { PokemonDetailClient } from './PokemonDetailClient';

interface Props {
  params: { id: string };
}

export function generateStaticParams() {
  return POKEMON_DATA.map((p) => ({ id: String(p.id) }));
}

export function generateMetadata({ params }: Props) {
  const pokemon = POKEMON_DATA.find((p) => p.id === Number(params.id));
  if (!pokemon) return { title: 'Not Found' };
  return {
    title: `${pokemon.name_en} (${pokemon.name_zh}) — Pokenese`,
    description: `${pokemon.name_en}'s Chinese name is ${pokemon.name_zh} (${pokemon.pinyin}). ${pokemon.category}.`,
  };
}

export default function PokemonDetailPage({ params }: Props) {
  const pokemon = POKEMON_DATA.find((p) => p.id === Number(params.id));
  if (!pokemon) notFound();

  return <PokemonDetailClient pokemon={pokemon} />;
}
