'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, BookOpen, Zap, Sun, Dumbbell, GraduationCap } from 'lucide-react';
import { Button } from '../ui/Button';

const ONBOARDED_KEY = 'pokenese-onboarded';

interface SlideProps {
  children: React.ReactNode;
}

function Slide({ children }: SlideProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {children}
    </motion.div>
  );
}

const SLIDES = [
  {
    key: 'welcome',
    title: 'Welcome to Pokenese',
    content: (
      <Slide>
        <div className="text-center py-4">
          <div className="inline-block bg-bg-elevated border border-border-default rounded-2xl px-6 py-4 mb-4">
            <span className="text-4xl font-chinese font-bold text-accent-red">妙蛙种子</span>
          </div>
          <p className="text-text-primary font-semibold text-lg">
            Learn Mandarin through Pokémon
          </p>
          <p className="text-text-muted text-sm mt-2">
            Guess English Pokémon names from their Chinese characters. Build vocabulary, learn pronunciation, and discover etymology.
          </p>
        </div>
      </Slide>
    ),
  },
  {
    key: 'how-to-play',
    title: 'How to Play',
    content: (
      <Slide>
        <div className="space-y-3">
          <div className="bg-bg-elevated rounded-xl p-4">
            <p className="text-text-primary font-semibold mb-1">See a Chinese name</p>
            <span className="text-2xl font-chinese text-accent-red">皮卡丘</span>
          </div>
          <div className="bg-bg-elevated rounded-xl p-4">
            <p className="text-text-primary font-semibold mb-1">Guess the English name</p>
            <p className="text-text-muted text-sm">Type your answer in the input field</p>
          </div>
          <div className="bg-bg-elevated rounded-xl p-4">
            <p className="text-text-primary font-semibold mb-1">Wrong guess?</p>
            <p className="text-text-muted text-sm">Each wrong guess reveals a hint to help you out</p>
          </div>
        </div>
      </Slide>
    ),
  },
  {
    key: 'hints',
    title: 'Hint Types',
    content: (
      <Slide>
        <p className="text-text-muted text-sm mb-2">Four hints reveal progressively more information:</p>
        <div className="space-y-2">
          {[
            { icon: BookOpen, label: 'Etymology', desc: 'What each character means', color: 'text-accent-blue' },
            { icon: Zap, label: 'Generation', desc: 'Which game generation', color: 'text-accent-gold' },
            { icon: Sun, label: 'Type', desc: 'Fire, Water, Grass…', color: 'text-accent-red' },
            { icon: BookOpen, label: 'Category', desc: 'The species descriptor', color: 'text-color-success' },
          ].map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className="flex items-center gap-3 bg-bg-elevated rounded-xl p-3">
              <Icon size={18} className={color} />
              <div>
                <p className="text-text-primary text-sm font-semibold">{label}</p>
                <p className="text-text-muted text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Slide>
    ),
  },
  {
    key: 'scoring',
    title: 'Scoring',
    content: (
      <Slide>
        <div className="space-y-3">
          <div className="bg-color-success/10 border border-color-success/20 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-accent-gold">3,000 pts</p>
            <p className="text-text-secondary text-sm mt-1">Perfect — no hints used</p>
          </div>
          <div className="bg-bg-elevated rounded-xl p-4">
            <p className="text-text-primary font-semibold mb-2">Scoring breakdown</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Base score</span>
                <span className="font-mono">3,000</span>
              </div>
              <div className="flex justify-between text-color-error">
                <span>Per hint used</span>
                <span className="font-mono">−600</span>
              </div>
              <div className="flex justify-between text-color-error">
                <span>All hints + failed</span>
                <span className="font-mono">0 pts</span>
              </div>
            </div>
          </div>
        </div>
      </Slide>
    ),
  },
  {
    key: 'modes',
    title: 'Game Modes',
    content: (
      <Slide>
        <div className="space-y-2">
          {[
            { icon: Sun, label: 'Daily', desc: '3 challenges per day, same worldwide', color: 'text-accent-gold' },
            { icon: Zap, label: 'Master Mode', desc: 'Endless Pokémon — don\'t score 0!', color: 'text-accent-red' },
            { icon: Dumbbell, label: 'Practice', desc: 'Filter by type or generation, try pinyin mode', color: 'text-accent-blue' },
            { icon: GraduationCap, label: 'Review', desc: 'Your personal glossary flashcards', color: 'text-color-success' },
          ].map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className="flex items-center gap-3 bg-bg-elevated rounded-xl p-3">
              <div className="w-9 h-9 bg-bg-base rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={18} className={color} />
              </div>
              <div>
                <p className="text-text-primary text-sm font-semibold">{label}</p>
                <p className="text-text-muted text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Slide>
    ),
  },
];

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onboarded = localStorage.getItem(ONBOARDED_KEY);
    if (!onboarded) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDED_KEY, '1');
    }
    setIsOpen(false);
  };

  const handleNext = () => {
    if (step < SLIDES.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  if (!isOpen) return null;

  const current = SLIDES[step];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <motion.div
        className="relative bg-bg-surface border border-border-default rounded-2xl shadow-card w-full max-w-md z-10 overflow-hidden"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-default">
          <h2 id="onboarding-title" className="text-lg font-bold text-text-primary">
            {current.title}
          </h2>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Skip onboarding"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 min-h-[280px]">
          <AnimatePresence mode="wait">
            <div key={current.key}>
              {current.content}
            </div>
          </AnimatePresence>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 pb-3">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? 'bg-accent-red w-4' : 'bg-border-default'
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 p-5 pt-2 border-t border-border-default">
          <Button
            variant="secondary"
            size="md"
            onClick={handlePrev}
            disabled={step === 0}
            className="flex-1"
          >
            <ChevronLeft size={16} />
            Prev
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={step === SLIDES.length - 1 ? handleDismiss : handleNext}
            className="flex-1"
          >
            {step === SLIDES.length - 1 ? 'Done' : 'Next'}
            {step < SLIDES.length - 1 && <ChevronRight size={16} />}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
