import { GameState } from '../types/game';
import { PokemonType } from '../types/pokemon';

export interface ShareData {
  pokemon: PokemonType;
  gameState: GameState;
  mode: 'daily' | 'challenge';
  date?: string;
}

export async function generateShareText(data: ShareData): Promise<string> {
  const { pokemon, gameState, mode, date } = data;
  const score = gameState.score ?? 0;
  const guessCount = gameState.guesses.length;
  const maxHints = 4;
  const hintsUsed = gameState.hints_revealed;

  const scoreBlocks = Array.from({ length: maxHints + 1 }, (_, i) => {
    if (!gameState.is_correct) return '⬛';
    if (i < hintsUsed) return '🟨';
    if (i === hintsUsed) return '🟩';
    return '⬛';
  });

  const header = mode === 'daily' ? `🎮 Pokenese Daily ${date ?? ''}` : '🎮 Pokenese Challenge';

  const lines = [
    header,
    `Pokémon: ${pokemon.name_zh} (${pokemon.pinyin})`,
    `Score: ${score.toLocaleString()} pts`,
    `Guesses: ${guessCount} | Hints: ${hintsUsed}`,
    '',
    scoreBlocks.join(''),
    '',
    `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://pokenese.com'}`,
  ];

  return lines.join('\n');
}

export async function captureShareGraphic(
  elementId: string
): Promise<string | null> {
  try {
    const { default: html2canvas } = await import('html2canvas');
    const element = document.getElementById(elementId);
    if (!element) return null;

    const canvas = await html2canvas(element, {
      backgroundColor: '#0F0F1A',
      scale: 2,
      useCORS: true,
      allowTaint: false,
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to capture share graphic:', error);
    return null;
  }
}

export async function shareResult(shareText: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Pokenese',
        text: shareText,
      });
      return true;
    } catch {
      // User cancelled or error
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(shareText);
    return true;
  } catch {
    return false;
  }
}
