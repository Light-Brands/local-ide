'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import {
  FileCode,
  FolderOpen,
  Terminal,
  Code,
  X,
  ChevronDown,
  ChevronRight,
  Info,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface ContextItem {
  type: 'file' | 'selection' | 'terminal' | 'custom';
  label: string;
  content?: string;
  icon?: React.ReactNode;
}

interface ContextPanelProps {
  activeFile?: string | null;
  selectedCode?: string;
  terminalOutput?: string;
  customContext?: ContextItem[];
  onRemoveContext?: (index: number) => void;
  className?: string;
}

const ContextItem = memo(function ContextItem({
  item,
  index,
  onRemove,
  isExpanded,
  onToggle,
}: {
  item: ContextItem;
  index: number;
  onRemove?: (index: number) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const getIcon = () => {
    switch (item.type) {
      case 'file':
        return <FileCode className="w-3.5 h-3.5 text-blue-400" />;
      case 'selection':
        return <Code className="w-3.5 h-3.5 text-amber-400" />;
      case 'terminal':
        return <Terminal className="w-3.5 h-3.5 text-green-400" />;
      default:
        return item.icon || <Info className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  return (
    <div className="rounded-lg bg-neutral-800/50 border border-neutral-700/50 overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-neutral-700/30 transition-colors"
        onClick={onToggle}
      >
        {item.content && (
          isExpanded ? (
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          ) : (
            <ChevronRight className="w-3 h-3 text-neutral-500" />
          )
        )}
        {getIcon()}
        <span className="text-xs text-neutral-300 flex-1 truncate">{item.label}</span>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            className="p-0.5 rounded hover:bg-neutral-600 text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {item.content && isExpanded && (
        <div className="px-3 pb-2 max-h-32 overflow-y-auto">
          <pre className="text-[10px] text-neutral-400 font-mono whitespace-pre-wrap break-all">
            {item.content.length > 500 ? item.content.slice(0, 500) + '...' : item.content}
          </pre>
        </div>
      )}
    </div>
  );
});

export const ContextPanel = memo(function ContextPanel({
  activeFile,
  selectedCode,
  terminalOutput,
  customContext = [],
  onRemoveContext,
  className,
}: ContextPanelProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Build context items
  const contextItems: ContextItem[] = [];

  if (activeFile) {
    contextItems.push({
      type: 'file',
      label: activeFile.split('/').pop() || activeFile,
      content: undefined, // File content shown separately
    });
  }

  if (selectedCode) {
    contextItems.push({
      type: 'selection',
      label: 'Selected code',
      content: selectedCode,
    });
  }

  if (terminalOutput) {
    contextItems.push({
      type: 'terminal',
      label: 'Recent terminal output',
      content: terminalOutput,
    });
  }

  // Add custom context
  contextItems.push(...customContext);

  const toggleExpanded = (index: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  if (contextItems.length === 0) {
    return null;
  }

  return (
    <div className={cn('p-2 border-b border-neutral-800', className)}>
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
          Context ({contextItems.length})
        </span>
      </div>
      <div className="space-y-1.5">
        {contextItems.map((item, index) => (
          <ContextItem
            key={index}
            item={item}
            index={index}
            onRemove={onRemoveContext}
            isExpanded={expandedItems.has(index)}
            onToggle={() => toggleExpanded(index)}
          />
        ))}
      </div>
    </div>
  );
});

// Compact version for mobile
export const ContextPanelCompact = memo(function ContextPanelCompact({
  activeFile,
  selectedCode,
  className,
}: {
  activeFile?: string | null;
  selectedCode?: string;
  className?: string;
}) {
  const hasContext = activeFile || selectedCode;

  if (!hasContext) {
    return null;
  }

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 bg-neutral-800/50 border-b border-neutral-800',
      className
    )}>
      <Zap className="w-3 h-3 text-amber-400" />
      <span className="text-[10px] text-neutral-500">Context:</span>
      <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide">
        {activeFile && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] whitespace-nowrap">
            <FileCode className="w-3 h-3" />
            {activeFile.split('/').pop()}
          </span>
        )}
        {selectedCode && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] whitespace-nowrap">
            <Code className="w-3 h-3" />
            Selection
          </span>
        )}
      </div>
    </div>
  );
});
