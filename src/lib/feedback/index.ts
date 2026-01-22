// =============================================================================
// Feedback Module - Public API
// =============================================================================

// Types
export * from './types';

// Visibility control
export { FEEDBACK_ENABLED, isBrowser, withFeedbackEnabled } from './visibility';

// Page ID utilities
export { getCurrentPageId, getPageIdFromPath, formatPageId } from './pageId';

// Capture utilities
export {
  getElementPath,
  getComponentName,
  getTextContext,
  getPosition,
  captureScreenshot,
  formatTextContextPreview,
  captureContextFromElement,
  captureContextFromSelection,
} from './feedbackCapture';

// API service
export {
  getFeedbackItems,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getFeedbackCount,
  getNewFeedbackCount,
  getFeedbackStats,
} from './feedbackService';
