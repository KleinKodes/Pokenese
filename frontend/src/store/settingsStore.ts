'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSettings } from '../types/game';

interface SettingsStore extends UserSettings {
  togglePinyin: () => void;
  toggleIpa: () => void;
  toggleExtremeMode: () => void;
  toggleAutoPlayAudio: () => void;
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      show_pinyin: true,
      show_ipa: false,
      extreme_mode: false,
      auto_play_audio: false,
      theme: 'dark',

      togglePinyin: () =>
        set((state) => ({ show_pinyin: !state.show_pinyin })),

      toggleIpa: () => set((state) => ({ show_ipa: !state.show_ipa })),

      toggleExtremeMode: () =>
        set((state) => ({ extreme_mode: !state.extreme_mode })),

      toggleAutoPlayAudio: () =>
        set((state) => ({ auto_play_audio: !state.auto_play_audio })),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),

      setTheme: (theme) => set({ theme }),

      updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
    }),
    {
      name: 'pokenese-settings',
    }
  )
);
