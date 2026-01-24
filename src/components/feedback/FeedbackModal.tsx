'use client';

// =============================================================================
// Feedback Modal - Form for creating/editing feedback
// =============================================================================

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bug, Sparkles, HelpCircle, FileText, type LucideIcon } from 'lucide-react';
import { useFeedback } from '@/contexts/FeedbackContext';
import {
  categoryConfig,
  priorityConfig,
  type FeedbackCategory,
  type FeedbackPriority,
} from '@/lib/feedback/types';
import { formatTextContextPreview, isBrowser } from '@/lib/feedback';

// Icon mapping for categories
const categoryIcons: Record<FeedbackCategory, LucideIcon> = {
  bug: Bug,
  enhancement: Sparkles,
  question: HelpCircle,
  content: FileText,
};

export function FeedbackModal() {
  const { isModalOpen, closeModal, pendingCapture, createFeedback } = useFeedback();
  const [mounted, setMounted] = useState(false);

  // Form state
  const [category, setCategory] = useState<FeedbackCategory>('enhancement');
  const [priority, setPriority] = useState<FeedbackPriority>('medium');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTextContext, setShowTextContext] = useState(false);
  const [expandedScreenshot, setExpandedScreenshot] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setCategory('enhancement');
      setPriority('medium');
      setTitle('');
      setNotes('');
      setIncludeScreenshot(true);
      setShowTextContext(false);
    }
  }, [isModalOpen]);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createFeedback({
        category,
        priority,
        title: title.trim(),
        notes: notes.trim(),
        includeScreenshot,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || !isBrowser || !isModalOpen || !pendingCapture) return null;

  const modal = (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" data-feedback-ui>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={closeModal}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-neutral-800/50 border-b border-neutral-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-neutral-100">Leave Feedback</h2>
          <button
            onClick={closeModal}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Context Info */}
          <div className="bg-neutral-800/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-teal-400/50 uppercase tracking-wider">Location</span>
              <button
                type="button"
                onClick={() => setShowTextContext(!showTextContext)}
                className="text-[10px] text-cyan-400 hover:underline"
              >
                {showTextContext ? 'Hide text context' : 'Show text context'}
              </button>
            </div>
            <div className="text-sm text-neutral-100 font-mono">{pendingCapture.sectionPath}</div>
            {pendingCapture.componentName && (
              <div className="text-xs text-neutral-500">Component: {pendingCapture.componentName}</div>
            )}
            <div className="text-xs text-neutral-500">
              {formatTextContextPreview(pendingCapture.textContext)}
            </div>

            {/* Expandable text context */}
            {showTextContext && (
              <div className="mt-4 space-y-3">
                {pendingCapture.textContext.textBefore && (
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase">Text Before (50 lines)</span>
                    <pre className="mt-1 p-2 bg-black/30 rounded text-[10px] text-neutral-400 overflow-x-auto max-h-32 overflow-y-auto font-mono">
                      {pendingCapture.textContext.textBefore}
                    </pre>
                  </div>
                )}
                {pendingCapture.textContext.clickedText && (
                  <div>
                    <span className="text-[10px] text-cyan-400 uppercase">Clicked Element</span>
                    <pre className="mt-1 p-2 bg-cyan-500/10 border border-cyan-500/20 rounded text-[10px] text-cyan-300 overflow-x-auto max-h-20 overflow-y-auto font-mono">
                      {pendingCapture.textContext.clickedText}
                    </pre>
                  </div>
                )}
                {pendingCapture.textContext.textAfter && (
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase">Text After (50 lines)</span>
                    <pre className="mt-1 p-2 bg-black/30 rounded text-[10px] text-neutral-400 overflow-x-auto max-h-32 overflow-y-auto font-mono">
                      {pendingCapture.textContext.textAfter}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Screenshot Preview */}
          {pendingCapture.screenshot && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-teal-400/50 uppercase tracking-wider">Screenshot</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeScreenshot}
                    onChange={(e) => setIncludeScreenshot(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <span className="text-xs text-neutral-400">Include screenshot</span>
                </label>
              </div>
              {includeScreenshot && (
                <img
                  src={pendingCapture.screenshot}
                  alt="Screenshot of clicked area"
                  className="w-full max-h-48 object-contain rounded-xl border border-neutral-700 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setExpandedScreenshot(true)}
                  title="Click to expand"
                />
              )}

              {/* Expanded Screenshot Lightbox */}
              {expandedScreenshot && pendingCapture.screenshot && (
                <div
                  className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
                  onClick={() => setExpandedScreenshot(false)}
                >
                  <img
                    src={pendingCapture.screenshot}
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
            </div>
          )}

          {/* Category */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-teal-400/50 uppercase tracking-wider">Category</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(categoryConfig) as FeedbackCategory[]).map((cat) => {
                const config = categoryConfig[cat];
                const Icon = categoryIcons[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                      category === cat
                        ? `${config.color} ring-2 ring-offset-2 ring-offset-neutral-900 ring-current`
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-teal-400/50 uppercase tracking-wider">Priority</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(priorityConfig) as FeedbackPriority[]).map((pri) => {
                const config = priorityConfig[pri];
                return (
                  <button
                    key={pri}
                    type="button"
                    onClick={() => setPriority(pri)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                      priority === pri
                        ? `${config.color} ring-2 ring-offset-2 ring-offset-neutral-900 ring-current`
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-teal-400/50 uppercase tracking-wider">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the feedback..."
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50"
              required
              autoFocus
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-teal-400/50 uppercase tracking-wider">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detailed notes, suggestions, or context..."
              rows={4}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-700">
            <button
              type="button"
              onClick={closeModal}
              className="px-6 py-2.5 text-neutral-400 hover:text-neutral-200 font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="px-6 py-2.5 bg-cyan-500 text-neutral-900 font-bold rounded-xl hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Submit Feedback'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
