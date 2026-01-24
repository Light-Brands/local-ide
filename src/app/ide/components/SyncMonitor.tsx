'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileSync } from '@/lib/ide/hooks/useFileSync';

export function SyncMonitor() {
  const [hasMounted, setHasMounted] = useState(false);
  const { pendingStrategy, executeSync, dismiss, isChecking } = useFileSync({
    autoStart: true,
    interval: 2000,
    // Don't auto-reload - let user decide
    autoSoftReload: false,
    autoHardReload: false,
  });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Don't render during SSR to prevent hydration mismatch
  if (!hasMounted) return null;

  // No pending sync required
  if (!pendingStrategy) return null;

  const strategyLabels: Record<string, { title: string; description: string; color: string }> = {
    hmr: {
      title: 'Hot Update Applied',
      description: 'Changes applied automatically.',
      color: 'bg-green-500',
    },
    'soft-reload': {
      title: 'Preview Refresh Ready',
      description: 'App files changed. Preview will refresh.',
      color: 'bg-amber-500',
    },
    'hard-reload': {
      title: 'Preview Reload Required',
      description: 'Critical app files changed. Preview needs full reload.',
      color: 'bg-orange-500',
    },
    'server-restart': {
      title: 'Server Restart Needed',
      description: 'Config files changed. Restart the dev server.',
      color: 'bg-red-600',
    },
  };

  // Don't show notification for HMR - it's automatic
  if (pendingStrategy === 'hmr') {
    return null;
  }

  const info = strategyLabels[pendingStrategy] || strategyLabels['soft-reload'];

  return (
    <div
      className={cn(
        'fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80',
        'bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl',
        'animate-in slide-in-from-bottom-4 duration-300'
      )}
    >
      {/* Color bar */}
      <div className={cn('h-1 rounded-t-lg', info.color)} />

      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className={cn('p-1.5 rounded-full', info.color)}>
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white">{info.title}</h4>
            <p className="text-xs text-neutral-400 mt-0.5">{info.description}</p>
          </div>

          <button
            onClick={dismiss}
            className="p-1 hover:bg-neutral-800 rounded transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={executeSync}
            disabled={isChecking}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-1.5',
              'bg-white text-neutral-900 text-sm font-medium rounded',
              'hover:bg-neutral-100 transition-colors',
              'disabled:opacity-50'
            )}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isChecking && 'animate-spin')} />
            {pendingStrategy === 'hard-reload' ? 'Reload Now' : 'Refresh'}
          </button>

          <button
            onClick={dismiss}
            className={cn(
              'px-3 py-1.5 text-sm text-neutral-400',
              'hover:text-white transition-colors'
            )}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact sync indicator for header/status bar
 */
export function SyncIndicator() {
  const [hasMounted, setHasMounted] = useState(false);
  const { pendingStrategy, isChecking, checkSync } = useFileSync({
    autoStart: true,
    interval: 3000,
  });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  const getStatusColor = () => {
    if (isChecking) return 'text-blue-400 animate-pulse';
    if (pendingStrategy === 'hard-reload') return 'text-red-500';
    if (pendingStrategy) return 'text-amber-500';
    return 'text-green-500';
  };

  return (
    <button
      onClick={() => checkSync()}
      className={cn(
        'p-1.5 rounded hover:bg-neutral-800 transition-colors',
        getStatusColor()
      )}
      title={
        pendingStrategy
          ? `Sync required: ${pendingStrategy}`
          : isChecking
            ? 'Checking...'
            : 'In sync'
      }
    >
      {pendingStrategy ? (
        <AlertTriangle className="w-4 h-4" />
      ) : (
        <Check className="w-4 h-4" />
      )}
    </button>
  );
}
