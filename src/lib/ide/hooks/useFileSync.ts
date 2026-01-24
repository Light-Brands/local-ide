'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getFileSyncService,
  type SyncStatus,
  type SyncStrategy,
  type FileSyncEvent,
} from '../services/file-sync';
import { IDE_FEATURES } from '../features';

export interface UseFileSyncOptions {
  /** Enable automatic sync monitoring */
  autoStart?: boolean;
  /** Check interval in milliseconds */
  interval?: number;
  /** Auto-execute soft reloads */
  autoSoftReload?: boolean;
  /** Auto-execute hard reloads */
  autoHardReload?: boolean;
}

export interface UseFileSyncReturn {
  /** Current sync status */
  status: SyncStatus | null;
  /** Whether we're currently checking */
  isChecking: boolean;
  /** Pending sync strategy if out of sync */
  pendingStrategy: SyncStrategy | null;
  /** Force a sync check */
  checkSync: () => Promise<void>;
  /** Execute the pending strategy */
  executeSync: () => Promise<void>;
  /** Dismiss the sync notification */
  dismiss: () => void;
  /** Acknowledge current version (call after successful hydration) */
  acknowledge: () => void;
}

export function useFileSync(options: UseFileSyncOptions = {}): UseFileSyncReturn {
  const {
    autoStart = true,
    interval = 3000,
    autoSoftReload = false,
    autoHardReload = false,
  } = options;

  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [pendingStrategy, setPendingStrategy] = useState<SyncStrategy | null>(null);
  const serviceRef = useRef(getFileSyncService());

  // If file sync is disabled, return a no-op version
  if (!IDE_FEATURES.fileSync) {
    return {
      status: { inSync: true, serverVersion: 'disabled', clientVersion: 'disabled', stalePaths: [], lastCheck: Date.now() },
      isChecking: false,
      pendingStrategy: null,
      checkSync: async () => {},
      executeSync: async () => {},
      dismiss: () => {},
      acknowledge: () => {},
    };
  }

  // Handle sync events
  useEffect(() => {
    const service = serviceRef.current;

    const unsubscribe = service.subscribe((event: FileSyncEvent) => {
      switch (event.type) {
        case 'sync-required':
          if (event.strategy) {
            setPendingStrategy(event.strategy);

            // Auto-execute if configured
            if (event.strategy === 'soft-reload' && autoSoftReload) {
              service.executeStrategy(event.strategy);
            } else if (event.strategy === 'hard-reload' && autoHardReload) {
              service.executeStrategy(event.strategy);
            }
          }
          break;

        case 'sync-complete':
          setPendingStrategy(null);
          break;

        case 'error':
          console.error('[useFileSync] Error:', event.error);
          break;
      }
    });

    if (autoStart) {
      service.start(interval);
    }

    return () => {
      unsubscribe();
      if (autoStart) {
        service.stop();
      }
    };
  }, [autoStart, interval, autoSoftReload, autoHardReload]);

  const checkSync = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await serviceRef.current.checkSync();
      setStatus(result);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const executeSync = useCallback(async () => {
    if (pendingStrategy) {
      await serviceRef.current.executeStrategy(pendingStrategy);
      setPendingStrategy(null);
    }
  }, [pendingStrategy]);

  const dismiss = useCallback(() => {
    setPendingStrategy(null);
    serviceRef.current.acknowledgeVersion();
  }, []);

  const acknowledge = useCallback(() => {
    serviceRef.current.acknowledgeVersion();
  }, []);

  return {
    status,
    isChecking,
    pendingStrategy,
    checkSync,
    executeSync,
    dismiss,
    acknowledge,
  };
}
