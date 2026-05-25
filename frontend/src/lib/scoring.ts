import { PokemonType } from '../types/pokemon';

export function calculateScore(hintsShown: number, isCorrect: boolean): number {
  if (isCorrect) return 3000 - hintsShown * 600;
  return 0;
}

export function calculateProximityScore(
  guessedPokemon: PokemonType,
  correctPokemon: PokemonType
): number {
  // Same evolution line → 300
  if (correctPokemon.evolution_line.includes(guessedPokemon.id)) return 300;

  // All types match → 200
  const guessTypes = [guessedPokemon.type1, guessedPokemon.type2].filter(Boolean);
  const correctTypes = [correctPokemon.type1, correctPokemon.type2].filter(Boolean);
  if (
    guessTypes.length === correctTypes.length &&
    guessTypes.every((t) => correctTypes.includes(t))
  )
    return 200;

  // One type matches → 100
  if (guessTypes.some((t) => correctTypes.includes(t))) return 100;

  // Shares Chinese character → 50
  const correctChars = new Set(correctPokemon.name_zh.split(''));
  if (guessedPokemon.name_zh.split('').some((c) => correctChars.has(c))) return 50;

  return 0;
}

export function getScoreLabel(score: number): string {
  if (score >= 3000) return 'Perfect!';
  if (score >= 2400) return 'Excellent!';
  if (score >= 1800) return 'Great!';
  if (score >= 1200) return 'Good';
  if (score >= 600) return 'OK';
  return 'Missed';
}

export function getScoreColor(score: number): string {
  if (score >= 3000) return 'text-accent-gold';
  if (score >= 2400) return 'text-color-success';
  if (score >= 1800) return 'text-accent-blue';
  if (score >= 1200) return 'text-text-primary';
  if (score >= 600) return 'text-color-warning';
  return 'text-color-error';
}
