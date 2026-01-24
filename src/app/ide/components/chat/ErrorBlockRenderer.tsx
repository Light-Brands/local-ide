'use client';

import { memo } from 'react';
import { AlertCircle } from 'lucide-react';
import type { ErrorBlock } from '@/types/chat';

interface ErrorBlockRendererProps {
  block: ErrorBlock;
}

export const ErrorBlockRenderer = memo(function ErrorBlockRenderer({
  block,
}: ErrorBlockRendererProps) {
  return (
    <div className="my-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-red-300">{block.content}</div>
          {block.code && (
            <div className="mt-1 text-xs text-red-400/70 font-mono">
              Code: {block.code}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
