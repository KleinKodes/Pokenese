'use client';

import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function LoadingSpinner({
  size = 'md',
  className,
  label = 'Loading...',
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 24,
    md: 40,
    lg: 64,
  };

  const px = sizeMap[size];

  return (
    <div
      className={clsx('flex flex-col items-center justify-center gap-3', className)}
      role="status"
      aria-label={label}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 40 40"
        className="animate-spin-slow"
        aria-hidden="true"
      >
        {/* Poké Ball top half */}
        <path
          d="M2 20 A18 18 0 0 1 38 20"
          fill="#E8334A"
          stroke="#1A1A2E"
          strokeWidth="2"
        />
        {/* Poké Ball bottom half */}
        <path
          d="M38 20 A18 18 0 0 1 2 20"
          fill="#F0F0FF"
          stroke="#1A1A2E"
          strokeWidth="2"
        />
        {/* Center band */}
        <rect x="2" y="18" width="36" height="4" fill="#1A1A2E" />
        {/* Center button outer */}
        <circle cx="20" cy="20" r="6" fill="#1A1A2E" />
        {/* Center button inner */}
        <circle cx="20" cy="20" r="4" fill="#F0F0FF" />
        {/* Center button highlight */}
        <circle cx="20" cy="20" r="2" fill="#9090BB" />
      </svg>

      {size !== 'sm' && (
        <span className="text-text-muted text-sm animate-pulse-soft">{label}</span>
      )}
    </div>
  );
}
