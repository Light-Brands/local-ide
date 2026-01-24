'use client';

// =============================================================================
// Feedback Preview - Hover card showing feedback summary
// =============================================================================

import React from 'react';
import { Bug, Sparkles, HelpCircle, FileText, type LucideIcon } from 'lucide-react';
import {
  categoryConfig,
  priorityConfig,
  statusConfig,
  type FeedbackItem,
  type FeedbackCategory,
} from '@/lib/feedback/types';

// Icon mapping for categories
const categoryIcons: Record<FeedbackCategory, LucideIcon> = {
  bug: Bug,
  enhancement: Sparkles,
  question: HelpCircle,
  content: FileText,
};

interface FeedbackPreviewProps {
  feedback: FeedbackItem;
}

export function FeedbackPreview({ feedback }: FeedbackPreviewProps) {
  const category = categoryConfig[feedback.category];
  const priority = priorityConfig[feedback.priority];
  const status = statusConfig[feedback.status];

  const createdDate = new Date(feedback.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="w-72 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden pointer-events-none">
      {/* Header */}
      <div className="bg-neutral-800/50 px-3 py-2 flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${status.color}`}>
          {status.label}
        </span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${priority.color}`}>
          {priority.label}
        </span>
        <span className="text-[10px] text-neutral-400 ml-auto">{createdDate}</span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <div className="flex items-start gap-2">
          {(() => { const Icon = categoryIcons[feedback.category]; return <Icon className="w-4 h-4 text-neutral-300 shrink-0 mt-0.5" />; })()}
          <h4 className="text-sm font-bold text-neutral-100 line-clamp-2">{feedback.title}</h4>
        </div>

        {/* Notes preview */}
        {feedback.notes && (
          <p className="text-xs text-neutral-400 line-clamp-2">{feedback.notes}</p>
        )}

        {/* Location */}
        <div className="text-[10px] text-teal-400/50 truncate">
          {feedback.section_path}
        </div>

        {/* Screenshot thumbnail */}
        {feedback.screenshot_url && (
          <div className="mt-2">
            <img
              src={feedback.screenshot_url}
              alt="Feedback screenshot"
              className="w-full h-20 object-cover rounded border border-neutral-700"
            />
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="bg-neutral-800/30 px-3 py-1.5 text-center">
        <span className="text-[10px] text-neutral-500">Click to view details</span>
      </div>
    </div>
  );
}
