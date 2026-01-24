'use client';

import { useEffect } from 'react';

/**
 * Development Refresh Handler
 *
 * In development, Next.js HMR can cause hydration mismatches when components
 * render differently on server vs client. This component detects when HMR
 * updates happen and forces a clean page refresh to avoid hydration errors.
 *
 * Only active in development mode.
 */
export function DevRefreshHandler() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Listen for HMR updates
    if (typeof window !== 'undefined' && 'hot' in module) {
      const hot = (module as any).hot;

      if (hot) {
        // When a module is updated, force a full refresh for clean hydration
        hot.addStatusHandler((status: string) => {
          if (status === 'apply') {
            // Small delay to let HMR finish, then refresh
            setTimeout(() => {
              window.location.reload();
            }, 100);
          }
        });
      }
    }

    // Alternative: Listen for Next.js specific events
    const handleRouteChange = () => {
      // Clear any stale state
    };

    window.addEventListener('beforeunload', handleRouteChange);
    return () => window.removeEventListener('beforeunload', handleRouteChange);
  }, []);

  return null;
}
