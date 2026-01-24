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
import { statusColors, colors, gradients } from '@/lib/design/tokens';

// Job type configurations - using design tokens
const jobTypes = {
  'ai-generate': {
    label: 'AI Generation',
    icon: Sparkles,
    gradient: gradients.brand,
    description: 'Generate content using AI',
  },
  publish: {
    label: 'Bulk Publish',
    icon: CheckCircle,
    gradient: gradients.success,
    description: 'Publish multiple items',
  },
  optimize: {
    label: 'Image Optimization',
    icon: Upload,
    gradient: gradients.primary,
    description: 'Optimize images for web',
  },
  schedule: {
    label: 'Scheduled Publish',
    icon: Clock,
    gradient: gradients.secondary,
    description: 'Schedule content publishing',
  },
};

// Status configurations - using design tokens
const statusConfig = {
  queued: { 
    label: 'Queued', 
    icon: Clock, 
    color: cn(colors.secondary.text, colors.primary.bg) 
  },
  processing: {
    label: 'Processing',
    icon: Play,
    color: cn(colors.primary.text, colors.primary.bg),
  },
  complete: {
    label: 'Complete',
    icon: CheckCircle,
    color: cn(colors.success.text, colors.success.bg),
  },
  failed: { 
    label: 'Failed', 
    icon: XCircle, 
    color: cn(colors.error.text, colors.error.bg) 
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    color: cn(colors.primary.text, colors.primary.bg),
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
      className="admin-section"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Batch Queue
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Manage bulk operations and background jobs
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
          aria-label="Create new batch job"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          New Batch Job
        </motion.button>
      </motion.div>

      {/* Stats - Compact inline design */}
      <motion.div 
        variants={itemVariants} 
        className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60"
        role="region" 
        aria-label="Job statistics"
      >
        <div className="flex items-center gap-6 flex-wrap">
          {[
            { label: 'Total', value: stats.total, color: 'text-neutral-900 dark:text-white' },
            { label: 'Processing', value: stats.processing, color: colors.primary.text },
            { label: 'Queued', value: stats.queued, color: colors.secondary.text },
            { label: 'Complete', value: stats.complete, color: colors.success.text },
            { label: 'Failed', value: stats.failed, color: colors.error.text },
          ].map((stat, index) => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className={cn('text-lg font-bold tabular-nums', stat.color)}>{stat.value}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{stat.label}</span>
              {index < 4 && (
                <span className="text-neutral-300 dark:text-neutral-700 mx-1">•</span>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={itemVariants} className="admin-tabs overflow-x-auto mb-6" role="tablist" aria-label="Filter jobs by status">
        <button
          onClick={() => setFilter(null)}
          className={cn('admin-tab whitespace-nowrap', !filter && 'admin-tab-active')}
          role="tab"
          aria-selected={!filter}
        >
          All Jobs
        </button>
        {Object.entries(statusConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn('admin-tab whitespace-nowrap', filter === key && 'admin-tab-active')}
            role="tab"
            aria-selected={filter === key}
          >
            {config.label}
          </button>
        ))}
      </motion.div>

      {/* Job List */}
      <motion.div variants={itemVariants} className="space-y-4" role="list" aria-label="Batch jobs">
        <AnimatePresence mode="popLayout">
          {filteredJobs.map((job, index) => {
            const typeConfig = jobTypes[job.type as keyof typeof jobTypes];
            const statusInfo = statusConfig[job.status as keyof typeof statusConfig];
            const TypeIcon = typeConfig.icon;
            const StatusIcon = statusInfo.icon;

            return (
              <motion.article
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                layout
                className="admin-card admin-card-padded hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300"
                aria-labelledby={`job-title-${job.id}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      'admin-icon-container admin-icon-container-lg flex-shrink-0',
                      'text-white',
                      typeConfig.gradient
                    )}
                    aria-hidden="true"
                  >
                    <TypeIcon className="w-6 h-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 id={`job-title-${job.id}`} className="font-semibold text-neutral-900 dark:text-white">{job.title}</h3>
                      <span className={cn('admin-badge', statusInfo.color)}>
                        <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {typeConfig.description} <span aria-hidden="true">&middot;</span> <span className="tabular-nums">{job.items.length}</span> items
                    </p>

                    {/* Progress Bar */}
                    {(job.status === 'processing' || job.status === 'paused') && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-neutral-500 dark:text-neutral-400">Progress</span>
                          <span className="font-medium text-neutral-900 dark:text-white tabular-nums">
                            {job.progress}/{job.total}
                          </span>
                        </div>
                        <div className="admin-progress" role="progressbar" aria-valuenow={job.progress} aria-valuemin={0} aria-valuemax={job.total} aria-label={`${job.title}: ${job.progress} of ${job.total} complete`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(job.progress / job.total) * 100}%` }}
                            transition={{ duration: 0.5 }}
                            className={cn(
                              'admin-progress-bar',
                              job.status === 'paused'
                                ? colors.primary.solid
                                : 'bg-gradient-to-r from-primary-500 to-primary-600'
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                      <time className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        Created: {new Date(job.createdAt).toLocaleDateString()}
                      </time>
                      {job.completedAt && (
                        <time className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          Completed: {new Date(job.completedAt).toLocaleDateString()}
                        </time>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="admin-actions">
                    {job.status === 'processing' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn('admin-icon-btn', colors.primary.text, 'hover:bg-primary/10 dark:hover:bg-primary/20')}
                        aria-label={`Pause ${job.title}`}
                      >
                        <Pause className="w-4 h-4" aria-hidden="true" />
                      </motion.button>
                    )}
                    {job.status === 'paused' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn('admin-icon-btn', colors.success.text, colors.success.bg)}
                        aria-label={`Resume ${job.title}`}
                      >
                        <Play className="w-4 h-4" aria-hidden="true" />
                      </motion.button>
                    )}
                    {job.status === 'failed' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn('admin-icon-btn', colors.secondary.text, 'hover:bg-secondary/10 dark:hover:bg-secondary/20')}
                        aria-label={`Retry ${job.title}`}
                      >
                        <RotateCcw className="w-4 h-4" aria-hidden="true" />
                      </motion.button>
                    )}
                    {job.status === 'queued' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn('admin-icon-btn', colors.error.text, colors.error.bg)}
                        aria-label={`Cancel ${job.title}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="admin-icon-btn"
                      aria-label={`More options for ${job.title}`}
                    >
                      <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
                    </motion.button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>

        {filteredJobs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="admin-empty-state"
          >
            <FolderOpen className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" aria-hidden="true" />
            <p className="admin-empty-state-text">No jobs found</p>
          </motion.div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} role="region" aria-labelledby="new-job-heading">
        <h2 id="new-job-heading" className="admin-section-title">
          Start New Job
        </h2>
        <nav className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Job type quick actions">
          {Object.entries(jobTypes).map(([key, config], index) => {
            const Icon = config.icon;
            return (
              <motion.button
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={{ y: -4 }}
                className="admin-card admin-card-padded text-left hover:shadow-lg transition-all duration-300 group"
              >
                <div
                  className={cn(
                    'admin-icon-container admin-icon-container-sm mb-3',
                    'text-white',
                    config.gradient
                  )}
                  aria-hidden="true"
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                  {config.label}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{config.description}</p>
                <span className={cn('mt-3 flex items-center text-xs font-medium group-hover:gap-2 transition-all', colors.primary.text)}>
                  Start
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" aria-hidden="true" />
                </span>
              </motion.button>
            );
          })}
        </nav>
      </motion.div>
    </motion.div>
  );
}
