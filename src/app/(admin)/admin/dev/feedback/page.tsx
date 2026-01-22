'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug,
  Sparkles,
  HelpCircle,
  FileText,
  Filter,
  Search,
  Plus,
  ChevronRight,
  MapPin,
  Clock,
  Tag,
  AlertCircle,
  CheckCircle2,
  Circle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/dev/shared';

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

// Category config
const categoryConfig: Record<FeedbackCategory, { label: string; icon: React.ElementType; color: string }> = {
  bug: { label: 'Bug', icon: Bug, color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
  enhancement: { label: 'Enhancement', icon: Sparkles, color: 'text-violet-500 bg-violet-100 dark:bg-violet-900/30' },
  question: { label: 'Question', icon: HelpCircle, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
  content: { label: 'Content', icon: FileText, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30' },
};

// Priority config
const priorityConfig: Record<FeedbackPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800' },
  medium: { label: 'Medium', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  high: { label: 'High', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  critical: { label: 'Critical', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
};

// Status config
const statusConfig: Record<FeedbackStatus, { label: string; icon: React.ElementType; color: string }> = {
  new: { label: 'New', icon: Circle, color: 'text-amber-500' },
  'in-progress': { label: 'In Progress', icon: AlertCircle, color: 'text-blue-500' },
  resolved: { label: 'Resolved', icon: CheckCircle2, color: 'text-emerald-500' },
  blocked: { label: 'Blocked', icon: XCircle, color: 'text-red-500' },
};

export default function DevFeedbackPage() {
  const [items] = useState<FeedbackItem[]>(demoFeedback);
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);

  // Filter items
  const filteredItems = items.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Dev Feedback
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Capture and manage development feedback
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'inline-flex items-center justify-center gap-2 px-4 py-2.5',
            'text-sm font-medium text-white',
            'bg-gradient-to-r from-primary-500 to-primary-600',
            'rounded-xl shadow-lg shadow-primary-500/20',
            'hover:shadow-xl hover:shadow-primary-500/30',
            'transition-all duration-200'
          )}
        >
          <Plus className="w-4 h-4" />
          New Feedback
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="New" value={stats.new} color="amber" />
        <StatCard label="In Progress" value={stats.inProgress} color="primary" />
        <StatCard label="Resolved" value={stats.resolved} color="emerald" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full pl-10 pr-4 py-2.5 rounded-xl',
              'bg-white dark:bg-neutral-900',
              'border border-neutral-200/60 dark:border-neutral-800/60',
              'text-sm text-neutral-900 dark:text-white',
              'placeholder:text-neutral-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
            )}
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {(['all', 'new', 'in-progress', 'resolved', 'blocked'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium transition-all',
                statusFilter === status
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              )}
            >
              {status === 'all' ? 'All' : statusConfig[status].label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feedback List */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredItems.map((item, index) => {
              const CategoryIcon = categoryConfig[item.category].icon;
              const StatusIcon = statusConfig[item.status].icon;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedItem(item)}
                  className={cn(
                    'p-4 rounded-2xl cursor-pointer transition-all',
                    'bg-white dark:bg-neutral-900',
                    'border border-neutral-200/60 dark:border-neutral-800/60',
                    'hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800',
                    selectedItem?.id === item.id && 'ring-2 ring-primary-500'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', categoryConfig[item.category].color)}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white line-clamp-1">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-1">
                          <StatusIcon className={cn('w-4 h-4', statusConfig[item.status].color)} />
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', priorityConfig[item.priority].color)}>
                          {priorityConfig[item.priority].label}
                        </span>
                        <span className="text-[10px] text-neutral-400">{item.page}</span>
                      </div>

                      {/* Notes Preview */}
                      <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{item.notes}</p>

                      {/* Footer */}
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-400">
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
            <div className="text-center py-12">
              <Bug className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-500">No feedback items found</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:sticky lg:top-24">
          {selectedItem ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'p-6 rounded-2xl',
                'bg-white dark:bg-neutral-900',
                'border border-neutral-200/60 dark:border-neutral-800/60'
              )}
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', categoryConfig[selectedItem.category].color)}>
                  {(() => {
                    const Icon = categoryConfig[selectedItem.category].icon;
                    return <Icon className="w-6 h-6" />;
                  })()}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {selectedItem.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', priorityConfig[selectedItem.priority].color)}>
                      {priorityConfig[selectedItem.priority].label}
                    </span>
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1', statusConfig[selectedItem.status].color)}>
                      {(() => {
                        const Icon = statusConfig[selectedItem.status].icon;
                        return <Icon className="w-3 h-3" />;
                      })()}
                      {statusConfig[selectedItem.status].label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Page</span>
                  <p className="text-sm text-neutral-900 dark:text-white font-medium">{selectedItem.page}</p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Category</span>
                  <p className="text-sm text-neutral-900 dark:text-white font-medium">{categoryConfig[selectedItem.category].label}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Section Path</span>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 font-mono">{selectedItem.sectionPath}</p>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Notes</span>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                  {selectedItem.notes}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-xl text-sm font-medium',
                    'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400',
                    'hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors'
                  )}
                >
                  Go to Location
                </button>
                <button
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-xl text-sm font-medium',
                    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
                    'hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors'
                  )}
                >
                  Mark Resolved
                </button>
              </div>
            </motion.div>
          ) : (
            <div className={cn(
              'p-12 rounded-2xl text-center',
              'bg-neutral-50 dark:bg-neutral-800/50',
              'border border-dashed border-neutral-300 dark:border-neutral-700'
            )}>
              <FileText className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-500">Select a feedback item to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
