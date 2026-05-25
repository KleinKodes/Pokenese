'use client';

import { useSettingsStore } from '../store/settingsStore';

export function useSettings() {
  const settings = useSettingsStore();
  return settings;
}
