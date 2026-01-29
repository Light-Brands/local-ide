'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Eye,
  EyeOff,
  User,
  Bot,
  Wrench,
  FileText,
  Terminal,
  Pencil,
  Search,
  FolderTree,
  MessageSquare,
  Sparkles,
  Loader2,
  ChevronDown,
  History,
  Trash2,
  X,
  Clock,
  ChevronRight,
  Plus,
  Copy,
  Check,
  Code,
  Play,
  RotateCcw,
} from 'lucide-react';
import type { SkinMessage, SkinSession, SkinTool, ParserState } from './skinTypes';
import { parseIncremental, createParserState } from './skinParser';
import * as skinStore from './skinStore';

// =============================================================================
// TOOL ICONS
// =============================================================================

const TOOL_ICONS: Record<string, typeof FileText> = {
  Read: FileText,
  Edit: Pencil,
  Write: Pencil,
  Bash: Terminal,
  Grep: Search,
  Glob: FolderTree,
  Search: Search,
  Task: Sparkles,
  WebFetch: Search,
  WebSearch: Search,
  MultiEdit: Pencil,
};

const TOOL_COLORS: Record<string, string> = {
  Read: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  Edit: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  Write: 'text-green-400 bg-green-500/20 border-green-500/30',
  Bash: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
  Grep: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
  Glob: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
  Task: 'text-pink-400 bg-pink-500/20 border-pink-500/30',
};

// =============================================================================
// CODE BLOCK COMPONENT
// =============================================================================

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-2 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-700">
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-800/50 border-b border-neutral-700">
        <span className="text-[10px] text-neutral-500 font-mono">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-neutral-700 text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-xs">
        <code className="text-neutral-300 font-mono">{code}</code>
      </pre>
    </div>
  );
}

// =============================================================================
// MESSAGE CONTENT RENDERER
// =============================================================================

function MessageContent({ content }: { content: string }) {
  // Parse content for code blocks and render appropriately
  const parts = useMemo(() => {
    const result: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        result.push({ type: 'text', content: content.slice(lastIndex, match.index) });
      }
      // Add code block
      result.push({ type: 'code', content: match[2].trim(), language: match[1] || undefined });
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      result.push({ type: 'text', content: content.slice(lastIndex) });
    }

    return result.length > 0 ? result : [{ type: 'text' as const, content }];
  }, [content]);

  return (
    <div className="text-sm leading-relaxed">
      {parts.map((part, i) => (
        part.type === 'code' ? (
          <CodeBlock key={i} code={part.content} language={part.language} />
        ) : (
          <span key={i} className="whitespace-pre-wrap">{part.content}</span>
        )
      ))}
    </div>
  );
}

// =============================================================================
// TOOL BADGE
// =============================================================================

function ToolBadge({ tool }: { tool: SkinTool }) {
  const IconComponent = TOOL_ICONS[tool.name] || Wrench;
  const colorClass = TOOL_COLORS[tool.name] || 'text-neutral-400 bg-neutral-500/20 border-neutral-500/30';
  const isRunning = tool.status === 'running';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        'text-xs font-medium border transition-all',
        colorClass,
        isRunning && 'animate-pulse'
      )}
    >
      <IconComponent className={cn('w-3.5 h-3.5', isRunning && 'animate-spin')} />
      <span>{tool.name}</span>
      {isRunning && <Loader2 className="w-3 h-3 animate-spin" />}
    </span>
  );
}

// =============================================================================
// MESSAGE BUBBLE
// =============================================================================

interface MessageBubbleProps {
  message: SkinMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isStreaming = !message.isComplete;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'group flex gap-3 mb-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center',
          'shadow-lg transition-transform group-hover:scale-105',
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
            : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className={cn('w-4 h-4', isStreaming && 'animate-pulse')} />
        )}
      </div>

      {/* Message content */}
      <div className={cn('flex-1 max-w-[85%]', isUser && 'flex flex-col items-end')}>
        {/* Tools indicator */}
        {message.tools && message.tools.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.tools.map((tool, i) => (
              <ToolBadge key={i} tool={tool} />
            ))}
          </div>
        )}

        {/* Message card */}
        <div
          className={cn(
            'relative rounded-2xl px-4 py-3',
            'shadow-lg transition-all duration-200',
            'border',
            isUser
              ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-50'
              : 'bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 border-neutral-700/50 text-neutral-100',
            isStreaming && 'border-purple-500/50 shadow-purple-500/10'
          )}
        >
          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex items-center gap-2 mb-2 text-xs text-purple-400">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>Claude is typing...</span>
            </div>
          )}

          {/* Content */}
          {message.content ? (
            <MessageContent content={message.content} />
          ) : isStreaming ? (
            <span className="text-neutral-500 italic text-sm">Waiting for response...</span>
          ) : null}

          {/* Copy button - appears on hover */}
          {message.content && !isUser && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100
                       bg-neutral-700/50 hover:bg-neutral-600/50 text-neutral-400 hover:text-neutral-200
                       transition-all duration-200"
              title="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Timestamp */}
        <div className={cn(
          'flex items-center gap-1 mt-1.5 text-[10px] text-neutral-500',
          isUser && 'flex-row-reverse'
        )}>
          <Clock className="w-3 h-3" />
          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SESSION HISTORY PANEL
// =============================================================================

interface SessionHistoryProps {
  sessions: SkinSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onClose: () => void;
}

function SessionHistory({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onClose,
}: SessionHistoryProps) {
  return (
    <div className="absolute inset-0 z-30 bg-neutral-950/98 backdrop-blur-md animate-in fade-in-0 duration-200">
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/20">
            <History className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <span className="font-semibold text-neutral-200">Session History</span>
            <span className="ml-2 text-xs text-neutral-500">({sessions.length} saved)</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-y-auto h-[calc(100%-70px)] p-4 space-y-3">
        {sessions.length === 0 ? (
          <div className="text-center text-neutral-500 py-12">
            <History className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No saved sessions yet</p>
            <p className="text-sm opacity-70 mt-1">Your conversations will appear here</p>
          </div>
        ) : (
          sessions.map((session) => {
            const messagePreview = session.messages[session.messages.length - 1]?.content?.slice(0, 80) || 'No messages';
            return (
              <div
                key={session.id}
                className={cn(
                  'group relative p-4 rounded-2xl cursor-pointer',
                  'border transition-all duration-200',
                  session.id === currentSessionId
                    ? 'bg-purple-500/10 border-purple-500/30 shadow-lg shadow-purple-500/5'
                    : 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800/50 hover:border-neutral-700'
                )}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-neutral-400" />
                      <span className="font-medium text-neutral-200 truncate">
                        {session.name}
                      </span>
                      {session.isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 truncate mt-1">{messagePreview}...</p>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-neutral-600">
                      <span>{session.messages.length} messages</span>
                      <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20
                             text-neutral-500 hover:text-red-400 transition-all"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface TerminalSkinProps {
  isVisible: boolean;
  onToggle: () => void;
  outputBuffer: string;
  terminalSessionId: string;
  isConnected: boolean;
  jsonMode?: boolean;
}

export function TerminalSkin({
  isVisible,
  onToggle,
  outputBuffer,
  terminalSessionId,
  isConnected,
  jsonMode = false,
}: TerminalSkinProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // Session state
  const [currentSession, setCurrentSession] = useState<SkinSession | null>(null);
  const [messages, setMessages] = useState<SkinMessage[]>([]);
  const [parserState, setParserState] = useState<ParserState>(createParserState);
  const [allSessions, setAllSessions] = useState<SkinSession[]>([]);

  // Initialize or restore session
  useEffect(() => {
    if (!terminalSessionId) return;

    // Try to find existing session for this terminal
    let session = skinStore.getSessionByTerminalId(terminalSessionId);

    if (!session) {
      // Create new session
      session = skinStore.createSession(terminalSessionId);
    } else {
      // Restore existing session
      skinStore.setActiveSession(session.id);
    }

    setCurrentSession(session);
    setMessages(session.messages);
    setAllSessions(skinStore.getAllSessions());

    // Reset parser state for new session
    setParserState(createParserState());
  }, [terminalSessionId]);

  // Real-time parsing of new output
  useEffect(() => {
    if (!currentSession || !outputBuffer) return;

    const result = parseIncremental(outputBuffer, messages, parserState);

    if (result.messages.length !== messages.length ||
        (result.messages.length > 0 && result.messages[result.messages.length - 1]?.content !== messages[messages.length - 1]?.content)) {
      setMessages(result.messages);

      // Persist to storage
      skinStore.updateSession(currentSession.id, {
        messages: result.messages,
      });
    }

    setParserState(result.state);
  }, [outputBuffer, currentSession?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current && isVisible) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll, isVisible]);

  // Detect manual scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isAtBottom);
  }, []);

  // Session management
  const handleSelectSession = useCallback((sessionId: string) => {
    const session = skinStore.getSession(sessionId);
    if (session) {
      skinStore.setActiveSession(sessionId);
      setCurrentSession(session);
      setMessages(session.messages);
      setParserState(createParserState());
      setShowHistory(false);
    }
  }, []);

  const handleDeleteSession = useCallback((sessionId: string) => {
    skinStore.deleteSession(sessionId);
    setAllSessions(skinStore.getAllSessions());

    if (currentSession?.id === sessionId) {
      const sessions = skinStore.getAllSessions();
      if (sessions.length > 0) {
        handleSelectSession(sessions[0].id);
      } else {
        setCurrentSession(null);
        setMessages([]);
      }
    }
  }, [currentSession?.id, handleSelectSession]);

  const refreshSessions = useCallback(() => {
    setAllSessions(skinStore.getAllSessions());
  }, []);

  return (
    <>
      {/* Toggle button - always visible */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
        {isVisible && (
          <button
            onClick={() => {
              refreshSessions();
              setShowHistory(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                     bg-neutral-800/90 text-neutral-400 border border-neutral-700/50
                     hover:bg-neutral-700/90 hover:text-neutral-200 transition-all text-xs font-medium
                     shadow-lg"
            title="View session history"
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
        )}

        <button
          onClick={onToggle}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl',
            'text-xs font-medium transition-all duration-300',
            'shadow-lg border',
            isVisible
              ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-200 border-purple-500/30 hover:from-purple-500/40 hover:to-pink-500/40'
              : 'bg-neutral-800/90 text-neutral-300 border-neutral-700/50 hover:bg-neutral-700/90'
          )}
          title={isVisible ? 'Show raw terminal' : 'Show chat skin'}
        >
          {isVisible ? (
            <>
              <Terminal className="w-4 h-4" />
              <span>Raw</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Chat</span>
            </>
          )}
        </button>
      </div>

      {/* Skin overlay */}
      <div
        className={cn(
          'absolute inset-0 z-10 transition-all duration-500 ease-out',
          isVisible
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Blurred background - terminal shows through */}
        <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm" />

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-pink-500/5" />

        {/* Chat content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto p-6 pt-16 pb-6"
        >
          {!jsonMode ? (
            // Legacy mode - show clear message
            <div className="flex flex-col items-center justify-center h-full text-neutral-500">
              <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800">
                <Terminal className="w-12 h-12 opacity-40 mx-auto" />
              </div>
              <p className="mt-6 text-base font-medium text-amber-400">Legacy Session</p>
              <p className="text-sm mt-2 opacity-70 text-center max-w-sm">
                This session uses visual output mode.
                <br />
                Create a new session for the chat experience.
              </p>
              <div className="mt-6 px-5 py-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <p className="text-purple-300 text-sm font-medium flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Click + to create a new session
                </p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <MessageSquare className="w-12 h-12 text-purple-400/50" />
                </div>
                <Sparkles className="w-6 h-6 absolute -top-2 -right-2 text-pink-400 animate-pulse" />
              </div>
              <p className="mt-6 text-base font-medium text-neutral-300">Ready for conversation</p>
              <p className="text-sm mt-2 text-neutral-500 text-center max-w-xs">
                Messages will appear here in real-time as you chat with Claude
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
          )}
        </div>

        {/* Scroll to bottom button */}
        {!autoScroll && messages.length > 0 && (
          <button
            onClick={() => {
              setAutoScroll(true);
              scrollRef.current?.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth',
              });
            }}
            className="absolute bottom-6 right-6 p-3 rounded-full
                     bg-gradient-to-r from-purple-500 to-pink-500 text-white
                     shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40
                     transition-all duration-200 hover:scale-105"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}

        {/* Status bar */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3 px-4 py-2
                      rounded-full bg-neutral-900/90 border border-neutral-800
                      text-xs text-neutral-400 shadow-lg">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500'
            )} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          {currentSession && (
            <>
              <div className="w-px h-3 bg-neutral-700" />
              <span className="text-neutral-500">{messages.length} messages</span>
            </>
          )}
          {jsonMode && (
            <>
              <div className="w-px h-3 bg-neutral-700" />
              <span className="text-purple-400 flex items-center gap-1">
                <Code className="w-3 h-3" />
                JSON
              </span>
            </>
          )}
        </div>

        {/* Session History Panel */}
        {showHistory && (
          <SessionHistory
            sessions={allSessions}
            currentSessionId={currentSession?.id || null}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>
    </>
  );
}
