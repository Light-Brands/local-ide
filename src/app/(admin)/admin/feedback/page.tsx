'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Filter,
  MoreHorizontal,
  Trash2,
  Check,
  Archive,
  ExternalLink,
  MapPin,
  Image,
  FileText,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeedbackItem, FeedbackStatus, FeedbackCategory } from '@/lib/feedback/types';
import { categoryConfig, priorityConfig, statusConfig } from '@/lib/feedback/types';
import { getFeedbackItems, updateFeedback, deleteFeedback } from '@/lib/feedback/feedbackService';

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | FeedbackStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | FeedbackCategory>('all');
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [expandedScreenshot, setExpandedScreenshot] = useState(false);
  const [showTextContext, setShowTextContext] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Load feedback items
  const loadFeedback = async () => {
    setLoading(true);
    try {
      const data = await getFeedbackItems();
      setItems(data);
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesStatus = filter === 'all' || item.status === filter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  // Stats
  const stats = {
    total: items.length,
    new: items.filter((f) => f.status === 'new').length,
    inProgress: items.filter((f) => f.status === 'in-progress').length,
    resolved: items.filter((f) => f.status === 'resolved').length,
    blocked: items.filter((f) => f.status === 'blocked').length,
  };

  // Handle status change
  const handleStatusChange = async (id: string, status: FeedbackStatus) => {
    const updates: Partial<FeedbackItem> = { status };
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }
    await updateFeedback(id, updates);
    await loadFeedback();
    if (selectedItem?.id === id) {
      setSelectedItem((prev) => (prev ? { ...prev, status, resolved_at: updates.resolved_at } : null));
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    await deleteFeedback(id);
    await loadFeedback();
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
    setConfirmDelete(null);
  };

  const statusIcons = {
    new: AlertTriangle,
    'in-progress': Clock,
    resolved: CheckCircle,
    blocked: XCircle,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Feedback</h1>
          <p className="text-neutral-500 mt-1">
            Review and manage element-captured feedback
          </p>
        </div>
        <button
          onClick={loadFeedback}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/10 to-secondary-500/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Total</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">
                {stats.total}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">New</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">
                {stats.new}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">In Progress</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">
                {stats.inProgress}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Resolved</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">
                {stats.resolved}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Blocked</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">
                {stats.blocked}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400" />
          <span className="text-sm text-neutral-500">Status:</span>
          {(['all', 'new', 'in-progress', 'resolved', 'blocked'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-xl transition-all duration-200 capitalize',
                filter === status
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              )}
            >
              {status === 'all' ? 'All' : statusConfig[status].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Category:</span>
          {(['all', 'bug', 'enhancement', 'question', 'content'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-xl transition-all duration-200',
                categoryFilter === cat
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              )}
            >
              {cat === 'all' ? 'All' : categoryConfig[cat].icon}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-500">No feedback items found</p>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* List */}
          <div className="flex-1 space-y-3">
            {filteredItems.map((item, index) => {
              const status = statusConfig[item.status];
              const category = categoryConfig[item.category];
              const priority = priorityConfig[item.priority];
              const StatusIcon = statusIcons[item.status];

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setSelectedItem(item)}
                  className={cn(
                    'bg-white dark:bg-neutral-900 rounded-2xl border p-4 cursor-pointer transition-all duration-200',
                    selectedItem?.id === item.id
                      ? 'border-primary-500 ring-2 ring-primary-500/20'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', status.color.replace('text-', 'bg-').replace(/\/\d+$/, '/20'))}>
                      <StatusIcon className={cn('w-5 h-5', status.color.split(' ')[0])} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', category.color)}>
                          {category.icon} {category.label}
                        </span>
                        <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', priority.color)}>
                          {priority.label}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-neutral-900 dark:text-white font-medium line-clamp-1">
                        {item.title || 'Untitled'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.page_id}
                        </span>
                        {item.screenshot_url && (
                          <span className="flex items-center gap-1">
                            <Image className="w-3 h-3" />
                            Screenshot
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Detail Panel */}
          <AnimatePresence mode="wait">
            {selectedItem && (
              <motion.div
                key={selectedItem.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="hidden lg:block w-[400px] bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto"
              >
                {/* Header */}
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{categoryConfig[selectedItem.category].icon}</span>
                      <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', statusConfig[selectedItem.status].color)}>
                        {statusConfig[selectedItem.status].label}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                    >
                      <MoreHorizontal className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                    {selectedItem.title || 'Untitled'}
                  </h3>
                  {selectedItem.notes && (
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                      {selectedItem.notes}
                    </p>
                  )}
                </div>

                {/* Screenshot */}
                {selectedItem.screenshot_url && (
                  <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-neutral-500 uppercase">Screenshot</span>
                    </div>
                    <img
                      src={selectedItem.screenshot_url}
                      alt="Feedback screenshot"
                      className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setExpandedScreenshot(true)}
                    />
                  </div>
                )}

                {/* Location Details */}
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Page</span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                      {selectedItem.page_id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Section</span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white truncate ml-4">
                      {selectedItem.section_path || '-'}
                    </span>
                  </div>
                  {selectedItem.component_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-500">Component</span>
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">
                        {selectedItem.component_name}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Priority</span>
                    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', priorityConfig[selectedItem.priority].color)}>
                      {priorityConfig[selectedItem.priority].label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Created</span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                      {new Date(selectedItem.created_at).toLocaleString()}
                    </span>
                  </div>
                  {selectedItem.page_url && (
                    <a
                      href={selectedItem.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary-500 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View page
                    </a>
                  )}
                </div>

                {/* Text Context */}
                {selectedItem.text_context && (
                  <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <button
                      onClick={() => setShowTextContext(!showTextContext)}
                      className="flex items-center gap-2 text-xs font-medium text-neutral-500 uppercase hover:text-neutral-700 dark:hover:text-neutral-300"
                    >
                      <FileText className="w-3 h-3" />
                      {showTextContext ? 'Hide' : 'Show'} Text Context
                    </button>
                    {showTextContext && (
                      <div className="mt-3 space-y-3">
                        {selectedItem.text_context.clickedText && (
                          <div>
                            <span className="text-[10px] text-cyan-500 uppercase">Clicked Element</span>
                            <pre className="mt-1 p-2 bg-cyan-500/5 border border-cyan-500/20 rounded text-xs text-cyan-600 dark:text-cyan-400 overflow-x-auto max-h-24 overflow-y-auto font-mono">
                              {selectedItem.text_context.clickedText}
                            </pre>
                          </div>
                        )}
                        {selectedItem.text_context.textBefore && (
                          <div>
                            <span className="text-[10px] text-neutral-400 uppercase">Before</span>
                            <pre className="mt-1 p-2 bg-neutral-100 dark:bg-neutral-800 rounded text-xs text-neutral-600 dark:text-neutral-400 overflow-x-auto max-h-24 overflow-y-auto font-mono">
                              {selectedItem.text_context.textBefore}
                            </pre>
                          </div>
                        )}
                        {selectedItem.text_context.textAfter && (
                          <div>
                            <span className="text-[10px] text-neutral-400 uppercase">After</span>
                            <pre className="mt-1 p-2 bg-neutral-100 dark:bg-neutral-800 rounded text-xs text-neutral-600 dark:text-neutral-400 overflow-x-auto max-h-24 overflow-y-auto font-mono">
                              {selectedItem.text_context.textAfter}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Status Actions */}
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                  <span className="text-xs font-medium text-neutral-500 uppercase mb-3 block">Change Status</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(['new', 'in-progress', 'resolved', 'blocked'] as FeedbackStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedItem.id, status)}
                        className={cn(
                          'px-3 py-2 text-sm font-medium rounded-lg transition-all',
                          selectedItem.status === status
                            ? statusConfig[status].color + ' ring-1 ring-current'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        )}
                      >
                        {statusConfig[status].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution */}
                {selectedItem.resolution && (
                  <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <span className="text-xs font-medium text-neutral-500 uppercase mb-2 block">Resolution</span>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{selectedItem.resolution}</p>
                    {selectedItem.resolved_at && (
                      <p className="text-xs text-neutral-400 mt-2">
                        Resolved: {new Date(selectedItem.resolved_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Delete Action */}
                <div className="p-4">
                  <button
                    onClick={() => handleDelete(selectedItem.id)}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors',
                      confirmDelete === selectedItem.id
                        ? 'bg-red-500 text-white'
                        : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                    {confirmDelete === selectedItem.id ? 'Click again to confirm' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Expanded Screenshot Modal */}
      {expandedScreenshot && selectedItem?.screenshot_url && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setExpandedScreenshot(false)}
        >
          <img
            src={selectedItem.screenshot_url}
            alt="Screenshot expanded"
            className="max-w-full max-h-full object-contain rounded-xl"
          />
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            onClick={() => setExpandedScreenshot(false)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
