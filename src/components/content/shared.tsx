'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon, FileText, Image, Video, File, Music, Archive } from 'lucide-react';

// Status badge component for content items
export function ContentStatusBadge({
  status,
}: {
  status: 'draft' | 'published' | 'archived' | 'scheduled' | 'processing' | 'failed';
}) {
  const config = {
    draft: {
      label: 'Draft',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
    published: {
      label: 'Published',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    archived: {
      label: 'Archived',
      className: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
    },
    scheduled: {
      label: 'Scheduled',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    processing: {
      label: 'Processing',
      className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    },
    failed: {
      label: 'Failed',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
  };

  const { label, className } = config[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider',
        className
      )}
    >
      {status === 'processing' && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1.5" />
      )}
      {label}
    </span>
  );
}

// Media type icon helper
export function getMediaIcon(type: string): LucideIcon {
  const typeMap: Record<string, LucideIcon> = {
    image: Image,
    video: Video,
    audio: Music,
    document: FileText,
    archive: Archive,
  };
  return typeMap[type] || File;
}

// Content card component
export function ContentCard({
  title,
  subtitle,
  status,
  icon: Icon,
  onClick,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  status?: 'draft' | 'published' | 'archived' | 'scheduled';
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        'p-4 rounded-2xl cursor-pointer',
        'bg-white dark:bg-neutral-900',
        'border border-neutral-200/60 dark:border-neutral-800/60',
        'hover:shadow-lg hover:shadow-neutral-900/[0.04] dark:hover:shadow-neutral-950/30',
        'transition-all duration-300',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <Icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">{title}</h3>
            {subtitle && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p>
            )}
          </div>
        </div>
        {status && <ContentStatusBadge status={status} />}
      </div>
      {children}
    </motion.div>
  );
}

// Stat card for overview dashboards
export function ContentStatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  gradient,
}: {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  gradient?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        'p-5 rounded-2xl',
        'bg-white dark:bg-neutral-900',
        'border border-neutral-200/60 dark:border-neutral-800/60',
        'hover:shadow-lg transition-all duration-300'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        {icon && (
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              gradient ? `bg-gradient-to-br ${gradient} shadow-lg` : 'bg-neutral-100 dark:bg-neutral-800'
            )}
          >
            {icon}
          </div>
        )}
        {change && (
          <span
            className={cn(
              'text-xs font-semibold px-2 py-1 rounded-full',
              changeType === 'up' && 'text-success bg-success/10 dark:text-success dark:bg-success/20',
              changeType === 'down' && 'text-error bg-error/10 dark:text-error dark:bg-error/20',
              changeType === 'neutral' && 'text-neutral-600 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-800'
            )}
          >
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{label}</p>
    </motion.div>
  );
}

// AI prompt input component
export function AIPromptInput({
  value,
  onChange,
  onGenerate,
  placeholder = 'Describe what you want to generate...',
  isGenerating = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  placeholder?: string;
  isGenerating?: boolean;
}) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className={cn(
          'w-full px-4 py-3 rounded-xl resize-none',
          'bg-neutral-50 dark:bg-neutral-800',
          'border border-neutral-200 dark:border-neutral-700',
          'text-neutral-900 dark:text-white',
          'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
          'transition-all duration-200'
        )}
      />
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onGenerate}
        disabled={isGenerating || !value.trim()}
        className={cn(
          'absolute bottom-3 right-3 px-4 py-2 rounded-lg',
          'bg-gradient-to-r from-primary-500 to-secondary-500',
          'text-white text-sm font-medium',
          'shadow-lg shadow-primary-500/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-all duration-200'
        )}
      >
        {isGenerating ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </span>
        ) : (
          'Generate'
        )}
      </motion.button>
    </div>
  );
}

// Queue item component
export function QueueItem({
  title,
  type,
  status,
  progress,
  onCancel,
  onRetry,
}: {
  title: string;
  type: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  progress?: number;
  onCancel?: () => void;
  onRetry?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 rounded-xl',
        'bg-white dark:bg-neutral-900',
        'border border-neutral-200/60 dark:border-neutral-800/60'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="font-medium text-neutral-900 dark:text-white text-sm">{title}</h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{type}</p>
        </div>
        <ContentStatusBadge status={status === 'queued' ? 'scheduled' : status === 'complete' ? 'published' : status} />
      </div>
      {status === 'processing' && progress !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
            />
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{progress}% complete</p>
        </div>
      )}
      {(status === 'failed' || status === 'queued') && (
        <div className="flex gap-2 mt-3">
          {status === 'failed' && onRetry && (
            <button
              onClick={onRetry}
              className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              Retry
            </button>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Animation variants for consistent page transitions
export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const itemVariants = {
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
