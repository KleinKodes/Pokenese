'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-250 focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]',
          {
            // Sizes
            'px-3 py-2 text-sm': size === 'sm',
            'px-5 py-2.5 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
            // Variants
            'bg-accent-red text-white hover:bg-accent-red-hover hover:shadow-glow-red active:scale-95':
              variant === 'primary',
            'bg-bg-elevated text-text-primary border border-border-default hover:border-border-focus hover:bg-bg-surface active:scale-95':
              variant === 'secondary',
            'text-text-secondary hover:text-text-primary hover:bg-bg-elevated active:scale-95':
              variant === 'ghost',
            'bg-color-error text-white hover:opacity-90 active:scale-95':
              variant === 'danger',
            'w-full': fullWidth,
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinnerInline />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

function LoadingSpinnerInline() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
