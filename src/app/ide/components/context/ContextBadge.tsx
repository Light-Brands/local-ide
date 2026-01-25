'use client';

import React, { memo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContextItem } from './ContextProvider';

// Complexity colors for workflows
const COMPLEXITY_COLORS: Record<string, string> = {
  quick: '#10b981',
  sprint: '#0ea5e9',
  project: '#8b5cf6',
  platform: '#f97316',
};

interface ContextBadgeProps {
  items: ContextItem[];
  isOpen: boolean;
  onClick: () => void;
  compact?: boolean;
  className?: string;
}

export const ContextBadge = memo(function ContextBadge({
  items,
  isOpen,
  onClick,
  compact = false,
  className,
}: ContextBadgeProps) {
  if (items.length === 0) {
    return null;
  }

  // Get the primary item (workflow if exists, otherwise first item)
  const workflow = items.find((i) => i.type === 'workflow');
  const primaryItem = workflow || items[0];
  const otherCount = items.length - 1;

  // Determine the gradient color based on the primary item
  const getPrimaryColor = () => {
    if (workflow && workflow.metadata?.complexity) {
      return COMPLEXITY_COLORS[workflow.metadata.complexity as string] || '#f97316';
    }
    if (primaryItem.type === 'workflow') {
      return primaryItem.color || '#f97316';
    }
    switch (primaryItem.type) {
      case 'agent':
        return primaryItem.color || '#a855f7';
      case 'command':
        return '#3b82f6';
      case 'skill':
        return '#f59e0b';
      case 'file':
        return '#22c55e';
      default:
        return '#6b7280';
    }
  };

  const primaryColor = getPrimaryColor();
  const primaryName = primaryItem.displayName || primaryItem.name;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
        'hover:opacity-90',
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
        boxShadow: `0 4px 14px ${primaryColor}40`,
      }}
    >
      <span className="text-white truncate max-w-[120px]">
        {compact ? primaryName.slice(0, 12) : primaryName}
        {compact && primaryName.length > 12 ? '...' : ''}
      </span>
      {otherCount > 0 && (
        <span className="text-white/70">+ {otherCount}</span>
      )}
      {isOpen ? (
        <ChevronDown className="w-3 h-3 text-white/70" />
      ) : (
        <ChevronUp className="w-3 h-3 text-white/70" />
      )}
    </button>
  );
});
