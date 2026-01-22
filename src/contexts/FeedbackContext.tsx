'use client';

// =============================================================================
// Feedback Context - Global state management for feedback system
// =============================================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import type {
  FeedbackItem,
  CapturedContext,
  FeedbackFormData,
  PageId,
} from '@/lib/feedback/types';
import {
  FEEDBACK_ENABLED,
  isBrowser,
  getFeedbackItems,
  createFeedback as apiCreateFeedback,
  updateFeedback as apiUpdateFeedback,
  deleteFeedback as apiDeleteFeedback,
  getNewFeedbackCount,
  getCurrentPageId,
} from '@/lib/feedback';

interface FeedbackContextValue {
  // Items
  items: FeedbackItem[];
  pageItems: FeedbackItem[];
  newCount: number;

  // UI State
  feedbackMode: boolean;
  showMarkers: boolean;
  selectedFeedbackId: string | null;
  pendingCapture: CapturedContext | null;
  isModalOpen: boolean;

  // Actions
  toggleFeedbackMode: () => void;
  toggleMarkers: () => void;
  setSelectedFeedback: (id: string | null) => void;
  setPendingCapture: (capture: CapturedContext | null) => void;
  openModal: () => void;
  closeModal: () => void;

  // CRUD Operations
  createFeedback: (data: FeedbackFormData) => Promise<FeedbackItem | null>;
  updateFeedback: (id: string, updates: Partial<FeedbackItem>) => Promise<void>;
  deleteFeedback: (id: string) => Promise<void>;
  refreshItems: () => Promise<void>;

  // Navigation
  navigateToFeedback: (item: FeedbackItem, onNavigate?: (pageId: string) => void) => void;

  // Current page
  currentPageId: PageId;
  setCurrentPageId: (pageId: PageId) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

interface FeedbackProviderProps {
  children: ReactNode;
  initialPageId?: PageId;
  pageId?: PageId; // Current page ID - syncs with external navigation
}

export function FeedbackProvider({
  children,
  initialPageId = 'home',
  pageId,
}: FeedbackProviderProps) {
  // In production, just render children without any feedback functionality
  if (!FEEDBACK_ENABLED) {
    return <>{children}</>;
  }

  return (
    <FeedbackProviderInternal initialPageId={initialPageId} pageId={pageId}>
      {children}
    </FeedbackProviderInternal>
  );
}

function FeedbackProviderInternal({
  children,
  initialPageId = 'home',
  pageId,
}: FeedbackProviderProps) {
  // All feedback items
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [newCount, setNewCount] = useState(0);

  // UI state
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const [pendingCapture, setPendingCapture] = useState<CapturedContext | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPageId, setCurrentPageId] = useState<PageId>(pageId ?? initialPageId);

  // Sync currentPageId with external pageId prop
  useEffect(() => {
    if (pageId && pageId !== currentPageId) {
      setCurrentPageId(pageId);
    }
  }, [pageId, currentPageId]);

  // Auto-detect page ID from URL when it changes
  useEffect(() => {
    if (!isBrowser) return;

    const updatePageId = () => {
      const detectedPageId = getCurrentPageId();
      if (detectedPageId !== currentPageId) {
        setCurrentPageId(detectedPageId);
      }
    };

    // Listen for popstate (browser back/forward)
    window.addEventListener('popstate', updatePageId);

    // Also check on initial mount
    updatePageId();

    return () => window.removeEventListener('popstate', updatePageId);
  }, [currentPageId]);

  // Items filtered for current page
  const pageItems = items.filter((item) => item.page_id === currentPageId);

  // Load items on mount
  useEffect(() => {
    refreshItems();
  }, []);

  // Refresh items from API
  const refreshItems = useCallback(async () => {
    const allItems = await getFeedbackItems();
    setItems(allItems);
    const count = await getNewFeedbackCount();
    setNewCount(count);
  }, []);

  // Toggle feedback mode
  const toggleFeedbackMode = useCallback(() => {
    setFeedbackMode((prev) => {
      if (prev) {
        // Exiting feedback mode, clear pending capture
        setPendingCapture(null);
      }
      return !prev;
    });
  }, []);

  // Toggle marker visibility
  const toggleMarkers = useCallback(() => {
    setShowMarkers((prev) => !prev);
  }, []);

  // Set selected feedback
  const setSelectedFeedback = useCallback((id: string | null) => {
    setSelectedFeedbackId(id);
  }, []);

  // Open modal
  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setPendingCapture(null);
    setFeedbackMode(false);
  }, []);

  // Create feedback
  const createFeedback = useCallback(
    async (data: FeedbackFormData): Promise<FeedbackItem | null> => {
      if (!pendingCapture) {
        console.error('No pending capture context');
        return null;
      }

      try {
        const newItem = await apiCreateFeedback({
          // From capture
          section_path: pendingCapture.sectionPath,
          component_name: pendingCapture.componentName,
          page_id: pendingCapture.pageId,
          page_url: isBrowser ? window.location.href : '',
          position: pendingCapture.position,
          text_context: pendingCapture.textContext,
          screenshot: data.includeScreenshot ? pendingCapture.screenshot : undefined,

          // From form
          category: data.category,
          priority: data.priority,
          title: data.title,
          notes: data.notes,
        });

        if (newItem) {
          await refreshItems();
          closeModal();
        }
        return newItem;
      } catch (error) {
        console.error('Failed to create feedback:', error);
        return null;
      }
    },
    [pendingCapture, refreshItems, closeModal]
  );

  // Update feedback
  const updateFeedback = useCallback(
    async (id: string, updates: Partial<FeedbackItem>) => {
      try {
        await apiUpdateFeedback(id, updates);
        await refreshItems();
      } catch (error) {
        console.error('Failed to update feedback:', error);
      }
    },
    [refreshItems]
  );

  // Delete feedback
  const deleteFeedback = useCallback(
    async (id: string) => {
      try {
        await apiDeleteFeedback(id);
        await refreshItems();
        if (selectedFeedbackId === id) {
          setSelectedFeedbackId(null);
        }
      } catch (error) {
        console.error('Failed to delete feedback:', error);
      }
    },
    [refreshItems, selectedFeedbackId]
  );

  // Navigate to a feedback item's location
  const navigateToFeedback = useCallback(
    (item: FeedbackItem, onNavigate?: (pageId: string) => void) => {
      // First navigate to the page if we're on a different page
      if (item.page_id !== currentPageId && onNavigate) {
        onNavigate(item.page_id);
        // Wait for page navigation, then scroll
        setTimeout(() => {
          scrollToFeedbackPosition(item);
        }, 500);
      } else {
        scrollToFeedbackPosition(item);
      }
    },
    [currentPageId]
  );

  // Helper to scroll to feedback position and flash marker
  const scrollToFeedbackPosition = (item: FeedbackItem) => {
    if (!isBrowser) return;

    // Calculate scroll position based on stored position
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    const targetY = (item.position.y / 100) * docHeight;

    // Scroll to position
    window.scrollTo({
      top: targetY - window.innerHeight / 3,
      behavior: 'smooth',
    });

    // Flash the marker briefly
    setTimeout(() => {
      const marker = document.querySelector(`[data-feedback-id="${item.id}"]`);
      if (marker) {
        marker.classList.add('animate-ping');
        setTimeout(() => marker.classList.remove('animate-ping'), 1000);
      }
    }, 500);
  };

  // ESC key to exit feedback mode
  useEffect(() => {
    if (!isBrowser) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) {
          closeModal();
        } else if (feedbackMode) {
          setFeedbackMode(false);
          setPendingCapture(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedbackMode, isModalOpen, closeModal]);

  const value: FeedbackContextValue = {
    // Items
    items,
    pageItems,
    newCount,

    // UI State
    feedbackMode,
    showMarkers,
    selectedFeedbackId,
    pendingCapture,
    isModalOpen,

    // Actions
    toggleFeedbackMode,
    toggleMarkers,
    setSelectedFeedback,
    setPendingCapture,
    openModal,
    closeModal,

    // CRUD
    createFeedback,
    updateFeedback,
    deleteFeedback,
    refreshItems,

    // Navigation
    navigateToFeedback,

    // Page
    currentPageId,
    setCurrentPageId,
  };

  return (
    <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>
  );
}

// Hook to use feedback context
export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}

// Hook to check if we're in feedback mode (useful for components to opt-in/out)
export function useFeedbackMode() {
  const { feedbackMode } = useFeedback();
  return feedbackMode;
}

// Hook to safely use feedback context (returns null if not in provider)
export function useFeedbackSafe() {
  return useContext(FeedbackContext);
}
