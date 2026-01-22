'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// =============================================================================
// Status Badge Component
// =============================================================================

type EpicStatus = 'not-started' | 'in-progress' | 'blocked' | 'complete';
type TaskStatus = 'pending' | 'in-progress' | 'complete' | 'blocked';

const statusConfig: Record<EpicStatus, { label: string; className: string }> = {
  'not-started': {
    label: 'Not Started',
    className: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400',
  },
  'in-progress': {
    label: 'In Progress',
    className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  },
  blocked: {
    label: 'Blocked',
    className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
  },
  complete: {
    label: 'Complete',
    className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  },
};

export function StatusBadge({ status }: { status: EpicStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

// =============================================================================
// Task Status Config
// =============================================================================

export const taskStatusConfig: Record<TaskStatus, { icon: string; className: string }> = {
  pending: { icon: '○', className: 'text-neutral-400' },
  'in-progress': { icon: '◐', className: 'text-amber-500 animate-pulse' },
  complete: { icon: '●', className: 'text-emerald-500' },
  blocked: { icon: '⊘', className: 'text-red-500' },
};

// =============================================================================
// Progress Ring Component
// =============================================================================

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  status: EpicStatus;
}

export function ProgressRing({
  percentage,
  size = 80,
  strokeWidth = 6,
  status,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const colorClass = {
    'not-started': 'stroke-neutral-300 dark:stroke-neutral-600',
    'in-progress': 'stroke-amber-500',
    blocked: 'stroke-red-500',
    complete: 'stroke-emerald-500',
  }[status];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="stroke-neutral-200 dark:stroke-neutral-800"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          className={cn(colorClass, 'transition-all duration-500 ease-out')}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-neutral-900 dark:text-white">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Sparkline Component
// =============================================================================

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = 'currentColor',
}: SparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// =============================================================================
// Animated Number Component
// =============================================================================

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1000,
  className,
}: AnimatedNumberProps) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key={value}
    >
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration / 1000 }}
      >
        {value.toLocaleString()}
      </motion.span>
    </motion.span>
  );
}

// =============================================================================
// Glow Card Component
// =============================================================================

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlowCard({
  children,
  className,
  glowColor = 'primary',
}: GlowCardProps) {
  const glowColors = {
    primary: 'hover:shadow-primary-500/20',
    emerald: 'hover:shadow-emerald-500/20',
    amber: 'hover:shadow-amber-500/20',
    red: 'hover:shadow-red-500/20',
    violet: 'hover:shadow-violet-500/20',
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60',
        'transition-all duration-300 hover:shadow-lg',
        glowColors[glowColor as keyof typeof glowColors] || glowColors.primary,
        className
      )}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Section Header Component
// =============================================================================

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

// =============================================================================
// Stat Card Component
// =============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  color?: 'default' | 'primary' | 'emerald' | 'amber' | 'red';
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  color = 'default',
}: StatCardProps) {
  const colorStyles = {
    default: 'bg-white dark:bg-neutral-900',
    primary: 'bg-primary-50 dark:bg-primary-900/20',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20',
    amber: 'bg-amber-50 dark:bg-amber-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
  };

  const valueColors = {
    default: 'text-neutral-900 dark:text-white',
    primary: 'text-primary-600 dark:text-primary-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
  };

  return (
    <div
      className={cn(
        'p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60',
        colorStyles[color]
      )}
    >
      <div className="flex items-start justify-between">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            {icon}
          </div>
        )}
        {trend && (
          <span
            className={cn(
              'text-xs font-semibold px-2 py-1 rounded-full',
              trend.direction === 'up'
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            )}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className={cn('text-2xl font-bold', valueColors[color])}>{value}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mt-1">
          {label}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Type Icons
// =============================================================================

export const typeIcons: Record<string, string> = {
  table: '🗄️',
  endpoint: '🔌',
  service: '⚙️',
  component: '🧩',
  test: '🧪',
  config: '⚡',
};
