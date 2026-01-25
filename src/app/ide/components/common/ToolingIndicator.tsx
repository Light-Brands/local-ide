'use client';

import { useToolingOptional } from '../../contexts/ToolingContext';
import { cn } from '@/lib/utils';
import { Terminal, Bot } from 'lucide-react';

interface ToolingIndicatorProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

export function ToolingIndicator({
  className,
  showLabel = true,
  compact = false
}: ToolingIndicatorProps) {
  const tooling = useToolingOptional();

  if (!tooling) return null;

  const { config, activeCommand, activeAgent } = tooling;
  const commandCount = config.commands.length;
  const agentCount = config.agents.length;

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-[10px] text-neutral-500',
        compact && 'gap-1.5',
        className
      )}
    >
      {showLabel && (
        <>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            AI Tooling
          </span>
          <span className="text-neutral-400">•</span>
        </>
      )}

      {/* Command count */}
      <span className="flex items-center gap-1">
        {!compact && <Terminal className="w-3 h-3" />}
        <span className={cn(activeCommand && 'text-blue-400 font-medium')}>
          {commandCount} {compact ? 'cmds' : 'commands'}
        </span>
      </span>

      <span className="text-neutral-400">•</span>

      {/* Agent count */}
      <span className="flex items-center gap-1">
        {!compact && <Bot className="w-3 h-3" />}
        <span className={cn(activeAgent && 'text-purple-400 font-medium')}>
          {agentCount} {compact ? 'agents' : 'agents'}
        </span>
      </span>

      {/* Active command/agent */}
      {(activeCommand || activeAgent) && (
        <>
          <span className="text-neutral-400">•</span>
          {activeCommand && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
              /{activeCommand.name}
            </span>
          )}
          {activeAgent && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono">
              @{activeAgent.name}
            </span>
          )}
        </>
      )}
    </div>
  );
}
