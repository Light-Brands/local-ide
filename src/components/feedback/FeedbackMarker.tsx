'use client';

// =============================================================================
// Feedback Marker - Visual pin showing where feedback was left
// =============================================================================

import React, { useState } from 'react';
import { statusConfig, type FeedbackItem } from '@/lib/feedback/types';
import { FeedbackPreview } from './FeedbackPreview';

interface FeedbackMarkerProps {
  feedback: FeedbackItem;
  onClick?: () => void;
}

export function FeedbackMarker({ feedback, onClick }: FeedbackMarkerProps) {
  const [showPreview, setShowPreview] = useState(false);
  const status = statusConfig[feedback.status];

  // Calculate position based on stored percentages
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${feedback.position.x}%`,
    top: `${feedback.position.y}%`,
    transform: 'translate(-50%, -100%)', // Pin points to the click location
    zIndex: 40,
  };

  return (
    <div
      style={style}
      className="group"
      data-feedback-id={feedback.id}
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      {/* Pin Icon */}
      <button
        onClick={onClick}
        className={`relative w-6 h-8 transition-all duration-200 group-hover:scale-125 ${
          feedback.status === 'new' ? 'animate-pulse' : ''
        }`}
      >
        {/* Pin shape - SVG */}
        <svg
          viewBox="0 0 24 32"
          fill="currentColor"
          className={`w-full h-full drop-shadow-lg ${
            feedback.status === 'new'
              ? 'text-slate-600'
              : feedback.status === 'in-progress'
              ? 'text-cyan-500'
              : feedback.status === 'resolved'
              ? 'text-emerald-500'
              : 'text-red-500'
          }`}
        >
          <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" />
          <circle cx="12" cy="12" r="5" fill="currentColor" className="opacity-30" />
        </svg>

        {/* Status indicator dot */}
        <div
          className={`absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${status.markerColor} ${
            feedback.status === 'new' ? 'animate-ping' : ''
          }`}
        />

        {/* Category icon */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[8px]">
          {feedback.category === 'bug' && '🐛'}
          {feedback.category === 'enhancement' && '✨'}
          {feedback.category === 'question' && '❓'}
          {feedback.category === 'content' && '📝'}
        </div>
      </button>

      {/* Preview on hover */}
      {showPreview && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2">
          <FeedbackPreview feedback={feedback} />
        </div>
      )}
    </div>
  );
}
