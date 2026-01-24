'use client';

import React, { useMemo } from 'react';
import { Loader2, ChevronUp, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOperations } from '@/app/ide/stores/ideStore';
import { OperationIcon } from './OperationIcon';
import { formatOperationDuration } from '@/lib/ide/services/operations';

// =============================================================================
// COMPONENT
// =============================================================================

export interface OperationStatusBarProps {
  className?: string;
}

export function OperationStatusBar({ className }: OperationStatusBarProps) {
  const { operations, panelOpen, togglePanel } = useOperations();

  // Get running operations
  const runningOperations = useMemo(
    () => operations.filter((op) => op.status === 'running'),
    [operations]
  );

  // Get the most recent running operation for display
  const currentOperation = runningOperations[0];

  // Get recent completed operations count (last minute)
  const recentCompleted = useMemo(() => {
    const oneMinuteAgo = Date.now() - 60000;
    return operations.filter(
      (op) =>
        op.status !== 'running' &&
        op.completedAt &&
        op.completedAt.getTime() > oneMinuteAgo
    ).length;
  }, [operations]);

  const hasActivity = runningOperations.length > 0 || recentCompleted > 0;

  // Calculate elapsed time for current operation
  const elapsed = currentOperation
    ? Date.now() - currentOperation.startedAt.getTime()
    : 0;

  return (
    <button
      onClick={togglePanel}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all',
        'hover:bg-neutral-100 dark:hover:bg-neutral-800',
        'text-sm',
        panelOpen && 'bg-neutral-100 dark:bg-neutral-800',
        hasActivity && !panelOpen && 'bg-blue-500/10',
        className
      )}
    >
      {/* Activity indicator */}
      {runningOperations.length > 0 ? (
        <>
          {/* Show current operation icon with spinner */}
          <OperationIcon
            type={currentOperation.type}
            status="running"
            size="sm"
          />

          {/* Current operation title */}
          <span className="text-neutral-700 dark:text-neutral-300 truncate max-w-[200px]">
            {currentOperation.title}
          </span>

          {/* Elapsed time */}
          <span className="text-xs text-neutral-400 tabular-nums">
            {formatOperationDuration(elapsed)}
          </span>

          {/* Badge for multiple running operations */}
          {runningOperations.length > 1 && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500 text-white rounded-full">
              +{runningOperations.length - 1}
            </span>
          )}
        </>
      ) : hasActivity ? (
        <>
          <Activity className="w-4 h-4 text-neutral-500" />
          <span className="text-neutral-500">
            {recentCompleted} operation{recentCompleted !== 1 ? 's' : ''}
          </span>
        </>
      ) : (
        <>
          <Activity className="w-4 h-4 text-neutral-400" />
          <span className="text-neutral-400">No recent activity</span>
        </>
      )}

      {/* Expand/collapse chevron */}
      <ChevronUp
        className={cn(
          'w-3.5 h-3.5 text-neutral-400 transition-transform',
          !panelOpen && 'rotate-180'
        )}
      />
    </button>
  );
}

// =============================================================================
// COMPACT VERSION (for tight spaces)
// =============================================================================

export interface CompactOperationIndicatorProps {
  className?: string;
  onClick?: () => void;
}

export function CompactOperationIndicator({
  className,
  onClick,
}: CompactOperationIndicatorProps) {
  const { operations, togglePanel } = useOperations();

  const runningCount = useMemo(
    () => operations.filter((op) => op.status === 'running').length,
    [operations]
  );

  const currentOperation = operations.find((op) => op.status === 'running');

  if (runningCount === 0) {
    return null;
  }

  return (
    <button
      onClick={onClick || togglePanel}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-md',
        'bg-blue-500/10 hover:bg-blue-500/20 transition-colors',
        className
      )}
    >
      {currentOperation && (
        <OperationIcon type={currentOperation.type} status="running" size="sm" />
      )}
      {runningCount > 1 && (
        <span className="text-xs text-blue-500 font-medium">
          {runningCount}
        </span>
      )}
    </button>
  );
}
