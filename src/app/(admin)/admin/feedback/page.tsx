'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Filter,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  MapPin,
  Image,
  FileText,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Bug,
  Sparkles,
  HelpCircle,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { colors, statusColors } from '@/lib/design/tokens';
import type { FeedbackItem, FeedbackStatus, FeedbackCategory } from '@/lib/feedback/types';
import { categoryConfig, priorityConfig, statusConfig } from '@/lib/feedback/types';
import { getFeedbackItems, updateFeedback, deleteFeedback } from '@/lib/feedback/feedbackService';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

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

  const statusIcons: Record<FeedbackStatus, LucideIcon> = {
    new: AlertTriangle,
    'in-progress': Clock,
    resolved: CheckCircle,
    blocked: XCircle,
  };

  const categoryIcons: Record<FeedbackCategory, LucideIcon> = {
    bug: Bug,
    enhancement: Sparkles,
    question: HelpCircle,
    content: FileText,
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="admin-section"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Feedback
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Review and manage element-captured feedback
          </p>
        </div>
        <motion.button
          onClick={loadFeedback}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
            'bg-white dark:bg-neutral-900',
            'border border-neutral-200 dark:border-neutral-800',
            'text-neutral-700 dark:text-neutral-300',
            'hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-busy={loading}
          aria-label="Refresh feedback list"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} aria-hidden="true" />
          Refresh
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-5 gap-6" role="region" aria-label="Feedback statistics">
        <div className={cn(
          'p-5 rounded-xl border',
          'bg-white dark:bg-neutral-900',
          'border-neutral-200/60 dark:border-neutral-800/60'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.primary.bg)} aria-hidden="true">
              <MessageSquare className={cn('w-5 h-5', colors.primary.text)} />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className={cn(
          'p-5 rounded-xl border',
          'bg-white dark:bg-neutral-900',
          'border-neutral-200/60 dark:border-neutral-800/60'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.warning.bg)} aria-hidden="true">
              <AlertTriangle className={cn('w-5 h-5', colors.warning.text)} />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">New</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">{stats.new}</p>
            </div>
          </div>
        </div>

        <div className={cn(
          'p-5 rounded-xl border',
          'bg-white dark:bg-neutral-900',
          'border-neutral-200/60 dark:border-neutral-800/60'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.primary.bg)} aria-hidden="true">
              <Clock className={cn('w-5 h-5', colors.primary.text)} />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">In Progress</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className={cn(
          'p-5 rounded-xl border',
          'bg-white dark:bg-neutral-900',
          'border-neutral-200/60 dark:border-neutral-800/60'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.success.bg)} aria-hidden="true">
              <CheckCircle className={cn('w-5 h-5', colors.success.text)} />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Resolved</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">{stats.resolved}</p>
            </div>
          </div>
        </div>

        <div className={cn(
          'p-5 rounded-xl border',
          'bg-white dark:bg-neutral-900',
          'border-neutral-200/60 dark:border-neutral-800/60'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.error.bg)} aria-hidden="true">
              <XCircle className={cn('w-5 h-5', colors.error.text)} />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Blocked</p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">{stats.blocked}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Status:</span>
          <div className="flex gap-2" role="tablist" aria-label="Filter by status">
            {(['all', 'new', 'in-progress', 'resolved', 'blocked'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  filter === status
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                )}
                role="tab"
                aria-selected={filter === status}
              >
                {status === 'all' ? 'All' : statusConfig[status].label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Category:</span>
          <div className="flex gap-2" role="tablist" aria-label="Filter by category">
            {(['all', 'bug', 'enhancement', 'question', 'content'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  categoryFilter === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                )}
                role="tab"
                aria-selected={categoryFilter === cat}
                aria-label={cat === 'all' ? 'All categories' : cat}
              >
                {cat === 'all' ? 'All' : (() => {
                  const Icon = categoryIcons[cat];
                  return <Icon className="w-4 h-4" aria-hidden="true" />;
                })()}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Feedback List */}
      {loading ? (
        <div className="flex items-center justify-center py-12" aria-busy="true" aria-label="Loading feedback">
          <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin" aria-hidden="true" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className={cn(
          'flex flex-col items-center justify-center py-12 px-4',
          'rounded-xl border',
          'bg-white dark:bg-neutral-900',
          'border-neutral-200/60 dark:border-neutral-800/60'
        )}>
          <MessageSquare className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-4" aria-hidden="true" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">No feedback items found</p>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* List */}
          <div className="flex-1 space-y-3" role="list" aria-label="Feedback items">
            {filteredItems.map((item, index) => {
              const status = statusConfig[item.status];
              const category = categoryConfig[item.category];
              const priority = priorityConfig[item.priority];
              const StatusIcon = statusIcons[item.status];

              return (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setSelectedItem(item)}
                  className={cn(
                    'p-5 rounded-xl border cursor-pointer transition-all duration-200',
                    'bg-white dark:bg-neutral-900',
                    selectedItem?.id === item.id
                      ? cn('border-primary ring-2 ring-primary/20', colors.primary.border)
                      : 'border-neutral-200/60 dark:border-neutral-800/60 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm'
                  )}
                  aria-selected={selectedItem?.id === item.id}
                  tabIndex={0}
                  role="button"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn('admin-icon-container admin-icon-container-sm', status.color.replace('text-', 'bg-').replace(new RegExp('/\\d+$'), '/20'))} aria-hidden="true">
                      <StatusIcon className={cn('w-5 h-5', status.color.split(' ')[0])} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={cn('admin-badge', category.color)}>
                          {(() => {
                            const CategoryIcon = categoryIcons[item.category];
                            return <CategoryIcon className="w-3 h-3" aria-hidden="true" />;
                          })()}
                          {category.label}
                        </span>
                        <span className={cn('admin-badge', priority.color)}>
                          {priority.label}
                        </span>
                        <time className="text-xs text-neutral-400">
                          {new Date(item.created_at).toLocaleDateString()}
                        </time>
                      </div>
                      <h3 className="text-neutral-900 dark:text-white font-medium line-clamp-1">
                        {item.title || 'Untitled'}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" aria-hidden="true" />
                          {item.page_id}
                        </span>
                        {item.screenshot_url && (
                          <span className="flex items-center gap-1">
                            <Image className="w-3 h-3" aria-hidden="true" />
                            Screenshot
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          {/* Detail Panel */}
          <AnimatePresence mode="wait">
            {selectedItem && (
              <motion.aside
                key={selectedItem.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  'hidden lg:block w-[400px] overflow-hidden sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto',
                  'p-0 rounded-xl border',
                  'bg-white dark:bg-neutral-900',
                  'border-neutral-200/60 dark:border-neutral-800/60'
                )}
                role="complementary"
                aria-label="Feedback details"
              >
                {/* Header */}
                <header className="p-6 border-b border-neutral-200/60 dark:border-neutral-800/60">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('admin-icon-container admin-icon-container-sm', categoryConfig[selectedItem.category].color)} aria-hidden="true">
                        {(() => {
                          const CategoryIcon = categoryIcons[selectedItem.category];
                          return <CategoryIcon className="w-5 h-5" />;
                        })()}
                      </div>
                      <span className={cn('admin-badge', statusConfig[selectedItem.status].color)}>
                        {statusConfig[selectedItem.status].label}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      aria-label="Close details panel"
                    >
                      <X className="w-4 h-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
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
                </header>

                {/* Screenshot */}
                {selectedItem.screenshot_url && (
                  <div className="p-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
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
                <div className="p-4 border-b border-neutral-200/60 dark:border-neutral-800/60 space-y-3">
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
                      className={cn('flex items-center gap-2 text-sm hover:underline', colors.primary.text)}
                    >
                      <ExternalLink className="w-3 h-3" />
                      View page
                    </a>
                  )}
                </div>

                {/* Text Context */}
                {selectedItem.text_context && (
                  <div className="p-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
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
                            <span className="text-[10px] text-primary-500 uppercase">Clicked Element</span>
                            <pre className="mt-1 p-2 bg-primary-500/5 border border-primary-500/20 rounded text-xs text-primary-600 dark:text-primary-400 overflow-x-auto max-h-24 overflow-y-auto font-mono">
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
                <div className="p-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
                  <span className="text-xs font-medium text-neutral-500 uppercase mb-3 block">Change Status</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(['new', 'in-progress', 'resolved', 'blocked'] as FeedbackStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedItem.id, status)}
                        className={cn(
                          'px-3 py-2 text-sm font-medium rounded-lg transition-all',
                          selectedItem.status === status
                            ? cn(statusConfig[status].color, 'ring-1 ring-current')
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
                  <div className="p-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
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
                      'flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      confirmDelete === selectedItem.id
                        ? cn(colors.error.solid, 'text-white')
                        : cn(colors.error.text, colors.error.bg)
                    )}
                    aria-label={confirmDelete === selectedItem.id ? 'Confirm delete' : 'Delete feedback item'}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    {confirmDelete === selectedItem.id ? 'Click again to confirm' : 'Delete'}
                  </button>
                </div>
              </motion.aside>
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
    </motion.div>
  );
}
