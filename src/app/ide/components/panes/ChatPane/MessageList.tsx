'use client';

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Message as LegacyMessage } from '../../../stores/ideStore';
import type { Message as NewMessage, ContentBlock } from '@/types/chat';
import {
  Sparkles,
  User,
  Loader2,
  Copy,
  Check,
  Bot,
  Slash,
  FileCode,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { ThinkingBlockRenderer } from '../../chat/ThinkingBlockRenderer';
import { ToolUseBlockRenderer } from '../../chat/ToolUseBlockRenderer';
import { ErrorBlockRenderer } from '../../chat/ErrorBlockRenderer';
import { ChatMarkdown } from '../../chat/ChatMarkdown';

// Union type to support both old and new message formats
type Message = LegacyMessage | NewMessage;

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  onToggleThinking?: (messageId: string, blockIndex: number) => void;
}

// Type guard to check if message uses new content block format
function isNewMessageFormat(message: Message): message is NewMessage {
  return Array.isArray(message.content);
}

// Simple markdown-like parser for code blocks (legacy format)
function parseCodeBlocks(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before the code block
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++}>{parseInlineElements(content.slice(lastIndex, match.index))}</span>
      );
    }

    // Add the code block
    const language = match[1] || 'text';
    const code = match[2].trim();

    parts.push(
      <CodeBlock key={key++} language={language} code={code} />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(
      <span key={key++}>{parseInlineElements(content.slice(lastIndex))}</span>
    );
  }

  return parts.length > 0 ? parts : [parseInlineElements(content)];
}

// Parse inline elements like /commands and @mentions
function parseInlineElements(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Pattern for /commands, @mentions, and `inline code`
  const pattern = /(?:^|[\s\n])(\/[a-z0-9-]+)|(@[a-z0-9-]+)|`([^`]+)`/gi;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    const fullMatch = match[0];
    const startIndex = match.index;

    // Add text before the match
    if (startIndex > lastIndex) {
      parts.push(content.slice(lastIndex, startIndex));
    }

    if (match[1]) {
      // Command
      const name = fullMatch.trim().slice(1);
      parts.push(
        <span
          key={startIndex}
          className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded font-mono text-xs bg-blue-500/20 text-blue-300"
        >
          <Slash className="w-3 h-3" />
          {name}
        </span>
      );
    } else if (match[2]) {
      // Mention
      const name = fullMatch.trim().slice(1);
      parts.push(
        <span
          key={startIndex}
          className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded font-mono text-xs bg-purple-500/20 text-purple-300"
        >
          <Bot className="w-3 h-3" />
          {name}
        </span>
      );
    } else if (match[3]) {
      // Inline code
      parts.push(
        <code
          key={startIndex}
          className="px-1.5 py-0.5 rounded bg-neutral-700 text-amber-300 font-mono text-xs"
        >
          {match[3]}
        </code>
      );
    }

    lastIndex = match.index + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
}

// Code block component with copy button
const CodeBlock = memo(function CodeBlock({
  language,
  code,
}: {
  language: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="my-2 rounded-lg overflow-hidden bg-neutral-800 border border-neutral-700">
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-750 border-b border-neutral-700">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-xs text-neutral-400 font-mono">{language}</span>
        </div>
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
      <pre className="p-3 overflow-x-auto">
        <code className="text-sm font-mono text-neutral-200">{code}</code>
      </pre>
    </div>
  );
});

// Render content blocks for new message format
const ContentBlocksRenderer = memo(function ContentBlocksRenderer({
  blocks,
  messageId,
  onToggleThinking,
}: {
  blocks: ContentBlock[];
  messageId: string;
  onToggleThinking?: (messageId: string, blockIndex: number) => void;
}) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'text':
            return <ChatMarkdown key={index} content={block.content} />;

          case 'thinking':
            return (
              <ThinkingBlockRenderer
                key={index}
                block={block}
                onToggle={() => onToggleThinking?.(messageId, index)}
              />
            );

          case 'tool_use':
            return <ToolUseBlockRenderer key={index} block={block} />;

          case 'error':
            return <ErrorBlockRenderer key={index} block={block} />;

          case 'tool_result':
            // Tool results are typically shown within tool_use blocks
            return null;

          default:
            return null;
        }
      })}
    </>
  );
});

// Individual message component
const MessageItem = memo(function MessageItem({
  message,
  onToggleThinking,
}: {
  message: Message;
  onToggleThinking?: (messageId: string, blockIndex: number) => void;
}) {
  const isUser = message.role === 'user';
  const isStreaming = 'isStreaming' in message && message.isStreaming;

  // Render content based on message format
  const renderContent = () => {
    if (isNewMessageFormat(message)) {
      // New format with content blocks
      if (message.content.length === 0 && isStreaming) {
        return (
          <div className="flex items-center gap-2 text-neutral-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        );
      }
      return (
        <ContentBlocksRenderer
          blocks={message.content}
          messageId={message.id}
          onToggleThinking={onToggleThinking}
        />
      );
    } else {
      // Legacy format with string content
      const content = parseCodeBlocks(message.content as string);
      return (
        <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {content}
        </div>
      );
    }
  };

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500/30 to-purple-500/30 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-400" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[85%] rounded-xl px-4 py-2.5',
          isUser
            ? 'bg-primary-500 text-white'
            : 'bg-neutral-800 text-neutral-200 border border-neutral-700',
          isStreaming && 'animate-pulse'
        )}
      >
        {renderContent()}
        <div className={cn(
          'text-[10px] mt-1.5 opacity-60',
          isUser ? 'text-right' : ''
        )}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
          <User className="w-4 h-4 text-neutral-300" />
        </div>
      )}
    </div>
  );
});

// Typing indicator
const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500/30 to-purple-500/30 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-primary-400" />
      </div>
      <div className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
});

// Empty state
const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-primary-400" />
      </div>
      <h3 className="text-lg font-medium text-neutral-200 mb-2">
        AI Assistant
      </h3>
      <p className="text-neutral-500 text-sm max-w-xs">
        Ask questions about your code, get suggestions, and debug issues
      </p>
      <div className="mt-4 flex items-center gap-3 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <Slash className="w-3 h-3 text-blue-400" />
          <span>commands</span>
        </span>
        <span className="flex items-center gap-1">
          <Bot className="w-3 h-3 text-purple-400" />
          <span>agents</span>
        </span>
      </div>
    </div>
  );
});

export const MessageList = memo(function MessageList({
  messages,
  isTyping,
  onToggleThinking,
}: MessageListProps) {
  const showTypingIndicator = isTyping && (messages.length === 0 || messages[messages.length - 1]?.role !== 'assistant');

  if (messages.length === 0 && !isTyping) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onToggleThinking={onToggleThinking}
        />
      ))}
      {showTypingIndicator && <TypingIndicator />}
    </div>
  );
});
