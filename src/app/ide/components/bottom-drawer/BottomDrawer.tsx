'use client';

import { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useIDEStore, type DrawerHeight } from '../../stores/ideStore';
import { DrawerToggle } from './DrawerToggle';
import { DrawerHandle } from './DrawerHandle';
import { TerminalView } from './TerminalView';
import { ChatView } from './ChatView';

export function BottomDrawer() {
  const drawerRef = useRef<HTMLDivElement>(null);

  const height = useIDEStore((state) => state.drawer.height);
  const activeTab = useIDEStore((state) => state.drawer.activeTab);
  const setHeight = useIDEStore((state) => state.setDrawerHeight);
  const expand = useIDEStore((state) => state.expandDrawer);
  const collapse = useIDEStore((state) => state.collapseDrawer);

  // Height classes for different states
  const getHeightClass = (): string => {
    switch (height) {
      case 'collapsed':
        return 'h-14'; // Slightly taller to accommodate handle + toggle
      case 'half':
        return 'h-[45vh]';
      case 'expanded':
        return 'h-[70vh]';
      case 'fullscreen':
        return 'h-[100dvh]';
      default:
        return 'h-[45vh]';
    }
  };

  // Handle swipe gestures
  const handleSwipe = useCallback(
    (direction: 'up' | 'down') => {
      if (direction === 'up') {
        expand();
      } else {
        collapse();
      }
    },
    [expand, collapse]
  );

  // Handle double tap to toggle fullscreen
  const handleDoubleTap = useCallback(() => {
    setHeight(height === 'fullscreen' ? 'half' : 'fullscreen');
  }, [height, setHeight]);

  return (
    <div
      ref={drawerRef}
      className={cn(
        'flex-shrink-0 flex flex-col',
        'border-t border-neutral-200 dark:border-neutral-800',
        'bg-white dark:bg-neutral-900',
        'transition-all duration-200 ease-out',
        height === 'fullscreen' && 'fixed inset-0 z-50',
        getHeightClass()
      )}
    >
      {/* Drag Handle */}
      <DrawerHandle
        onSwipe={handleSwipe}
        onDoubleTap={handleDoubleTap}
        height={height}
      />

      {/* Tab Toggle */}
      <DrawerToggle />

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'terminal' ? <TerminalView /> : <ChatView />}
      </div>
    </div>
  );
}
