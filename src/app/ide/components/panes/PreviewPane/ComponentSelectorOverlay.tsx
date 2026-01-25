'use client';

import { memo } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SelectorMode, HoverData } from '@/lib/ide/componentSelector/types';

interface ComponentSelectorOverlayProps {
  isEnabled: boolean;
  mode: SelectorMode;
  hoveredComponent: HoverData | null;
  onDisable: () => void;
}

/**
 * Overlay component showing selector banner and hover info
 */
export const ComponentSelectorOverlay = memo(function ComponentSelectorOverlay({
  isEnabled,
  mode,
  hoveredComponent,
  onDisable,
}: ComponentSelectorOverlayProps) {
  if (!isEnabled) return null;

  const bannerText = mode === 'once'
    ? 'Component Selector - Click on a component to copy its context'
    : 'Component Selector (Multi) - Click components to copy. ESC to exit.';

  return (
    <>
      {/* Banner at top of preview */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 z-10',
          'bg-primary-500 text-white',
          'px-4 py-2 text-sm font-medium',
          'flex items-center justify-between gap-4'
        )}
      >
        <span>{bannerText}</span>
        <button
          onClick={onDisable}
          className="p-1 hover:bg-primary-600 rounded transition-colors"
          aria-label="Close selector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </>
  );
});
