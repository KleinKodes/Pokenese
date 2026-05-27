'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Lock, CheckCircle, Share2, Clock, ChevronRight, Link2 } from 'lucide-react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import { POKEMON_DATA } from '../../data/pokemon';
import { useLocalState } from '../../hooks/useLocalState';
import { useGame } from '../../hooks/useGame';
import { useUserStore } from '../../store/userStore';
import { ChineseName } from '../../components/game/ChineseName';
import { GuessInput } from '../../components/game/GuessInput';
import { HintList } from '../../components/game/HintList';
import { GuessHistory } from '../../components/game/GuessHistory';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { generateShareText, shareResult } from '../../lib/share';

const ChallengeComplete = dynamic(
  () =>
    import('../../components/game/ChallengeComplete').then(
      (m) => m.ChallengeComplete
    ),
  { ssr: false }
);

function seededRand(seed: number) {
  let s = seed | 0;
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
    return ((s ^ (s >>> 14)) >>> 0) / 0x100000000;
  };
}

function hashDate(date: string): number {
  let h = 2166136261;
  for (let i = 0; i < date.length; i++) {
    h ^= date.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function getDailyPokemonIds(date: string, allIds: number[]): [number, number, number] {
  const rand = seededRand(hashDate(date));
  const pool = [...allIds];
  const chosen: number[] = [];
  while (chosen.length < 3 && pool.length > 0) {
    const i = Math.floor(rand() * pool.length);
    chosen.push(pool.splice(i, 1)[0]);
  }
  return chosen as [number, number, number];
}

type ChallengeStep = 1 | 2 | 3;

export default function DailyPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { state, getDailyResults, saveDailyResult, addToGlossary, updateStreak } = useLocalState();
  const [currentStep, setCurrentStep] = useState<ChallengeStep>(1);
  const [showComplete, setShowComplete] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
  const [nextTime, setNextTime] = useState('');

  const dailyResults = useMemo(
    () => getDailyResults(today),
    [getDailyResults, today]
  );

  // Determine starting step (skip completed)
  useEffect(() => {
    if (dailyResults.challenge_1 && dailyResults.challenge_2 && dailyResults.challenge_3) {
      setAllDone(true);
    } else if (dailyResults.challenge_1 && dailyResults.challenge_2) {
      setCurrentStep(3);
    } else if (dailyResults.challenge_1) {
      setCurrentStep(2);
    } else {
      setCurrentStep(1);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown to midnight
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setNextTime(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const dailyPokemonIds = useMemo(
    () => getDailyPokemonIds(today, POKEMON_DATA.map((p) => p.id)),
    [today]
  );

  const currentPokemonId = dailyPokemonIds[currentStep - 1];
  const currentPokemon = POKEMON_DATA.find((p) => p.id === currentPokemonId)!;

  const { gameState, submitGuess, isWrongGuess } = useGame(currentPokemon, {
    mode: 'daily',
    challengeNumber: currentStep,
    date: today,
    onSaveResult: saveDailyResult,
    onAddToGlossary: addToGlossary,
  });

  const handleNext = () => {
    setShowComplete(false);
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as ChallengeStep);
    } else {
      setAllDone(true);
      updateStreak(today);
    }
  };

  const handleGuess = (guess: string) => {
    submitGuess(guess);
    if (gameState.is_complete || guess.toLowerCase() === currentPokemon.name_en.toLowerCase()) {
      setTimeout(() => setShowComplete(true), 400);
    }
  };

  // Watch for completion
  useEffect(() => {
    if (gameState.is_complete && !showComplete) {
      setTimeout(() => setShowComplete(true), 400);
    }
  }, [gameState.is_complete]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShareAll = async () => {
    const lines = dailyPokemonIds.map((_id, i) => {
      const result = dailyResults[`challenge_${i + 1}` as keyof typeof dailyResults];
      const score = result?.score ?? 0;
      const correct = score > 0;
      return `Challenge ${i + 1}: ${correct ? '✅' : '❌'} ${score.toLocaleString()} pts`;
    });
    const text = [
      `🎮 Pokenese Daily — ${today}`,
      ...lines,
      `Total: ${lines.reduce((acc, _l, i) => {
        const r = dailyResults[`challenge_${i + 1}` as keyof typeof dailyResults];
        return acc + (r?.score ?? 0);
      }, 0).toLocaleString()} pts`,
      '',
      process.env.NEXT_PUBLIC_APP_URL ?? 'https://pokenese.com',
    ].join('\n');

    const copied = await shareResult(text);
    if (copied) {
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };

  if (allDone) {
    return <DailyCompleteScreen
      dailyResults={dailyResults}
      nextTime={nextTime}
      onShare={handleShareAll}
      shareStatus={shareStatus}
    />;
  }

  const guessedIds = gameState.guesses
    .map((g) => POKEMON_DATA.find((p) => p.name_en.toLowerCase() === g.toLowerCase())?.id)
    .filter((id): id is number => id !== undefined);

  return (
    <div className="page-container" aria-label="Daily challenge">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sun size={20} className="text-accent-gold" aria-hidden="true" />
          <h1 className="text-lg font-bold text-text-primary">Daily</h1>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-2">
          {([1, 2, 3] as ChallengeStep[]).map((step) => {
            const result = dailyResults[`challenge_${step}` as keyof typeof dailyResults];
            const isComplete = !!result;
            const isCurrent = step === currentStep;
            const isLocked = step > currentStep;
            return (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isComplete
                    ? 'bg-color-success text-white'
                    : isCurrent
                    ? 'bg-accent-red text-white'
                    : 'bg-bg-elevated text-text-muted'
                }`}
                aria-label={
                  isComplete
                    ? `Challenge ${step} completed`
                    : isCurrent
                    ? `Challenge ${step} active`
                    : `Challenge ${step} locked`
                }
              >
                {isComplete ? <CheckCircle size={14} /> : isLocked ? <Lock size={12} /> : step}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-text-muted text-sm text-center mb-6">
        Challenge {currentStep} of 3 — {format(new Date(), 'MMMM d')}
      </p>

      {/* Chinese name */}
      <ChineseName pokemon={currentPokemon} />

      {/* Hints */}
      <div className="mt-4">
        <HintList
          pokemon={currentPokemon}
          hintsRevealed={gameState.hints_revealed}
        />
      </div>

      {/* Guess history */}
      {gameState.guesses.length > 0 && !gameState.is_correct && (
        <div className="mt-4">
          <GuessHistory
            guesses={gameState.guesses}
            correctPokemon={currentPokemon}
            allPokemon={POKEMON_DATA}
          />
        </div>
      )}

      {/* Input */}
      {!gameState.is_complete && (
        <div className="mt-6">
          <GuessInput
            onGuess={handleGuess}
            guessedIds={guessedIds}
            isDisabled={gameState.is_complete}
            isWrongGuess={isWrongGuess}
            allPokemon={POKEMON_DATA}
          />
        </div>
      )}

      {/* Continue button shown after dismissing the completion modal */}
      {gameState.is_complete && !showComplete && (
        <div className="mt-6">
          <Button variant="primary" size="lg" fullWidth onClick={handleNext}>
            {currentStep < 3 ? 'Next Challenge' : 'See Results'}
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Complete overlay */}
      <AnimatePresence>
        {showComplete && gameState.pokemon && (
          <ChallengeComplete
            pokemon={currentPokemon}
            gameState={gameState}
            mode="daily"
            date={today}
            onNext={handleNext}
            onDismiss={() => setShowComplete(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DailyCompleteScreen({
  dailyResults,
  nextTime,
  onShare,
  shareStatus,
}: {
  dailyResults: Record<string, { score: number; guesses: string[]; hints_used: number } | undefined>;
  nextTime: string;
  onShare: () => void;
  shareStatus: 'idle' | 'copied';
}) {
  const { user } = useUserStore();
  const [challengeLinkStatus, setChallengeLinkStatus] = useState<'idle' | 'copied'>('idle');

  const today = format(new Date(), 'yyyy-MM-dd');
  const totalScore = [1, 2, 3].reduce((acc, i) => {
    const r = dailyResults[`challenge_${i}` as keyof typeof dailyResults];
    return acc + (r?.score ?? 0);
  }, 0);

  const handleChallengeLink = async () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pokenese.com';
    const s1 = dailyResults['challenge_1']?.score ?? 0;
    const s2 = dailyResults['challenge_2']?.score ?? 0;
    const s3 = dailyResults['challenge_3']?.score ?? 0;
    const uParam = user?.username ? `&u=${encodeURIComponent(user.username)}` : '';
    const url = `${appUrl}/score?d=${today}&s1=${s1}&s2=${s2}&s3=${s3}${uParam}`;
    try {
      await navigator.clipboard.writeText(url);
      setChallengeLinkStatus('copied');
      setTimeout(() => setChallengeLinkStatus('idle'), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <div>
          <CheckCircle size={48} className="text-color-success mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-text-primary mb-1">
            Daily Complete!
          </h1>
          <p className="text-text-muted">Come back tomorrow for new challenges</p>
        </div>

        {/* Score summary */}
        <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-3">
          {[1, 2, 3].map((i) => {
            const result = dailyResults[`challenge_${i}`];
            return (
              <div key={i} className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">Challenge {i}</span>
                <span className="font-bold text-accent-gold">
                  {result?.score?.toLocaleString() ?? '0'} pts
                </span>
              </div>
            );
          })}
          <div className="border-t border-border-default pt-3 flex justify-between items-center">
            <span className="font-semibold text-text-primary">Total</span>
            <span className="text-xl font-bold text-accent-gold">
              {totalScore.toLocaleString()} pts
            </span>
          </div>
        </div>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-2 text-text-muted">
          <Clock size={16} aria-hidden="true" />
          <span className="text-sm">Next daily in</span>
          <span className="font-mono font-bold text-text-primary">{nextTime}</span>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={onShare}
          fullWidth
        >
          <Share2 size={18} />
          {shareStatus === 'copied' ? 'Copied!' : 'Share Results'}
        </Button>

        <Button
          variant="secondary"
          size="lg"
          onClick={handleChallengeLink}
          fullWidth
        >
          <Link2 size={18} />
          {challengeLinkStatus === 'copied' ? 'Link Copied!' : 'Challenge a Friend'}
        </Button>
      </motion.div>
    </div>
  );
}
