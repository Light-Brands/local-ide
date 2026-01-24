'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Terminal, Plus, X, MoreVertical } from 'lucide-react';

export interface TerminalTab {
  id: string;
  name: string;
  isActive: boolean;
  hasActivity?: boolean;
}

interface TerminalTabsProps {
  tabs: TerminalTab[];
  activeTabId: string;
  onTabSelect: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
  maxTabs?: number;
}

export const TerminalTabs = memo(function TerminalTabs({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab,
  maxTabs = 5,
}: TerminalTabsProps) {
  const canAddTab = tabs.length < maxTabs;

  return (
    <div className="flex items-center bg-neutral-900/50 border-b border-neutral-800 overflow-x-auto scrollbar-hide">
      {/* Tabs */}
      <div className="flex items-center flex-1 min-w-0">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;

          return (
            <div
              key={tab.id}
              role="tab"
              tabIndex={0}
              onClick={() => onTabSelect(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onTabSelect(tab.id);
                }
              }}
              className={cn(
                'group flex items-center gap-2 px-3 py-1.5 text-xs border-r border-neutral-800 transition-colors min-w-0 cursor-pointer',
                isActive
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              )}
            >
              <Terminal className={cn(
                'w-3 h-3 flex-shrink-0',
                isActive ? 'text-green-400' : 'text-neutral-500'
              )} />

              <span className="truncate max-w-[80px]">{tab.name}</span>

              {tab.hasActivity && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 animate-pulse" />
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className={cn(
                  'p-0.5 rounded transition-colors flex-shrink-0',
                  'hover:bg-neutral-700 text-neutral-500 hover:text-neutral-200',
                  !isActive && 'opacity-0 group-hover:opacity-100'
                )}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* New tab button */}
      {canAddTab && (
        <button
          onClick={onNewTab}
          className="flex-shrink-0 p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          title="New terminal"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
});
