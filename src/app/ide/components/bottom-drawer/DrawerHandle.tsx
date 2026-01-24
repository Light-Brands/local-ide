'use client';

import { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { type DrawerHeight } from '../../stores/ideStore';
import { ChevronUp, ChevronDown, X } from 'lucide-react';

interface DrawerHandleProps {
  onSwipe: (direction: 'up' | 'down') => void;
  onDoubleTap: () => void;
  height: DrawerHeight;
}

export function DrawerHandle({ onSwipe, onDoubleTap, height }: DrawerHandleProps) {
  const touchStartY = useRef<number>(0);
  const lastTap = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY.current - touchEndY;
      const threshold = 80; // Increased threshold to reduce sensitivity

      if (Math.abs(diff) > threshold) {
        onSwipe(diff > 0 ? 'up' : 'down');
      }
    },
    [onSwipe]
  );

  const handleClick = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onDoubleTap();
    }
    lastTap.current = now;
  }, [onDoubleTap]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onSwipe('up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onSwipe('down');
      } else if (e.key === 'Enter') {
        onDoubleTap();
      }
    },
    [onSwipe, onDoubleTap]
  );

  return (
    <div
      className={cn(
        'flex-shrink-0 h-8 flex items-center justify-center',
        'cursor-grab active:cursor-grabbing',
        'touch-manipulation select-none',
        'border-b border-neutral-100 dark:border-neutral-800/50'
      )}
      style={{ touchAction: 'none' }} // Prevent browser scroll handling on handle
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Resize drawer"
    >
      {/* Visual handle indicator */}
      <div className="flex items-center gap-2">
        {/* Direction hint */}
        {height === 'collapsed' ? (
          <ChevronUp className="w-4 h-4 text-neutral-400" />
        ) : height === 'fullscreen' ? (
          <X className="w-4 h-4 text-neutral-400" />
        ) : (
          <>
            <ChevronUp className="w-3 h-3 text-neutral-300 dark:text-neutral-600" />
            <div className="w-8 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            <ChevronDown className="w-3 h-3 text-neutral-300 dark:text-neutral-600" />
          </>
        )}
      </div>
    </div>
  );
}
