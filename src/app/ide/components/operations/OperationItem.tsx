'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OperationIcon } from './OperationIcon';
import { formatOperationDuration, type Operation } from '@/lib/ide/services/operations';

// =============================================================================
// COMPONENT
// =============================================================================

export interface OperationItemProps {
  operation: Operation;
  compact?: boolean;
  className?: string;
}

export function OperationItem({ operation, compact = false, className }: OperationItemProps) {
  const [expanded, setExpanded] = useState(false);

  const hasDetails = operation.description || operation.error || operation.metadata;
  const isRunning = operation.status === 'running';

  // Calculate elapsed time for running operations
  const elapsedTime = isRunning
    ? Date.now() - operation.startedAt.getTime()
    : operation.duration;

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-md',
          'hover:bg-neutral-100 dark:hover:bg-neutral-800',
          isRunning && 'bg-blue-500/5',
          className
        )}
      >
        <OperationIcon type={operation.type} status={operation.status} size="sm" />
        <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate flex-1">
          {operation.title}
        </span>
        {elapsedTime && (
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 tabular-nums">
            {formatOperationDuration(elapsedTime)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border',
        isRunning
          ? 'border-blue-500/30 bg-blue-500/5'
          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900',
        className
      )}
    >
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 text-left',
          hasDetails && 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
        )}
        disabled={!hasDetails}
      >
        {/* Expand/collapse indicator */}
        {hasDetails ? (
          expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          )
        ) : (
          <div className="w-3.5 h-3.5 flex-shrink-0" />
        )}

        {/* Icon */}
        <OperationIcon
          type={operation.type}
          status={operation.status}
          size="md"
          showBackground
        />

        {/* Title and metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {operation.title}
            </span>
            {operation.status === 'error' && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-500/10 text-red-500 rounded">
                Error
              </span>
            )}
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 flex-shrink-0">
          <Clock className="w-3 h-3" />
          <span className="tabular-nums">
            {elapsedTime ? formatOperationDuration(elapsedTime) : '—'}
          </span>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && hasDetails && (
        <div className="px-3 pb-3 pt-0">
          <div className="ml-[calc(0.875rem+0.75rem)] pl-3 border-l-2 border-neutral-200 dark:border-neutral-700 space-y-2">
            {/* Description (usually file path or command) */}
            {operation.description && (
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-[11px] break-all">
                  {operation.description}
                </code>
              </div>
            )}

            {/* Error message */}
            {operation.error && (
              <div className="text-xs text-red-500 bg-red-500/10 rounded px-2 py-1.5">
                {operation.error}
              </div>
            )}

            {/* Metadata (if any interesting fields) */}
            {operation.metadata && typeof operation.metadata.toolName === 'string' && (
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                <span>Tool: {operation.metadata.toolName}</span>
              </div>
            )}

            {/* Timestamps */}
            <div className="flex gap-4 text-[10px] text-neutral-400 dark:text-neutral-500">
              <span>
                Started: {operation.startedAt.toLocaleTimeString()}
              </span>
              {operation.completedAt && (
                <span>
                  Completed: {operation.completedAt.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// RUNNING OPERATION (Minimal inline display)
// =============================================================================

export interface RunningOperationProps {
  operation: Operation;
  className?: string;
}

export function RunningOperation({ operation, className }: RunningOperationProps) {
  const elapsed = Date.now() - operation.startedAt.getTime();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <OperationIcon type={operation.type} status="running" size="sm" />
      <span className="text-xs text-neutral-600 dark:text-neutral-300 truncate">
        {operation.title}
      </span>
      <span className="text-[10px] text-neutral-400 tabular-nums">
        {formatOperationDuration(elapsed)}
      </span>
    </div>
  );
}
