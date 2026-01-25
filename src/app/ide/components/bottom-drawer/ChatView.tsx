'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useIDEStore } from '../../stores/ideStore';
import {
  getClaudeService,
  getStoredClaudeApiKey,
  buildContextualPrompt,
} from '@/lib/ide/services/claude';
import type { ClaudeStreamEvent } from '@/lib/ide/services/claude';
import { getActivityService } from '@/lib/ide/services/activity';
import { useToolingOptional } from '../../contexts/ToolingContext';
import { ChatInput } from '../chat/ChatInput';
import {
  Sparkles,
  Loader2,
  StopCircle,
  Trash2,
  Code,
  Bot,
  Slash,
} from 'lucide-react';
import { ToolingIndicator } from '@/app/ide/components/common/ToolingIndicator';

// Parse commands and mentions from message content
function parseMessageContent(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Regex to find /commands and @mentions
  const pattern = /(?:^|[\s\n])(\/[a-z0-9-]+)|(@[a-z0-9-]+)/gi;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    const fullMatch = match[0];
    const isCommand = fullMatch.trim().startsWith('/');
    const name = fullMatch.trim().slice(1);
    const startIndex = match.index;

    if (startIndex > lastIndex) {
      parts.push(content.slice(lastIndex, startIndex));
    }

    parts.push(
      <span
        key={startIndex}
        className={cn(
          'inline-flex items-center gap-0.5 px-1 py-0.5 rounded font-mono text-xs',
          isCommand ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
        )}
      >
        {isCommand ? <Slash className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
        {name}
      </span>
    );

    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
}

export function ChatView() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [isAborting, setIsAborting] = useState(false);
  const tooling = useToolingOptional();

  const messages = useIDEStore((state) => state.chat.messages);
  const isTyping = useIDEStore((state) => state.chat.isTyping);
  const addMessage = useIDEStore((state) => state.addChatMessage);
  const updateLastMessage = useIDEStore((state) => state.updateLastMessage);
  const setTyping = useIDEStore((state) => state.setChatTyping);
  const clearChat = useIDEStore((state) => state.clearChat);
  const drawerHeight = useIDEStore((state) => state.drawer.height);
  const activeFile = useIDEStore((state) => state.editor.activeFile);

  // Initialize Claude service with stored API key
  useEffect(() => {
    const apiKey = getStoredClaudeApiKey();
    if (apiKey) {
      getClaudeService().setApiKey(apiKey);
    }
  }, []);

  // Auto-scroll to bottom when new messages or streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, streamingContent]);

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
        { currentFile: activeFile || undefined }
      );
    },
    [activeFile, tooling]
  );

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setStreamingContent('');

    addMessage({ role: 'user', content: userMessage });
    getActivityService().trackAIMessage(userMessage);
    setTyping(true);

    const claude = getClaudeService();
    const contextualMessage = buildPromptWithTooling(userMessage);

    try {
      await claude.sendMessage(contextualMessage, (event: ClaudeStreamEvent) => {
        switch (event.type) {
          case 'start':
            addMessage({ role: 'assistant', content: '', isStreaming: true });
            break;
          case 'text':
            if (event.text) {
              setStreamingContent((prev) => prev + event.text);
            }
            break;
          case 'error':
            setStreamingContent((prev) => prev + `\n\n*Error: ${event.error || 'Unknown error'}*`);
            break;
        }
      });

      updateLastMessage(streamingContent || 'Response received');

      if (streamingContent) {
        getActivityService().trackAIResponse(streamingContent);
      }
    } catch (error) {
      if (!isAborting) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (messages.length > 0) {
          updateLastMessage(`*Error: ${errorMessage}*`);
        }
      }
    } finally {
      setTyping(false);
      setStreamingContent('');
      setIsAborting(false);
    }
  }, [
    input,
    isTyping,
    addMessage,
    setTyping,
    buildPromptWithTooling,
    streamingContent,
    updateLastMessage,
    isAborting,
    messages.length,
  ]);

  const handleAbort = useCallback(() => {
    setIsAborting(true);
    getClaudeService().abort();
    setTyping(false);
    if (streamingContent) {
      updateLastMessage(streamingContent + '\n\n*[Response interrupted]*');
    }
    setStreamingContent('');
  }, [streamingContent, updateLastMessage, setTyping]);

  // Parse markdown-like formatting for display
  const formatContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
        if (match) {
          const language = match[1] || '';
          const code = match[2];
          return (
            <div key={index} className="my-2 rounded-lg overflow-hidden bg-neutral-950">
              {language && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 text-xs text-neutral-400">
                  <Code className="w-3 h-3" />
                  {language}
                </div>
              )}
              <pre className="p-3 overflow-x-auto">
                <code className="text-xs font-mono text-neutral-200">{code}</code>
              </pre>
            </div>
          );
        }
      }

      // Parse commands and mentions, then apply inline formatting
      const parsed = parseMessageContent(part);
      return (
        <span key={index}>
          {parsed.map((segment, i) => {
            if (typeof segment !== 'string') return segment;

            return segment.split(/(`[^`]+`)/g).map((s, j) => {
              if (s.startsWith('`') && s.endsWith('`')) {
                return (
                  <code
                    key={`${i}-${j}`}
                    className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-xs font-mono"
                  >
                    {s.slice(1, -1)}
                  </code>
                );
              }
              return s.split(/(\*\*[^*]+\*\*)/g).map((t, k) => {
                if (t.startsWith('**') && t.endsWith('**')) {
                  return <strong key={`${i}-${j}-${k}`}>{t.slice(2, -2)}</strong>;
                }
                return t.split(/(\*[^*]+\*)/g).map((u, l) => {
                  if (u.startsWith('*') && u.endsWith('*') && !u.startsWith('**')) {
                    return <em key={`${i}-${j}-${k}-${l}`}>{u.slice(1, -1)}</em>;
                  }
                  return u;
                });
              });
            });
          })}
        </span>
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-500" />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Claude</span>
          {!getClaudeService().isConfigured && (
            <span className="text-xs text-amber-500">(Demo mode)</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tooling indicator */}
      <div className="px-4 py-1.5 border-b border-neutral-200/50 dark:border-neutral-800/50">
        <ToolingIndicator showLabel compact />
      </div>

      {/* Messages area - touch-action ensures native scrolling takes priority */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{
          touchAction: 'pan-y',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="w-8 h-8 text-primary-500 mx-auto mb-3" />
            <p className="text-neutral-600 dark:text-neutral-400">Start a conversation with Claude</p>
            {tooling && (
              <p className="text-xs text-neutral-500 mt-2">
                Use <span className="text-blue-400 font-mono">/</span> for commands or{' '}
                <span className="text-purple-400 font-mono">@</span> for agents
              </p>
            )}

            {/* Quick actions */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['Explain this code', 'Help me debug', 'Write a function', 'Best practices'].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-3 py-1.5 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5',
                  message.role === 'user'
                    ? 'bg-primary-500 text-white rounded-br-md'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-md'
                )}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {message.role === 'assistant' && message.isStreaming && isTyping
                    ? formatContent(streamingContent || 'Thinking...')
                    : formatContent(message.content)}
                </div>
                <p
                  className={cn(
                    'text-[10px] mt-1',
                    message.role === 'user' ? 'text-primary-200' : 'text-neutral-400'
                  )}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isTyping && !messages.some((m) => m.isStreaming) && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                <span className="text-sm text-neutral-500">Claude is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 p-3 border-t border-neutral-200 dark:border-neutral-800">
        {/* Context indicator */}
        {activeFile && (
          <div className="mb-2 flex items-center gap-1 text-xs text-neutral-500">
            <Code className="w-3 h-3" />
            <span>Context: {activeFile.split('/').pop()}</span>
          </div>
        )}

        {isTyping ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-500">
              Claude is responding...
            </div>
            <button
              type="button"
              onClick={handleAbort}
              className="p-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all"
              aria-label="Stop response"
            >
              <StopCircle className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder="Message Claude..."
            disabled={isTyping}
            isLoading={isTyping}
          />
        )}
      </div>
    </div>
  );
}
