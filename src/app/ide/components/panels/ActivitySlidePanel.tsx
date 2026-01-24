'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useIDEStore } from '../../stores/ideStore';
import { Activity, X, ChevronLeft } from 'lucide-react';
import dynamic from 'next/dynamic';

const ActivityPane = dynamic(() => import('../panes/ActivityPane').then((m) => m.ActivityPane), { ssr: false });

export function ActivitySlidePanel() {
  const activityPanelOpen = useIDEStore((state) => state.activityPanelOpen);
  const toggleActivityPanel = useIDEStore((state) => state.toggleActivityPanel);

  return (
    <>
      {/* Toggle button - always visible on right edge */}
      <button
        onClick={toggleActivityPanel}
        className={cn(
          'fixed right-0 top-1/2 -translate-y-1/2 z-40',
          'flex items-center justify-center',
          'w-6 h-16 rounded-l-lg',
          'bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700',
          'border border-r-0 border-neutral-300 dark:border-neutral-600',
          'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white',
          'transition-all shadow-sm',
          activityPanelOpen && 'opacity-0 pointer-events-none'
        )}
        title="Open Activity Panel"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Backdrop */}
      {activityPanelOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
          onClick={toggleActivityPanel}
        />
      )}

      {/* Slide-out panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-80 z-50',
          'bg-white dark:bg-neutral-900',
          'border-l border-neutral-200 dark:border-neutral-800',
          'shadow-xl',
          'transform transition-transform duration-200 ease-out',
          activityPanelOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Activity
            </span>
          </div>
          <button
            onClick={toggleActivityPanel}
            className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            aria-label="Close Activity Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-49px)] overflow-auto">
          {activityPanelOpen && <ActivityPane />}
        </div>
      </div>
    </>
  );
}
