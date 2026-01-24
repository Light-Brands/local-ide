'use client';

// =============================================================================
// Feedback Detail - Full detail view and edit modal
// =============================================================================

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bug, Sparkles, HelpCircle, FileText, type LucideIcon } from 'lucide-react';
import { useFeedback } from '@/contexts/FeedbackContext';
import {
  categoryConfig,
  priorityConfig,
  statusConfig,
  type FeedbackItem,
  type FeedbackStatus,
  type FeedbackCategory,
} from '@/lib/feedback/types';
import { isBrowser } from '@/lib/feedback';

// Icon mapping for categories
const categoryIcons: Record<FeedbackCategory, LucideIcon> = {
  bug: Bug,
  enhancement: Sparkles,
  question: HelpCircle,
  content: FileText,
};

interface FeedbackDetailProps {
  feedback: FeedbackItem;
  onClose: () => void;
  onNavigate?: () => void;
}

export function FeedbackDetail({ feedback, onClose, onNavigate }: FeedbackDetailProps) {
  const { updateFeedback, deleteFeedback } = useFeedback();
  const [mounted, setMounted] = useState(false);

  const [status, setStatus] = useState<FeedbackStatus>(feedback.status);
  const [resolution, setResolution] = useState(feedback.resolution || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showTextContext, setShowTextContext] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expandedScreenshot, setExpandedScreenshot] = useState(false);

  const category = categoryConfig[feedback.category];
  const priority = priorityConfig[feedback.priority];

  const createdDate = new Date(feedback.created_at).toLocaleString();
  const updatedDate = new Date(feedback.updated_at).toLocaleString();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStatusChange = async (newStatus: FeedbackStatus) => {
    setStatus(newStatus);
    setIsUpdating(true);
    try {
      const updates: Partial<FeedbackItem> = { status: newStatus };
      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
        updates.resolution = resolution;
      }
      await updateFeedback(feedback.id, updates);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveResolution = async () => {
    setIsUpdating(true);
    try {
      await updateFeedback(feedback.id, { resolution });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteFeedback(feedback.id);
    onClose();
  };

  if (!mounted || !isBrowser) return null;

  const modal = (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-neutral-900 border border-neutral-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-neutral-800/50 border-b border-neutral-700 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {(() => { const Icon = categoryIcons[feedback.category]; return <Icon className="w-6 h-6 text-neutral-300" />; })()}
            <div>
              <h2 className="text-lg font-black text-neutral-100">{feedback.title}</h2>
              <div className="text-xs text-neutral-400">{feedback.section_path}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & Meta */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Status selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-500 uppercase">Status:</span>
              <div className="flex gap-1">
                {(Object.keys(statusConfig) as FeedbackStatus[]).map((s) => {
                  const config = statusConfig[s];
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={isUpdating}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        status === s
                          ? `${config.color} ring-1 ring-current`
                          : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'
                      }`}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <span className={`px-2 py-1 rounded text-[10px] font-bold ${category.color}`}>
              {category.label}
            </span>
            <span className={`px-2 py-1 rounded text-[10px] font-bold ${priority.color}`}>
              {priority.label}
            </span>
          </div>

          {/* Notes */}
          {feedback.notes && (
            <div className="bg-neutral-800/50 rounded-xl p-4">
              <span className="text-[10px] font-black text-teal-400/50 uppercase tracking-wider">Notes</span>
              <p className="mt-2 text-sm text-neutral-300 whitespace-pre-wrap">{feedback.notes}</p>
            </div>
          )}

          {/* Resolution */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-teal-400/50 uppercase tracking-wider">Resolution Notes</span>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              onBlur={handleSaveResolution}
              placeholder="Add notes when resolving this feedback..."
              rows={3}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 resize-none"
            />
          </div>

          {/* Screenshot */}
          {feedback.screenshot_url && (
            <div className="space-y-2">
              <span className="text-[10px] font-black text-teal-400/50 uppercase tracking-wider">Screenshot</span>
              <img
                src={feedback.screenshot_url}
                alt="Feedback screenshot"
                className="w-full max-h-64 object-contain rounded-xl border border-neutral-700 bg-black/30 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setExpandedScreenshot(true)}
                title="Click to expand"
              />
            </div>
          )}

          {/* Expanded Screenshot Lightbox */}
          {expandedScreenshot && feedback.screenshot_url && (
            <div
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
              onClick={() => setExpandedScreenshot(false)}
            >
              <img
                src={feedback.screenshot_url}
                alt="Screenshot expanded"
                className="max-w-full max-h-full object-contain rounded-xl"
              />
              <button
                className="absolute top-4 right-4 w-10 h-10 bg-neutral-700 hover:bg-neutral-600 rounded-full flex items-center justify-center text-white transition-colors"
                onClick={() => setExpandedScreenshot(false)}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Text Context */}
          <div className="space-y-2">
            <button
              onClick={() => setShowTextContext(!showTextContext)}
              className="flex items-center gap-2 text-[10px] font-black text-teal-400/50 uppercase tracking-wider hover:text-teal-400 transition-colors"
            >
              <span>{showTextContext ? '▼' : '▶'}</span>
              Text Context (+/- 50 lines)
            </button>

            {showTextContext && (
              <div className="bg-neutral-800/50 rounded-xl p-4 space-y-4">
                {/* Element Info */}
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className="px-2 py-0.5 bg-neutral-700 rounded text-neutral-400">
                    &lt;{feedback.text_context.elementTag}&gt;
                  </span>
                  {feedback.text_context.elementId && (
                    <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded">
                      #{feedback.text_context.elementId}
                    </span>
                  )}
                  {feedback.text_context.elementClasses.slice(0, 3).map((cls, i) => (
                    <span key={i} className="px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded">
                      .{cls}
                    </span>
                  ))}
                </div>

                {/* Clicked Text */}
                {feedback.text_context.clickedText && (
                  <div>
                    <span className="text-[10px] text-cyan-400 uppercase">Clicked Element</span>
                    <pre className="mt-1 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg text-xs text-cyan-300 overflow-x-auto max-h-32 overflow-y-auto font-mono">
                      {feedback.text_context.clickedText}
                    </pre>
                  </div>
                )}

                {/* Text Before */}
                {feedback.text_context.textBefore && (
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase">50 Lines Before</span>
                    <pre className="mt-1 p-3 bg-black/30 rounded-lg text-xs text-neutral-400 overflow-x-auto max-h-48 overflow-y-auto font-mono">
                      {feedback.text_context.textBefore}
                    </pre>
                  </div>
                )}

                {/* Text After */}
                {feedback.text_context.textAfter && (
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase">50 Lines After</span>
                    <pre className="mt-1 p-3 bg-black/30 rounded-lg text-xs text-neutral-400 overflow-x-auto max-h-48 overflow-y-auto font-mono">
                      {feedback.text_context.textAfter}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="text-[10px] text-neutral-500 space-y-1">
            <div>Created: {createdDate}</div>
            <div>Updated: {updatedDate}</div>
            {feedback.resolved_at && (
              <div>Resolved: {new Date(feedback.resolved_at).toLocaleString()}</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-800/30 border-t border-neutral-700 px-6 py-4 flex items-center justify-between shrink-0">
          {/* Left actions */}
          <div className="flex items-center gap-2">
            {/* Delete button */}
            <button
              onClick={handleDelete}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                confirmDelete
                  ? 'bg-red-500 text-white'
                  : 'bg-neutral-800 text-red-400 hover:bg-red-500/10'
              }`}
            >
              {confirmDelete ? 'Click again to confirm' : 'Delete'}
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Navigate to location button */}
            {onNavigate && (
              <button
                onClick={() => {
                  onClose();
                  onNavigate();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 font-bold rounded-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Go to Location</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-6 py-2 bg-cyan-500 text-neutral-900 font-bold rounded-lg hover:bg-cyan-400 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
