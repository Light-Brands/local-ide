'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  FileText,
  Image,
  Sparkles,
  FolderOpen,
  Tags,
  Plus,
  ChevronRight,
  Eye,
  HardDrive,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  demoPosts,
  demoAIGenerations,
  demoBatchJobs,
  getContentStats,
  formatFileSize,
} from '@/data/content/demoData';
import {
  ContentStatusBadge,
  ContentStatCard,
  containerVariants,
  itemVariants,
} from '@/components/content/shared';
import { colors, gradients } from '@/lib/design/tokens';

// Quick action cards
const quickActions = [
  {
    title: 'New Post',
    description: 'Create a new blog post',
    href: '/admin/content/posts',
    icon: FileText,
    gradient: gradients.primary,
  },
  {
    title: 'Upload Media',
    description: 'Add images, videos, or files',
    href: '/admin/content/media',
    icon: Image,
    gradient: gradients.secondary,
  },
  {
    title: 'AI Generator',
    description: 'Generate content with AI',
    href: '/admin/content/generator',
    icon: Sparkles,
    gradient: gradients.brand,
  },
];

export default function ContentOverview() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const stats = getContentStats();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="admin-section"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
          Content & Media
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Manage your posts, media library, and AI-powered content generation
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="admin-stats-grid">
        <ContentStatCard
          label="Total Posts"
          value={stats.totalPosts}
          change={`${stats.publishedPosts} published`}
          changeType="neutral"
          icon={<FileText className="w-5 h-5 text-white" />}
          gradient={gradients.primary}
        />
        <ContentStatCard
          label="Page Views"
          value={stats.totalViews.toLocaleString()}
          change="+12.5%"
          changeType="up"
          icon={<Eye className="w-5 h-5 text-white" />}
          gradient={gradients.success}
        />
        <ContentStatCard
          label="Media Files"
          value={stats.totalMedia}
          change={formatFileSize(stats.totalStorage)}
          changeType="neutral"
          icon={<HardDrive className="w-5 h-5 text-white" />}
          gradient={gradients.secondary}
        />
        <ContentStatCard
          label="AI Generations"
          value={stats.aiGenerationsThisMonth}
          change="This month"
          changeType="neutral"
          icon={<Sparkles className="w-5 h-5 text-white" />}
          gradient={gradients.brand}
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} role="region" aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
          Quick Actions
        </h2>
        <nav className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="Content quick actions">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  href={action.href}
                  className={cn(
                    'p-5 rounded-xl border block hover:shadow-lg transition-all duration-300',
                    'bg-white dark:bg-neutral-900',
                    'border-neutral-200/60 dark:border-neutral-800/60',
                    'hover:border-neutral-300 dark:hover:border-neutral-700',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20'
                  )}
                >
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4', action.gradient)}>
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">
                    {action.title}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {action.description}
                  </p>
                  <span className={cn('mt-4 flex items-center text-sm font-medium', colors.primary.text)}>
                    Get started
                    <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Posts */}
        <motion.div
          variants={itemVariants}
          className={cn(
            'p-5 rounded-xl border overflow-hidden',
            'bg-white dark:bg-neutral-900',
            'border-neutral-200/60 dark:border-neutral-800/60'
          )}
          role="region"
          aria-labelledby="recent-posts-title"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="recent-posts-title" className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
              Recent Posts
            </h2>
            <Link
              href="/admin/content/posts"
              className={cn('text-sm font-medium hover:underline flex items-center', colors.primary.text)}
            >
              View all
              <ChevronRight className="w-4 h-4 ml-0.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="space-y-0" role="list">
            <AnimatePresence>
              {demoPosts.slice(0, 4).map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className={cn(
                    'flex items-center gap-3 py-3',
                    index < demoPosts.slice(0, 4).length - 1 && 'border-b border-neutral-200/60 dark:border-neutral-800/60'
                  )}
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white', gradients.primary)} aria-hidden="true">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                        {post.title}
                      </h3>
                      <ContentStatusBadge status={post.status} />
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {post.author} &middot; <time>{new Date(post.updatedAt).toLocaleDateString()}</time>
                    </p>
                  </div>

                  <div className="hidden sm:flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400 tabular-nums">
                    <span className="flex items-center gap-1" aria-label={`${post.viewCount.toLocaleString()} views`}>
                      <Eye className="w-4 h-4" aria-hidden="true" />
                      {post.viewCount.toLocaleString()}
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    aria-label={`More options for ${post.title}`}
                  >
                    <MoreHorizontal className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="pt-4 mt-4 border-t border-neutral-200/60 dark:border-neutral-800/60">
            <Link
              href="/admin/content/posts"
              className={cn('inline-flex items-center gap-2 text-sm font-medium transition-colors', colors.primary.text)}
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Create new post
            </Link>
          </div>
        </motion.div>

        {/* Right Sidebar */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6">
          {/* Batch Queue Status */}
          <div className={cn(
            'p-5 rounded-xl border overflow-hidden',
            'bg-white dark:bg-neutral-900',
            'border-neutral-200/60 dark:border-neutral-800/60'
          )} role="region" aria-labelledby="queue-status-title">
            <div className="flex items-center justify-between mb-4">
              <h2 id="queue-status-title" className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
                Queue Status
              </h2>
              <Link
                href="/admin/content/batch"
                className={cn('text-xs font-medium hover:underline', colors.primary.text)}
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {demoBatchJobs
                .filter((job) => job.status === 'processing' || job.status === 'queued')
                .slice(0, 2)
                .map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
                    className={cn(
                      'p-3 rounded-lg border',
                      'bg-neutral-50 dark:bg-neutral-800/50',
                      'border-neutral-200/50 dark:border-neutral-700/50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">
                        {job.title}
                      </span>
                      <ContentStatusBadge
                        status={job.status === 'queued' ? 'scheduled' : 'processing'}
                      />
                    </div>
                    {job.status === 'processing' && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={job.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${job.title}: ${job.progress}% complete`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${job.progress}%` }}
                            transition={{ duration: 0.5 }}
                            className={cn('h-full rounded-full', colors.primary.solid)}
                          />
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 tabular-nums">
                          {job.progress}% complete
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              {demoBatchJobs.filter((job) => job.status === 'processing' || job.status === 'queued')
                .length === 0 && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                  No active jobs
                </p>
              )}
            </div>
          </div>

          {/* Content Overview */}
          <div className={cn(
            'p-5 rounded-xl border overflow-hidden',
            'bg-white dark:bg-neutral-900',
            'border-neutral-200/60 dark:border-neutral-800/60'
          )} role="region" aria-labelledby="content-overview-title">
            <h2 id="content-overview-title" className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
              Content Overview
            </h2>
            <div className="space-y-4">
              {[
                {
                  label: 'Published',
                  value: stats.publishedPosts,
                  total: stats.totalPosts,
                  color: colors.success.solid,
                },
                {
                  label: 'Drafts',
                  value: stats.draftPosts,
                  total: stats.totalPosts,
                  color: colors.primary.solid,
                },
                {
                  label: 'Scheduled',
                  value: stats.scheduledPosts,
                  total: stats.totalPosts,
                  color: colors.secondary.solid,
                },
              ].map((item, index) => {
                const percentage = item.total > 0 ? (item.value / item.total) * 100 : 0;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-neutral-600 dark:text-neutral-400">{item.label}</span>
                      <span className="font-semibold text-neutral-900 dark:text-white tabular-nums">
                        {item.value}
                      </span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={item.value} aria-valuemax={item.total} aria-label={`${item.label}: ${item.value} of ${item.total}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{
                          duration: 0.8,
                          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                          delay: 0.4 + index * 0.1,
                        }}
                        className={cn('h-full rounded-full', item.color)}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Recent AI Generations */}
          <div className={cn(
            'p-5 rounded-xl border overflow-hidden',
            'bg-white dark:bg-neutral-900',
            'border-neutral-200/60 dark:border-neutral-800/60'
          )} role="region" aria-labelledby="ai-generations-title">
            <div className="flex items-center justify-between mb-4">
              <h2 id="ai-generations-title" className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
                Recent AI Generations
              </h2>
              <Link
                href="/admin/content/generator"
                className={cn('text-xs font-medium hover:underline', colors.primary.text)}
              >
                Generate
              </Link>
            </div>
            <div className="space-y-2" role="list">
              {demoAIGenerations.slice(0, 3).map((gen, index) => (
                <motion.div
                  key={gen.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white', gradients.brand)} aria-hidden="true">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900 dark:text-white truncate">
                      {gen.prompt.substring(0, 40)}...
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 capitalize">
                      {gen.type} &middot; {gen.status}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
