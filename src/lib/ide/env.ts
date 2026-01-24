/**
 * Environment detection utilities for Local IDE
 * Handles Vercel/production vs local development detection
 */

// Server-side: Check if running on Vercel
export const isVercel = !!process.env.VERCEL;

// Client-side environment detection
export interface ClientEnvironment {
  isLocal: boolean;
  isTerminalSupported: boolean;
  hostname: string;
}

/**
 * Get client-side environment information
 * Call this only in client components or useEffect
 */
export function getClientEnvironment(): ClientEnvironment {
  if (typeof window === 'undefined') {
    // Server-side rendering - assume based on Vercel env
    return {
      isLocal: !isVercel,
      isTerminalSupported: !isVercel,
      hostname: '',
    };
  }

  const hostname = window.location.hostname;
  const isLocal = ['localhost', '127.0.0.1'].includes(hostname);

  return {
    isLocal,
    isTerminalSupported: isLocal,
    hostname,
  };
}

/**
 * Check if we're in a production environment (Vercel or non-localhost)
 */
export function isProduction(): boolean {
  if (typeof window === 'undefined') {
    return isVercel;
  }
  return !['localhost', '127.0.0.1'].includes(window.location.hostname);
}
