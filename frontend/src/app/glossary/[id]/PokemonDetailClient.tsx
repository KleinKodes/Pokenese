'use client';

import { PokemonType } from '../../../types/pokemon';
import { PokemonDetail } from '../../../components/glossary/PokemonDetail';

interface Props {
  pokemon: PokemonType;
}

export function PokemonDetailClient({ pokemon }: Props) {
  return (
    <div className="page-container">
      <PokemonDetail pokemon={pokemon} />
    </div>
  );
}
