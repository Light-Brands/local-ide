// =============================================================================
// Page ID Utility
// Maps routes to page identifiers for feedback grouping
// =============================================================================

import type { PageId } from './types';

/**
 * Get a page ID from the current URL/pathname
 * Supports both static and dynamic routes
 */
export function getPageIdFromPath(pathname: string): PageId {
  // Remove leading/trailing slashes and normalize
  const normalized = pathname.replace(/^\/+|\/+$/g, '');

  // Handle empty path (home)
  if (!normalized) return 'home';

  // Handle admin routes
  if (normalized.startsWith('admin')) {
    // admin/content/posts -> admin-content-posts
    return normalized.replace(/\//g, '-');
  }

  // Handle dynamic routes - replace IDs with descriptive placeholders
  // e.g., /posts/123 -> posts-detail
  // e.g., /users/abc123/settings -> users-detail-settings
  const segments = normalized.split('/');
  const processedSegments = segments.map((segment, index) => {
    // Check if this looks like an ID (UUID, numeric, or alphanumeric hash)
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || // UUID
                 /^\d+$/.test(segment) || // Numeric ID
                 /^[a-z0-9]{20,}$/i.test(segment); // Long alphanumeric hash

    if (isId) {
      return 'detail';
    }
    return segment;
  });

  return processedSegments.join('-');
}

/**
 * Get the current page ID based on the current URL
 * SSR-safe: returns 'unknown' on server
 */
export function getCurrentPageId(): PageId {
  if (typeof window === 'undefined') return 'unknown';

  // Check for data-page attribute on main content first
  const mainContent = document.querySelector('[data-page]');
  if (mainContent) {
    const pageAttr = mainContent.getAttribute('data-page');
    if (pageAttr) return pageAttr;
  }

  // Check for active nav item
  const activeNav = document.querySelector('[data-nav-active="true"]');
  if (activeNav) {
    const navId = activeNav.getAttribute('data-nav-id');
    if (navId) return navId;
  }

  // Fall back to URL path
  return getPageIdFromPath(window.location.pathname);
}

/**
 * Format a page ID for display
 * e.g., 'admin-content-posts' -> 'Admin > Content > Posts'
 */
export function formatPageId(pageId: PageId): string {
  return pageId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' > ');
}
