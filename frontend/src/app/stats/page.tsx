'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import {
  BarChart2,
  Flame,
  Snowflake,
  Sun,
  Swords,
  BookOpen,
  Trophy,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useLocalState } from '../../hooks/useLocalState';
import { Button } from '../../components/ui/Button';
import type { ChallengeResult, MasterRunRecord } from '../../types/game';

type Tab = 'overview' | 'history';

export default function StatsPage() {
  const { state, hydrated, equipFreeze } = useLocalState();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const streak = state.streak;

  // Overview stats
  const overviewStats = useMemo(() => {
    let totalDaysCompleted = 0;
    let totalDailyScore = 0;
    let totalChallenges = 0;
    let wonChallenges = 0;
    let totalGuesses = 0;
    let totalHints = 0;

    for (const [, day] of Object.entries(state.daily)) {
      const c1 = day.challenge_1;
      const c2 = day.challenge_2;
      const c3 = day.challenge_3;
      if (c1 && c2 && c3) totalDaysCompleted++;

      for (const c of [c1, c2, c3]) {
        if (c) {
          totalChallenges++;
          totalDailyScore += c.score;
          if (c.score > 0) wonChallenges++;
          totalGuesses += c.guesses.length;
          totalHints += c.hints_used;
        }
      }
    }

    const winRate = totalChallenges > 0 ? Math.round((wonChallenges / totalChallenges) * 100) : 0;
    const avgGuesses = totalChallenges > 0 ? (totalGuesses / totalChallenges).toFixed(1) : '—';
    const avgHints = totalChallenges > 0 ? (totalHints / totalChallenges).toFixed(1) : '—';

    return { totalDaysCompleted, totalDailyScore, winRate, avgGuesses, avgHints };
  }, [state.daily]);

  const masterStats = useMemo(() => {
    const runs = state.master_runs ?? [];
    const bestRun = runs.reduce<MasterRunRecord | null>((best, r) => {
      if (!best || r.total_score > best.total_score) return r;
      return best;
    }, null);
    const totalPokemon = runs.reduce((sum, r) => sum + r.pokemon_count, 0);
    return { bestRun, totalPokemon, runCount: runs.length };
  }, [state.master_runs]);

  const glossaryStats = useMemo(() => {
    const count = state.glossary.length;
    const pct = Math.round((count / 1025) * 100);
    const mostReviewed = state.glossary.reduce<{ id: number; count: number } | null>(
      (best, id) => {
        const seen = state.glossary_seen_count[id] ?? 0;
        if (!best || seen > best.count) return { id, count: seen };
        return best;
      },
      null
    );
    return { count, pct, mostReviewed };
  }, [state.glossary, state.glossary_seen_count]);

  // History tab
  const dailyHistory = useMemo(() => {
    return Object.entries(state.daily)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 60);
  }, [state.daily]);

  const masterRuns = useMemo(() => {
    return [...(state.master_runs ?? [])].reverse();
  }, [state.master_runs]);

  if (!hydrated) return null;

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-6"
      >
        <BarChart2 size={22} className="text-accent-blue" />
        <h1 className="text-2xl font-bold text-text-primary">Stats</h1>
      </motion.div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-bg-elevated rounded-xl p-1 mb-6">
        {(['overview', 'history'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab
                ? 'bg-bg-surface text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Streak card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-surface border border-border-default rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Flame size={18} className="text-accent-red" />
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest">Streak</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-accent-red">{streak?.current ?? 0}</p>
                <p className="text-xs text-text-muted">Current</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-accent-gold">{streak?.longest ?? 0}</p>
                <p className="text-xs text-text-muted">Longest</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Snowflake size={16} className="text-accent-blue" />
                <span className="text-sm text-text-secondary">
                  {streak?.freeze_tokens ?? 0} freeze token{(streak?.freeze_tokens ?? 0) !== 1 ? 's' : ''}
                </span>
                {streak?.freeze_equipped && (
                  <span className="text-xs bg-accent-blue/20 text-accent-blue px-2 py-0.5 rounded-full">Equipped</span>
                )}
              </div>
              {(streak?.freeze_tokens ?? 0) > 0 && !streak?.freeze_equipped && (
                <Button variant="secondary" size="sm" onClick={equipFreeze}>
                  Equip Freeze
                </Button>
              )}
            </div>
          </motion.div>

          {/* Daily stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-bg-surface border border-border-default rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sun size={18} className="text-accent-gold" />
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest">Daily</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Days Completed', value: overviewStats.totalDaysCompleted },
                { label: 'Total Score', value: overviewStats.totalDailyScore.toLocaleString() },
                { label: 'Win Rate', value: `${overviewStats.winRate}%` },
                { label: 'Avg Guesses', value: overviewStats.avgGuesses },
                { label: 'Avg Hints', value: overviewStats.avgHints },
              ].map(({ label, value }) => (
                <div key={label} className="bg-bg-elevated rounded-xl p-3">
                  <p className="text-lg font-bold text-text-primary">{value}</p>
                  <p className="text-xs text-text-muted">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Master mode */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-bg-surface border border-border-default rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Swords size={18} className="text-accent-red" />
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest">Master Mode</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-bg-elevated rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-accent-gold">
                  {masterStats.bestRun ? masterStats.bestRun.total_score.toLocaleString() : '—'}
                </p>
                <p className="text-xs text-text-muted">Best Run</p>
              </div>
              <div className="bg-bg-elevated rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-text-primary">{masterStats.totalPokemon}</p>
                <p className="text-xs text-text-muted">Pokémon Caught</p>
              </div>
              <div className="bg-bg-elevated rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-text-primary">{masterStats.runCount}</p>
                <p className="text-xs text-text-muted">Runs</p>
              </div>
            </div>
          </motion.div>

          {/* Glossary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-bg-surface border border-border-default rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-accent-blue" />
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest">Glossary</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-elevated rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-accent-blue">{glossaryStats.count}</p>
                <p className="text-xs text-text-muted">Discovered</p>
              </div>
              <div className="bg-bg-elevated rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-text-primary">{glossaryStats.pct}%</p>
                <p className="text-xs text-text-muted">of 1,025</p>
              </div>
            </div>
            {glossaryStats.mostReviewed && (
              <p className="text-xs text-text-muted mt-3">
                Most reviewed: Pokémon #{glossaryStats.mostReviewed.id} ({glossaryStats.mostReviewed.count}×)
              </p>
            )}
          </motion.div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-8">
          {/* Master Mode history */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Swords size={16} className="text-accent-red" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest">
                Master Mode
              </h2>
            </div>
            {masterRuns.length === 0 ? (
              <p className="text-text-muted text-sm">No completed runs yet.</p>
            ) : (
              <div className="space-y-2">
                {masterRuns.map((run, i) => (
                  <MasterRunRow key={`${run.run_number}-${i}`} run={run} index={i} />
                ))}
              </div>
            )}
          </section>

          {/* Daily history */}
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
      )}
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
