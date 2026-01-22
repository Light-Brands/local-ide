'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Terminal,
  ListTodo,
  Bug,
  Bot,
  ChevronRight,
  Zap,
  GitBranch,
  Code2,
  Layers,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  epicData,
  getEpicStatus,
  getEpicProgress,
  getEpicTaskCounts,
  getTotalProgress,
} from '@/data/dev/trackerData';
import { ProgressRing, StatusBadge, StatCard } from '@/components/dev/shared';

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

// Quick action cards for dev tools
const devTools = [
  {
    title: 'Dev Tracker',
    description: 'Track epics, tasks, and progress',
    href: '/admin/dev/tracker',
    icon: ListTodo,
    color: 'from-blue-500 to-indigo-500',
    shadowColor: 'shadow-blue-500/20',
  },
  {
    title: 'Dev Feedback',
    description: 'Capture contextual feedback',
    href: '/admin/dev/feedback',
    icon: Bug,
    color: 'from-amber-500 to-orange-500',
    shadowColor: 'shadow-amber-500/20',
  },
  {
    title: 'AutoDev',
    description: 'AI-powered operations',
    href: '/admin/dev/autodev',
    icon: Bot,
    color: 'from-violet-500 to-purple-500',
    shadowColor: 'shadow-violet-500/20',
  },
];

// Spec documentation links
const specLinks = [
  {
    title: 'Architecture',
    description: 'System design & data models',
    icon: Layers,
    color: 'text-violet-500 bg-violet-100 dark:bg-violet-900/30',
  },
  {
    title: 'API Routes',
    description: 'Endpoint documentation',
    icon: Code2,
    color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  },
  {
    title: 'Components',
    description: 'UI component library',
    icon: Zap,
    color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
  },
  {
    title: 'Development',
    description: 'Coding rules & agents',
    icon: Terminal,
    color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30',
  },
];

export default function DevDashboard() {
  const [hoveredEpic, setHoveredEpic] = useState<string | null>(null);
  const progress = getTotalProgress();

  // Calculate stats
  const completedEpics = epicData.filter(e => getEpicStatus(e) === 'complete').length;
  const inProgressEpics = epicData.filter(e => getEpicStatus(e) === 'in-progress').length;

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
            Developer Dashboard
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Development command center for local-ide
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Overall Progress"
          value={`${progress.percentage.toFixed(0)}%`}
          icon={<Activity className="w-5 h-5 text-primary-500" />}
          color="primary"
        />
        <StatCard
          label="Epics Complete"
          value={completedEpics}
          icon={<GitBranch className="w-5 h-5 text-emerald-500" />}
          color="emerald"
        />
        <StatCard
          label="In Progress"
          value={inProgressEpics}
          icon={<Zap className="w-5 h-5 text-amber-500" />}
          color="amber"
        />
        <StatCard
          label="Total Tasks"
          value={progress.total}
          icon={<ListTodo className="w-5 h-5 text-neutral-500" />}
        />
      </motion.div>

      {/* Dev Tools Quick Access */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
            Developer Tools
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {devTools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  href={tool.href}
                  className={cn(
                    'block p-5 rounded-2xl',
                    'bg-white dark:bg-neutral-900',
                    'border border-neutral-200/60 dark:border-neutral-800/60',
                    'hover:shadow-lg transition-all duration-300',
                    tool.shadowColor
                  )}
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                      'bg-gradient-to-br text-white shadow-lg',
                      tool.color,
                      tool.shadowColor
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {tool.description}
                  </p>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary-600 dark:text-primary-400">
                    Open
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Epic Progress Grid */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
            Epic Progress
          </h2>
          <Link
            href="/admin/dev/tracker"
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center"
          >
            View All
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {epicData.map((epic, index) => {
            const status = getEpicStatus(epic);
            const progress = getEpicProgress(epic);
            const counts = getEpicTaskCounts(epic);
            const isHovered = hoveredEpic === epic.epicId;

            return (
              <motion.div
                key={epic.epicId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                onMouseEnter={() => setHoveredEpic(epic.epicId)}
                onMouseLeave={() => setHoveredEpic(null)}
              >
                <Link
                  href={`/admin/dev/tracker?epic=${epic.epicId}`}
                  className={cn(
                    'block p-4 rounded-2xl border transition-all duration-300',
                    'bg-white dark:bg-neutral-900',
                    status === 'blocked'
                      ? 'border-red-200 dark:border-red-900/50'
                      : 'border-neutral-200/60 dark:border-neutral-800/60',
                    isHovered && status !== 'blocked' && 'shadow-lg scale-[1.02]'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                        {epic.epicId}
                      </span>
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {epic.epicName}
                      </h3>
                      <span
                        className={cn(
                          'text-[10px] uppercase tracking-wider font-medium',
                          epic.phase === 'Foundation'
                            ? 'text-amber-500'
                            : epic.phase === 'MVP'
                            ? 'text-blue-500'
                            : 'text-emerald-500'
                        )}
                      >
                        {epic.phase}
                      </span>
                    </div>
                    <StatusBadge status={status} />
                  </div>

                  <div className="flex items-center gap-3">
                    <ProgressRing percentage={progress} size={56} strokeWidth={5} status={status} />
                    <div className="flex-1 text-xs">
                      <div className="text-neutral-900 dark:text-white font-medium">
                        {counts.completed}/{counts.total} tasks
                      </div>
                      <div className="text-neutral-500 dark:text-neutral-400">
                        {counts.inProgress} in progress
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Spec Documentation & Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spec Documentation */}
        <motion.div
          variants={itemVariants}
          className={cn(
            'p-5 rounded-2xl',
            'bg-white dark:bg-neutral-900',
            'border border-neutral-200/60 dark:border-neutral-800/60'
          )}
        >
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
            Documentation
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {specLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <motion.button
                  key={link.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl text-left',
                    'bg-neutral-50 dark:bg-neutral-800/50',
                    'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                    'transition-colors'
                  )}
                >
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', link.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-900 dark:text-white">
                      {link.title}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {link.description}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          variants={itemVariants}
          className={cn(
            'p-5 rounded-2xl',
            'bg-white dark:bg-neutral-900',
            'border border-neutral-200/60 dark:border-neutral-800/60'
          )}
        >
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {[
              { action: 'Updated', item: 'AdminSidebar', time: 'Just now', type: 'component' },
              { action: 'Created', item: 'Dev Dashboard', time: '5 min ago', type: 'component' },
              { action: 'Completed', item: 'Auth Service', time: '1 hour ago', type: 'service' },
              { action: 'In Progress', item: 'Analytics API', time: '2 hours ago', type: 'endpoint' },
            ].map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-xs font-medium">
                  {activity.type === 'component' ? '🧩' : activity.type === 'service' ? '⚙️' : '🔌'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-900 dark:text-white">
                    <span className="font-medium">{activity.action}</span>{' '}
                    <span className="text-neutral-500 dark:text-neutral-400">{activity.item}</span>
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
