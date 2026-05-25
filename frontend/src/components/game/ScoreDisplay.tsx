'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getScoreLabel, getScoreColor } from '../../lib/scoring';
import { clsx } from 'clsx';

interface ScoreDisplayProps {
  score: number;
  isCorrect: boolean;
  animate?: boolean;
}

export function ScoreDisplay({
  score,
  isCorrect,
  animate = true,
}: ScoreDisplayProps) {
  const [displayed, setDisplayed] = useState(animate ? 0 : score);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animate || score === 0) {
      setDisplayed(score);
      return;
    }

    const duration = 1000;
    const start = performance.now();
    const from = 0;
    const to = score;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(from + (to - from) * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [score, animate]);

  const label = getScoreLabel(score);
  const colorClass = getScoreColor(score);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center gap-2"
      aria-live="polite"
      aria-label={`Score: ${score} points`}
    >
      <span
        className={clsx(
          'text-5xl font-bold tabular-nums tracking-tight',
          colorClass
        )}
      >
        {displayed.toLocaleString()}
      </span>

      <div className="flex flex-col items-center gap-1">
        <span className={clsx('text-lg font-semibold', colorClass)}>
          {label}
        </span>
        {!isCorrect && (
          <span className="text-text-muted text-sm">Better luck next time</span>
        )}
      </div>
    </motion.div>
  );
}
