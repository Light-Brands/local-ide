'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Eye,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
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

// Demo analytics data
const overviewStats = [
  {
    label: 'Total Visitors',
    value: '24,521',
    change: '+18.2%',
    trend: 'up',
    icon: Users,
  },
  {
    label: 'Page Views',
    value: '89,432',
    change: '+12.5%',
    trend: 'up',
    icon: Eye,
  },
  {
    label: 'Avg. Session',
    value: '3m 24s',
    change: '+5.1%',
    trend: 'up',
    icon: Clock,
  },
  {
    label: 'Bounce Rate',
    value: '42.3%',
    change: '-2.4%',
    trend: 'up',
    icon: TrendingUp,
  },
];

const topPages = [
  { path: '/', title: 'Home', views: 12453, change: '+15%' },
  { path: '/features', title: 'Features', views: 8234, change: '+8%' },
  { path: '/pricing', title: 'Pricing', views: 6521, change: '+22%' },
  { path: '/blog', title: 'Blog', views: 4312, change: '+5%' },
  { path: '/contact', title: 'Contact', views: 2198, change: '-3%' },
];

const topCountries = [
  { country: 'United States', visitors: 8432, percentage: 34.4 },
  { country: 'United Kingdom', visitors: 3521, percentage: 14.4 },
  { country: 'Germany', visitors: 2876, percentage: 11.7 },
  { country: 'France', visitors: 2145, percentage: 8.7 },
  { country: 'Canada', visitors: 1987, percentage: 8.1 },
];

const devices = [
  { device: 'Desktop', icon: Monitor, percentage: 58, color: colors.primary.solid },
  { device: 'Mobile', icon: Smartphone, percentage: 35, color: colors.secondary.solid },
  { device: 'Tablet', icon: Tablet, percentage: 7, color: 'bg-neutral-400 dark:bg-neutral-500' },
];

export default function AnalyticsPage() {
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
            Analytics
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Track your site&apos;s performance and visitor behavior
          </p>
        </div>
        <select
          className={cn(
            'px-4 py-2.5 rounded-xl text-sm cursor-pointer',
            'bg-white dark:bg-neutral-900',
            'border border-neutral-200 dark:border-neutral-800',
            'text-neutral-900 dark:text-white',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
          )}
          aria-label="Select date range"
        >
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
          <option>This year</option>
        </select>
      </motion.div>

      {/* Overview Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" role="region" aria-label="Analytics overview">
        {overviewStats.map((stat, index) => {
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
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.primary.bg)} aria-hidden="true">
                  <Icon className={cn('w-5 h-5', colors.primary.text)} />
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
              <p className="text-2xl font-bold text-neutral-900 dark:text-white tabular-nums">
                {stat.value}
              </p>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                {stat.label}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitors Chart */}
        <div className={cn(
          'p-5 rounded-xl border',
          'bg-white dark:bg-neutral-900',
          'border-neutral-200/60 dark:border-neutral-800/60'
        )} role="region" aria-labelledby="visitors-chart-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="visitors-chart-heading" className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
              Visitors Over Time
            </h2>
            <div className={cn('flex items-center gap-2 text-xs', colors.success.text)}>
              <span className={cn('w-2 h-2 rounded-full animate-pulse', colors.success.solid)}></span>
              <span>Growing</span>
            </div>
          </div>
          <div className="flex items-end gap-0.5 h-12 mb-3">
            {Array.from({ length: 48 }).map((_, i) => {
              const height = 20 + Math.random() * 80;
              const isRecent = i >= 43;
              return (
                <div
                  key={i}
                  className={cn(
                    'flex-1 rounded-sm transition-all',
                    isRecent ? colors.success.solid : 'bg-neutral-200 dark:bg-neutral-800'
                  )}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>24,521 visitors today</span>
            <span>+18.2% from yesterday</span>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className={cn(
          'p-5 rounded-xl border',
          'bg-white dark:bg-neutral-900',
          'border-neutral-200/60 dark:border-neutral-800/60'
        )} role="region" aria-labelledby="devices-heading">
          <h2 id="devices-heading" className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-6">
            Devices
          </h2>
          <div className="space-y-5">
            {devices.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.device}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center" aria-hidden="true">
                        <Icon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                      </div>
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {item.device}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-neutral-900 dark:text-white tabular-nums">
                      {item.percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={item.percentage} aria-valuemin={0} aria-valuemax={100} aria-label={`${item.device}: ${item.percentage}%`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.6 + index * 0.1 }}
                      className={cn('h-full rounded-full', item.color)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Tables Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className={cn(
          'p-5 rounded-xl border',
          'bg-white dark:bg-neutral-900',
          'border-neutral-200/60 dark:border-neutral-800/60'
        )} role="region" aria-labelledby="top-pages-heading">
          <h2 id="top-pages-heading" className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
            Top Pages
          </h2>
          <div className="space-y-0">
            {topPages.map((page, index) => (
              <div
                key={page.path}
                className={cn(
                  'flex items-center justify-between py-3',
                  index < topPages.length - 1 && 'border-b border-neutral-200/60 dark:border-neutral-800/60'
                )}
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    {page.title}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{page.path}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white tabular-nums">
                    {page.views.toLocaleString()}
                  </p>
                  <p
                    className={cn(
                      'text-xs font-medium mt-0.5 tabular-nums',
                      page.change.startsWith('+')
                        ? colors.success.text
                        : colors.error.text
                    )}
                  >
                    {page.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Countries */}
        <div className={cn(
          'p-5 rounded-xl border',
          'bg-white dark:bg-neutral-900',
          'border-neutral-200/60 dark:border-neutral-800/60'
        )} role="region" aria-labelledby="top-countries-heading">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
            <h2 id="top-countries-heading" className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
              Top Countries
            </h2>
          </div>
          <div className="space-y-0">
            {topCountries.map((item, index) => (
              <div
                key={item.country}
                className={cn(
                  'flex items-center justify-between py-3',
                  index < topCountries.length - 1 && 'border-b border-neutral-200/60 dark:border-neutral-800/60'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center" aria-hidden="true">
                    <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                      {item.country.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    {item.country}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white tabular-nums">
                    {item.visitors.toLocaleString()}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums">{item.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
