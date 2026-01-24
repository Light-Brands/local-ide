'use client';

import React from 'react';

interface PaneContainerProps {
  id: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onCollapse: () => void;
  headerActions?: React.ReactNode;
  className?: string;
}

export function PaneContainer({
  id,
  title,
  icon,
  children,
  onCollapse,
  headerActions,
  className = '',
}: PaneContainerProps) {
  return (
    <div className={`flex flex-col h-full bg-neutral-900 ${className}`}>
      {/* Pane Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-neutral-400">{icon}</span>
          <span className="text-sm font-medium text-neutral-200">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {headerActions}
          <button
            className="p-1 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded transition-colors"
            onClick={onCollapse}
            title={`Collapse ${title} (Cmd+${id})`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 5l3 3 3-3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Pane Content - allows vertical scroll, horizontal handled by parent */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}

// Simple skeleton for loading states
export function PaneSkeleton() {
  return (
    <div className="flex flex-col h-full bg-neutral-900 animate-pulse">
      <div className="h-10 bg-neutral-800 border-b border-neutral-700" />
      <div className="flex-1 p-4 space-y-3">
        <div className="h-4 bg-neutral-800 rounded w-3/4" />
        <div className="h-4 bg-neutral-800 rounded w-1/2" />
        <div className="h-4 bg-neutral-800 rounded w-2/3" />
      </div>
    </div>
  );
}
