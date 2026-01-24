'use client';

// =============================================================================
// Feedback Mode Overlay - Hover to highlight elements, click to capture
// =============================================================================

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFeedback } from '@/contexts/FeedbackContext';
import { captureContextFromElement, FEEDBACK_ENABLED, isBrowser } from '@/lib/feedback';

export function FeedbackMode() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!FEEDBACK_ENABLED || !isBrowser || !mounted) return null;

  return <FeedbackModeInner />;
}

function FeedbackModeInner() {
  const { feedbackMode, toggleFeedbackMode, setPendingCapture, openModal, isModalOpen } =
    useFeedback();
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [highlightBox, setHighlightBox] = useState<DOMRect | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Clear highlight when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setHoveredElement(null);
      setHighlightBox(null);
    }
  }, [isModalOpen]);

  // Handle mouse move - find and highlight element under cursor
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // Don't update while capturing or when modal is open
      if (isCapturing || isModalOpen) return;

      // Get element under cursor (excluding our overlay)
      const elements = document.elementsFromPoint(e.clientX, e.clientY);

      // Find the first meaningful element (skip overlay and tiny elements)
      let targetElement: HTMLElement | null = null;

      for (const el of elements) {
        const htmlEl = el as HTMLElement;

        // Skip our feedback UI
        if (htmlEl.closest('[data-feedback-ui]')) continue;
        if (htmlEl.id === 'feedback-mode-overlay') continue;
        if (htmlEl.id === 'feedback-highlight-box') continue;

        // Skip very small elements
        const rect = htmlEl.getBoundingClientRect();
        if (rect.width < 20 || rect.height < 20) continue;

        // Skip body and html
        if (htmlEl === document.body || htmlEl === document.documentElement) continue;

        // Found a good element
        targetElement = htmlEl;
        break;
      }

      if (targetElement && targetElement !== hoveredElement) {
        setHoveredElement(targetElement);
        setHighlightBox(targetElement.getBoundingClientRect());
      } else if (!targetElement) {
        setHoveredElement(null);
        setHighlightBox(null);
      }
    },
    [hoveredElement, isCapturing, isModalOpen]
  );

  // Handle click - capture the hovered element
  const handleClick = useCallback(
    async (e: MouseEvent) => {
      // Don't capture clicks when modal is open
      if (isModalOpen) return;

      // Don't capture clicks on UI elements
      const target = e.target as HTMLElement;
      if (target.closest('[data-feedback-ui]')) return;

      e.preventDefault();
      e.stopPropagation();

      if (!hoveredElement) return;

      setIsCapturing(true);

      try {
        // Capture the element's context
        const context = await captureContextFromElement(hoveredElement, e);

        if (context) {
          setPendingCapture(context);
          openModal();
        }
      } catch (error) {
        console.error('Capture failed:', error);
      } finally {
        setIsCapturing(false);
      }
    },
    [hoveredElement, isModalOpen, setPendingCapture, openModal]
  );

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleFeedbackMode();
      }
    },
    [toggleFeedbackMode]
  );

  // Set up event listeners when in feedback mode
  useEffect(() => {
    if (!feedbackMode) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [feedbackMode, handleMouseMove, handleClick, handleKeyDown]);

  // Clean up highlight when exiting feedback mode
  useEffect(() => {
    if (!feedbackMode) {
      setHoveredElement(null);
      setHighlightBox(null);
    }
  }, [feedbackMode]);

  // Don't render if not in feedback mode
  if (!feedbackMode) return null;

  const overlay = (
    <>
      {/* Instruction banner at top */}
      <div
        data-feedback-ui
        className="fixed top-0 left-0 right-0 bg-neutral-900/95 border-b border-slate-600/30 py-3 px-6 flex items-center justify-between z-[61]"
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-slate-600 rounded-full animate-pulse" />
          <span className="text-neutral-100 font-bold">Feedback Mode</span>
          <span className="text-neutral-400">Hover to highlight elements, click to capture</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFeedbackMode();
          }}
          className="flex items-center gap-2 px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-sm font-bold rounded-lg transition-colors"
        >
          <span>ESC</span>
          <span className="text-neutral-400">to cancel</span>
        </button>
      </div>

      {/* Highlight box around hovered element */}
      {highlightBox && !isCapturing && (
        <div
          id="feedback-highlight-box"
          data-feedback-ui
          className="fixed pointer-events-none z-[60] border-2 border-slate-600 bg-slate-600/10 rounded-lg transition-all duration-75"
          style={{
            left: highlightBox.left - 4,
            top: highlightBox.top - 4,
            width: highlightBox.width + 8,
            height: highlightBox.height + 8,
          }}
        >
          {/* Label showing element info */}
          <div className="absolute -top-6 left-0 px-2 py-0.5 bg-slate-600 text-neutral-900 text-[10px] font-bold rounded whitespace-nowrap">
            {hoveredElement?.tagName.toLowerCase()}
            {hoveredElement?.id ? `#${hoveredElement.id}` : ''}
            {hoveredElement?.className && typeof hoveredElement.className === 'string'
              ? `.${hoveredElement.className.split(' ')[0]}`
              : ''}
          </div>
        </div>
      )}

      {/* Capturing indicator */}
      {isCapturing && (
        <div
          data-feedback-ui
          className="fixed inset-0 flex items-center justify-center z-[63] bg-black/50"
        >
          <div className="bg-neutral-800 border border-slate-600/30 rounded-2xl px-8 py-6 flex items-center gap-4">
            <div className="w-6 h-6 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-neutral-100 font-bold">Capturing element...</span>
          </div>
        </div>
      )}
    </>
  );

  return createPortal(overlay, document.body);
}
