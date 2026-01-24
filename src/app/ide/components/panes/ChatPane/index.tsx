'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useIDEStore, type Message } from '../../../stores/ideStore';
import { useMobileDetect } from '../../../hooks';
import {
  getClaudeService,
  getStoredClaudeApiKey,
  buildContextualPrompt,
  type ClaudeStreamEvent,
} from '@/lib/ide/services/claude';
import { getActivityService } from '@/lib/ide/services/activity';
import { isProduction } from '@/lib/ide/env';
import { useToolingOptional } from '../../../contexts/ToolingContext';
import { ChatInput } from '../../chat/ChatInput';
import { MessageList } from './MessageList';
import { ContextPanel, ContextPanelCompact } from './ContextPanel';
import {
  Sparkles,
  Trash2,
  Code,
  Terminal,
  Settings,
  ChevronDown,
  AlertCircle,
  Zap,
} from 'lucide-react';

export function ChatPane() {
  const isMobile = useMobileDetect();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showContext, setShowContext] = useState(!isMobile);
  const tooling = useToolingOptional();
  const inProduction = isProduction();

  // Store state
  const chatMode = useIDEStore((state) => state.chatMode);
  const terminalMessages = useIDEStore((state) => state.terminalMessages);
  const workspaceMessages = useIDEStore((state) => state.workspaceMessages);
  const isTyping = useIDEStore((state) => state.isTyping);
  const claude = useIDEStore((state) => state.integrations.claude);
  const activeFile = useIDEStore((state) => state.editor.activeFile);
  const fileContents = useIDEStore((state) => state.editor.fileContents);
  const setChatMode = useIDEStore((state) => state.setChatMode);
  const addMessage = useIDEStore((state) => state.addMessage);
  const updateLastMessage = useIDEStore((state) => state.updateLastMessage);
  const setIsTyping = useIDEStore((state) => state.setIsTyping);
  const clearMessages = useIDEStore((state) => state.clearMessages);
  const clearMobileChatUnread = useIDEStore((state) => state.clearMobileChatUnread);

  const messages = chatMode === 'terminal' ? terminalMessages : workspaceMessages;
  const hasApiKey = !!getStoredClaudeApiKey();

  // Clear unread count when viewing chat
  useEffect(() => {
    clearMobileChatUnread();
  }, [clearMobileChatUnread]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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
      const codeContext = {
        currentFile: activeFile || undefined,
        selectedCode:
          activeFile && fileContents[activeFile]
            ? fileContents[activeFile].content.slice(0, 2000)
            : undefined,
      };

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

      return buildContextualPrompt(
        contextParts.length > 0
          ? `${contextParts.join('\n\n')}\n\n[User Message]\n${userMessage}`
          : userMessage,
        codeContext
      );
    },
    [activeFile, fileContents, tooling]
  );

  // Handle message submission
  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isStreaming || !hasApiKey) return;

    const userMessage = input.trim();
    setInput('');
    setIsStreaming(true);
    setIsTyping(true);

    // Add user message
    addMessage(chatMode, { role: 'user', content: userMessage });

    // Track activity
    getActivityService().trackAIMessage(userMessage.slice(0, 100));

    try {
      const service = getClaudeService();
      let responseContent = '';

      // Add empty assistant message
      addMessage(chatMode, { role: 'assistant', content: '' });

      // Build enhanced prompt with tooling context
      const prompt = buildPromptWithTooling(userMessage);

      // Use sendMessage with onStream callback
      await service.sendMessage(prompt, (event: ClaudeStreamEvent) => {
        if (event.type === 'text' && event.text) {
          responseContent += event.text;
          updateLastMessage(chatMode, responseContent);
        }
      });

      // Track AI response
      getActivityService().trackAIResponse(responseContent.slice(0, 100));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
      updateLastMessage(chatMode, `Error: ${errorMessage}`);
      getActivityService().trackError('AI Error', errorMessage);
    } finally {
      setIsStreaming(false);
      setIsTyping(false);
    }
  }, [
    input,
    isStreaming,
    hasApiKey,
    chatMode,
    addMessage,
    updateLastMessage,
    setIsTyping,
    buildPromptWithTooling,
  ]);

  // Clear messages
  const handleClear = useCallback(() => {
    if (confirm(`Clear all ${chatMode} messages?`)) {
      clearMessages(chatMode);
    }
  }, [chatMode, clearMessages]);

  // Get selected code for context
  const selectedCode = activeFile && fileContents[activeFile]
    ? fileContents[activeFile].content.slice(0, 500)
    : undefined;

  // Not configured state
  if (!claude.connected || !hasApiKey) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-neutral-900">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-primary-400" />
        </div>
        <h3 className="text-xl font-semibold text-neutral-200 mb-2">AI Assistant</h3>
        <p className="text-sm text-neutral-500 mb-6 max-w-sm">
          Configure your Claude API key to enable AI-powered code assistance, debugging, and more.
        </p>
        <a
          href="/ide/onboarding"
          className="px-5 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Configure Claude
        </a>
        <p className="mt-4 text-xs text-neutral-600">
          Or continue using the IDE without AI features
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-neutral-900">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-neutral-800">
        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-0.5">
          <button
            onClick={() => setChatMode('terminal')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
              chatMode === 'terminal'
                ? 'bg-neutral-700 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            )}
          >
            <Terminal className="w-3.5 h-3.5" />
            {!isMobile && 'Terminal'}
          </button>
          <button
            onClick={() => setChatMode('workspace')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
              chatMode === 'workspace'
                ? 'bg-neutral-700 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            )}
          >
            <Code className="w-3.5 h-3.5" />
            {!isMobile && 'Workspace'}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {!isMobile && (
            <button
              onClick={() => setShowContext(!showContext)}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                showContext
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              )}
              title="Toggle context panel"
            >
              <Zap className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Clear messages"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

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

      {/* Tooling indicator */}
      {tooling && (
        <div className="flex-shrink-0 px-3 py-1.5 border-b border-neutral-800/50 flex items-center gap-2 text-[10px] text-neutral-500 bg-neutral-900/50">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
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

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 scrollbar-thin"
      >
        <MessageList
          messages={messages}
          isTyping={isTyping}
          chatMode={chatMode}
        />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 p-3 border-t border-neutral-800 safe-area-bottom">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder={
            chatMode === 'terminal'
              ? inProduction
                ? 'Ask for command suggestions (commands shown, not executed)...'
                : 'Ask about commands, scripts, CLI tools...'
              : 'Ask about your code, get help debugging...'
          }
          disabled={isStreaming}
          isLoading={isStreaming}
        />
      </div>
    </div>
  );
}
