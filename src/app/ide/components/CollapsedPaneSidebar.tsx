'use client';

import { cn } from '@/lib/utils';
import { useIDEStore } from '../stores/ideStore';
import { PANE_CONFIG, type PaneNumber } from '../contexts/PanePortalContext';
import {
  MessageSquare,
  Code,
  Code2,
  Eye,
  Database,
  Rocket,
  Activity,
  Terminal,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  MessageSquare,
  Code,
  Code2,
  Eye,
  Database,
  Rocket,
  Activity,
  Terminal,
};

interface CollapsedPaneSidebarProps {
  position: 'left' | 'right';
}

export function CollapsedPaneSidebar({ position }: CollapsedPaneSidebarProps) {
  const paneOrder = useIDEStore((state) => state.paneOrder);
  const paneVisibility = useIDEStore((state) => state.paneVisibility);
  const togglePane = useIDEStore((state) => state.togglePane);
  const maxPanesReached = useIDEStore((state) => state.maxPanesReached);

  // Get collapsed panes based on position
  // Left sidebar: panes before first visible
  // Right sidebar: panes after last visible
  // Filter out pane 3 (Terminal) - it's now part of Developer pane
  const displayablePanes = paneOrder.filter((id) => id !== 3);
  const visiblePanes = displayablePanes.filter((id) => paneVisibility[id]);
  const firstVisibleIndex = displayablePanes.findIndex((id) => paneVisibility[id]);
  const lastVisibleIndex = displayablePanes.length - 1 - [...displayablePanes].reverse().findIndex((id) => paneVisibility[id]);

  const collapsedPanes =
    position === 'left'
      ? displayablePanes.slice(0, Math.max(0, firstVisibleIndex)).filter((id) => !paneVisibility[id])
      : displayablePanes.slice(lastVisibleIndex + 1).filter((id) => !paneVisibility[id]);

  if (collapsedPanes.length === 0) return null;

  return (
    <div
      className={cn(
        'flex flex-col gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800',
        position === 'left' ? 'border-r' : 'border-l'
      )}
    >
      {collapsedPanes.map((paneId) => {
        const config = PANE_CONFIG[paneId as PaneNumber];
        if (!config) return null;

        const Icon = ICON_MAP[config.icon];
        if (!Icon) return null;

        return (
          <button
            key={paneId}
            onClick={() => togglePane(paneId)}
            disabled={maxPanesReached}
            className={cn(
              'p-2 rounded-lg transition-colors',
              'hover:bg-neutral-200 dark:hover:bg-neutral-800',
              'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'group relative'
            )}
            title={`Show ${config.name}`}
          >
            <Icon className="w-4 h-4" />
            {/* Tooltip */}
            <span
              className={cn(
                'absolute top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium',
                'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900',
                'rounded whitespace-nowrap opacity-0 group-hover:opacity-100',
                'pointer-events-none transition-opacity z-50',
                position === 'left' ? 'left-full ml-2' : 'right-full mr-2'
              )}
            >
              {config.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
