// =============================================================================
// Feedback Module - Type Definitions
// =============================================================================

export type FeedbackCategory = 'bug' | 'enhancement' | 'question' | 'content';
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';
export type FeedbackStatus = 'new' | 'in-progress' | 'resolved' | 'blocked';

// PageId is a string to support dynamic routes
export type PageId = string;

export interface FeedbackPosition {
  x: number;           // % from left (0-100)
  y: number;           // % from top of document
  scrollY: number;     // scroll position when created
  viewportY: number;   // % from top of viewport when clicked
}

export interface TextContext {
  // The actual text content around the clicked area
  textBefore: string;  // ~50 lines before click point
  textAfter: string;   // ~50 lines after click point
  clickedText: string; // The specific text element clicked on

  // For precise location
  elementTag: string;  // e.g., 'div', 'span', 'p'
  elementId?: string;  // DOM element id if present
  elementClasses: string[]; // CSS classes on element
  dataAttributes: Record<string, string>; // data-* attributes
}

export interface FeedbackItem {
  id: string;
  created_at: string;
  updated_at: string;
  user_id?: string;           // User who created this

  // Context - where in the app
  page_id: PageId;
  page_url: string;
  section_path: string;       // "Dashboard > Epic Cards > Epic 01"
  component_name?: string;    // "EpicCard"

  // Position - for marker placement
  position: FeedbackPosition;

  // Text Context - the actual content around click point
  text_context: TextContext;

  // Content - what the user wants to say
  category: FeedbackCategory;
  priority: FeedbackPriority;
  title: string;
  notes: string;
  screenshot_url?: string;    // URL from Supabase Storage

  // Status tracking
  status: FeedbackStatus;
  resolution?: string;        // Notes when resolved
  resolved_at?: string;       // Timestamp when resolved
  resolved_by?: string;       // User who resolved
}

// What we capture when user clicks
export interface CapturedContext {
  sectionPath: string;
  componentName?: string;
  pageId: PageId;
  position: FeedbackPosition;
  textContext: TextContext;
  screenshot?: string;        // base64 for preview, uploaded on save
}

// UI-only state (not persisted)
export interface FeedbackUIState {
  feedbackMode: boolean;
  showMarkers: boolean;
  selectedFeedbackId: string | null;
  pendingCapture: CapturedContext | null;
}

// Form data for creating feedback
export interface FeedbackFormData {
  category: FeedbackCategory;
  priority: FeedbackPriority;
  title: string;
  notes: string;
  includeScreenshot: boolean;
}

import { badge, colors } from '@/lib/design/tokens';

// Category display config - uses centralized tokens
// `icon` is kept for backwards compatibility (previously was emoji)
// `iconName` is the Lucide icon name for rendering
export const categoryConfig: Record<FeedbackCategory, { label: string; icon: string; iconName: string; color: string }> = {
  bug: { label: 'Bug', icon: 'Bug', iconName: 'Bug', color: badge.error },
  enhancement: { label: 'Enhancement', icon: 'Sparkles', iconName: 'Sparkles', color: badge.primary },
  question: { label: 'Question', icon: 'HelpCircle', iconName: 'HelpCircle', color: badge.warning },
  content: { label: 'Content', icon: 'FileText', iconName: 'FileText', color: badge.neutral },
};

// Priority display config - using centralized tokens
export const priorityConfig: Record<FeedbackPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: badge.neutral },
  medium: { label: 'Medium', color: badge.primary },
  high: { label: 'High', color: badge.warning },
  critical: { label: 'Critical', color: badge.error },
};

// Status display config - using centralized tokens
export const statusConfig: Record<FeedbackStatus, { label: string; color: string; markerColor: string }> = {
  new: { label: 'New', color: badge.warning, markerColor: colors.warning.solid },
  'in-progress': { label: 'In Progress', color: badge.primary, markerColor: colors.primary.solid },
  resolved: { label: 'Resolved', color: badge.success, markerColor: colors.success.solid },
  blocked: { label: 'Blocked', color: badge.error, markerColor: colors.error.solid },
};

// Create form data type (what API receives)
export interface CreateFeedbackPayload {
  page_id: PageId;
  page_url: string;
  section_path: string;
  component_name?: string;
  position: FeedbackPosition;
  text_context: TextContext;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  title: string;
  notes: string;
  screenshot?: string;        // base64 to upload
}

// Update feedback payload
export interface UpdateFeedbackPayload {
  status?: FeedbackStatus;
  resolution?: string;
  resolved_at?: string;
  priority?: FeedbackPriority;
  title?: string;
  notes?: string;
}
