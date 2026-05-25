import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme (default)
        'bg-base': 'var(--bg-base)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-input': 'var(--bg-input)',
        'border-default': 'var(--border)',
        'border-focus': 'var(--border-focus)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'accent-red': 'var(--accent-red)',
        'accent-red-hover': 'var(--accent-red-hover)',
        'accent-gold': 'var(--accent-gold)',
        'accent-blue': 'var(--accent-blue)',
        'color-success': 'var(--success)',
        'color-error': 'var(--error)',
        'color-warning': 'var(--warning)',
        'hint-bg': 'var(--hint-bg)',
        // Pokemon type colors
        'type-normal': '#A8A878',
        'type-fire': '#F08030',
        'type-water': '#6890F0',
        'type-electric': '#F8D030',
        'type-grass': '#78C850',
        'type-ice': '#98D8D8',
        'type-fighting': '#C03028',
        'type-poison': '#A040A0',
        'type-ground': '#E0C068',
        'type-flying': '#A890F0',
        'type-psychic': '#F85888',
        'type-bug': '#A8B820',
        'type-rock': '#B8A038',
        'type-ghost': '#705898',
        'type-dragon': '#7038F8',
        'type-dark': '#705848',
        'type-steel': '#B8B8D0',
        'type-fairy': '#EE99AC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        chinese: ['"Noto Sans SC"', 'sans-serif'],
        mono: ['"Noto Sans Mono"', 'monospace'],
      },
      fontSize: {
        'chinese-hero': ['64px', { lineHeight: '1.2', fontWeight: '700' }],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.3)',
        'glow-red': '0 0 20px rgba(232,51,74,0.4)',
        'glow-gold': '0 0 20px rgba(245,200,66,0.4)',
      },
      transitionDuration: {
        DEFAULT: '250ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'ease-out',
      },
      animation: {
        'shake': 'shake 0.4s ease-in-out',
        'spin-slow': 'spin 2s linear infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '15%': { transform: 'translateX(-6px)' },
          '30%': { transform: 'translateX(6px)' },
          '45%': { transform: 'translateX(-4px)' },
          '60%': { transform: 'translateX(4px)' },
          '75%': { transform: 'translateX(-2px)' },
          '90%': { transform: 'translateX(2px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
