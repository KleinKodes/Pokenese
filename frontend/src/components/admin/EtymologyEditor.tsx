'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Save, RotateCcw, X, Check, ShieldAlert } from 'lucide-react';
import { EtymologyEntry } from '../../types/pokemon';
import { Button } from '../ui/Button';
import apiClient from '../../lib/api';

interface EtymologyEditorProps {
  pokemonId: number;
  baseEtymology: EtymologyEntry[];
  activeOverride: EtymologyEntry[] | null;
  onSaved: (etymology: EtymologyEntry[]) => void;
  onReset: () => void;
}

export function EtymologyEditor({
  pokemonId,
  baseEtymology,
  activeOverride,
  onSaved,
  onReset,
}: EtymologyEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [entries, setEntries] = useState<EtymologyEntry[]>(
    activeOverride ?? baseEtymology
  );
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    setEntries(activeOverride ?? baseEtymology);
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleMeaningChange = (index: number, value: string) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, meaning: value } : e))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiClient.adminSaveEtymologyOverride(pokemonId, entries);
      onSaved(entries);
      setIsEditing(false);
    } catch {
      setError('Failed to save. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!activeOverride) return;
    setResetting(true);
    setError(null);
    try {
      await apiClient.adminDeleteEtymologyOverride(pokemonId);
      setEntries(baseEtymology);
      onReset();
      setIsEditing(false);
    } catch {
      setError('Failed to reset.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="mt-3 border-t border-border-default pt-3">
      {/* Admin badge + controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <ShieldAlert size={13} className="text-accent-gold" />
          <span className="text-accent-gold font-medium">Admin</span>
          {activeOverride && (
            <span className="ml-1 px-1.5 py-0.5 rounded bg-accent-gold/15 text-accent-gold text-xs">
              Override active
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors px-2 py-1 rounded-lg hover:bg-bg-elevated"
            >
              <Pencil size={12} />
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors px-2 py-1 rounded-lg hover:bg-bg-elevated"
              >
                <X size={12} />
                Cancel
              </button>
              {activeOverride && (
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="flex items-center gap-1 text-xs text-color-error hover:opacity-80 transition-opacity px-2 py-1 rounded-lg hover:bg-color-error/10"
                >
                  <RotateCcw size={12} />
                  {resetting ? 'Resetting…' : 'Reset to auto'}
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 text-xs text-color-success hover:opacity-80 transition-opacity px-2 py-1 rounded-lg hover:bg-color-success/10"
              >
                {saving ? <Check size={12} /> : <Save size={12} />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-color-error mb-2">{error}</p>
      )}

      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {entries.map((entry, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-bg-elevated rounded-xl">
              <span className="font-chinese text-2xl text-text-primary w-10 text-center flex-shrink-0">
                {entry.character}
              </span>
              <span className="text-accent-blue text-sm w-20 flex-shrink-0">{entry.pinyin}</span>
              <input
                type="text"
                value={entry.meaning}
                onChange={(e) => handleMeaningChange(i, e.target.value)}
                className="flex-1 bg-bg-input border border-border-default rounded-lg px-2 py-1 text-sm text-text-primary focus:outline-none focus:border-border-focus"
                placeholder="Enter meaning…"
              />
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
