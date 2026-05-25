'use client';

import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { Toggle } from '../../components/ui/Toggle';
import { useSettingsStore } from '../../store/settingsStore';
import { Moon, Sun } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function SettingsPage() {
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

  return (
    <div className="page-container max-w-lg">
      <div className="flex items-center gap-2 mb-8">
        <Settings size={20} className="text-text-secondary" aria-hidden="true" />
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
      </div>

      <div className="space-y-8">
        {/* Display */}
        <Section title="Display">
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
                Currently: {theme === 'dark' ? 'Dark' : 'Light'} mode
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </Button>
          </div>
        </Section>

        {/* Audio */}
        <Section title="Audio">
          <Toggle
            checked={auto_play_audio}
            onChange={toggleAutoPlayAudio}
            label="Auto-play Pronunciation"
            description="Automatically speak the Chinese name when a new Pokémon appears"
          />
        </Section>

        {/* Gameplay */}
        <Section title="Gameplay">
          <Toggle
            checked={extreme_mode}
            onChange={toggleExtremeMode}
            label="Extreme Mode"
            description="Blur Chinese characters — you must click to reveal them"
          />
        </Section>

        {/* Scoring reference */}
        <Section title="Scoring System">
          <div className="space-y-2">
            {[
              { label: 'Correct (first guess)', score: 3000 },
              { label: 'Correct (1 hint)', score: 2400 },
              { label: 'Correct (2 hints)', score: 1800 },
              { label: 'Correct (3 hints)', score: 1200 },
              { label: 'Correct (4 hints)', score: 600 },
              { label: 'Failed', score: 0 },
            ].map(({ label, score }) => (
              <div
                key={label}
                className="flex items-center justify-between py-1.5 border-b border-border-default last:border-0"
              >
                <span className="text-text-secondary text-sm">{label}</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    score > 0 ? 'text-accent-gold' : 'text-color-error'
                  }`}
                >
                  {score > 0 ? `${score.toLocaleString()} pts` : '0 pts'}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* About */}
        <Section title="About">
          <p className="text-text-muted text-sm leading-relaxed">
            Pokenese is a Wordle-style game that teaches Mandarin Chinese through
            Pokémon names. Each challenge shows you a Pokémon&apos;s Chinese name
            and you must guess the English name.
          </p>
          <p className="text-text-muted text-xs mt-2">Version 0.1.0</p>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
        {title}
      </h2>
      <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-4">
        {children}
      </div>
    </motion.section>
  );
}
