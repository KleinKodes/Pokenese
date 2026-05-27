'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sun, Swords, BookOpen, Dumbbell, BarChart2 } from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home, exact: true },
  { href: '/daily', label: 'Daily', icon: Sun, exact: false },
  { href: '/challenge', label: 'Master', icon: Swords, exact: false },
  { href: '/practice', label: 'Practice', icon: Dumbbell, exact: false },
  { href: '/glossary', label: 'Glossary', icon: BookOpen, exact: false },
  { href: '/stats', label: 'Stats', icon: BarChart2, exact: false },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-bg-base border-t border-border-default flex items-center"
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
              isActive ? 'text-accent-red' : 'text-text-muted hover:text-text-secondary'
            )}
            aria-current={isActive ? 'page' : undefined}
            aria-label={label}
          >
            <Icon
              size={20}
              strokeWidth={isActive ? 2.5 : 1.5}
              aria-hidden="true"
            />
            <span className={clsx('text-[10px] font-medium', isActive && 'font-bold')}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
