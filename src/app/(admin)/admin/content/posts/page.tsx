'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { colors, statusColors } from '@/lib/design/tokens';

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

// Demo content data
const contentItems = [
  {
    id: '1',
    title: 'Getting Started with Light Brands AI',
    type: 'page',
    status: 'published',
    author: 'John Doe',
    updatedAt: '2024-01-15',
    views: 1234,
  },
  {
    id: '2',
    title: 'How to Build Modern Websites',
    type: 'blog',
    status: 'published',
    author: 'Jane Smith',
    updatedAt: '2024-01-14',
    views: 856,
  },
  {
    id: '3',
    title: 'Design System Overview',
    type: 'page',
    status: 'draft',
    author: 'Mike Johnson',
    updatedAt: '2024-01-13',
    views: 0,
  },
  {
    id: '4',
    title: 'New Feature Announcement',
    type: 'blog',
    status: 'scheduled',
    author: 'Sarah Wilson',
    updatedAt: '2024-01-12',
    views: 0,
  },
  {
    id: '5',
    title: 'API Documentation',
    type: 'page',
    status: 'published',
    author: 'Alex Brown',
    updatedAt: '2024-01-11',
    views: 2341,
  },
];

const statusConfig = {
  published: {
    label: 'Published',
    icon: CheckCircle,
    color: cn(colors.success.text, colors.success.bg),
  },
  draft: {
    label: 'Draft',
    icon: Clock,
    color: cn(colors.primary.text, colors.primary.bg),
  },
  scheduled: {
    label: 'Scheduled',
    icon: Clock,
    color: cn(colors.secondary.text, colors.secondary.bg),
  },
  archived: {
    label: 'Archived',
    icon: XCircle,
    color: 'text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800',
  },
};

export default function ContentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const filteredContent = contentItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredContent.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredContent.map((item) => item.id));
    }
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
            Posts
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your pages and blog posts
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
            'bg-primary text-primary-foreground',
            'hover:bg-primary-hover transition-colors'
          )}
          aria-label="Create new content"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          New Content
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search content..."
            className={cn(
              'w-full pl-10 pr-4 py-2.5 rounded-xl text-sm',
              'bg-white dark:bg-neutral-900',
              'border border-neutral-200 dark:border-neutral-800',
              'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
            )}
            aria-label="Search content"
          />
        </div>
        <button className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
          'bg-white dark:bg-neutral-900',
          'border border-neutral-200 dark:border-neutral-800',
          'text-neutral-700 dark:text-neutral-300',
          'hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors'
        )} aria-haspopup="true" aria-expanded="false">
          <Filter className="w-4 h-4" aria-hidden="true" />
          Filters
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </button>
      </motion.div>

      {/* Bulk actions */}
      {selectedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'p-4 rounded-xl border flex flex-wrap items-center gap-3 mb-6',
            colors.primary.bg,
            colors.primary.border
          )}
          role="toolbar"
          aria-label="Bulk actions"
        >
          <span className={cn('text-sm font-medium', colors.primary.text)}>
            {selectedItems.length} selected
          </span>
          <div className="flex items-center gap-2">
            <button className={cn('px-3 py-1.5 text-sm font-medium rounded-lg transition-colors', colors.primary.text, colors.primary.bg.replace('bg-', 'hover:bg-'))}>
              Publish
            </button>
            <button className={cn('px-3 py-1.5 text-sm font-medium rounded-lg transition-colors', colors.error.text, colors.error.bg.replace('bg-', 'hover:bg-'))}>
              Delete
            </button>
          </div>
        </motion.div>
      )}

      {/* Content List - Mobile Card View */}
      <motion.div variants={itemVariants} className="block lg:hidden space-y-3" role="list">
        {filteredContent.map((item) => {
          const status = statusConfig[item.status as keyof typeof statusConfig];
          const StatusIcon = status.icon;

          return (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'p-5 rounded-xl border',
                'bg-white dark:bg-neutral-900',
                'border-neutral-200/60 dark:border-neutral-800/60'
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleSelectItem(item.id)}
                  className="mt-1 w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                  aria-label={`Select ${item.title}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-neutral-900 dark:text-white">
                      {item.title}
                    </h3>
                    <span
                      className={cn(
                        'admin-badge flex-shrink-0',
                        status.color
                      )}
                    >
                      <StatusIcon className="w-3 h-3" aria-hidden="true" />
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500 flex-wrap">
                    <span className="capitalize">{item.type}</span>
                    <span aria-hidden="true">•</span>
                    <span>{item.author}</span>
                    <span aria-hidden="true">•</span>
                    <span className="tabular-nums">{item.views.toLocaleString()} views</span>
                  </div>
                  <div className="admin-actions mt-3">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors" aria-label={`View ${item.title}`}>
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      View
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors" aria-label={`Edit ${item.title}`}>
                      <Edit className="w-3.5 h-3.5" aria-hidden="true" />
                      Edit
                    </button>
                    <button className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors', colors.error.text, colors.error.bg)} aria-label={`Delete ${item.title}`}>
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </motion.div>

      {/* Content Table - Desktop View */}
      <motion.div variants={itemVariants} className={cn(
        'hidden lg:block overflow-hidden rounded-xl border',
        'bg-white dark:bg-neutral-900',
        'border-neutral-200/60 dark:border-neutral-800/60'
      )}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" role="grid">
            <thead>
              <tr className="border-b border-neutral-200/60 dark:border-neutral-800/60">
                <th scope="col" className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.length === filteredContent.length &&
                      filteredContent.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary/20"
                    aria-label="Select all items"
                  />
                </th>
                <th scope="col" className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Title</th>
                <th scope="col" className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Type</th>
                <th scope="col" className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Status</th>
                <th scope="col" className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Author</th>
                <th scope="col" className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Updated</th>
                <th scope="col" className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Views</th>
                <th scope="col" className="w-12 py-3 px-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredContent.map((item) => {
                const status = statusConfig[item.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;

                return (
                  <tr key={item.id} className="border-b border-neutral-200/60 dark:border-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary/20"
                        aria-label={`Select ${item.title}`}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center" aria-hidden="true">
                          <FileText className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                        </div>
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {item.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400 capitalize">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', status.color)}>
                        <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {item.author}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <time className="text-sm text-neutral-500 dark:text-neutral-400">
                        {item.updatedAt}
                      </time>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400 tabular-nums">
                        {item.views.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="relative group">
                        <button
                          onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          aria-label={`Actions for ${item.title}`}
                          aria-haspopup="menu"
                          aria-expanded={activeMenu === item.id}
                        >
                          <MoreHorizontal className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                        </button>
                        {activeMenu === item.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveMenu(null)}
                              aria-hidden="true"
                            />
                            <div className={cn(
                              'absolute right-0 mt-1 w-40 rounded-xl border shadow-lg z-20 overflow-hidden p-1',
                              'bg-white dark:bg-neutral-900',
                              'border-neutral-200 dark:border-neutral-800'
                            )} role="menu">
                              <button
                                onClick={() => setActiveMenu(null)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                role="menuitem"
                              >
                                <Eye className="w-4 h-4" aria-hidden="true" />
                                View
                              </button>
                              <button
                                onClick={() => setActiveMenu(null)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                role="menuitem"
                              >
                                <Edit className="w-4 h-4" aria-hidden="true" />
                                Edit
                              </button>
                              <button
                                onClick={() => setActiveMenu(null)}
                                className={cn('w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors', colors.error.text, colors.error.bg.replace('bg-', 'hover:bg-'))}
                                role="menuitem"
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <nav className="flex items-center justify-between px-4 py-3 border-t border-neutral-200/60 dark:border-neutral-800/60" aria-label="Pagination">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Showing <span className="tabular-nums">{filteredContent.length}</span> of <span className="tabular-nums">{contentItems.length}</span> items
          </p>
          <div className="flex items-center gap-2">
            <button
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                'bg-white dark:bg-neutral-900',
                'border border-neutral-200 dark:border-neutral-800',
                'text-neutral-700 dark:text-neutral-300',
                'hover:bg-neutral-50 dark:hover:bg-neutral-800',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              disabled
              aria-label="Go to previous page"
            >
              Previous
            </button>
            <button
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                'bg-white dark:bg-neutral-900',
                'border border-neutral-200 dark:border-neutral-800',
                'text-neutral-700 dark:text-neutral-300',
                'hover:bg-neutral-50 dark:hover:bg-neutral-800',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              disabled
              aria-label="Go to next page"
            >
              Next
            </button>
          </div>
        </nav>
      </motion.div>
    </motion.div>
  );
}
