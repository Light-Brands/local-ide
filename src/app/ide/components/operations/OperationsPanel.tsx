'use client';

import React, { useMemo, useEffect } from 'react';
import { X, Trash2, Activity, FileText, Search, Terminal, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOperations } from '@/app/ide/stores/ideStore';
import { useOperationSync } from '@/lib/ide/hooks/useOperationSync';
import { OperationItem } from './OperationItem';
import { FILTER_TYPES, type OperationFilter } from '@/lib/ide/services/operations';

// =============================================================================
// FILTER TABS
// =============================================================================

const FILTER_TABS: { key: OperationFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'all', label: 'All', icon: Activity },
  { key: 'files', label: 'Files', icon: FileText },
  { key: 'search', label: 'Search', icon: Search },
  { key: 'commands', label: 'Commands', icon: Terminal },
  { key: 'agents', label: 'Agents', icon: Bot },
];

// =============================================================================
// COMPONENT
// =============================================================================

export interface OperationsPanelProps {
  className?: string;
}

export function OperationsPanel({ className }: OperationsPanelProps) {
  const { operations, panelOpen, filter, setPanelOpen, setFilter } = useOperations();
  const { clearOperations } = useOperationSync();

  // Filter operations based on current filter
  const filteredOperations = useMemo(() => {
    if (filter === 'all') return operations;

    const types = FILTER_TYPES[filter];
    return operations.filter((op) => types.includes(op.type));
  }, [operations, filter]);

  // Separate running and completed operations
  const { runningOperations, completedOperations } = useMemo(() => {
    const running = filteredOperations.filter((op) => op.status === 'running');
    const completed = filteredOperations.filter((op) => op.status !== 'running');
    return { runningOperations: running, completedOperations: completed };
  }, [filteredOperations]);

  // Handle escape key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && panelOpen) {
        setPanelOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [panelOpen, setPanelOpen]);

  if (!panelOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
        onClick={() => setPanelOpen(false)}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-white dark:bg-neutral-900',
          'border-t border-neutral-200 dark:border-neutral-800',
          'rounded-t-xl shadow-2xl',
          'transform transition-transform duration-200 ease-out',
          'max-h-[70vh] flex flex-col',
          panelOpen ? 'translate-y-0' : 'translate-y-full',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-neutral-500" />
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Operations
            </h2>
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded">
              {filteredOperations.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Clear button */}
            <button
              onClick={clearOperations}
              className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Clear all operations"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              onClick={() => setPanelOpen(false)}
              className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
          {FILTER_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors',
                filter === key
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredOperations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <Activity className="w-8 h-8 mb-2" />
              <p className="text-sm">No operations yet</p>
              <p className="text-xs mt-1">
                Operations will appear here as AI tools are used
              </p>
            </div>
          ) : (
            <>
              {/* In Progress Section */}
              {runningOperations.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                    In Progress ({runningOperations.length})
                  </h3>
                  <div className="space-y-2">
                    {runningOperations.map((operation) => (
                      <OperationItem key={operation.id} operation={operation} />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Section */}
              {completedOperations.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                    Recent ({completedOperations.length})
                  </h3>
                  <div className="space-y-2">
                    {completedOperations.slice(0, 50).map((operation) => (
                      <OperationItem key={operation.id} operation={operation} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with running count */}
        {runningOperations.length > 0 && (
          <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>
                {runningOperations.length} operation{runningOperations.length !== 1 ? 's' : ''} in progress
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
