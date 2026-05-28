import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    return img;
  },
}));

// Mock framer-motion to avoid animation overhead in tests
vi.mock('framer-motion', () => {
  const React = require('react');
  const createMotionComponent = (tag: string) => {
    return React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: unknown) => {
      // Filter out framer-motion specific props
      const domProps = Object.fromEntries(
        Object.entries(props).filter(([key]) =>
          !['initial', 'animate', 'exit', 'variants', 'transition', 'whileHover',
            'whileTap', 'whileFocus', 'whileInView', 'layout', 'layoutId',
            'drag', 'dragConstraints', 'onAnimationComplete', 'onDragEnd',
            'onDragStart', 'positionTransition'].includes(key)
        )
      );
      return React.createElement(tag, { ...domProps, ref }, children);
    });
  };

  const motion = new Proxy({} as Record<string, unknown>, {
    get: (_, tag: string) => createMotionComponent(tag),
  });

  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
    useMotionValue: (initial: unknown) => ({ get: () => initial, set: vi.fn() }),
    useTransform: () => ({ get: vi.fn() }),
  };
});

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

// Mock Web Speech API
Object.defineProperty(window, 'speechSynthesis', {
  value: { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [] },
  writable: true,
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined), readText: vi.fn().mockResolvedValue('') },
  writable: true,
});
