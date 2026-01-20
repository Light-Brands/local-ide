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

// Demo stats data - using refined design system colors
const stats = [
  {
    label: 'Total Users',
    value: '2,847',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
    gradient: 'from-primary-500 to-primary-600',
    shadowColor: 'shadow-primary-500/20',
  },
  {
    label: 'Content Items',
    value: '142',
    change: '+8.2%',
    trend: 'up',
    icon: FileText,
    gradient: 'from-secondary-500 to-secondary-600',
    shadowColor: 'shadow-secondary-500/20',
  },
  {
    label: 'Page Views',
    value: '48.2K',
    change: '+24.1%',
    trend: 'up',
    icon: Eye,
    gradient: 'from-primary-400 to-primary-500',
    shadowColor: 'shadow-primary-400/20',
  },
  {
    label: 'Conversion',
    value: '3.2%',
    change: '-2.4%',
    trend: 'down',
    icon: TrendingUp,
    gradient: 'from-secondary-400 to-secondary-500',
    shadowColor: 'shadow-secondary-400/20',
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
      ease: [0.22, 1, 0.36, 1],
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
      className="space-y-6"
    >
      {/* Header - Refined */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
            Welcome back! Here&apos;s what&apos;s happening.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'inline-flex items-center justify-center gap-2 px-4 py-2.5',
            'text-sm font-medium',
            'text-neutral-700 dark:text-neutral-300',
            'bg-white dark:bg-neutral-800',
            'border border-neutral-200/80 dark:border-neutral-700/80',
            'rounded-xl',
            'hover:bg-neutral-50 dark:hover:bg-neutral-700/80',
            'shadow-sm',
            'transition-colors duration-200'
          )}
        >
          <Calendar className="w-4 h-4" />
          Last 7 days
        </motion.button>
      </motion.div>

      {/* Stats Grid - Refined with premium cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
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
                'group relative',
                'bg-white dark:bg-neutral-900',
                'rounded-2xl',
                'border border-neutral-200/60 dark:border-neutral-800/60',
                'p-5 lg:p-6',
                'hover:shadow-lg hover:shadow-neutral-900/[0.04] dark:hover:shadow-neutral-950/30',
                'transition-all duration-300'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                {/* Icon with gradient */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl',
                    'bg-gradient-to-br flex items-center justify-center',
                    'shadow-lg',
                    stat.gradient,
                    stat.shadowColor
                  )}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Trend badge */}
                <div
                  className={cn(
                    'flex items-center gap-0.5 text-xs font-semibold',
                    'px-2 py-1 rounded-full',
                    stat.trend === 'up'
                      ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30'
                      : 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30'
                  )}
                >
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {stat.change}
                </div>
              </div>

              {/* Value */}
              <p className="text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                {stat.value}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {stat.label}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        {/* Recent Activity */}
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
          {/* Card Header */}
          <div className="p-5 border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Recent Activity
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-neutral-400" />
            </motion.button>
          </div>

          {/* Activity List */}
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
            <AnimatePresence>
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="p-4 sm:px-5 flex items-center gap-3 sm:gap-4 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/10">
                    <span className="text-sm font-semibold text-white">
                      {activity.user.charAt(0)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900 dark:text-white">
                      <span className="font-semibold">{activity.user}</span>{' '}
                      <span className="text-neutral-500 dark:text-neutral-400">{activity.action}</span>{' '}
                      <span className="font-medium">{activity.target}</span>
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                      {activity.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* View All Link */}
          <div className="p-4 sm:p-5 border-t border-neutral-200/60 dark:border-neutral-800/60">
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors group"
            >
              View all activity
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Right Sidebar */}
        <motion.div variants={itemVariants} className="space-y-5 lg:space-y-6">
          {/* Quick Actions */}
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
                Quick Actions
              </h2>
            </div>
            <div className="p-3 sm:p-4 grid grid-cols-3 gap-2 sm:gap-3">
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
                        'flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl',
                        'bg-neutral-50 dark:bg-neutral-800/50',
                        'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                        'transition-colors text-center',
                        'group'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-xl',
                        'bg-white dark:bg-neutral-700',
                        'flex items-center justify-center',
                        'shadow-sm',
                        'group-hover:shadow-md',
                        'transition-shadow'
                      )}>
                        <Icon className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                      </div>
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        {action.label}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Traffic Overview */}
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
                Traffic Sources
              </h2>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Direct', value: 42, color: 'bg-primary-500' },
                { label: 'Organic', value: 31, color: 'bg-secondary-500' },
                { label: 'Referral', value: 27, color: 'bg-primary-400' },
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
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {source.value}%
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
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
