'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Nav } from '../components/layout/Nav';
import { BottomNav } from '../components/layout/BottomNav';
import { SettingsDrawer } from '../components/layout/SettingsDrawer';
import { useSettingsStore } from '../store/settingsStore';

function ThemeApplicator() {
  const { theme } = useSettingsStore();

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'light') {
      html.classList.remove('dark');
      html.classList.add('light');
    } else {
      html.classList.remove('light');
      html.classList.add('dark');
    }
  }, [theme]);

  return null;
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <ThemeApplicator />
      <Nav onSettingsClick={() => setSettingsOpen(true)} />
      <BottomNav />
      <SettingsDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <main id="main-content" aria-label="Main content">
        <AnimatePresence mode="wait">{children}</AnimatePresence>
      </main>
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>{children}</AppShell>
    </QueryClientProvider>
  );
}
