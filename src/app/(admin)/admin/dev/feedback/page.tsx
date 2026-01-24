'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug,
  Sparkles,
  HelpCircle,
  FileText,
  Search,
  Plus,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  XCircle,
  ArrowRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { statusColors, colors, categoryColors, priorityColors } from '@/lib/design/tokens';

// Animation config
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } 
  },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

// Types
type FeedbackCategory = 'bug' | 'enhancement' | 'question' | 'content';
type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';
type FeedbackStatus = 'new' | 'in-progress' | 'resolved' | 'blocked';

interface FeedbackItem {
  id: string;
  title: string;
  notes: string;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  page: string;
  sectionPath: string;
  createdAt: string;
  screenshot?: string;
}

// Demo data
const demoFeedback: FeedbackItem[] = [
  {
    id: '1',
    title: 'Dashboard stats not updating',
    notes: 'The user count on the main dashboard is not reflecting new signups in real-time.',
    category: 'bug',
    priority: 'high',
    status: 'in-progress',
    page: 'Admin Dashboard',
    sectionPath: 'Dashboard > Stats Grid',
    createdAt: '2026-01-22T10:30:00Z',
  },
  {
    id: '2',
    title: 'Add dark mode toggle to settings',
    notes: 'Would be nice to have a more prominent dark mode toggle in the settings page.',
    category: 'enhancement',
    priority: 'medium',
    status: 'new',
    page: 'Settings',
    sectionPath: 'Settings > Appearance',
    createdAt: '2026-01-21T14:20:00Z',
  },
  {
    id: '3',
    title: 'How to configure Supabase?',
    notes: 'Need documentation on how to set up Supabase connection for the admin panel.',
    category: 'question',
    priority: 'low',
    status: 'resolved',
    page: 'Setup',
    sectionPath: 'Setup > Database',
    createdAt: '2026-01-20T09:15:00Z',
  },
  {
    id: '4',
    title: 'Media library upload fails',
    notes: 'Large files (>5MB) fail to upload with no error message displayed.',
    category: 'bug',
    priority: 'critical',
    status: 'blocked',
    page: 'Media Library',
    sectionPath: 'Media > Upload Zone',
    createdAt: '2026-01-19T16:45:00Z',
  },
  {
    id: '5',
    title: 'Update content editor placeholder',
    notes: 'The placeholder text in the content editor could be more helpful.',
    category: 'content',
    priority: 'low',
    status: 'new',
    page: 'Content',
    sectionPath: 'Content > Editor',
    createdAt: '2026-01-18T11:00:00Z',
  },
];

// Category config - using design tokens
const categoryConfig: Record<FeedbackCategory, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  bug: { label: 'Bug', icon: Bug, color: colors.error.text, bg: colors.error.bg },
  enhancement: { label: 'Enhancement', icon: Sparkles, color: colors.primary.text, bg: colors.primary.bg },
  question: { label: 'Question', icon: HelpCircle, color: colors.warning.text, bg: colors.warning.bg },
  content: { label: 'Content', icon: FileText, color: colors.neutral.text, bg: colors.neutral.bg },
};

// Priority config - using design tokens
const priorityConfig: Record<FeedbackPriority, { label: string; color: string; dot: string }> = {
  low: { label: 'Low', color: 'text-neutral-500 dark:text-neutral-400', dot: 'bg-neutral-400 dark:bg-neutral-500' },
  medium: { label: 'Medium', color: colors.primary.text, dot: colors.primary.solid },
  high: { label: 'High', color: colors.warning.text, dot: colors.warning.solid },
  critical: { label: 'Critical', color: colors.error.text, dot: colors.error.solid },
};

// Status config - using design tokens
const statusConfig: Record<FeedbackStatus, { label: string; icon: React.ElementType; color: string }> = {
  new: { label: 'New', icon: Circle, color: colors.warning.text },
  'in-progress': { label: 'In Progress', icon: AlertCircle, color: colors.primary.text },
  resolved: { label: 'Resolved', icon: CheckCircle2, color: colors.success.text },
  blocked: { label: 'Blocked', icon: XCircle, color: colors.error.text },
};

export default function DevFeedbackPage() {
  const [items] = useState<FeedbackItem[]>(demoFeedback);
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);

  // Filter items
  const filteredItems = items.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.notes.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Calculate stats
  const stats = {
    total: items.length,
    new: items.filter(i => i.status === 'new').length,
    inProgress: items.filter(i => i.status === 'in-progress').length,
    resolved: items.filter(i => i.status === 'resolved').length,
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight font-mono">
              FEEDBACK
            </h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1 ml-4 text-sm font-mono">
            [ISSUE_TRACKER] Development feedback system
          </p>
        </div>
        <button
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium font-mono uppercase',
            'bg-primary text-primary-foreground',
            'hover:bg-primary-hover transition-colors'
          )}
        >
          <Plus className="w-4 h-4" />
          NEW
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-4 gap-3">
        {[
          { label: 'TOTAL', value: stats.total, color: 'text-neutral-900 dark:text-white' },
          { label: 'NEW', value: stats.new, color: colors.warning.text },
          { label: 'IN_PROGRESS', value: stats.inProgress, color: colors.primary.text },
          { label: 'RESOLVED', value: stats.resolved, color: colors.success.text },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'p-4 rounded-xl border',
              'bg-white dark:bg-neutral-900',
              'border-neutral-200/60 dark:border-neutral-800/60'
            )}
          >
            <div className={cn('text-2xl font-bold font-mono tabular-nums', stat.color)}>{stat.value}</div>
            <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          <input
            type="search"
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full pl-10 pr-4 py-2.5 rounded-xl text-sm',
              'bg-white dark:bg-neutral-900',
              'border border-neutral-200 dark:border-neutral-800',
              'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
            )}
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'new', 'in-progress', 'resolved', 'blocked'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all border font-mono uppercase',
                statusFilter === status
                  ? 'bg-primary text-primary-foreground border-primary'
                  : cn(
                      'bg-white dark:bg-neutral-900',
                      'border-neutral-200/60 dark:border-neutral-800/60',
                      'text-neutral-600 dark:text-neutral-400',
                      'hover:bg-neutral-50 dark:hover:bg-neutral-800',
                      'hover:border-primary/30 dark:hover:border-primary/30'
                    )
              )}
            >
              {status === 'all' ? 'ALL' : statusConfig[status].label.replace(' ', '_')}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Feedback List */}
        <motion.div variants={fadeUp} className="lg:col-span-3 space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => {
              const CategoryIcon = categoryConfig[item.category].icon;
              const StatusIcon = statusConfig[item.status].icon;
              const isSelected = selectedItem?.id === item.id;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedItem(item)}
                  className={cn(
                    'p-4 rounded-xl border cursor-pointer transition-all',
                    'bg-white dark:bg-neutral-900',
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-neutral-200/60 dark:border-neutral-800/60 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      categoryConfig[item.category].bg
                    )}>
                      <CategoryIcon className={cn('w-5 h-5', categoryConfig[item.category].color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white line-clamp-1">
                          {item.title}
                        </h3>
                        <StatusIcon className={cn('w-4 h-4 flex-shrink-0', statusConfig[item.status].color)} />
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('w-1.5 h-1.5 rounded-full', priorityConfig[item.priority].dot)} />
                          <span className={cn('text-[10px] font-medium uppercase', priorityConfig[item.priority].color)}>
                            {priorityConfig[item.priority].label}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400">{item.page}</span>
                      </div>

                      {/* Notes Preview */}
                      <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{item.notes}</p>

                      {/* Footer */}
                      <div className="flex items-center gap-4 mt-3 text-[10px] text-neutral-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.sectionPath}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <Bug className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-500">No feedback items found</p>
            </div>
          )}
        </motion.div>

        {/* Detail Panel */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <div className="lg:sticky lg:top-6">
            {selectedItem ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60"
              >
                {/* Close button */}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:hidden"
                >
                  <X className="w-4 h-4 text-neutral-400" />
                </button>

                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    categoryConfig[selectedItem.category].bg
                  )}>
                    {(() => {
                      const Icon = categoryConfig[selectedItem.category].icon;
                      return <Icon className={cn('w-6 h-6', categoryConfig[selectedItem.category].color)} />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                      {selectedItem.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium',
                        categoryConfig[selectedItem.category].bg,
                        categoryConfig[selectedItem.category].color
                      )}>
                        {categoryConfig[selectedItem.category].label}
                      </span>
                      <span className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium',
                        'bg-neutral-100 dark:bg-neutral-800'
                      )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', priorityConfig[selectedItem.priority].dot)} />
                        <span className={priorityConfig[selectedItem.priority].color}>
                          {priorityConfig[selectedItem.priority].label}
                        </span>
                      </span>
                      <span className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium',
                        'bg-neutral-100 dark:bg-neutral-800'
                      )}>
                        {(() => {
                          const Icon = statusConfig[selectedItem.status].icon;
                          return <Icon className={cn('w-3 h-3', statusConfig[selectedItem.status].color)} />;
                        })()}
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {statusConfig[selectedItem.status].label}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Page</span>
                    <p className="text-sm text-neutral-900 dark:text-white font-medium">{selectedItem.page}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Created</span>
                    <p className="text-sm text-neutral-900 dark:text-white font-medium">
                      {new Date(selectedItem.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="col-span-2 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Section Path</span>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 font-mono">{selectedItem.sectionPath}</p>
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-2">Notes</span>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {selectedItem.notes}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
                      'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
                      'hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors'
                    )}
                  >
                    <MapPin className="w-4 h-4" />
                    Go to Location
                  </button>
                  <button
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
                      colors.success.bg,
                      colors.success.text,
                      'hover:opacity-90 transition-opacity'
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Resolve
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="p-8 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 text-center">
                <FileText className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
                <p className="text-sm text-neutral-500">Select a feedback item to view details</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
