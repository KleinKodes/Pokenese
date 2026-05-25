'use client';

import { PokemonTypeName } from '../../types/pokemon';
import { TYPE_COLORS } from '../../lib/pokemon';
import { clsx } from 'clsx';

interface TypeBadgeProps {
  type: PokemonTypeName;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TypeBadge({ type, size = 'md', className }: TypeBadgeProps) {
  const color = TYPE_COLORS[type];

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-semibold tracking-wide uppercase',
        {
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-3 py-1 text-xs': size === 'md',
          'px-4 py-1.5 text-sm': size === 'lg',
        },
        className
      )}
      style={{
        backgroundColor: color,
        color: isLightColor(color) ? '#111128' : '#F0F0FF',
        boxShadow: `0 2px 8px ${color}66`,
      }}
    >
      {type}
    </span>
  );
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}
