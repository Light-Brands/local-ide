'use client';

import React, { memo } from 'react';
import { Trash2, Fuel, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContextState } from './ContextProvider';
import { ContextCard } from './ContextCard';

interface ContextDrawerProps {
  className?: string;
}

export const ContextDrawer = memo(function ContextDrawer({
  className,
}: ContextDrawerProps) {
  const {
    items,
    isDrawerOpen,
    removeContext,
    updateContent,
    resetContent,
    clearAll,
  } = useContextState();

  if (!isDrawerOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        'border border-neutral-700/50 rounded-lg bg-neutral-900/95 backdrop-blur-sm overflow-hidden',
        'animate-in slide-in-from-top-2 duration-200',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Fuel className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
            Fuel Tank
          </span>
          <span className="text-[10px] text-neutral-500">
            ({items.length} {items.length === 1 ? 'item' : 'items'})
          </span>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-neutral-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear All
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-[300px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Sparkles className="w-8 h-8 text-neutral-700 mb-3" />
            <p className="text-xs text-neutral-500 mb-1">No context loaded</p>
            <p className="text-[10px] text-neutral-600">
              Use <span className="font-mono text-orange-400">~</span> for workflows,{' '}
              <span className="font-mono text-purple-400">@</span> for agents,{' '}
              <span className="font-mono text-blue-400">/</span> for commands
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {items.map((item) => (
              <ContextCard
                key={item.id}
                item={item}
                onRemove={removeContext}
                onUpdateContent={updateContent}
                onResetContent={resetContent}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
