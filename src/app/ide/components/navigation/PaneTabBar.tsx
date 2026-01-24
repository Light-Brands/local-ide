'use client';

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useIDEStore, useStoreHydrated } from '../../stores/ideStore';
import { PANE_CONFIG, type PaneNumber } from '../../contexts/PanePortalContext';
import {
  MessageSquare,
  Code,
  Code2,
  Eye,
  Database,
  Rocket,
  Terminal,
  type LucideIcon,
  GripVertical,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  MessageSquare,
  Code,
  Code2,
  Eye,
  Database,
  Rocket,
  Terminal,
};

interface PaneTabBarProps {
  className?: string;
}

export function PaneTabBar({ className }: PaneTabBarProps) {
  const hydrated = useStoreHydrated();
  const paneOrder = useIDEStore((state) => state.paneOrder);
  const paneVisibility = useIDEStore((state) => state.paneVisibility);
  const togglePane = useIDEStore((state) => state.togglePane);
  const reorderPanes = useIDEStore((state) => state.reorderPanes);
  const maxPanesReached = useIDEStore((state) => state.maxPanesReached);

  const [draggedPaneId, setDraggedPaneId] = useState<number | null>(null);
  const [dragOverPaneId, setDragOverPaneId] = useState<number | null>(null);
  const dragStartIndex = useRef<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, paneId: number, index: number) => {
    setDraggedPaneId(paneId);
    dragStartIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(paneId));

    // Make drag image slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 50, 20);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, paneId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedPaneId !== null && paneId !== draggedPaneId) {
      setDragOverPaneId(paneId);
    }
  }, [draggedPaneId]);

  const handleDragLeave = useCallback(() => {
    setDragOverPaneId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetPaneId: number, targetIndex: number) => {
    e.preventDefault();

    if (draggedPaneId !== null && dragStartIndex.current !== null) {
      const newOrder = [...paneOrder];
      const fromIndex = dragStartIndex.current;

      // Remove from old position and insert at new position
      newOrder.splice(fromIndex, 1);
      newOrder.splice(targetIndex, 0, draggedPaneId);

      reorderPanes(newOrder);
    }

    setDraggedPaneId(null);
    setDragOverPaneId(null);
    dragStartIndex.current = null;
  }, [draggedPaneId, paneOrder, reorderPanes]);

  const handleDragEnd = useCallback(() => {
    setDraggedPaneId(null);
    setDragOverPaneId(null);
    dragStartIndex.current = null;
  }, []);

  // Count visible panes, excluding Terminal (pane 3) which is now part of Developer
  const visibleCount = Object.entries(paneVisibility)
    .filter(([id, visible]) => visible && id !== '3')
    .length;

  // Don't render content until hydrated to avoid flash of default state
  if (!hydrated) {
    return (
      <div className={cn(
        'relative flex items-center justify-center gap-1 px-2 py-1.5 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 h-[42px]',
        className
      )} />
    );
  }

  // Filter out pane 3 (Terminal) - it's now part of the Developer pane
  const displayablePanes = paneOrder.filter((id) => id !== 3);

  return (
    <div
      className={cn(
        'relative flex items-center justify-center gap-1 px-2 py-1.5 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto scrollbar-hide',
        className
      )}
    >
      {displayablePanes.map((paneId, index) => {
        const config = PANE_CONFIG[paneId as PaneNumber];
        if (!config) return null;

        const Icon = ICON_MAP[config.icon];
        if (!Icon) return null;

        const isVisible = paneVisibility[paneId];
        const isDragging = draggedPaneId === paneId;
        const isDragOver = dragOverPaneId === paneId;
        const canToggleOn = !isVisible && !maxPanesReached;
        const canToggle = isVisible || canToggleOn;

        return (
          <div
            key={paneId}
            draggable
            onDragStart={(e) => handleDragStart(e, paneId, index)}
            onDragOver={(e) => handleDragOver(e, paneId)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, paneId, index)}
            onDragEnd={handleDragEnd}
            onClick={() => canToggle && togglePane(paneId)}
            className={cn(
              'group flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer select-none',
              'border',
              isVisible
                ? 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white shadow-sm'
                : 'bg-transparent border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50',
              isDragging && 'opacity-50',
              isDragOver && 'ring-2 ring-primary-500 ring-offset-1 ring-offset-neutral-100 dark:ring-offset-neutral-900',
              !canToggle && 'opacity-40 cursor-not-allowed'
            )}
            title={`${isVisible ? 'Hide' : 'Show'} ${config.name}${!canToggle ? ' (max panes reached)' : ''}`}
          >
            {/* Drag handle indicator */}
            <GripVertical className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex-shrink-0 -ml-1" />

            {/* Icon */}
            <Icon className={cn(
              'w-3.5 h-3.5 flex-shrink-0',
              isVisible ? 'text-primary-600 dark:text-primary-400' : ''
            )} />

            {/* Label */}
            <span className="whitespace-nowrap">{config.name}</span>

            {/* Keyboard shortcut hint */}
            <kbd className={cn(
              'hidden sm:inline-block ml-1 px-1 py-0.5 text-[10px] rounded',
              isVisible
                ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                : 'bg-neutral-200/50 dark:bg-neutral-800/50 text-neutral-400 dark:text-neutral-500'
            )}>
              {paneId}
            </kbd>
          </div>
        );
      })}

      {/* Pane count indicator - positioned absolute right */}
      <div className="absolute right-3 text-[10px] text-neutral-400 whitespace-nowrap">
        {visibleCount}/{Math.min(displayablePanes.length, 5)}
      </div>
    </div>
  );
}
