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

// Demo content data
const contentItems = [
  {
    id: '1',
    title: 'Getting Started with Oracle',
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
    color: 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30',
  },
  draft: {
    label: 'Draft',
    icon: Clock,
    color: 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30',
  },
  scheduled: {
    label: 'Scheduled',
    icon: Clock,
    color: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
  },
  archived: {
    label: 'Archived',
    icon: XCircle,
    color: 'text-neutral-600 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-800',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Content
          </h1>
          <p className="text-neutral-500 mt-1 text-sm">
            Manage your pages and blog posts
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary-500/25">
          <Plus className="w-4 h-4" />
          New Content
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search content..."
            className={cn(
              'w-full pl-9 pr-4 py-2.5 rounded-xl',
              'bg-white dark:bg-neutral-900',
              'border border-neutral-200 dark:border-neutral-800',
              'text-sm text-neutral-900 dark:text-white',
              'placeholder:text-neutral-500',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
            )}
          />
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
          <Filter className="w-4 h-4" />
          Filters
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Bulk actions */}
      {selectedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl"
        >
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
            {selectedItems.length} selected
          </span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg transition-colors">
              Publish
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors">
              Delete
            </button>
          </div>
        </motion.div>
      )}

      {/* Content List - Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        {filteredContent.map((item) => {
          const status = statusConfig[item.status as keyof typeof statusConfig];
          const StatusIcon = status.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleSelectItem(item.id)}
                  className="mt-1 w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-neutral-900 dark:text-white">
                      {item.title}
                    </h3>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                        status.color
                      )}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                    <span className="capitalize">{item.type}</span>
                    <span>•</span>
                    <span>{item.author}</span>
                    <span>•</span>
                    <span>{item.views.toLocaleString()} views</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Content Table - Desktop View */}
      <div className="hidden lg:block bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.length === filteredContent.length &&
                      filteredContent.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredContent.map((item) => {
                const status = statusConfig[item.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-neutral-500" />
                        </div>
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {item.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400 capitalize">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                          status.color
                        )}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {item.author}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-500">
                        {item.updatedAt}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {item.views.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4 text-neutral-400" />
                        </button>
                        {activeMenu === item.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveMenu(null)}
                            />
                            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg z-20 overflow-hidden">
                              <button
                                onClick={() => setActiveMenu(null)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                              <button
                                onClick={() => setActiveMenu(null)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => setActiveMenu(null)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
          <span className="text-sm text-neutral-500">
            Showing {filteredContent.length} of {contentItems.length} items
          </span>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors"
              disabled
            >
              Previous
            </button>
            <button
              className="px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors"
              disabled
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
