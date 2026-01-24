'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  getActivityService,
  formatActivityTime,
  getActivityColor,
} from '@/lib/ide/services/activity';
import type { Activity, ActivityFilter } from '@/lib/ide/services/activity';
import {
  Activity as ActivityIcon,
  File,
  FileText,
  FilePlus,
  Terminal,
  MessageSquare,
  Rocket,
  AlertCircle,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
  Database,
  GitCommit,
  Upload,
  Info,
  Sparkles,
  Save,
  RefreshCw,
} from 'lucide-react';

export function ActivityPane() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [search, setSearch] = useState('');

  // Subscribe to activity updates
  useEffect(() => {
    const service = getActivityService();

    // Initial load
    const filtered = search
      ? service.search(search)
      : service.getByFilter(filter);
    setActivities(filtered);

    // Subscribe to updates
    const unsubscribe = service.subscribe(() => {
      const updated = search
        ? service.search(search)
        : service.getByFilter(filter);
      setActivities(updated);
    });

    return unsubscribe;
  }, [filter, search]);

  // Get icon for activity type
  const getTypeIcon = (type: Activity['type']) => {
    switch (type) {
      case 'file_open':
        return <FileText className="w-4 h-4" />;
      case 'file_save':
        return <Save className="w-4 h-4" />;
      case 'file_create':
        return <FilePlus className="w-4 h-4" />;
      case 'file_delete':
        return <Trash2 className="w-4 h-4" />;
      case 'terminal_command':
      case 'terminal_output':
        return <Terminal className="w-4 h-4" />;
      case 'ai_message':
        return <MessageSquare className="w-4 h-4" />;
      case 'ai_response':
        return <Sparkles className="w-4 h-4" />;
      case 'deployment_start':
        return <Rocket className="w-4 h-4" />;
      case 'deployment_success':
        return <CheckCircle className="w-4 h-4" />;
      case 'deployment_error':
        return <XCircle className="w-4 h-4" />;
      case 'database_query':
        return <Database className="w-4 h-4" />;
      case 'git_commit':
        return <GitCommit className="w-4 h-4" />;
      case 'git_push':
        return <Upload className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
      default:
        return <ActivityIcon className="w-4 h-4" />;
    }
  };

  // Get background color for activity type
  const getTypeBgColor = (type: Activity['type']) => {
    switch (type) {
      case 'file_open':
      case 'file_save':
      case 'file_create':
        return 'bg-blue-100 dark:bg-blue-900/30';
      case 'file_delete':
        return 'bg-red-100 dark:bg-red-900/30';
      case 'terminal_command':
      case 'terminal_output':
        return 'bg-amber-100 dark:bg-amber-900/30';
      case 'ai_message':
      case 'ai_response':
        return 'bg-purple-100 dark:bg-purple-900/30';
      case 'deployment_start':
        return 'bg-blue-100 dark:bg-blue-900/30';
      case 'deployment_success':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'deployment_error':
        return 'bg-red-100 dark:bg-red-900/30';
      case 'database_query':
        return 'bg-cyan-100 dark:bg-cyan-900/30';
      case 'git_commit':
      case 'git_push':
        return 'bg-orange-100 dark:bg-orange-900/30';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/30';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800';
    }
  };

  // Handle clear all
  const handleClear = () => {
    if (confirm('Clear all activity history?')) {
      getActivityService().clear();
    }
  };

  // Handle refresh (track demo activities)
  const handleRefresh = () => {
    const service = getActivityService();
    // Demo activity to show the feature works
    service.trackInfo('Activity refreshed', 'Manual refresh triggered');
  };

  const filters: { id: ActivityFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'files', label: 'Files' },
    { id: 'terminal', label: 'Terminal' },
    { id: 'ai', label: 'AI' },
    { id: 'deploy', label: 'Deploy' },
    { id: 'database', label: 'Database' },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        {/* Search and actions */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activity..."
              className={cn(
                'w-full pl-9 pr-4 py-2 rounded-lg',
                'bg-neutral-100 dark:bg-neutral-800',
                'text-sm placeholder:text-neutral-400',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
              )}
            />
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
            title="Clear all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
                filter === f.id
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity list */}
      <div className="flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <ActivityIcon className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-neutral-500">No activity found</p>
            <p className="text-xs text-neutral-400 mt-1">
              {search
                ? 'Try a different search term'
                : 'Activity will appear here as you use the IDE'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {activities.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                    getTypeBgColor(item.type),
                    getActivityColor(item.type)
                  )}
                >
                  {getTypeIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-xs text-neutral-500 truncate mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Time */}
                <span className="flex-shrink-0 text-xs text-neutral-400">
                  {formatActivityTime(item.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with count */}
      {activities.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500">
          {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
          {filter !== 'all' && ` (filtered: ${filter})`}
        </div>
      )}
    </div>
  );
}
