'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Plus,
  Sparkles,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { demoBatchJobs } from '@/data/content/demoData';
import { containerVariants, itemVariants, ContentStatusBadge } from '@/components/content/shared';

// Job type configurations
const jobTypes = {
  'ai-generate': {
    label: 'AI Generation',
    icon: Sparkles,
    color: 'from-violet-500 to-purple-500',
    description: 'Generate content using AI',
  },
  publish: {
    label: 'Bulk Publish',
    icon: CheckCircle,
    color: 'from-emerald-500 to-teal-500',
    description: 'Publish multiple items',
  },
  optimize: {
    label: 'Image Optimization',
    icon: Upload,
    color: 'from-blue-500 to-indigo-500',
    description: 'Optimize images for web',
  },
  schedule: {
    label: 'Scheduled Publish',
    icon: Clock,
    color: 'from-amber-500 to-orange-500',
    description: 'Schedule content publishing',
  },
};

// Status configurations
const statusConfig = {
  queued: { label: 'Queued', icon: Clock, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
  processing: {
    label: 'Processing',
    icon: Play,
    color: 'text-violet-500 bg-violet-100 dark:bg-violet-900/30',
  },
  complete: {
    label: 'Complete',
    icon: CheckCircle,
    color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30',
  },
  failed: { label: 'Failed', icon: XCircle, color: 'text-red-500 bg-red-100 dark:bg-red-900/30' },
  paused: {
    label: 'Paused',
    icon: Pause,
    color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
  },
};

export default function BatchQueuePage() {
  const [filter, setFilter] = useState<string | null>(null);
  const [jobs, setJobs] = useState(demoBatchJobs);

  const filteredJobs = filter ? jobs.filter((job) => job.status === filter) : jobs;

  const stats = {
    total: jobs.length,
    processing: jobs.filter((j) => j.status === 'processing').length,
    queued: jobs.filter((j) => j.status === 'queued').length,
    complete: jobs.filter((j) => j.status === 'complete').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Batch Queue
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Manage bulk operations and background jobs
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary-500/25"
        >
          <Plus className="w-4 h-4" />
          New Batch Job
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Jobs', value: stats.total, color: 'neutral' },
          { label: 'Processing', value: stats.processing, color: 'violet' },
          { label: 'Queued', value: stats.queued, color: 'blue' },
          { label: 'Complete', value: stats.complete, color: 'emerald' },
          { label: 'Failed', value: stats.failed, color: 'red' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -2 }}
            className={cn(
              'p-4 rounded-2xl text-center',
              'bg-white dark:bg-neutral-900',
              'border border-neutral-200/60 dark:border-neutral-800/60',
              'hover:shadow-lg transition-all duration-300'
            )}
          >
            <p className={cn('text-2xl font-bold', `text-${stat.color}-500`)}>{stat.value}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={itemVariants} className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter(null)}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
            !filter
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
              : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
          )}
        >
          All Jobs
        </button>
        {Object.entries(statusConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              filter === key
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
            )}
          >
            {config.label}
          </button>
        ))}
      </motion.div>

      {/* Job List */}
      <motion.div variants={itemVariants} className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredJobs.map((job, index) => {
            const typeConfig = jobTypes[job.type as keyof typeof jobTypes];
            const statusInfo = statusConfig[job.status as keyof typeof statusConfig];
            const TypeIcon = typeConfig.icon;
            const StatusIcon = statusInfo.icon;

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                layout
                className={cn(
                  'p-5 rounded-2xl',
                  'bg-white dark:bg-neutral-900',
                  'border border-neutral-200/60 dark:border-neutral-800/60',
                  'hover:shadow-lg transition-all duration-300'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      'bg-gradient-to-br text-white shadow-lg',
                      typeConfig.color
                    )}
                  >
                    <TypeIcon className="w-6 h-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-neutral-900 dark:text-white">{job.title}</h3>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                          statusInfo.color
                        )}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {typeConfig.description} &middot; {job.items.length} items
                    </p>

                    {/* Progress Bar */}
                    {(job.status === 'processing' || job.status === 'paused') && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-neutral-500 dark:text-neutral-400">Progress</span>
                          <span className="font-medium text-neutral-900 dark:text-white">
                            {job.progress}/{job.total}
                          </span>
                        </div>
                        <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(job.progress / job.total) * 100}%` }}
                            transition={{ duration: 0.5 }}
                            className={cn(
                              'h-full rounded-full',
                              job.status === 'paused'
                                ? 'bg-amber-500'
                                : 'bg-gradient-to-r from-primary-500 to-secondary-500'
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Created: {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                      {job.completedAt && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Completed: {new Date(job.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {job.status === 'processing' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                        title="Pause"
                      >
                        <Pause className="w-4 h-4" />
                      </motion.button>
                    )}
                    {job.status === 'paused' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        title="Resume"
                      >
                        <Play className="w-4 h-4" />
                      </motion.button>
                    )}
                    {job.status === 'failed' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Retry"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </motion.button>
                    )}
                    {job.status === 'queued' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Cancel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredJobs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <FolderOpen className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-500 dark:text-neutral-400">No jobs found</p>
          </motion.div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
          Start New Job
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(jobTypes).map(([key, config], index) => {
            const Icon = config.icon;
            return (
              <motion.button
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={{ y: -4 }}
                className={cn(
                  'p-4 rounded-2xl text-left',
                  'bg-white dark:bg-neutral-900',
                  'border border-neutral-200/60 dark:border-neutral-800/60',
                  'hover:shadow-lg transition-all duration-300',
                  'group'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
                    'bg-gradient-to-br text-white shadow-lg',
                    config.color
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                  {config.label}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{config.description}</p>
                <div className="mt-3 flex items-center text-xs font-medium text-primary-600 dark:text-primary-400 group-hover:gap-2 transition-all">
                  Start
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
