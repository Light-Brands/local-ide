'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// =============================================================================
// Status Badge Component
// =============================================================================

type EpicStatus = 'not-started' | 'in-progress' | 'blocked' | 'complete';
type TaskStatus = 'pending' | 'in-progress' | 'complete' | 'blocked';

// Uses semantic tokens: warning for in-progress, error for blocked, success for complete
const statusConfig: Record<EpicStatus, { label: string; className: string }> = {
  'not-started': {
    label: 'Not Started',
    className: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400',
  },
  'in-progress': {
    label: 'In Progress',
    className: 'bg-warning/10 text-warning border border-warning/30',
  },
  blocked: {
    label: 'Blocked',
    className: 'bg-error/10 text-error border border-error/30',
  },
  complete: {
    label: 'Complete',
    className: 'bg-success/10 text-success border border-success/30',
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

import { Circle, Clock, CheckCircle2, XCircle } from 'lucide-react';

// Uses semantic tokens for task status indicators
export const taskStatusConfig: Record<TaskStatus, { icon: React.ElementType; className: string }> = {
  pending: { icon: Circle, className: 'text-neutral-400' },
  'in-progress': { icon: Clock, className: 'text-warning animate-pulse' },
  complete: { icon: CheckCircle2, className: 'text-success' },
  blocked: { icon: XCircle, className: 'text-error' },
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

  // Semantic color mapping for progress ring strokes
  const colorClass = {
    'not-started': 'stroke-neutral-300 dark:stroke-neutral-600',
    'in-progress': 'stroke-warning',
    blocked: 'stroke-error',
    complete: 'stroke-success',
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

// Semantic glow color type
type GlowColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: GlowColor;
}

export function GlowCard({
  children,
  className,
  glowColor = 'primary',
}: GlowCardProps) {
  // Semantic glow colors using CSS variables
  const glowColors = {
    primary: 'hover:shadow-primary/20',
    secondary: 'hover:shadow-secondary/20',
    success: 'hover:shadow-success/20',
    warning: 'hover:shadow-warning/20',
    error: 'hover:shadow-error/20',
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60',
        'transition-all duration-300 hover:shadow-lg',
        glowColors[glowColor] || glowColors.primary,
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

// Semantic color type for StatCard
type StatCardColor = 'default' | 'primary' | 'success' | 'warning' | 'error';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  color?: StatCardColor;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  color = 'default',
}: StatCardProps) {
  // Semantic background colors
  const colorStyles: Record<StatCardColor, string> = {
    default: 'bg-white dark:bg-neutral-900',
    primary: 'bg-accent dark:bg-accent',
    success: 'bg-success/10',
    warning: 'bg-warning/10',
    error: 'bg-error/10',
  };

  // Semantic text colors
  const valueColors: Record<StatCardColor, string> = {
    default: 'text-neutral-900 dark:text-white',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
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
                ? 'bg-success/10 dark:bg-success/20 text-success dark:text-success'
                : 'bg-error/10 dark:bg-error/20 text-error dark:text-error'
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

import {
  Database,
  Plug,
  Settings,
  Puzzle,
  TestTube,
  Zap,
} from 'lucide-react';

export const typeIcons: Record<string, React.ElementType> = {
  table: Database,
  endpoint: Plug,
  service: Settings,
  component: Puzzle,
  test: TestTube,
  config: Zap,
};
