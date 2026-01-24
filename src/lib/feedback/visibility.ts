// =============================================================================
// Feedback Visibility Control
// Controls whether the feedback system is visible based on environment
// =============================================================================

/**
 * Whether the feedback system should be enabled.
 * In production: completely hidden - no DOM footprint, no event listeners
 * In development: fully active on ALL pages
 *
 * Set to false to hide the feedback button entirely
 */
export const FEEDBACK_ENABLED = false;

/**
 * Check if we're in a browser environment
 * Used for SSR guards
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Helper to conditionally render feedback components
 * Returns null if feedback is disabled (production)
 */
export function withFeedbackEnabled<T>(component: T): T | null {
  return FEEDBACK_ENABLED ? component : null;
}
