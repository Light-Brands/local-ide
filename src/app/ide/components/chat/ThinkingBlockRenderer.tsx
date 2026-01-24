'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Brain } from 'lucide-react';
import type { ThinkingBlock } from '@/types/chat';

interface ThinkingBlockRendererProps {
  block: ThinkingBlock;
  onToggle: () => void;
}

export const ThinkingBlockRenderer = memo(function ThinkingBlockRenderer({
  block,
  onToggle,
}: ThinkingBlockRendererProps) {
  return (
    <div className="my-2 border border-neutral-700 rounded-lg overflow-hidden bg-neutral-800/30">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 p-3 hover:bg-neutral-800/50 transition-colors text-left"
      >
        <ChevronRight
          className={cn(
            'w-4 h-4 text-neutral-400 transition-transform duration-200',
            !block.collapsed && 'rotate-90'
          )}
        />
        <Brain className="w-4 h-4 text-purple-400" />
        <span className="text-sm text-neutral-400 font-medium">Thinking...</span>
        {block.collapsed && block.content && (
          <span className="text-xs text-neutral-500 truncate ml-2 flex-1">
            {block.content.slice(0, 60)}
            {block.content.length > 60 ? '...' : ''}
          </span>
        )}
      </button>

      {!block.collapsed && (
        <div className="px-3 pb-3 pt-0">
          <div className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-700/50">
            <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed">
              {block.content || '(thinking...)'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
});
