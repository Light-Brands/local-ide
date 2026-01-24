'use client';

import React from 'react';
import {
  FileText,
  Save,
  Edit3,
  FolderOpen,
  Search,
  Terminal,
  Bot,
  Globe,
  Zap,
  Brain,
  Loader2,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OperationType, OperationStatus } from '@/lib/ide/services/operations';

// =============================================================================
// ICON MAPPING
// =============================================================================

const TYPE_ICONS: Record<OperationType, React.ComponentType<{ className?: string }>> = {
  read: FileText,
  write: Save,
  edit: Edit3,
  glob: FolderOpen,
  grep: Search,
  bash: Terminal,
  agent: Bot,
  research: Globe,
  skill: Zap,
  thinking: Brain,
};

const TYPE_COLORS: Record<OperationType, string> = {
  read: 'text-blue-500',
  write: 'text-green-500',
  edit: 'text-amber-500',
  glob: 'text-purple-500',
  grep: 'text-cyan-500',
  bash: 'text-orange-500',
  agent: 'text-pink-500',
  research: 'text-indigo-500',
  skill: 'text-yellow-500',
  thinking: 'text-neutral-400',
};

const TYPE_BG_COLORS: Record<OperationType, string> = {
  read: 'bg-blue-500/10',
  write: 'bg-green-500/10',
  edit: 'bg-amber-500/10',
  glob: 'bg-purple-500/10',
  grep: 'bg-cyan-500/10',
  bash: 'bg-orange-500/10',
  agent: 'bg-pink-500/10',
  research: 'bg-indigo-500/10',
  skill: 'bg-yellow-500/10',
  thinking: 'bg-neutral-500/10',
};

// =============================================================================
// COMPONENT
// =============================================================================

export interface OperationIconProps {
  type: OperationType;
  status?: OperationStatus;
  size?: 'sm' | 'md' | 'lg';
  showBackground?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const CONTAINER_SIZE_CLASSES = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function OperationIcon({
  type,
  status,
  size = 'md',
  showBackground = false,
  className,
}: OperationIconProps) {
  const Icon = TYPE_ICONS[type] || FileText;
  const color = TYPE_COLORS[type] || 'text-neutral-500';
  const bgColor = TYPE_BG_COLORS[type] || 'bg-neutral-500/10';

  // Show status icon overlay for running/completed states
  const showStatusOverlay = status === 'running' || status === 'success' || status === 'error';

  const iconContent = (
    <>
      {status === 'running' ? (
        <Loader2 className={cn(SIZE_CLASSES[size], color, 'animate-spin')} />
      ) : (
        <Icon className={cn(SIZE_CLASSES[size], color)} />
      )}

      {/* Status indicator badge */}
      {showStatusOverlay && status !== 'running' && (
        <span className={cn(
          'absolute -bottom-0.5 -right-0.5 rounded-full',
          size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5',
          status === 'success' && 'bg-green-500',
          status === 'error' && 'bg-red-500',
        )}>
          {status === 'success' && (
            <Check className="w-full h-full text-white p-0.5" />
          )}
          {status === 'error' && (
            <X className="w-full h-full text-white p-0.5" />
          )}
        </span>
      )}
    </>
  );

  if (showBackground) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center rounded-md',
          CONTAINER_SIZE_CLASSES[size],
          bgColor,
          className
        )}
      >
        {iconContent}
      </div>
    );
  }

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {iconContent}
    </div>
  );
}

// =============================================================================
// STATUS INDICATOR (Standalone)
// =============================================================================

export interface StatusIndicatorProps {
  status: OperationStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusIndicator({ status, size = 'md', className }: StatusIndicatorProps) {
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  switch (status) {
    case 'pending':
      return (
        <div className={cn('rounded-full bg-neutral-400', sizeClass, className)} />
      );
    case 'running':
      return (
        <Loader2 className={cn('text-blue-500 animate-spin', sizeClass, className)} />
      );
    case 'success':
      return (
        <Check className={cn('text-green-500', sizeClass, className)} />
      );
    case 'error':
      return (
        <AlertCircle className={cn('text-red-500', sizeClass, className)} />
      );
    case 'cancelled':
      return (
        <X className={cn('text-neutral-400', sizeClass, className)} />
      );
    default:
      return null;
  }
}
