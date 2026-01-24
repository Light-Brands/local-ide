'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  FileText,
  Eye,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Calendar,
  Plus,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { SkeletonDashboard } from '@/components/admin/Skeleton';
import { colors, gradients } from '@/lib/design/tokens';

// Demo stats data - using design tokens
const stats = [
  {
    label: 'Total Users',
    value: '2,847',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
    gradient: gradients.primary,
  },
  {
    label: 'Content Items',
    value: '142',
    change: '+8.2%',
    trend: 'up',
    icon: FileText,
    gradient: gradients.secondary,
  },
  {
    label: 'Page Views',
    value: '48.2K',
    change: '+24.1%',
    trend: 'up',
    icon: Eye,
    gradient: gradients.primary,
  },
  {
    label: 'Conversion',
    value: '3.2%',
    change: '-2.4%',
    trend: 'down',
    icon: TrendingUp,
    gradient: gradients.secondary,
  },
];

// Demo recent activity
const recentActivity = [
  {
    id: 1,
    user: 'John Doe',
    action: 'published',
    target: 'Getting Started Guide',
    time: '2 min ago',
  },
  {
    id: 2,
    user: 'Jane Smith',
    action: 'uploaded',
    target: 'hero-banner.jpg',
    time: '15 min ago',
  },
  {
    id: 3,
    user: 'Mike Johnson',
    action: 'updated',
    target: 'Pricing Page',
    time: '1 hour ago',
  },
  {
    id: 4,
    user: 'Sarah Wilson',
    action: 'created',
    target: 'Feature Announcement',
    time: '3 hours ago',
  },
];

// Demo quick actions
const quickActions = [
  { label: 'New Page', href: '/admin/content', icon: FileText },
  { label: 'Upload Media', href: '/admin/media', icon: Plus },
  { label: 'Analytics', href: '/admin/analytics', icon: Activity },
];

// Refined animation variants
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

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SkeletonDashboard />;
  }

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
            Dashboard
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Welcome back! Here&apos;s what&apos;s happening.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
            'bg-white dark:bg-neutral-900',
            'border border-neutral-200 dark:border-neutral-800',
            'text-neutral-700 dark:text-neutral-300',
            'hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors'
          )}
          aria-label="Filter by time period"
        >
          <Calendar className="w-4 h-4" />
          Last 7 days
        </motion.button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className={cn(
                'p-5 rounded-xl border transition-all',
                'bg-white dark:bg-neutral-900',
                'border-neutral-200/60 dark:border-neutral-800/60',
                'hover:shadow-sm'
              )}
              role="article"
              aria-label={`${stat.label}: ${stat.value}, ${stat.change}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white', stat.gradient)}>
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>

                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                    stat.trend === 'up'
                      ? cn(colors.success.text, colors.success.bg)
                      : cn(colors.error.text, colors.error.bg)
                  )}
                >
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" aria-hidden="true" />
                  )}
                  {stat.change}
                </span>
              </div>

              <div>
                <p className="text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight tabular-nums">
                  {stat.value}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Activity */}
        <motion.div
          variants={itemVariants}
          className={cn(
            'p-5 rounded-xl border',
            'bg-white dark:bg-neutral-900',
            'border-neutral-200/60 dark:border-neutral-800/60'
          )}
          role="region"
          aria-labelledby="recent-activity-title"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="recent-activity-title" className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
              Recent Activity
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="More options"
            >
              <MoreHorizontal className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
            </motion.button>
          </div>

          <div className="space-y-0">
            <AnimatePresence>
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className={cn(
                    'flex items-center gap-3 py-3',
                    index < recentActivity.length - 1 && 'border-b border-neutral-200/60 dark:border-neutral-800/60'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white', colors.primary.solid)} aria-hidden="true">
                    {activity.user.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900 dark:text-white">
                      <span className="font-semibold">{activity.user}</span>{' '}
                      <span className="text-neutral-500 dark:text-neutral-400">{activity.action}</span>{' '}
                      <span className="font-medium">{activity.target}</span>
                    </p>
                    <time className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 block">
                      {activity.time}
                    </time>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="pt-4 mt-4 border-t border-neutral-200/60 dark:border-neutral-800/60">
            <Link
              href="/admin/analytics"
              className={cn('inline-flex items-center gap-1.5 text-sm font-medium transition-colors group', colors.primary.text)}
            >
              View all activity
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        </motion.div>

        {/* Right Sidebar */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6">
          {/* Quick Actions */}
          <div className={cn(
            'p-5 rounded-xl border',
            'bg-white dark:bg-neutral-900',
            'border-neutral-200/60 dark:border-neutral-800/60'
          )} role="region" aria-labelledby="quick-actions-title">
            <h2 id="quick-actions-title" className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
              Quick Actions
            </h2>
            <nav className="grid grid-cols-3 gap-3" aria-label="Quick actions">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href={action.href}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl',
                        'bg-neutral-50 dark:bg-neutral-800/50',
                        'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                        'transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
                        'group border border-neutral-200/50 dark:border-neutral-700/50'
                      )}
                    >
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.primary.bg)}>
                        <Icon className="w-5 h-5 text-white" aria-hidden="true" />
                      </div>
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {action.label}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </div>

          {/* Traffic Overview */}
          <div className={cn(
            'p-5 rounded-xl border',
            'bg-white dark:bg-neutral-900',
            'border-neutral-200/60 dark:border-neutral-800/60'
          )} role="region" aria-labelledby="traffic-title">
            <h2 id="traffic-title" className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
              Traffic Sources
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Direct', value: 42, color: colors.primary.solid },
                { label: 'Organic', value: 31, color: colors.secondary.solid },
                { label: 'Referral', value: 27, color: colors.primary.solid },
              ].map((source, index) => (
                <motion.div
                  key={source.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {source.label}
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-white tabular-nums">
                      {source.value}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={source.value} aria-valuemin={0} aria-valuemax={100} aria-label={`${source.label} traffic: ${source.value}%`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${source.value}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.4 + index * 0.1 }}
                      className={cn('h-full rounded-full', source.color)}
                    />
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
