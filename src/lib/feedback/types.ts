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

// Category display config
export const categoryConfig: Record<FeedbackCategory, { label: string; icon: string; color: string }> = {
  bug: { label: 'Bug', icon: '🐛', color: 'text-red-400 bg-red-500/20' },
  enhancement: { label: 'Enhancement', icon: '✨', color: 'text-cyan-400 bg-cyan-500/20' },
  question: { label: 'Question', icon: '❓', color: 'text-amber-400 bg-amber-500/20' },
  content: { label: 'Content', icon: '📝', color: 'text-teal-400 bg-teal-500/20' },
};

// Priority display config
export const priorityConfig: Record<FeedbackPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-neutral-400 bg-neutral-500/20' },
  medium: { label: 'Medium', color: 'text-teal-400 bg-teal-500/20' },
  high: { label: 'High', color: 'text-amber-400 bg-amber-500/20' },
  critical: { label: 'Critical', color: 'text-red-400 bg-red-500/20' },
};

// Status display config
export const statusConfig: Record<FeedbackStatus, { label: string; color: string; markerColor: string }> = {
  new: { label: 'New', color: 'text-amber-400 bg-amber-500/20', markerColor: 'bg-amber-500' },
  'in-progress': { label: 'In Progress', color: 'text-cyan-400 bg-cyan-500/20', markerColor: 'bg-cyan-500' },
  resolved: { label: 'Resolved', color: 'text-emerald-400 bg-emerald-500/20', markerColor: 'bg-emerald-500' },
  blocked: { label: 'Blocked', color: 'text-red-400 bg-red-500/20', markerColor: 'bg-red-500' },
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
