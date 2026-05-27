'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Trophy, Sun, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

function ScoreContent() {
  const params = useSearchParams();
  const date = params.get('d') ?? '';
  const s1 = parseInt(params.get('s1') ?? '0', 10);
  const s2 = parseInt(params.get('s2') ?? '0', 10);
  const s3 = parseInt(params.get('s3') ?? '0', 10);
  const username = params.get('u') ?? '';
  const total = s1 + s2 + s3;
  const scores = [s1, s2, s3];

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <div>
          <Trophy size={48} className="text-accent-gold mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-text-primary mb-1">
            Can you beat this score?
          </h1>
          {date && (
            <p className="text-text-muted text-sm">{date}</p>
          )}
        </div>

        <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-3">
          {username && (
            <p className="text-text-secondary text-sm font-medium mb-3">
              <span className="font-bold text-text-primary">{username}</span> scored:
            </p>
          )}

          {scores.map((score, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sun size={14} className="text-accent-gold" />
                <span className="text-text-secondary text-sm">Challenge {i + 1}</span>
              </div>
              <span className={`font-bold text-sm ${score > 0 ? 'text-accent-gold' : 'text-color-error'}`}>
                {score > 0 ? score.toLocaleString() : 'Failed'} {score > 0 ? 'pts' : ''}
              </span>
            </div>
          ))}

          <div className="border-t border-border-default pt-3 flex justify-between items-center">
            <span className="font-semibold text-text-primary">Total</span>
            <span className="text-xl font-bold text-accent-gold">
              {total.toLocaleString()} pts
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/daily">
            <Button variant="primary" size="lg" fullWidth>
              Play Today&apos;s Challenge
              <ChevronRight size={16} />
            </Button>
          </Link>

          <Link href="/" className="block text-center text-text-muted text-sm hover:text-text-secondary transition-colors">
            What is Pokenese?
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function ScorePage() {
  return (
    <Suspense fallback={
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <p className="text-text-muted">Loading...</p>
      </div>
    }>
      <ScoreContent />
    </Suspense>
  );
}
