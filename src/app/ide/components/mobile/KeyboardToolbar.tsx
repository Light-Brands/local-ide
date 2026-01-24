'use client';

import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';

interface KeyboardToolbarProps {
  onKey: (key: string) => void;
  className?: string;
}

// Haptic feedback helper
const haptic = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(5);
  }
};

const KEYS = [
  { label: 'Tab', value: '\t', className: 'flex-1' },
  { label: 'Esc', value: '\x1b', className: 'flex-1' },
  { label: '^C', value: '\x03', className: 'flex-1' },
  { label: '^D', value: '\x04', className: 'flex-1' },
  { label: '^Z', value: '\x1a', className: 'flex-1' },
  { label: '\u2191', value: '\x1b[A', className: 'w-10' },  // Up arrow
  { label: '\u2193', value: '\x1b[B', className: 'w-10' },  // Down arrow
  { label: '\u2190', value: '\x1b[D', className: 'w-10' },  // Left arrow
  { label: '\u2192', value: '\x1b[C', className: 'w-10' },  // Right arrow
];

export function KeyboardToolbar({ onKey, className }: KeyboardToolbarProps) {
  const handleKeyPress = useCallback((value: string) => {
    haptic();
    onKey(value);
  }, [onKey]);

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1.5 bg-neutral-800 border-t border-neutral-700',
        className
      )}
    >
      {KEYS.map((key) => (
        <button
          key={key.label}
          type="button"
          onClick={() => handleKeyPress(key.value)}
          className={cn(
            'h-8 px-2 rounded bg-neutral-700 text-neutral-200 text-xs font-mono',
            'active:bg-neutral-600 transition-colors',
            key.className
          )}
        >
          {key.label}
        </button>
      ))}
    </div>
  );
}

// Compact version for when keyboard is visible
export function KeyboardToolbarCompact({ onKey, className }: KeyboardToolbarProps) {
  const handleKeyPress = useCallback((value: string) => {
    haptic();
    onKey(value);
  }, [onKey]);

  const COMPACT_KEYS = [
    { label: 'Tab', value: '\t' },
    { label: 'Esc', value: '\x1b' },
    { label: '^C', value: '\x03' },
    { label: '\u2191', value: '\x1b[A' },
    { label: '\u2193', value: '\x1b[B' },
  ];

  return (
    <div
      className={cn(
        'flex items-center justify-around px-1 py-1 bg-neutral-800/90 backdrop-blur-sm',
        className
      )}
    >
      {COMPACT_KEYS.map((key) => (
        <button
          key={key.label}
          type="button"
          onClick={() => handleKeyPress(key.value)}
          className="px-3 py-1 rounded bg-neutral-700/80 text-neutral-300 text-xs font-mono active:bg-neutral-600"
        >
          {key.label}
        </button>
      ))}
    </div>
  );
}
