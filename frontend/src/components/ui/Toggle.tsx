'use client';

import { clsx } from 'clsx';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
}: ToggleProps) {
  const toggleId = id ?? `toggle-${Math.random().toString(36).slice(2)}`;

  return (
    <div className="flex items-center justify-between gap-4 min-h-[44px]">
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <label
              htmlFor={toggleId}
              className="text-sm font-medium text-text-primary cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-text-muted mt-0.5">{description}</p>
          )}
        </div>
      )}

      <button
        id={toggleId}
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={clsx(
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:opacity-50 disabled:cursor-not-allowed',
          checked ? 'bg-accent-red' : 'bg-bg-elevated'
        )}
      >
        <span
          className={clsx(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}
