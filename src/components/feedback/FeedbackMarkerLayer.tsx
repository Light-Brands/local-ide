'use client';

// =============================================================================
// Feedback Marker Layer - Container for all markers on the current page
// =============================================================================

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFeedback } from '@/contexts/FeedbackContext';
import { FeedbackMarker } from './FeedbackMarker';
import { FeedbackDetail } from './FeedbackDetail';
import { isBrowser } from '@/lib/feedback';

export function FeedbackMarkerLayer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server or before mount
  if (!isBrowser || !mounted) return null;

  return <FeedbackMarkerLayerInner />;
}

function FeedbackMarkerLayerInner() {
  const { pageItems, showMarkers, feedbackMode, setSelectedFeedback, selectedFeedbackId } =
    useFeedback();

  // Don't show markers in feedback mode (overlay is active)
  if (feedbackMode || !showMarkers) return null;

  // Get selected feedback item if any
  const selectedFeedback = selectedFeedbackId
    ? pageItems.find((f) => f.id === selectedFeedbackId)
    : null;

  const layer = (
    <>
      {/* Markers container - positioned relative to document */}
      <div
        className="fixed inset-0 pointer-events-none z-30"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <div className="relative w-full h-full">
          {pageItems.map((feedback) => (
            <div key={feedback.id} className="pointer-events-auto">
              <FeedbackMarker
                feedback={feedback}
                onClick={() => setSelectedFeedback(feedback.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Detail modal for selected feedback */}
      {selectedFeedback && (
        <FeedbackDetail
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
        />
      )}
    </>
  );

  return createPortal(layer, document.body);
}
