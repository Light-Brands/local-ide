'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Terminal, BookOpen, Trash2 } from 'lucide-react';
import { useToolingOptional } from '../../../contexts/ToolingContext';
import { useIDEStore, useChatSessions } from '../../../stores/ideStore';

// Import the actual pane components
import { ChatPane } from '../ChatPane';
import { TerminalPane } from '../TerminalPane';

export type DeveloperTab = 'integrated' | 'terminal';

interface TabConfig {
  id: DeveloperTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: 'integrated',
    label: 'Integrated',
    icon: Sparkles,
    description: 'AI-powered development assistant',
  },
  {
    id: 'terminal',
    label: 'Terminal',
    icon: Terminal,
    description: 'Direct shell access',
  },
];

export function DeveloperPane() {
  const [activeTab, setActiveTab] = useState<DeveloperTab>('integrated');
  const tooling = useToolingOptional();

  // Store state for actions
  const claude = useIDEStore((state) => state.integrations.claude);
  const openCommandDictionary = useIDEStore((state) => state.openCommandDictionary);
  const clearSessionMessages = useIDEStore((state) => state.clearSessionMessages);
  const { activeSessionId } = useChatSessions();

  const handleTabChange = useCallback((tab: DeveloperTab) => {
    setActiveTab(tab);
  }, []);

  const handleClear = useCallback(() => {
    if (activeSessionId && confirm('Clear all messages in this chat session?')) {
      clearSessionMessages(activeSessionId);
    }
  }, [activeSessionId, clearSessionMessages]);

  return (
    <div className="h-full flex flex-col bg-neutral-900">
      {/* Tab bar */}
      <div className="flex-shrink-0 flex items-center border-b border-neutral-800 bg-neutral-900">
        {/* Tabs */}
        <div className="flex items-center">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative',
                  isActive
                    ? 'text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                )}
                title={tab.description}
              >
                <Icon className={cn(
                  'w-4 h-4',
                  isActive && tab.id === 'integrated' && 'text-primary-400',
                  isActive && tab.id === 'terminal' && 'text-green-400'
                )} />
                <span>{tab.label}</span>

                {/* Active indicator */}
                {isActive && (
                  <div className={cn(
                    'absolute bottom-0 left-0 right-0 h-0.5',
                    tab.id === 'integrated' ? 'bg-primary-500' : 'bg-green-500'
                  )} />
                )}
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Tooling indicator and actions (only show when on integrated tab) */}
        {activeTab === 'integrated' && (
          <div className="flex items-center gap-2 px-2">
            {/* Tooling status */}
            {tooling && (
              <div className="flex items-center gap-2 text-[10px] text-neutral-500 mr-2">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  AI Tooling
                </span>
                <span className="text-neutral-600">|</span>
                <span className="text-blue-400">{tooling.config.commands.length}</span>
                <span>commands</span>
                <span className="text-neutral-600">|</span>
                <span className="text-purple-400">{tooling.config.agents.length}</span>
                <span>agents</span>
              </div>
            )}

            {/* Connection status */}
            <div className="flex items-center gap-1.5 px-2 py-1">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  claude.connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                )}
              />
              <span className="text-[10px] text-neutral-500">
                {claude.connected ? 'CLI' : 'Checking...'}
              </span>
            </div>

            {/* Command Dictionary button */}
            <button
              onClick={() => openCommandDictionary()}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
              title="Command Dictionary (Cmd+/)"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Clear messages */}
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Clear messages"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 relative">
        {/* Integrated (Chat) pane */}
        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-150',
            activeTab === 'integrated'
              ? 'opacity-100 z-10'
              : 'opacity-0 z-0 pointer-events-none'
          )}
        >
          <ChatPane />
        </div>

        {/* Terminal pane */}
        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-150',
            activeTab === 'terminal'
              ? 'opacity-100 z-10'
              : 'opacity-0 z-0 pointer-events-none'
          )}
        >
          <TerminalPane />
        </div>
      </div>
    </div>
  );
}
