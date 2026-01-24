'use client';

import { useState, useEffect, useCallback } from 'react';
import { getClientEnvironment } from '@/lib/ide/env';

export type TerminalUnavailableReason =
  | 'production'
  | 'server_not_running'
  | 'connection_failed';

export interface TerminalAvailability {
  isAvailable: boolean;
  isChecking: boolean;
  reason: TerminalUnavailableReason | null;
  retryCheck: () => void;
}

/**
 * Hook to check if terminal functionality is available
 * Returns false immediately in production (non-localhost)
 * Checks terminal server health in local mode
 */
export function useTerminalAvailability(): TerminalAvailability {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [reason, setReason] = useState<TerminalUnavailableReason | null>(null);
  const [checkCount, setCheckCount] = useState(0);

  const checkAvailability = useCallback(async () => {
    setIsChecking(true);

    // Check client environment
    const env = getClientEnvironment();

    // If not on localhost, terminal is not supported
    if (!env.isTerminalSupported) {
      setIsAvailable(false);
      setReason('production');
      setIsChecking(false);
      return;
    }

    // On localhost - check if terminal server is running
    try {
      const response = await fetch('/api/terminal?autoStart=false', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      const data = await response.json();

      if (data.status === 'running' || data.status === 'started') {
        setIsAvailable(true);
        setReason(null);
      } else if (data.status === 'not_available') {
        // Server explicitly says not available (production mode)
        setIsAvailable(false);
        setReason('production');
      } else {
        // Server not running
        setIsAvailable(false);
        setReason('server_not_running');
      }
    } catch (error) {
      // Connection failed
      setIsAvailable(false);
      setReason('connection_failed');
    }

    setIsChecking(false);
  }, []);

  // Initial check and when checkCount changes (for retry)
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability, checkCount]);

  const retryCheck = useCallback(() => {
    setCheckCount((c) => c + 1);
  }, []);

  return {
    isAvailable,
    isChecking,
    reason,
    retryCheck,
  };
}
