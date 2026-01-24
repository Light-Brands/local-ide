'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ListTodo,
  Bug,
  Bot,
  ArrowRight,
  GitBranch,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
  Code2,
  Terminal,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  epicData,
  getEpicStatus,
  getEpicProgress,
  getEpicTaskCounts,
  getTotalProgress,
} from '@/data/dev/trackerData';
import { statusColors, colors } from '@/lib/design/tokens';

// Smooth animation config
const spring = { type: 'spring' as const, stiffness: 300, damping: 30 };

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } 
  },
};

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

// Dev tools config - using design token gradients
const devTools = [
  {
    title: 'Tracker',
    description: 'Epics, tasks & progress',
    href: '/admin/dev/tracker',
    icon: ListTodo,
    gradient: colors.secondary.gradient,
  },
  {
    title: 'Feedback',
    description: 'Capture & manage issues',
    href: '/admin/dev/feedback',
    icon: Bug,
    gradient: colors.primary.gradient,
  },
  {
    title: 'AutoDev',
    description: 'AI-powered operations',
    href: '/admin/dev/autodev',
    icon: Bot,
    gradient: colors.secondary.gradient,
  },
];

// Spec links
const specLinks = [
  { title: 'Architecture', icon: Layers },
  { title: 'API Routes', icon: Code2 },
  { title: 'Components', icon: Zap },
  { title: 'Development', icon: Terminal },
];

// Status icons
const statusIcons = {
  'complete': CheckCircle2,
  'in-progress': Clock,
  'blocked': AlertCircle,
  'not-started': Clock,
};

export default function DevDashboard() {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const progress = getTotalProgress();

  const completedEpics = epicData.filter(e => getEpicStatus(e) === 'complete').length;
  const inProgressEpics = epicData.filter(e => getEpicStatus(e) === 'in-progress').length;
  const totalTasks = progress.total;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header with Progress Ring */}
      <motion.div variants={fadeUp} className="relative">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Title Section */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight font-mono">
                DEVELOPER
              </h1>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 ml-4 text-sm font-mono">
              [COMMAND_CENTER] Development operations
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  className="stroke-neutral-200 dark:stroke-neutral-800"
                  strokeWidth="6"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="6"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: progress.percentage / 100 }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    strokeDasharray: '226.195',
                    strokeDashoffset: '0',
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-neutral-900 dark:text-white font-mono tabular-nums">
                  {Math.round(progress.percentage)}%
                </span>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-neutral-900 dark:text-white font-mono tabular-nums">
                {progress.completed}/{progress.total}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">TASKS</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Row */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        {[
          { label: 'COMPLETE', value: completedEpics, color: colors.success.text },
          { label: 'IN_PROGRESS', value: inProgressEpics, color: colors.warning.text },
          { label: 'TOTAL', value: totalTasks, color: 'text-neutral-900 dark:text-white' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'p-4 rounded-xl border',
              'bg-white dark:bg-neutral-900',
              'border-neutral-200/60 dark:border-neutral-800/60'
            )}
          >
            <div className={cn('text-2xl font-bold font-mono tabular-nums', stat.color)}>{stat.value}</div>
            <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Dev Tools */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-primary rounded-full" />
            <h2 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
              SYSTEMS
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {devTools.map((tool) => {
            const Icon = tool.icon;
            const isHovered = hoveredTool === tool.title;

            return (
              <motion.div
                key={tool.title}
                onHoverStart={() => setHoveredTool(tool.title)}
                onHoverEnd={() => setHoveredTool(null)}
                whileHover={{ y: -2 }}
                transition={spring}
              >
                <Link
                  href={tool.href}
                  className={cn(
                    'block p-5 rounded-xl border transition-all duration-300',
                    'bg-white dark:bg-neutral-900',
                    'border-neutral-200/60 dark:border-neutral-800/60',
                    'hover:border-primary/50 dark:hover:border-primary/50',
                    'hover:shadow-lg hover:shadow-primary/5'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        'w-11 h-11 rounded-lg flex items-center justify-center relative',
                        'bg-gradient-to-br',
                        tool.gradient,
                        'after:absolute after:inset-0 after:rounded-lg after:bg-white/10 after:opacity-0 hover:after:opacity-100 after:transition-opacity'
                      )}
                    >
                      <Icon className="w-5 h-5 text-white relative z-10" />
                    </div>
                    <motion.div
                      animate={{ x: isHovered ? 0 : -4, opacity: isHovered ? 1 : 0 }}
                      transition={spring}
                    >
                      <ArrowRight className="w-5 h-5 text-primary" />
                    </motion.div>
                  </div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white mt-4 font-mono text-sm">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-mono">
                    {tool.description}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Epic Progress */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-primary rounded-full" />
            <h2 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
              EPIC_STATUS
            </h2>
          </div>
          <Link
            href="/admin/dev/tracker"
            className={cn('text-xs font-mono hover:underline flex items-center gap-1', colors.primary.text)}
          >
            VIEW_ALL
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {epicData.map((epic) => {
            const status = getEpicStatus(epic);
            const epicProgress = getEpicProgress(epic);
            const counts = getEpicTaskCounts(epic);
            const StatusIcon = statusIcons[status];

            return (
              <Link
                key={epic.epicId}
                href={`/admin/dev/tracker?epic=${epic.epicId}`}
                className={cn(
                  'group block p-4 rounded-xl border transition-all duration-200',
                  'bg-white dark:bg-neutral-900',
                  'border-neutral-200/60 dark:border-neutral-800/60',
                  'hover:border-primary/50 dark:hover:border-primary/50',
                  status === 'blocked' && statusColors.blocked.border
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-mono">
                    {epic.epicId}
                  </span>
                  <StatusIcon
                    className={cn(
                      'w-4 h-4',
                      status === 'complete' && statusColors.completed.text,
                      status === 'in-progress' && statusColors['in-progress'].text,
                      status === 'blocked' && statusColors.blocked.text,
                      status === 'not-started' && 'text-neutral-300 dark:text-neutral-600'
                    )}
                  />
                </div>
                <h3 className="text-sm font-medium text-neutral-900 dark:text-white line-clamp-1 font-mono">
                  {epic.epicName}
                </h3>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1.5 font-mono tabular-nums">
                    <span>{counts.completed}/{counts.total}</span>
                    <span>{Math.round(epicProgress)}%</span>
                  </div>
                  <div className="h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden relative">
                    <motion.div
                      className={cn(
                        'h-full rounded-full relative',
                        status === 'complete' && statusColors.completed.solid,
                        status === 'in-progress' && statusColors['in-progress'].solid,
                        status === 'blocked' && statusColors.blocked.solid,
                        status === 'not-started' && 'bg-neutral-300 dark:bg-neutral-600',
                        'after:absolute after:right-0 after:top-0 after:w-0.5 after:h-full after:bg-white/30'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${epicProgress}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documentation */}
        <motion.div
          variants={fadeUp}
          className={cn(
            'p-5 rounded-xl border',
            'bg-white dark:bg-neutral-900',
            'border-neutral-200/60 dark:border-neutral-800/60'
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-primary rounded-full" />
            <h2 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
              DOCS
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {specLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.title}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg text-left border transition-all',
                    'bg-neutral-50 dark:bg-neutral-800/50',
                    'border-neutral-200/50 dark:border-neutral-700/50',
                    'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                    'hover:border-primary/30 dark:hover:border-primary/30'
                  )}
                >
                  <Icon className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 font-mono">
                    {link.title}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          variants={fadeUp}
          className={cn(
            'p-5 rounded-xl border',
            'bg-white dark:bg-neutral-900',
            'border-neutral-200/60 dark:border-neutral-800/60'
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-primary rounded-full" />
            <h2 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
              LOG
            </h2>
          </div>
          <div className="space-y-2">
            {[
              { action: 'UPDATED', item: 'AdminSidebar', time: '00:00' },
              { action: 'CREATED', item: 'Dev Dashboard', time: '00:05' },
              { action: 'COMPLETE', item: 'Auth Service', time: '01:00' },
              { action: 'STARTED', item: 'Analytics API', time: '02:00' },
            ].map((activity, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2 border-b border-neutral-200/60 dark:border-neutral-800/60 last:border-0"
              >
                <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-neutral-600 dark:text-neutral-300 font-mono">
                    <span className="text-neutral-400 dark:text-neutral-500">{activity.action}</span>{' '}
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {activity.item}
                    </span>
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 flex-shrink-0 font-mono tabular-nums">{activity.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
