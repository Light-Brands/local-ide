'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useIDEStore, useChatSessions, useStoreHydrated } from '../../../stores/ideStore';
import { useMobileDetect } from '../../../hooks';
import { useChat } from '@/lib/ide/hooks';
import { useOperationSync } from '@/lib/ide/hooks/useOperationSync';
import { getActivityService } from '@/lib/ide/services/activity';
import { IDE_FEATURES } from '@/lib/ide/features';
import { useToolingOptional } from '../../../contexts/ToolingContext';
import { ContextProvider, useContextState } from '../../context';
import { ChatInput } from '../../chat/ChatInput';
import { ChatSessionTabs } from '../../chat/ChatSessionTabs';
import { MessageList } from './MessageList';
import { ContextPanel, ContextPanelCompact } from './ContextPanel';
import {
  Sparkles,
  Settings,
  AlertCircle,
  RefreshCw,
  MessageSquarePlus,
  MessageSquare,
  RotateCcw,
  Send,
  Zap,
  Search,
  FileEdit,
  Terminal,
  Brain,
  Clock,
  XCircle,
} from 'lucide-react';
import { ToolingIndicator } from '@/app/ide/components/common/ToolingIndicator';

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
  const contextState = useContextState();

  // Expose tooling context globally for the autocomplete hook to access
  useEffect(() => {
    if (tooling) {
      (window as any).__toolingContext = tooling;
    }
    return () => {
      delete (window as any).__toolingContext;
    };
  }, [tooling]);

  // Operation tracking
  const {
    handleToolStart,
    handleToolEnd,
    handleThinkingStart,
    handleThinkingEnd,
  } = useOperationSync();
  const thinkingIdRef = useRef<string | null>(null);

  // Store state
  const activeFile = useIDEStore((state) => state.editor.activeFile);
  const fileContents = useIDEStore((state) => state.editor.fileContents);
  const clearMobileChatUnread = useIDEStore((state) => state.clearMobileChatUnread);

  // Get current session with backend info
  const session = useIDEStore((state) =>
    state.chatSessions.find((s) => s.id === sessionId)
  );
  const setChatSessionBackend = useIDEStore((state) => state.setChatSessionBackend);

  // Get workspace path from GitHub integration or default to temp workspace
  const github = useIDEStore((state) => state.integrations.github);
  const workspacePath = github.repo
    ? `/tmp/workspace/${github.owner}/${github.repo}`
    : '/tmp/workspace';

  // Get session messages from store and create update callback
  const sessionMessages = session?.messages ?? [];
  const updateChatSessionMessages = useIDEStore((state) => state.updateChatSessionMessages);

  // Memoize the callback to prevent unnecessary re-renders
  const handleMessagesChange = useCallback((newMessages: typeof sessionMessages) => {
    updateChatSessionMessages(sessionId, newMessages);
  }, [sessionId, updateChatSessionMessages]);

  // Handle backend session ID callback
  const handleBackendSessionId = useCallback((backendId: string) => {
    setChatSessionBackend(sessionId, backendId);
  }, [sessionId, setChatSessionBackend]);

  // Use robust chat hook with external message state (store is source of truth)
  // Enable WebSocket mode if persistentChat feature is enabled
  const {
    messages,
    isLoading,
    isConnected,
    error,
    claudeState,
    currentTool,
    isStuck,
    stuckDuration,
    sendMessage,
    toggleThinking,
    checkConnection,
    sendEnter,
    killSession,
    abort,
  } = useChat({
    workspacePath,
    externalMessages: sessionMessages,
    onMessagesChange: handleMessagesChange,
    useWebSocket: IDE_FEATURES.persistentChat,
    backendSessionId: session?.backendSessionId,
    onBackendSessionId: handleBackendSessionId,
    onToolUse: (tool) => {
      if (IDE_FEATURES.activityTracking) {
        getActivityService().trackAIResponse(`Tool: ${tool}`);
      }
    },
    onError: (errorMsg) => {
      if (IDE_FEATURES.activityTracking) {
        getActivityService().trackError('AI Error', errorMsg);
      }
    },
    // Operation tracking callbacks
    onToolStart: handleToolStart,
    onToolEnd: handleToolEnd,
    onThinkingStart: () => {
      const op = handleThinkingStart();
      thinkingIdRef.current = op.id;
    },
    onThinkingEnd: () => {
      if (thinkingIdRef.current) {
        handleThinkingEnd(thinkingIdRef.current);
        thinkingIdRef.current = null;
      }
    },
  });

  // Page unload handler to save chat output
  useEffect(() => {
    const handleUnload = () => {
      if (session?.backendSessionId) {
        navigator.sendBeacon(
          '/api/chat/save-output',
          JSON.stringify({ sessionId: session.backendSessionId })
        );
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [session?.backendSessionId]);

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

  // Build enhanced prompt with context system OR legacy tooling context
  const buildPromptWithTooling = useCallback(
    (userMessage: string) => {
      // Use the context system if it has items
      if (contextState.hasContext) {
        return contextState.buildPrompt(userMessage);
      }

      // Legacy fallback: parse @ and / mentions from message directly
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
    [activeFile, fileContents, tooling, contextState]
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

    // Debug: Log the full prompt being sent
    console.log('🚀 [ChatPane] Sending prompt with context:');
    console.log('📝 User message:', userMessage);
    console.log('📦 Context items:', contextState.items.length);
    if (contextState.items.length > 0) {
      console.log('📋 Context breakdown:');
      contextState.items.forEach((item, i) => {
        console.log(`   ${i + 1}. [${item.type}] ${item.name} - ${item.content.slice(0, 100)}...`);
      });
    }
    console.log('📤 Full prompt being sent:\n', prompt.slice(0, 500) + (prompt.length > 500 ? '...' : ''));

    // Clear context after building prompt (fuel is consumed)
    if (contextState.hasContext) {
      contextState.clearAll();
    }

    // Send message through CLI
    await sendMessage(prompt);
  }, [input, isLoading, buildPromptWithTooling, sendMessage, contextState]);

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

  // Helper to get state icon and label
  const getStateDisplay = () => {
    switch (claudeState) {
      case 'thinking':
        return { icon: Brain, label: 'Thinking', color: 'text-purple-400' };
      case 'responding':
        return { icon: Zap, label: 'Responding', color: 'text-green-400' };
      case 'tool_running':
        const toolIcon = currentTool?.toLowerCase().includes('search') ? Search
          : currentTool?.toLowerCase().includes('edit') ? FileEdit
          : currentTool?.toLowerCase().includes('bash') ? Terminal
          : Zap;
        return { icon: toolIcon, label: currentTool || 'Tool', color: 'text-blue-400' };
      case 'waiting_confirm':
        return { icon: Clock, label: 'Waiting...', color: 'text-yellow-400' };
      case 'idle':
        return { icon: MessageSquare, label: 'Ready', color: 'text-neutral-500' };
      default:
        return { icon: MessageSquare, label: 'Unknown', color: 'text-neutral-500' };
    }
  };

  const stateDisplay = getStateDisplay();
  const StateIcon = stateDisplay.icon;

  return (
    <>
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-1.5 bg-neutral-900 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-neutral-400" />
          <span className="text-xs text-neutral-400 font-medium">Chat</span>

          {/* Connection status */}
          {isConnected ? (
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          )}

          {/* Divider */}
          <div className="w-px h-3 bg-neutral-700" />

          {/* Tooling indicator */}
          <ToolingIndicator showLabel={false} compact />

          {/* Spacer */}
          <div className="flex-1" />

          {/* Claude State indicator */}
          {isLoading && (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-800 ${stateDisplay.color}`}>
              <StateIcon className="w-3 h-3 animate-pulse" />
              <span className="text-[10px] font-medium">{stateDisplay.label}</span>
            </div>
          )}

          {/* Control buttons */}
          {isLoading && (
            <div className="flex items-center gap-1">
              {/* Abort button */}
              <button
                onClick={abort}
                className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-red-400 transition-colors"
                title="Abort (Ctrl+C)"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
              {/* Send Enter button */}
              <button
                onClick={sendEnter}
                className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-blue-400 transition-colors"
                title="Send Enter (confirm paste)"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
              {/* Kill/Restart button */}
              <button
                onClick={killSession}
                className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-orange-400 transition-colors"
                title="Kill & Restart Session"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stuck warning banner */}
      {isStuck && (
        <div className="flex-shrink-0 px-3 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
          <div className="flex items-center gap-2 text-xs text-yellow-400">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span className="flex-1">
              Claude appears stuck ({Math.round(stuckDuration / 1000)}s no response)
            </span>
            <button
              onClick={sendEnter}
              className="px-2 py-1 rounded bg-yellow-500/20 hover:bg-yellow-500/30 transition-colors"
            >
              Send Enter
            </button>
            <button
              onClick={killSession}
              className="px-2 py-1 rounded bg-orange-500/20 hover:bg-orange-500/30 transition-colors text-orange-400"
            >
              Restart
            </button>
          </div>
        </div>
      )}

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

  // Handler to start a new chat
  const handleStartChat = useCallback(() => {
    addSession();
  }, [addSession]);

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

  // No active session - show start chat screen
  if (!activeSessionId || sessions.length === 0) {
    return (
      <div className="h-full flex flex-col bg-neutral-900">
        {sessions.length > 0 && <ChatSessionTabs />}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center mb-6 mx-auto">
              <Sparkles className="w-10 h-10 text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-200 mb-2">AI Assistant</h3>
            <p className="text-sm text-neutral-500 mb-6 max-w-sm">
              Ask questions about your code, get suggestions, and debug issues
            </p>
            <button
              onClick={handleStartChat}
              className="px-5 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <MessageSquarePlus className="w-4 h-4" />
              Start Chat
            </button>
            <p className="mt-4 text-xs text-neutral-600">
              Type <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-blue-400 font-mono">/</kbd> for commands, <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-purple-400 font-mono">@</kbd> for agents
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-neutral-900">
      {/* Session Tabs */}
      <ChatSessionTabs />

      {/* Session Content - keyed to reset when session changes, wrapped with ContextProvider */}
      <ContextProvider>
        <ChatSessionContent key={activeSessionId} sessionId={activeSessionId} />
      </ContextProvider>
    </div>
  );
}
