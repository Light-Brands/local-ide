'use client';

// =============================================================================
// Feedback Button - Consolidated floating feedback interface
// =============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { Bug, Sparkles, HelpCircle, FileText, type LucideIcon } from 'lucide-react';
import { useFeedback } from '@/contexts/FeedbackContext';
import {
  statusConfig,
  categoryConfig,
  priorityConfig,
  type FeedbackItem,
  type FeedbackCategory,
} from '@/lib/feedback/types';
import { FEEDBACK_ENABLED, isBrowser } from '@/lib/feedback';
import { FeedbackDetail } from './FeedbackDetail';

// Icon mapping for categories
const categoryIcons: Record<FeedbackCategory, LucideIcon> = {
  bug: Bug,
  enhancement: Sparkles,
  question: HelpCircle,
  content: FileText,
};

interface FeedbackButtonProps {
  onNavigate?: (pageId: string) => void;
}

export function FeedbackButton({ onNavigate }: FeedbackButtonProps) {
  // Don't render in production
  if (!FEEDBACK_ENABLED) return null;

  return <FeedbackButtonInner onNavigate={onNavigate} />;
}

function FeedbackButtonInner({ onNavigate }: FeedbackButtonProps) {
  const {
    feedbackMode,
    toggleFeedbackMode,
    newCount,
    toggleMarkers,
    showMarkers,
    items,
    currentPageId,
  } = useFeedback();

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'settings'>('list');
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [previewItem, setPreviewItem] = useState<FeedbackItem | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get feedback items for current page
  const pageFeedback = items.filter((item) => item.page_id === currentPageId);
  const allFeedback = items;

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close panel when entering feedback mode
  useEffect(() => {
    if (feedbackMode) {
      setIsOpen(false);
    }
  }, [feedbackMode]);

  // Scroll to feedback position
  const scrollToPosition = (item: FeedbackItem) => {
    if (!isBrowser) return;

    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    const targetY = (item.position.y / 100) * docHeight;

    window.scrollTo({
      top: targetY - window.innerHeight / 3,
      behavior: 'smooth',
    });

    // Flash the marker
    setTimeout(() => {
      const marker = document.querySelector(`[data-feedback-id="${item.id}"]`);
      if (marker) {
        marker.classList.add('animate-ping');
        setTimeout(() => marker.classList.remove('animate-ping'), 1000);
      }
    }, 500);
  };

  // Handle clicking on a feedback item - navigate and show detail
  const handleFeedbackClick = (item: FeedbackItem) => {
    setPreviewItem(null);
    setIsOpen(false);

    // Check if we need to navigate to a different page
    const needsNavigation = item.page_id !== currentPageId;

    if (needsNavigation && onNavigate) {
      // Navigate to the page first
      onNavigate(item.page_id);

      // Wait for navigation, then scroll and show detail
      setTimeout(() => {
        scrollToPosition(item);
        setTimeout(() => {
          setSelectedItem(item);
        }, 600);
      }, 300);
    } else {
      // Same page - just scroll and show detail
      scrollToPosition(item);
      setTimeout(() => {
        setSelectedItem(item);
      }, 600);
    }
  };

  // Handle main button click
  const handleMainClick = () => {
    if (feedbackMode) {
      toggleFeedbackMode();
    } else {
      setIsOpen(!isOpen);
    }
  };

  // Enter feedback mode from panel
  const handleEnterFeedbackMode = () => {
    setIsOpen(false);
    toggleFeedbackMode();
  };

  if (!mounted || !isBrowser) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50" data-feedback-ui ref={panelRef}>
      {/* Expanded Panel */}
      {isOpen && !feedbackMode && (
        <div className="absolute bottom-16 right-0 w-80 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden">
          {/* Panel Header */}
          <div className="bg-gradient-to-r from-primary-500/20 to-primary-600/10 px-4 py-3 border-b border-neutral-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Feedback</h3>
                  <p className="text-[10px] text-neutral-400">{allFeedback.length} total items</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-3 border-b border-neutral-800">
            <div className="grid grid-cols-2 gap-2">
              {/* Enter Feedback Mode */}
              <button
                onClick={handleEnterFeedbackMode}
                className="flex items-center gap-2 p-3 bg-slate-600/10 hover:bg-slate-600/20 border border-slate-600/30 rounded-xl transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" strokeDasharray="4 2" />
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="6" y2="12" />
                    <line x1="18" y1="12" x2="22" y2="12" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">Add Feedback</div>
                  <div className="text-[10px] text-neutral-500">Click anywhere</div>
                </div>
              </button>

              {/* Toggle Markers */}
              <button
                onClick={toggleMarkers}
                className={`flex items-center gap-2 p-3 rounded-xl transition-all group ${
                  showMarkers
                    ? 'bg-teal-500/10 border border-teal-500/30'
                    : 'bg-neutral-800 border border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${
                  showMarkers ? 'bg-teal-500/20' : 'bg-neutral-700'
                }`}>
                  <svg className={`w-4 h-4 ${showMarkers ? 'text-teal-400' : 'text-neutral-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showMarkers ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    )}
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">Markers</div>
                  <div className={`text-[10px] ${showMarkers ? 'text-teal-400' : 'text-neutral-500'}`}>
                    {showMarkers ? 'Visible' : 'Hidden'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-neutral-800">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === 'list'
                  ? 'text-slate-600 border-b-2 border-slate-600'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              This Page ({pageFeedback.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === 'settings'
                  ? 'text-slate-600 border-b-2 border-slate-600'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All ({allFeedback.length})
            </button>
          </div>

          {/* Content Area */}
          <div className="max-h-64 overflow-y-auto">
            {activeTab === 'list' ? (
              // This Page Tab
              pageFeedback.length > 0 ? (
                <div className="p-2 space-y-1">
                  {pageFeedback.map((item) => {
                    const status = statusConfig[item.status];
                    const category = categoryConfig[item.category];
                    return (
                      <div key={item.id} className="relative">
                        <button
                          onClick={() => handleFeedbackClick(item)}
                          onMouseEnter={() => setPreviewItem(item)}
                          onMouseLeave={() => setPreviewItem(null)}
                          className="w-full text-left p-3 rounded-xl hover:bg-neutral-800 transition-colors group"
                        >
                          <div className="flex items-start gap-2">
                            {(() => { const Icon = categoryIcons[item.category]; return <Icon className="w-5 h-5 shrink-0" />; })()}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${status.color}`}>
                                  {status.label}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${priorityConfig[item.priority].color}`}>
                                  {priorityConfig[item.priority].label}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-neutral-200 group-hover:text-slate-600 transition-colors truncate">
                                {item.title}
                              </p>
                              {item.notes && (
                                <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                                  {item.notes.slice(0, 60)}{item.notes.length > 60 ? '...' : ''}
                                </p>
                              )}
                            </div>
                            <svg className="w-4 h-4 text-neutral-600 group-hover:text-slate-600 transition-colors shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="text-3xl mb-2">📭</div>
                  <p className="text-sm font-bold text-neutral-300">No feedback on this page</p>
                  <p className="text-xs text-neutral-500 mt-1">Click "Add Feedback" to get started</p>
                </div>
              )
            ) : (
              // All Feedback Tab
              allFeedback.length > 0 ? (
                <div className="p-2 space-y-1">
                  {allFeedback.slice(0, 10).map((item) => {
                    const status = statusConfig[item.status];
                    const category = categoryConfig[item.category];
                    return (
                      <div key={item.id} className="relative">
                        <button
                          onClick={() => handleFeedbackClick(item)}
                          onMouseEnter={() => setPreviewItem(item)}
                          onMouseLeave={() => setPreviewItem(null)}
                          className="w-full text-left p-3 rounded-xl hover:bg-neutral-800 transition-colors group"
                        >
                          <div className="flex items-start gap-2">
                            {(() => { const Icon = categoryIcons[item.category]; return <Icon className="w-5 h-5 shrink-0" />; })()}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${status.color}`}>
                                  {status.label}
                                </span>
                                <span className="text-[9px] text-neutral-500 capitalize bg-neutral-800 px-1.5 py-0.5 rounded">
                                  {item.page_id}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-neutral-200 group-hover:text-slate-600 transition-colors truncate">
                                {item.title}
                              </p>
                              {item.notes && (
                                <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                                  {item.notes.slice(0, 50)}{item.notes.length > 50 ? '...' : ''}
                                </p>
                              )}
                            </div>
                            <svg className="w-4 h-4 text-neutral-600 group-hover:text-slate-600 transition-colors shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                  {allFeedback.length > 10 && (
                    <div className="text-center py-2 text-xs text-neutral-500">
                      +{allFeedback.length - 10} more items
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="text-3xl mb-2">✨</div>
                  <p className="text-sm font-bold text-neutral-300">No feedback yet</p>
                  <p className="text-xs text-neutral-500 mt-1">Start collecting feedback today</p>
                </div>
              )
            )}
          </div>

          {/* Panel Footer */}
          <div className="p-3 border-t border-neutral-800 bg-neutral-800/30">
            <div className="flex items-center justify-between text-[10px] text-neutral-500">
              <span>Press ESC to close</span>
              <span>{newCount > 0 ? `${newCount} new` : 'All reviewed'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Floating Button */}
      <button
        onClick={handleMainClick}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
          feedbackMode
            ? 'bg-cyan-500 text-neutral-900 scale-110 ring-4 ring-cyan-500/30'
            : isOpen
            ? 'bg-slate-600 text-neutral-900 scale-105 ring-4 ring-slate-600/30'
            : 'bg-slate-600 text-neutral-900 hover:scale-105 hover:shadow-2xl'
        }`}
        title={feedbackMode ? 'Exit feedback mode (ESC)' : 'Open feedback panel'}
      >
        {/* Icon */}
        {feedbackMode ? (
          // X icon when in feedback mode
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : isOpen ? (
          // Chevron down when panel is open
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          // Message icon when closed
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        )}

        {/* Badge for new feedback count */}
        {newCount > 0 && !feedbackMode && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {newCount > 9 ? '9+' : newCount}
          </span>
        )}

        {/* Markers indicator dot */}
        {showMarkers && !feedbackMode && !isOpen && (
          <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-teal-400 rounded-full border-2 border-neutral-900" />
        )}
      </button>

      {/* Active feedback mode indicator */}
      {feedbackMode && (
        <div className="absolute -top-12 right-0 bg-cyan-500/20 text-cyan-400 text-xs font-bold px-3 py-1.5 rounded-full border border-cyan-500/30 whitespace-nowrap animate-pulse backdrop-blur-sm">
          ✨ Click anywhere to add feedback
        </div>
      )}

      {/* Preview Panel (shows on hover) */}
      {previewItem && isOpen && (
        <div className="absolute bottom-16 right-[340px] w-72 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden pointer-events-none">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{categoryConfig[previewItem.category].icon}</span>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white truncate">{previewItem.title}</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${statusConfig[previewItem.status].color}`}>
                    {statusConfig[previewItem.status].label}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${priorityConfig[previewItem.priority].color}`}>
                    {priorityConfig[previewItem.priority].label}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes preview */}
            {previewItem.notes && (
              <div className="mb-3">
                <div className="text-[9px] text-neutral-500 uppercase mb-1">Notes</div>
                <p className="text-xs text-neutral-300 line-clamp-3">{previewItem.notes}</p>
              </div>
            )}

            {/* Screenshot thumbnail */}
            {previewItem.screenshot_url && (
              <div className="mb-3">
                <div className="text-[9px] text-neutral-500 uppercase mb-1">Screenshot</div>
                <img
                  src={previewItem.screenshot_url}
                  alt="Preview"
                  className="w-full h-24 object-cover rounded-lg border border-neutral-700"
                />
              </div>
            )}

            {/* Location */}
            <div className="text-[9px] text-neutral-500">
              <span className="capitalize">{previewItem.page_id}</span>
              <span className="mx-1">•</span>
              <span className="truncate">{previewItem.section_path}</span>
            </div>

            {/* Click hint */}
            <div className="mt-3 pt-3 border-t border-neutral-800 text-center">
              <span className="text-[10px] text-slate-600">Click to navigate & view details →</span>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Detail Modal */}
      {selectedItem && (
        <FeedbackDetail
          feedback={selectedItem}
          onClose={() => setSelectedItem(null)}
          onNavigate={() => scrollToPosition(selectedItem)}
        />
      )}
    </div>
  );
}
