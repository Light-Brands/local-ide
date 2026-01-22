// =============================================================================
// Feedback Service
// API calls to /api/feedback with Supabase integration
// =============================================================================

import type {
  FeedbackItem,
  CreateFeedbackPayload,
  UpdateFeedbackPayload,
  PageId,
} from './types';

const API_BASE = '/api/feedback';

/**
 * Convert API response to FeedbackItem (handles snake_case to camelCase if needed)
 */
function transformResponse(data: FeedbackItem): FeedbackItem {
  return data;
}

/**
 * Get all feedback items, optionally filtered by page
 */
export async function getFeedbackItems(pageId?: PageId): Promise<FeedbackItem[]> {
  try {
    const url = pageId
      ? `${API_BASE}?pageId=${encodeURIComponent(pageId)}`
      : API_BASE;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch feedback: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.data || []).map(transformResponse);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return [];
  }
}

/**
 * Get a single feedback item by ID
 */
export async function getFeedbackById(id: string): Promise<FeedbackItem | null> {
  try {
    const response = await fetch(`${API_BASE}/${id}`);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch feedback: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data ? transformResponse(data.data) : null;
  } catch (error) {
    console.error('Error fetching feedback by ID:', error);
    return null;
  }
}

/**
 * Create a new feedback item
 */
export async function createFeedback(payload: CreateFeedbackPayload): Promise<FeedbackItem | null> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to create feedback: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data ? transformResponse(data.data) : null;
  } catch (error) {
    console.error('Error creating feedback:', error);
    return null;
  }
}

/**
 * Update a feedback item
 */
export async function updateFeedback(
  id: string,
  updates: UpdateFeedbackPayload
): Promise<FeedbackItem | null> {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to update feedback: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data ? transformResponse(data.data) : null;
  } catch (error) {
    console.error('Error updating feedback:', error);
    return null;
  }
}

/**
 * Delete a feedback item
 */
export async function deleteFeedback(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete feedback: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return false;
  }
}

/**
 * Get feedback count for a specific status
 */
export async function getFeedbackCount(status?: string): Promise<number> {
  try {
    const items = await getFeedbackItems();
    if (!status) return items.length;
    return items.filter(item => item.status === status).length;
  } catch (error) {
    console.error('Error getting feedback count:', error);
    return 0;
  }
}

/**
 * Get new feedback count
 */
export async function getNewFeedbackCount(): Promise<number> {
  return getFeedbackCount('new');
}

/**
 * Get feedback stats
 */
export async function getFeedbackStats(): Promise<{
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
  blocked: number;
  byCategory: Record<string, number>;
  byPage: Record<string, number>;
}> {
  try {
    const items = await getFeedbackItems();

    const stats = {
      total: items.length,
      new: 0,
      inProgress: 0,
      resolved: 0,
      blocked: 0,
      byCategory: {} as Record<string, number>,
      byPage: {} as Record<string, number>,
    };

    for (const item of items) {
      // Status counts
      switch (item.status) {
        case 'new': stats.new++; break;
        case 'in-progress': stats.inProgress++; break;
        case 'resolved': stats.resolved++; break;
        case 'blocked': stats.blocked++; break;
      }

      // Category counts
      stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;

      // Page counts
      stats.byPage[item.page_id] = (stats.byPage[item.page_id] || 0) + 1;
    }

    return stats;
  } catch (error) {
    console.error('Error getting feedback stats:', error);
    return {
      total: 0,
      new: 0,
      inProgress: 0,
      resolved: 0,
      blocked: 0,
      byCategory: {},
      byPage: {},
    };
  }
}
