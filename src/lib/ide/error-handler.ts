/**
 * IDE Error Handler
 *
 * Provides graceful error handling for IDE services. When IDE features
 * are disabled or APIs are unavailable, errors are handled silently
 * to prevent cascading failures.
 */

import { IDE_ENABLED } from './features';

export type IDEErrorSeverity = 'silent' | 'warn' | 'error';

export interface IDEError {
  service: string;
  operation: string;
  error: unknown;
  severity: IDEErrorSeverity;
}

// Track which services have reported errors (to avoid spam)
const errorReported = new Set<string>();

/**
 * Wrap an async operation with graceful error handling.
 * Returns undefined on failure instead of throwing.
 */
export async function safeIDEOperation<T>(
  service: string,
  operation: string,
  fn: () => Promise<T>,
  options: {
    fallback?: T;
    severity?: IDEErrorSeverity;
    onError?: (error: IDEError) => void;
  } = {}
): Promise<T | undefined> {
  const { fallback, severity = 'warn', onError } = options;

  // If IDE is disabled, return fallback immediately
  if (!IDE_ENABLED) {
    return fallback;
  }

  try {
    return await fn();
  } catch (error) {
    const ideError: IDEError = { service, operation, error, severity };

    // Call custom error handler if provided
    onError?.(ideError);

    // Log based on severity (but only once per service+operation)
    const errorKey = `${service}:${operation}`;
    if (!errorReported.has(errorKey)) {
      errorReported.add(errorKey);

      if (severity === 'error') {
        console.error(`[IDE ${service}] ${operation} failed:`, error);
      } else if (severity === 'warn') {
        console.warn(`[IDE ${service}] ${operation} failed:`, error);
      }
      // 'silent' logs nothing
    }

    return fallback;
  }
}

/**
 * Wrap a sync operation with graceful error handling.
 */
export function safeIDESync<T>(
  service: string,
  operation: string,
  fn: () => T,
  options: {
    fallback?: T;
    severity?: IDEErrorSeverity;
  } = {}
): T | undefined {
  const { fallback, severity = 'warn' } = options;

  if (!IDE_ENABLED) {
    return fallback;
  }

  try {
    return fn();
  } catch (error) {
    const errorKey = `${service}:${operation}`;
    if (!errorReported.has(errorKey)) {
      errorReported.add(errorKey);

      if (severity === 'error') {
        console.error(`[IDE ${service}] ${operation} failed:`, error);
      } else if (severity === 'warn') {
        console.warn(`[IDE ${service}] ${operation} failed:`, error);
      }
    }

    return fallback;
  }
}

/**
 * Create a no-op service that returns fallback values.
 * Useful for creating mock services when IDE is disabled.
 */
export function createNoOpService<T extends object>(serviceName: string): T {
  return new Proxy({} as T, {
    get(_, prop) {
      // Return a no-op function for any method call
      if (typeof prop === 'string') {
        return (..._args: unknown[]) => {
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.debug(`[IDE ${serviceName}] ${prop} called but IDE is disabled`);
          }
          return undefined;
        };
      }
      return undefined;
    },
  });
}

/**
 * Check if an error is a network/fetch error (API unavailable)
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('failed to fetch') ||
      message.includes('connection refused') ||
      message.includes('econnrefused')
    );
  }
  return false;
}

/**
 * Reset error tracking (useful for testing or reconnection attempts)
 */
export function resetErrorTracking(): void {
  errorReported.clear();
}
