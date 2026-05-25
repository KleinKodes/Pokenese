'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  showClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          <motion.div
            ref={overlayRef}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className={clsx(
              'relative bg-bg-surface border border-border-default rounded-2xl shadow-card w-full z-10',
              {
                'max-w-sm': size === 'sm',
                'max-w-md': size === 'md',
                'max-w-lg': size === 'lg',
              }
            )}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {(title || showClose) && (
              <div className="flex items-center justify-between p-5 border-b border-border-default">
                {title && (
                  <h2 id="modal-title" className="text-lg font-bold text-text-primary">
                    {title}
                  </h2>
                )}
                {showClose && (
                  <button
                    onClick={onClose}
                    className="ml-auto p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}

            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
