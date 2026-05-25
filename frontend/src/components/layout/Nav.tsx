'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, User } from 'lucide-react';
import { clsx } from 'clsx';
import { useUserStore } from '../../store/userStore';

const NAV_LINKS = [
  { href: '/daily', label: 'Daily' },
  { href: '/challenge', label: 'Challenge' },
  { href: '/glossary', label: 'Glossary' },
];

interface NavProps {
  onSettingsClick: () => void;
}

export function Nav({ onSettingsClick }: NavProps) {
  const pathname = usePathname();
  const { isAuthenticated, user } = useUserStore();

  return (
    <nav
      className="hidden md:flex fixed top-0 left-0 right-0 z-30 h-16 bg-bg-base border-b border-border-default items-center px-6 gap-8"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-lg"
      >
        <span className="text-xl font-bold text-text-primary tracking-tight">
          Poke
        </span>
        <span className="text-xl font-bold text-accent-red tracking-tight font-chinese">
          乃塞
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex-1 flex items-center justify-center gap-1">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-250 focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus min-h-[44px] flex items-center',
                isActive
                  ? 'bg-accent-red/10 text-accent-red'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSettingsClick}
          className="p-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open settings"
        >
          <Settings size={20} />
        </button>

        {isAuthenticated && user ? (
          <Link
            href="/profile"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus min-h-[44px]"
          >
            <User size={18} />
            <span className="text-sm font-medium">{user.username}</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-sm font-medium bg-accent-red text-white hover:bg-accent-red-hover hover:shadow-glow-red transition-all duration-250 focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus min-h-[44px] flex items-center"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
