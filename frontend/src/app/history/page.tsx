'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { Sun, Swords, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { useLocalState } from '../../hooks/useLocalState';
import type { ChallengeResult, MasterRunRecord } from '../../types/game';

export default function HistoryPage() {
  const { state, hydrated } = useLocalState();

  const dailyHistory = useMemo(() => {
    return Object.entries(state.daily)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 60);
  }, [state.daily]);

  const masterRuns = useMemo(() => {
    return [...(state.master_runs ?? [])].reverse();
  }, [state.master_runs]);

  const currentRun = state.challenge;

  if (!hydrated) return null;

  return (
    <div className="page-container space-y-8">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-text-primary"
      >
        History
      </motion.h1>

      {/* Master Mode */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Swords size={16} className="text-accent-red" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest">
            Master Mode
          </h2>
        </div>

        {currentRun.is_active && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 mb-3"
          >
            <p className="text-xs text-accent-red font-semibold uppercase tracking-wide mb-2">
              Active Run
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-text-primary">
                  {currentRun.total_score.toLocaleString()}
                </p>
                <p className="text-text-muted text-sm">
                  {currentRun.seen_ids.length} Pokémon
                </p>
              </div>
              <Trophy size={28} className="text-accent-gold" />
            </div>
          </motion.div>
        )}

        {masterRuns.length === 0 && !currentRun.is_active ? (
          <p className="text-text-muted text-sm">No completed runs yet.</p>
        ) : (
          <div className="space-y-2">
            {masterRuns.map((run, i) => (
              <MasterRunRow key={`${run.run_number}-${i}`} run={run} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Daily History */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sun size={16} className="text-accent-gold" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest">
            Daily Challenges
          </h2>
        </div>

        {dailyHistory.length === 0 ? (
          <p className="text-text-muted text-sm">No daily challenges completed yet.</p>
        ) : (
          <div className="space-y-2">
            {dailyHistory.map(([date, results], i) => (
              <DayRow key={date} date={date} results={results} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MasterRunRow({ run, index }: { run: MasterRunRecord; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-bg-surface border border-border-default rounded-xl p-4 flex items-center justify-between"
    >
      <div>
        <p className="text-text-primary font-semibold">
          {run.total_score.toLocaleString()} pts
        </p>
        <p className="text-text-muted text-sm">
          {run.pokemon_count} Pokémon ·{' '}
          {run.ended_by === 'reset' ? 'run ended' : 'completed all!'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-text-muted text-xs">
          {format(parseISO(run.ended_at), 'MMM d, yyyy')}
        </p>
        {run.ended_by === 'complete' ? (
          <Trophy size={16} className="text-accent-gold ml-auto mt-1" />
        ) : (
          <XCircle size={16} className="text-color-error ml-auto mt-1" />
        )}
      </div>
    </motion.div>
  );
}

function DayRow({
  date,
  results,
  index,
}: {
  date: string;
  results: { challenge_1?: ChallengeResult; challenge_2?: ChallengeResult; challenge_3?: ChallengeResult };
  index: number;
}) {
  const challenges = [results.challenge_1, results.challenge_2, results.challenge_3];
  const totalScore = challenges.reduce((sum, c) => sum + (c?.score ?? 0), 0);
  const completed = challenges.filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-bg-surface border border-border-default rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-text-primary font-semibold text-sm">
          {format(parseISO(date), 'EEEE, MMM d')}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-accent-gold font-bold text-sm">
            {totalScore.toLocaleString()} pts
          </span>
          <span className="text-text-muted text-xs">{completed}/3</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {challenges.map((result, i) => (
          <ChallengeCell key={i} result={result} label={`#${i + 1}`} />
        ))}
      </div>
    </motion.div>
  );
}

function ChallengeCell({ result, label }: { result: ChallengeResult | undefined; label: string }) {
  if (!result) {
    return (
      <div className="bg-bg-elevated rounded-lg p-2 text-center opacity-40">
        <p className="text-text-muted text-xs">{label}</p>
        <p className="text-text-muted text-xs mt-0.5">—</p>
      </div>
    );
  }
  const won = result.score > 0;
  return (
    <div className={`rounded-lg p-2 text-center ${won ? 'bg-color-success/10' : 'bg-color-error/10'}`}>
      <div className="flex items-center justify-center gap-1 mb-0.5">
        {won ? (
          <CheckCircle size={10} className="text-color-success" />
        ) : (
          <XCircle size={10} className="text-color-error" />
        )}
        <p className="text-text-muted text-xs">{label}</p>
      </div>
      <p className={`text-xs font-semibold ${won ? 'text-color-success' : 'text-color-error'}`}>
        {won ? result.score.toLocaleString() : 'failed'}
      </p>
    </div>
  );
}
