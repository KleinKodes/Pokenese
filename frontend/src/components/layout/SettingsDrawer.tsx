'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Sun, Volume2, Eye, EyeOff, Flame, Trash2 } from 'lucide-react';
import { Toggle } from '../ui/Toggle';
import { useSettingsStore } from '../../store/settingsStore';
import { useLocalState } from '../../hooks/useLocalState';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const {
    show_pinyin,
    show_ipa,
    extreme_mode,
    auto_play_audio,
    theme,
    togglePinyin,
    toggleIpa,
    toggleExtremeMode,
    toggleAutoPlayAudio,
    toggleTheme,
  } = useSettingsStore();
  const { resetAllData } = useLocalState();
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            className="fixed right-0 top-0 bottom-0 z-50 w-80 max-w-full bg-bg-surface border-l border-border-default shadow-card overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border-default sticky top-0 bg-bg-surface z-10">
              <h2 className="text-lg font-bold text-text-primary">Settings</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close settings"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Display section */}
              <section>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
                  Display
                </h3>
                <div className="space-y-4">
                  <Toggle
                    checked={show_pinyin}
                    onChange={togglePinyin}
                    label="Show Pinyin"
                    description="Display pinyin romanization below Chinese characters"
                  />
                  <Toggle
                    checked={show_ipa}
                    onChange={toggleIpa}
                    label="Show IPA"
                    description="Display International Phonetic Alphabet pronunciation"
                  />
                  <div className="flex items-center justify-between min-h-[44px]">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Theme</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                      </p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="p-2.5 rounded-xl border border-border-default text-text-secondary hover:text-text-primary hover:border-border-focus transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                  </div>
                </div>
              </section>

              {/* Audio section */}
              <section>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
                  Audio
                </h3>
                <Toggle
                  checked={auto_play_audio}
                  onChange={toggleAutoPlayAudio}
                  label="Auto-play Audio"
                  description="Automatically play pronunciation when a new Pokémon appears"
                />
              </section>

              {/* Gameplay section */}
              <section>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
                  Gameplay
                </h3>
                <div className="space-y-4">
                  <Toggle
                    checked={extreme_mode}
                    onChange={toggleExtremeMode}
                    label="Extreme Mode"
                    description="Blur Chinese characters — click to reveal"
                  />
                </div>
              </section>

              {/* Data section */}
              <section>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
                  Data
                </h3>
                {confirmReset ? (
                  <div className="space-y-3">
                    <p className="text-sm text-text-secondary">
                      This will erase all progress, scores, and glossary data. Are you sure?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { resetAllData(); setConfirmReset(false); onClose(); }}
                        className="flex-1 py-2 rounded-xl bg-color-error text-white text-sm font-semibold hover:opacity-90 transition-opacity min-h-[44px]"
                      >
                        Yes, reset
                      </button>
                      <button
                        onClick={() => setConfirmReset(false)}
                        className="flex-1 py-2 rounded-xl border border-border-default text-text-secondary text-sm font-semibold hover:text-text-primary transition-colors min-h-[44px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmReset(true)}
                    className="flex items-center gap-2 w-full py-2.5 px-3 rounded-xl border border-border-default text-color-error hover:bg-color-error/10 transition-colors text-sm font-medium min-h-[44px]"
                  >
                    <Trash2 size={16} />
                    Reset All Data
                  </button>
                )}
              </section>

              {/* Legend */}
              <section>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
                  Scoring
                </h3>
                <div className="space-y-2 text-sm">
                  {[
                    { guesses: 0, score: 3000 },
                    { guesses: 1, score: 2400 },
                    { guesses: 2, score: 1800 },
                    { guesses: 3, score: 1200 },
                    { guesses: 4, score: 600 },
                  ].map(({ guesses, score }) => (
                    <div
                      key={guesses}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-text-secondary">
                        {guesses === 0 ? 'Correct (no hints)' : `Correct (${guesses} hint${guesses !== 1 ? 's' : ''})`}
                      </span>
                      <span className="font-mono font-semibold text-accent-gold">
                        {score.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
