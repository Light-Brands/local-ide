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

// Quick action cards
const quickActions = [
  {
    title: 'New Post',
    description: 'Create a new blog post',
    href: '/admin/content/posts',
    icon: FileText,
    color: 'from-blue-500 to-indigo-500',
    shadowColor: 'shadow-blue-500/20',
  },
  {
    title: 'Upload Media',
    description: 'Add images, videos, or files',
    href: '/admin/content/media',
    icon: Image,
    color: 'from-emerald-500 to-teal-500',
    shadowColor: 'shadow-emerald-500/20',
  },
  {
    title: 'AI Generator',
    description: 'Generate content with AI',
    href: '/admin/content/generator',
    icon: Sparkles,
    color: 'from-violet-500 to-purple-500',
    shadowColor: 'shadow-violet-500/20',
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
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Content & Media
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Manage your posts, media library, and AI-powered content generation
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ContentStatCard
          label="Total Posts"
          value={stats.totalPosts}
          change={`${stats.publishedPosts} published`}
          changeType="neutral"
          icon={<FileText className="w-5 h-5 text-white" />}
          gradient="from-blue-500 to-indigo-500"
        />
        <ContentStatCard
          label="Page Views"
          value={stats.totalViews.toLocaleString()}
          change="+12.5%"
          changeType="up"
          icon={<Eye className="w-5 h-5 text-white" />}
          gradient="from-emerald-500 to-teal-500"
        />
        <ContentStatCard
          label="Media Files"
          value={stats.totalMedia}
          change={formatFileSize(stats.totalStorage)}
          changeType="neutral"
          icon={<HardDrive className="w-5 h-5 text-white" />}
          gradient="from-amber-500 to-orange-500"
        />
        <ContentStatCard
          label="AI Generations"
          value={stats.aiGenerationsThisMonth}
          change="This month"
          changeType="neutral"
          icon={<Sparkles className="w-5 h-5 text-white" />}
          gradient="from-violet-500 to-purple-500"
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    'block p-5 rounded-2xl',
                    'bg-white dark:bg-neutral-900',
                    'border border-neutral-200/60 dark:border-neutral-800/60',
                    'hover:shadow-lg transition-all duration-300',
                    action.shadowColor
                  )}
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                      'bg-gradient-to-br text-white shadow-lg',
                      action.color,
                      action.shadowColor
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">
                    {action.title}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {action.description}
                  </p>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary-600 dark:text-primary-400">
                    Get started
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        {/* Recent Posts */}
        <motion.div
          variants={itemVariants}
          className={cn(
            'lg:col-span-2',
            'bg-white dark:bg-neutral-900',
            'rounded-2xl',
            'border border-neutral-200/60 dark:border-neutral-800/60',
            'overflow-hidden'
          )}
        >
          <div className="p-5 border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Recent Posts
            </h2>
            <Link
              href="/admin/content/posts"
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center"
            >
              View all
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
            <AnimatePresence>
              {demoPosts.slice(0, 4).map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  onMouseEnter={() => setHoveredCard(post.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="p-4 sm:px-5 flex items-center gap-3 sm:gap-4 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  {/* Thumbnail or icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/10">
                    <FileText className="w-5 h-5 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                        {post.title}
                      </h3>
                      <ContentStatusBadge status={post.status} />
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {post.author} &middot; {new Date(post.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {post.viewCount.toLocaleString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4 text-neutral-400" />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="p-4 sm:p-5 border-t border-neutral-200/60 dark:border-neutral-800/60">
            <Link
              href="/admin/content/posts"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors group"
            >
              <Plus className="w-4 h-4" />
              Create new post
            </Link>
          </div>
        </motion.div>

        {/* Right Sidebar */}
        <motion.div variants={itemVariants} className="space-y-5 lg:space-y-6">
          {/* Batch Queue Status */}
          <div
            className={cn(
              'bg-white dark:bg-neutral-900',
              'rounded-2xl',
              'border border-neutral-200/60 dark:border-neutral-800/60',
              'overflow-hidden'
            )}
          >
            <div className="p-5 border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                Queue Status
              </h2>
              <Link
                href="/admin/content/batch"
                className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="p-4 space-y-3">
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
                      'p-3 rounded-xl',
                      'bg-neutral-50 dark:bg-neutral-800/50'
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
                        <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${job.progress}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                          />
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
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
          <div
            className={cn(
              'bg-white dark:bg-neutral-900',
              'rounded-2xl',
              'border border-neutral-200/60 dark:border-neutral-800/60',
              'overflow-hidden'
            )}
          >
            <div className="p-5 border-b border-neutral-200/60 dark:border-neutral-800/60">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                Content Overview
              </h2>
            </div>
            <div className="p-5 space-y-4">
              {[
                {
                  label: 'Published',
                  value: stats.publishedPosts,
                  total: stats.totalPosts,
                  color: 'bg-emerald-500',
                },
                {
                  label: 'Drafts',
                  value: stats.draftPosts,
                  total: stats.totalPosts,
                  color: 'bg-amber-500',
                },
                {
                  label: 'Scheduled',
                  value: stats.scheduledPosts,
                  total: stats.totalPosts,
                  color: 'bg-blue-500',
                },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-neutral-600 dark:text-neutral-400">{item.label}</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {item.value}
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%`,
                      }}
                      transition={{
                        duration: 0.8,
                        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                        delay: 0.4 + index * 0.1,
                      }}
                      className={cn('h-full rounded-full', item.color)}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent AI Generations */}
          <div
            className={cn(
              'bg-white dark:bg-neutral-900',
              'rounded-2xl',
              'border border-neutral-200/60 dark:border-neutral-800/60',
              'overflow-hidden'
            )}
          >
            <div className="p-5 border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                Recent AI Generations
              </h2>
              <Link
                href="/admin/content/generator"
                className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                Generate
              </Link>
            </div>
            <div className="p-4 space-y-2">
              {demoAIGenerations.slice(0, 3).map((gen, index) => (
                <motion.div
                  key={gen.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white">
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
