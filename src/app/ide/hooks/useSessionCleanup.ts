'use client';

import { useEffect, useRef } from 'react';
import { useIDEStore } from '../stores/ideStore';

/**
 * Hook that automatically cleans up orphaned tmux sessions
 * when no chat or terminal tabs are open in the frontend.
 */
export function useSessionCleanup() {
  const chatSessions = useIDEStore((state) => state.chatSessions);
  const terminalTabs = useIDEStore((state) => state.terminalTabs);
  const lastCleanupRef = useRef<number>(0);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const chatCount = chatSessions.length;
    const terminalCount = terminalTabs.length;
    const totalSessions = chatCount + terminalCount;

    // If no sessions are open, schedule a cleanup
    if (totalSessions === 0) {
      // Debounce cleanup to avoid rapid firing during tab switching
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }

      cleanupTimeoutRef.current = setTimeout(async () => {
        // Don't cleanup more than once every 5 seconds
        const now = Date.now();
        if (now - lastCleanupRef.current < 5000) {
          return;
        }
        lastCleanupRef.current = now;

        console.log('[SessionCleanup] No sessions open, cleaning up orphaned tmux sessions...');

        try {
          const response = await fetch('/api/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'clear-sessions' }),
          });

          if (response.ok) {
            console.log('[SessionCleanup] Orphaned sessions cleared');
          }
        } catch (error) {
          console.error('[SessionCleanup] Failed to clear sessions:', error);
        }
      }, 2000); // Wait 2 seconds before cleanup to allow for tab switching
    }

    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
    };
  }, [chatSessions.length, terminalTabs.length]);
}
