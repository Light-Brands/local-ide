'use client';

import { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  Loader2,
  Check,
  X,
  Wrench,
  FileText,
  Search,
  Terminal,
  FolderOpen,
  Edit3,
  Copy,
} from 'lucide-react';
import type { ToolUseBlock } from '@/types/chat';

interface ToolUseBlockRendererProps {
  block: ToolUseBlock;
}

// Map tool names to icons
const toolIcons: Record<string, typeof Wrench> = {
  read_file: FileText,
  write_file: Edit3,
  list_files: FolderOpen,
  search_code: Search,
  bash: Terminal,
  grep: Search,
  glob: FolderOpen,
};

export const ToolUseBlockRenderer = memo(function ToolUseBlockRenderer({
  block,
}: ToolUseBlockRendererProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const Icon = toolIcons[block.tool] || Wrench;

  const statusIcon = {
    running: <Loader2 className="w-4 h-4 animate-spin text-blue-400" />,
    success: <Check className="w-4 h-4 text-green-400" />,
    error: <X className="w-4 h-4 text-red-400" />,
  }[block.status];

  const statusColor = {
    running: 'border-blue-500/30 bg-blue-500/5',
    success: 'border-green-500/30 bg-green-500/5',
    error: 'border-red-500/30 bg-red-500/5',
  }[block.status];

  const handleCopy = () => {
    const text = block.output || JSON.stringify(block.input, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format input for display
  const formatInput = () => {
    if (!block.input || Object.keys(block.input).length === 0) {
      return null;
    }

    // For bash commands, show the command directly
    if (block.tool === 'bash' && block.input.command) {
      return block.input.command as string;
    }

    // For file operations, show the path
    if (block.input.path || block.input.file_path) {
      return (block.input.path || block.input.file_path) as string;
    }

    // For search, show the pattern
    if (block.input.pattern) {
      return `Pattern: ${block.input.pattern}`;
    }

    // Default: stringify
    return JSON.stringify(block.input, null, 2);
  };

  const inputDisplay = formatInput();

  return (
    <div className={cn('my-2 border rounded-lg overflow-hidden', statusColor)}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-3 hover:bg-neutral-800/30 transition-colors text-left"
      >
        <ChevronRight
          className={cn(
            'w-4 h-4 text-neutral-400 transition-transform duration-200',
            expanded && 'rotate-90'
          )}
        />
        {statusIcon}
        <Icon className="w-4 h-4 text-neutral-400" />
        <span className="font-mono text-sm text-neutral-200">{block.tool}</span>

        {inputDisplay && !expanded && (
          <span className="text-xs text-neutral-500 truncate ml-2 flex-1 font-mono">
            {inputDisplay.slice(0, 40)}
            {inputDisplay.length > 40 ? '...' : ''}
          </span>
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Input */}
          {inputDisplay && (
            <div>
              <div className="text-xs text-neutral-500 mb-1">Input</div>
              <pre className="p-2 rounded bg-neutral-900/50 text-xs font-mono text-neutral-300 overflow-x-auto">
                {inputDisplay}
              </pre>
            </div>
          )}

          {/* Output */}
          {block.output && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500">Output</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-2 rounded bg-neutral-900/50 text-xs font-mono text-neutral-300 overflow-x-auto max-h-64 overflow-y-auto">
                {block.output}
              </pre>
            </div>
          )}

          {/* Error */}
          {block.error && (
            <div>
              <div className="text-xs text-red-400 mb-1">Error</div>
              <pre className="p-2 rounded bg-red-900/20 text-xs font-mono text-red-300 overflow-x-auto">
                {block.error}
              </pre>
            </div>
          )}

          {/* Running state */}
          {block.status === 'running' && !block.output && (
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Executing...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
