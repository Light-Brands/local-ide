'use client';

import React, { memo } from 'react';
import { Trash2, Sparkles, FileCode, Bot, Terminal, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContextState, type ContextFilterType } from './ContextProvider';
import { ContextCard } from './ContextCard';

interface ContextDrawerProps {
  className?: string;
}

// Category configuration with vibrant colors
const CATEGORIES: {
  key: ContextFilterType;
  label: string;
  icon: React.ElementType;
  color: string;
  emptyMessage: string;
}[] = [
  { key: 'file', label: 'Elements', icon: FileCode, color: 'cyan', emptyMessage: 'No files or elements selected' },
  { key: 'agent', label: 'Agents', icon: Bot, color: 'purple', emptyMessage: 'No agents loaded' },
  { key: 'command', label: 'Commands', icon: Terminal, color: 'slate', emptyMessage: 'No commands loaded' },
  { key: 'skill', label: 'Skills', icon: Sparkles, color: 'amber', emptyMessage: 'No skills loaded' },
  { key: 'workflow', label: 'Orchestration', icon: Layers, color: 'orange', emptyMessage: 'No workflow selected' },
];

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  purple: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30' },
  slate: { bg: 'bg-slate-500/10', text: 'text-slate-300', border: 'border-slate-500/30' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
};

export const ContextDrawer = memo(function ContextDrawer({
  className,
}: ContextDrawerProps) {
  const {
    items,
    isDrawerOpen,
    activeFilter,
    removeContext,
    updateContent,
    resetContent,
    togglePersist,
    clearAll,
    getFilteredItems,
  } = useContextState();

  if (!isDrawerOpen) {
    return null;
  }

  const filteredItems = getFilteredItems();

  // Group items by type
  const groupedItems = items.reduce((acc, item) => {
    const type = item.type === 'element' ? 'file' : item.type; // Group elements with files
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  // Get the current category title for filtered view
  const currentCategory = activeFilter ? CATEGORIES.find(c => c.key === activeFilter) : null;

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
          {currentCategory ? (
            <>
              <currentCategory.icon className={cn('w-3.5 h-3.5', COLOR_MAP[currentCategory.color]?.text || 'text-neutral-400')} />
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                {currentCategory.label}
              </span>
            </>
          ) : (
            <>
              <Layers className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                All Context
              </span>
            </>
          )}
          <span className="text-[10px] text-neutral-500">
            ({filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'})
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

      {/* Content - organized by category */}
      <div className="max-h-[70vh] overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Sparkles className="w-8 h-8 text-neutral-700 mb-3" />
            <p className="text-xs text-neutral-500 mb-1">
              {currentCategory ? currentCategory.emptyMessage : 'No context loaded'}
            </p>
            <p className="text-[10px] text-neutral-600">
              Use <span className="font-mono text-orange-400">~</span> for workflows,{' '}
              <span className="font-mono text-purple-400">@</span> for agents,{' '}
              <span className="font-mono text-blue-400">/</span> for commands
            </p>
          </div>
        ) : activeFilter ? (
          // Filtered view - just show the items
          <div className="p-2 space-y-2">
            {filteredItems.map((item) => (
              <ContextCard
                key={item.id}
                item={item}
                onRemove={removeContext}
                onUpdateContent={updateContent}
                onResetContent={resetContent}
                onTogglePersist={togglePersist}
              />
            ))}
          </div>
        ) : (
          // All items view - grouped by category
          <div className="p-2 space-y-3">
            {CATEGORIES.map(({ key, label, icon: Icon, color }) => {
              const categoryItems = key === 'file'
                ? [...(groupedItems['file'] || []), ...(groupedItems['element'] || [])]
                : groupedItems[key as string] || [];

              if (categoryItems.length === 0) return null;

              const colors = COLOR_MAP[color] || COLOR_MAP.orange;

              return (
                <div key={key} className={cn('rounded-lg border', colors.border, colors.bg)}>
                  {/* Category header */}
                  <div className="flex items-center gap-2 px-2 py-1.5 border-b border-neutral-700/30">
                    <Icon className={cn('w-3 h-3', colors.text)} />
                    <span className={cn('text-[10px] font-semibold uppercase tracking-wider', colors.text)}>
                      {label}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      ({categoryItems.length})
                    </span>
                  </div>
                  {/* Category items */}
                  <div className="p-1.5 space-y-1.5">
                    {categoryItems.map((item) => (
                      <ContextCard
                        key={item.id}
                        item={item}
                        onRemove={removeContext}
                        onUpdateContent={updateContent}
                        onResetContent={resetContent}
                        onTogglePersist={togglePersist}
                        compact
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
