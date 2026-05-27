'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sun, Swords, BookOpen, Trophy, ChevronRight, Dumbbell, GraduationCap, Flame } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useLocalState } from '../hooks/useLocalState';

interface ModeCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  statusText: string;
  statusColor?: string;
  delay?: number;
}

function ModeCard({
  href,
  icon: Icon,
  title,
  description,
  statusText,
  statusColor = 'text-text-muted',
  delay = 0,
}: ModeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Link
        href={href}
        className="group block p-5 bg-bg-surface border border-border-default rounded-xl hover:border-border-focus hover:shadow-card transition-all duration-250 focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-bg-elevated rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-accent-red/10 transition-colors">
            <Icon size={24} className="text-text-secondary group-hover:text-accent-red transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-text-primary">{title}</h2>
            <p className="text-text-muted text-sm">{description}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <ChevronRight
              size={18}
              className="text-text-muted group-hover:text-text-primary transition-colors"
            />
            <span className={`text-xs font-medium ${statusColor}`}>
              {statusText}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function HomePage() {
  const { state } = useLocalState();
  const today = format(new Date(), 'yyyy-MM-dd');

  const dailyResults = useMemo(() => {
    return state.daily[today] ?? {};
  }, [state.daily, today]);

  const dailyCompleted = Object.keys(dailyResults).length;
  const glossaryCount = state.glossary.length;
  const challengeScore = state.challenge.total_score;
  const isNewDay = dailyCompleted === 0;
  const streakCurrent = state.streak?.current ?? 0;

  return (
    <div className="page-container">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          Poke
          <span className="text-accent-red font-chinese">乃塞</span>
        </h1>
        <p className="text-text-muted text-lg">
          Learn Mandarin Chinese through Pokémon
        </p>
        <p className="text-text-muted text-sm mt-1 font-chinese">
          透過寶可夢學習中文
        </p>
        {streakCurrent > 0 && (
          <p className="text-accent-gold text-sm font-semibold mt-2 flex items-center justify-center gap-1">
            <Flame size={14} />
            {streakCurrent}-day streak
          </p>
        )}
      </motion.div>

      {/* Mode cards */}
      <div className="space-y-3 mb-8">
        <ModeCard
          href="/daily"
          icon={Sun}
          title="Daily Challenge"
          description="3 Pokémon each day — same worldwide"
          statusText={
            dailyCompleted === 3
              ? 'Completed!'
              : dailyCompleted > 0
              ? `${dailyCompleted}/3 done`
              : isNewDay
              ? 'New today!'
              : 'Play now'
          }
          statusColor={
            dailyCompleted === 3
              ? 'text-color-success'
              : dailyCompleted > 0
              ? 'text-accent-gold'
              : 'text-accent-red'
          }
          delay={0.1}
        />

        <ModeCard
          href="/challenge"
          icon={Swords}
          title="Master Mode"
          description="Endless Pokémon — don't break your streak"
          statusText={
            challengeScore > 0
              ? `${challengeScore.toLocaleString()} pts`
              : state.challenge.is_active
              ? 'In progress'
              : 'Start run'
          }
          statusColor={challengeScore > 0 ? 'text-accent-gold' : 'text-text-muted'}
          delay={0.15}
        />

        <ModeCard
          href="/glossary"
          icon={BookOpen}
          title="Glossary"
          description="Review your discovered Pokémon"
          statusText={`${glossaryCount} discovered`}
          statusColor={
            glossaryCount > 0 ? 'text-accent-blue' : 'text-text-muted'
          }
          delay={0.2}
        />

        <ModeCard
          href="/practice"
          icon={Dumbbell}
          title="Practice"
          description="Filter by type or generation + pinyin mode"
          statusText="Free play"
          statusColor="text-text-muted"
          delay={0.25}
        />

        <ModeCard
          href="/review"
          icon={GraduationCap}
          title="Review"
          description="Flashcard sessions from your glossary"
          statusText={glossaryCount > 0 ? `${glossaryCount} to review` : 'Build glossary first'}
          statusColor={glossaryCount > 0 ? 'text-color-success' : 'text-text-muted'}
          delay={0.3}
        />
      </div>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-3 gap-3"
      >
        <StatBlock
          icon={Flame}
          label="Day Streak"
          value={streakCurrent > 0 ? `${streakCurrent}` : `${dailyCompleted}/3`}
          color="text-accent-gold"
        />
        <StatBlock
          icon={Trophy}
          label="Best Score"
          value={challengeScore > 0 ? challengeScore.toLocaleString() : '—'}
          color="text-accent-red"
        />
        <StatBlock
          icon={BookOpen}
          label="Discovered"
          value={glossaryCount.toString()}
          color="text-accent-blue"
        />
      </motion.div>

      {/* Today's date */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-text-muted text-xs mt-8"
      >
        {format(new Date(), 'EEEE, MMMM d, yyyy')}
      </motion.p>
    </div>
  );
}

function StatBlock({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-bg-surface border border-border-default rounded-xl p-3 text-center">
      <Icon size={16} className={`${color} mx-auto mb-1`} aria-hidden="true" />
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}
