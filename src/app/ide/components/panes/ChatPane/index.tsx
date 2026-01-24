'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useIDEStore, useChatSessions, useStoreHydrated } from '../../../stores/ideStore';
import { useMobileDetect } from '../../../hooks';
import { useClaudeChat } from '../../../hooks/useClaudeChat';
import { getActivityService } from '@/lib/ide/services/activity';
import { useToolingOptional } from '../../../contexts/ToolingContext';
import { ChatInput } from '../../chat/ChatInput';
import { ChatSessionTabs } from '../../chat/ChatSessionTabs';
import { MessageList } from './MessageList';
import { ContextPanel, ContextPanelCompact } from './ContextPanel';
import {
  Sparkles,
  Settings,
  AlertCircle,
  RefreshCw,
  BookOpen,
} from 'lucide-react';

// ============================================================================
// CHAT SESSION CONTENT - Inner component for a single session
// ============================================================================

interface ChatSessionContentProps {
  sessionId: string;
}

function ChatSessionContent({ sessionId }: ChatSessionContentProps) {
  const isMobile = useMobileDetect();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [showContext, setShowContext] = useState(!isMobile);
  const [connectionChecked, setConnectionChecked] = useState(false);
  const tooling = useToolingOptional();

  // Command Dictionary
  const openCommandDictionary = useIDEStore((state) => state.openCommandDictionary);

  // Store state
  const activeFile = useIDEStore((state) => state.editor.activeFile);
  const fileContents = useIDEStore((state) => state.editor.fileContents);
  const clearMobileChatUnread = useIDEStore((state) => state.clearMobileChatUnread);

  // Get workspace path from GitHub integration or default to temp workspace
  const github = useIDEStore((state) => state.integrations.github);
  const workspacePath = github.repo
    ? `/tmp/workspace/${github.owner}/${github.repo}`
    : '/tmp/workspace';

  // Get session messages from store and create update callback
  const sessionMessages = useIDEStore((state) =>
    state.chatSessions.find((s) => s.id === sessionId)?.messages ?? []
  );
  const updateChatSessionMessages = useIDEStore((state) => state.updateChatSessionMessages);

  // Memoize the callback to prevent unnecessary re-renders
  const handleMessagesChange = useCallback((newMessages: typeof sessionMessages) => {
    updateChatSessionMessages(sessionId, newMessages);
  }, [sessionId, updateChatSessionMessages]);

  // Use Claude CLI chat hook with external message state (store is source of truth)
  const {
    messages,
    isLoading,
    isConnected,
    error,
    sendMessage,
    toggleThinking,
    checkConnection,
  } = useClaudeChat({
    workspacePath,
    externalMessages: sessionMessages,
    onMessagesChange: handleMessagesChange,
    onToolUse: (tool) => {
      getActivityService().trackAIResponse(`Tool: ${tool}`);
    },
    onError: (error) => {
      getActivityService().trackError('AI Error', error);
    },
  });

  // Check connection on mount
  useEffect(() => {
    if (!connectionChecked) {
      checkConnection().then(() => {
        setConnectionChecked(true);
      });
    }
  }, [connectionChecked, checkConnection]);

  // Clear unread count when viewing chat
  useEffect(() => {
    clearMobileChatUnread();
  }, [clearMobileChatUnread]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Build enhanced prompt with tooling context
  const buildPromptWithTooling = useCallback(
    (userMessage: string) => {
      const commands: string[] = [];
      const agents: string[] = [];

      const commandPattern = /(?:^|[\s\n])\/([\w-]+)/g;
      const agentPattern = /@([\w-]+)/g;

      let match;
      while ((match = commandPattern.exec(userMessage)) !== null) {
        commands.push(match[1]);
      }
      while ((match = agentPattern.exec(userMessage)) !== null) {
        agents.push(match[1]);
      }

      const contextParts: string[] = [];

      // Add active file context
      if (activeFile) {
        contextParts.push(`[Current File: ${activeFile}]`);
        const fileContent = fileContents[activeFile]?.content;
        if (fileContent) {
          contextParts.push(`\`\`\`\n${fileContent.slice(0, 2000)}\n\`\`\``);
        }
      }

      // Add command context if tooling available
      if (tooling && commands.length > 0) {
        const commandDocs = commands
          .map((name) => {
            const cmd = tooling.getCommand(name);
            return cmd ? `## /${name}\n${cmd.description}\n\n${cmd.content.slice(0, 500)}...` : null;
          })
          .filter(Boolean)
          .join('\n\n');

        if (commandDocs) {
          contextParts.push(`[Active Commands]\n${commandDocs}`);
        }
      }

      // Add agent context if tooling available
      if (tooling && agents.length > 0) {
        const agentDocs = agents
          .map((name) => {
            const agent = tooling.getAgent(name);
            return agent ? `## @${name}\n${agent.description}\n\n${agent.content.slice(0, 500)}...` : null;
          })
          .filter(Boolean)
          .join('\n\n');

        if (agentDocs) {
          contextParts.push(`[Active Agents]\n${agentDocs}`);
        }
      }

      if (contextParts.length > 0) {
        return `${contextParts.join('\n\n')}\n\n[User Message]\n${userMessage}`;
      }

      return userMessage;
    },
    [activeFile, fileContents, tooling]
  );

  // Handle message submission
  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Track activity
    getActivityService().trackAIMessage(userMessage.slice(0, 100));

    // Build enhanced prompt with tooling context
    const prompt = buildPromptWithTooling(userMessage);

    // Send message through CLI
    await sendMessage(prompt);
  }, [input, isLoading, buildPromptWithTooling, sendMessage]);

  // Retry connection check
  const handleRetryConnection = useCallback(async () => {
    setConnectionChecked(false);
    await checkConnection();
    setConnectionChecked(true);
  }, [checkConnection]);

  // Get selected code for context
  const selectedCode = activeFile && fileContents[activeFile]
    ? fileContents[activeFile].content.slice(0, 500)
    : undefined;

  // Connection error state
  if (connectionChecked && !isConnected) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-neutral-900">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-neutral-200 mb-2">Connection Error</h3>
        <p className="text-sm text-neutral-500 mb-4 max-w-sm">
          Could not connect to Claude CLI. Make sure it&apos;s installed and you&apos;re logged in.
        </p>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 max-w-sm">
            <p className="text-xs text-red-400 font-mono">{error}</p>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={handleRetryConnection}
            className="px-4 py-2 bg-neutral-800 text-white rounded-lg text-sm font-medium hover:bg-neutral-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <a
            href="/ide/onboarding"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Reconfigure
          </a>
        </div>
        <p className="mt-4 text-xs text-neutral-600">
          Run <code className="px-1.5 py-0.5 bg-neutral-800 rounded">claude login</code> in your terminal
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Context panel (desktop) */}
      {!isMobile && showContext && (
        <ContextPanel
          activeFile={activeFile}
          selectedCode={selectedCode}
        />
      )}

      {/* Context panel (mobile - compact) */}
      {isMobile && (activeFile || selectedCode) && (
        <ContextPanelCompact
          activeFile={activeFile}
          selectedCode={selectedCode}
        />
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 scrollbar-thin"
      >
        <MessageList
          messages={messages}
          isTyping={isLoading}
          onToggleThinking={toggleThinking}
        />
      </div>

      {/* Error banner */}
      {error && !isLoading && (
        <div className="flex-shrink-0 px-3 py-2 bg-red-500/10 border-t border-red-500/20">
          <div className="flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => handleRetryConnection()}
              className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Quick actions bar */}
      {!isLoading && messages.length === 0 && (
        <div className="flex-shrink-0 px-3 py-2 border-t border-neutral-800/50 bg-neutral-900/50">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] text-neutral-500 flex-shrink-0">Quick:</span>
            {[
              { label: '/autotask', desc: 'Auto-complete task' },
              { label: '@analyst', desc: 'Research & ideation' },
              { label: '/troubleshoot', desc: 'Debug issues' },
              { label: '@debugger', desc: 'Find root cause' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => setInput(item.label + ' ')}
                className="flex-shrink-0 px-2 py-1 rounded-md text-[11px] font-mono bg-neutral-800 text-neutral-300 hover:bg-violet-500/20 hover:text-violet-300 transition-colors"
                title={item.desc}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => openCommandDictionary()}
              className="flex-shrink-0 px-2 py-1 rounded-md text-[10px] bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              More...
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 p-3 border-t border-neutral-800 safe-area-bottom">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder="Ask anything or use / and @ ..."
          disabled={isLoading || !isConnected}
          isLoading={isLoading}
        />
        {/* Usage hints */}
        <div className="mt-2 text-[10px] text-neutral-500 text-center">
          Type <kbd className="px-1 py-0.5 rounded bg-neutral-800 text-blue-400 font-mono">/</kbd> for commands, <kbd className="px-1 py-0.5 rounded bg-neutral-800 text-purple-400 font-mono">@</kbd> for agents
        </div>
      </div>
    </>
  );
}

// ============================================================================
// CHAT PANE - Main wrapper component
// ============================================================================

export function ChatPane() {
  const isMobile = useMobileDetect();
  const hydrated = useStoreHydrated();

  // Store state
  const claude = useIDEStore((state) => state.integrations.claude);

  // Chat sessions
  const { sessions, activeSessionId, addSession } = useChatSessions();

  // Auto-create first session if none exist (only after hydration!)
  useEffect(() => {
    if (hydrated && sessions.length === 0 && claude.connected) {
      addSession('Chat 1');
    }
  }, [hydrated, sessions.length, claude.connected, addSession]);

  // Loading state while hydrating from localStorage
  if (!hydrated) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-neutral-900">
        <Sparkles className="w-8 h-8 text-primary-400 animate-pulse" />
        <p className="mt-2 text-sm text-neutral-500">Loading sessions...</p>
      </div>
    );
  }

  // Not configured state
  if (!claude.connected) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-neutral-900">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-primary-400" />
        </div>
        <h3 className="text-xl font-semibold text-neutral-200 mb-2">AI Assistant</h3>
        <p className="text-sm text-neutral-500 mb-6 max-w-sm">
          Configure Claude CLI to enable AI-powered code assistance with full tool access.
        </p>
        <a
          href="/ide/onboarding"
          className="px-5 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Configure Claude
        </a>
        <p className="mt-4 text-xs text-neutral-600">
          Requires Claude CLI with active subscription
        </p>
      </div>
    );
  }

  // No active session yet
  if (!activeSessionId) {
    return (
      <div className="h-full flex flex-col bg-neutral-900">
        <ChatSessionTabs />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="w-12 h-12 text-neutral-600 mb-4 mx-auto" />
            <p className="text-neutral-400">Loading chat session...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-neutral-900">
      {/* Session Tabs */}
      <ChatSessionTabs />

      {/* Session Content - keyed to reset when session changes */}
      <ChatSessionContent key={activeSessionId} sessionId={activeSessionId} />
    </div>
  );
}
