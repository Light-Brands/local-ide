/**
 * useChat Hook (Robust Version)
 *
 * A more robust chat implementation that:
 * - Uses refs to avoid re-renders during streaming
 * - Batches state updates
 * - Handles errors gracefully
 * - Provides stable callbacks
 * - Uses existing Message/ContentBlock types for compatibility
 * - Supports WebSocket mode for persistent chat via tmux
 */

'use client';

import { useCallback, useRef, useReducer, useEffect } from 'react';
import { IDE_FEATURES } from '../features';
import { ChatService, getChatService, getChatWebSocketUrl, ClaudeState } from '../services/chat';
import type {
  Message,
  ContentBlock,
  TextBlock,
  ThinkingBlock,
  ToolUseBlock,
  ErrorBlock,
} from '@/types/chat';

// Re-export types for convenience
export type { Message, ContentBlock };

// =============================================================================
// STATE TYPES
// =============================================================================

type ChatState = {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  // Claude CLI state tracking
  claudeState: ClaudeState;
  currentTool: string | null;
  isStuck: boolean;
  stuckDuration: number;
};

type ChatAction =
  | { type: 'ADD_USER_MESSAGE'; message: Message }
  | { type: 'ADD_ASSISTANT_MESSAGE'; message: Message }
  | { type: 'UPDATE_ASSISTANT_MESSAGE'; id: string; content: ContentBlock[]; isStreaming?: boolean }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_MESSAGES'; messages: Message[] }
  | { type: 'SET_CLAUDE_STATE'; claudeState: ClaudeState; currentTool?: string | null }
  | { type: 'SET_STUCK'; isStuck: boolean; stuckDuration?: number };

// =============================================================================
// REDUCER
// =============================================================================

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_USER_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.message],
      };

    case 'ADD_ASSISTANT_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.message],
      };

    case 'UPDATE_ASSISTANT_MESSAGE': {
      const index = state.messages.findIndex((m) => m.id === action.id);
      if (index === -1) return state;

      const newMessages = [...state.messages];
      newMessages[index] = {
        ...newMessages[index],
        content: action.content,
        isStreaming: action.isStreaming ?? newMessages[index].isStreaming,
      };
      return { ...state, messages: newMessages };
    }

    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'CLEAR_MESSAGES':
      return { ...state, messages: [], error: null, isStuck: false, stuckDuration: 0 };

    case 'SET_MESSAGES':
      return { ...state, messages: action.messages };

    case 'SET_CLAUDE_STATE':
      return {
        ...state,
        claudeState: action.claudeState,
        currentTool: action.currentTool ?? state.currentTool,
        // Clear stuck state when Claude state changes
        isStuck: false,
        stuckDuration: 0,
      };

    case 'SET_STUCK':
      return {
        ...state,
        isStuck: action.isStuck,
        stuckDuration: action.stuckDuration ?? 0,
      };

    default:
      return state;
  }
}

// =============================================================================
// UTILITIES
// =============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// =============================================================================
// HOOK
// =============================================================================

export interface UseChatOptions {
  /** API endpoint for chat */
  endpoint?: string;
  /** Initial messages */
  initialMessages?: Message[];
  /** Workspace path for context */
  workspacePath?: string;
  /** Called when tool is used */
  onToolUse?: (tool: string, input: Record<string, unknown>) => void;
  /** Called on error */
  onError?: (error: string) => void;
  /** Max history to send */
  maxHistory?: number;
  /** External messages (for session support) */
  externalMessages?: Message[];
  /** Callback when messages change (for external state sync) */
  onMessagesChange?: (messages: Message[]) => void;
  /** Called when tool starts (for operation tracking) */
  onToolStart?: (toolName: string, input: Record<string, unknown>, id: string) => void;
  /** Called when tool ends (for operation tracking) */
  onToolEnd?: (id: string, status: 'success' | 'error', error?: string) => void;
  /** Called when thinking starts */
  onThinkingStart?: () => void;
  /** Called when thinking ends */
  onThinkingEnd?: () => void;
  /** Use WebSocket mode for persistent chat */
  useWebSocket?: boolean;
  /** Backend session ID for reconnection */
  backendSessionId?: string;
  /** Callback when backend session ID is received */
  onBackendSessionId?: (id: string) => void;
}

export interface UseChatReturn {
  /** All messages */
  messages: Message[];
  /** Whether currently loading/streaming */
  isLoading: boolean;
  /** Whether connected to the chat service */
  isConnected: boolean;
  /** Current error message */
  error: string | null;
  /** Current Claude CLI state */
  claudeState: ClaudeState;
  /** Currently running tool name */
  currentTool: string | null;
  /** Whether Claude appears stuck (no output for a while) */
  isStuck: boolean;
  /** How long Claude has been stuck (ms) */
  stuckDuration: number;
  /** Send a message */
  sendMessage: (content: string) => Promise<void>;
  /** Clear all messages */
  clearMessages: () => void;
  /** Abort current stream */
  abort: () => void;
  /** Set messages directly (for session restore) */
  setMessages: (messages: Message[]) => void;
  /** Toggle thinking block collapse */
  toggleThinking: (messageId: string, blockIndex: number) => void;
  /** Check connection status */
  checkConnection: () => Promise<{ connected: boolean; error?: string }>;
  /** Send Enter key to confirm paste */
  sendEnter: () => void;
  /** Kill and restart the session */
  killSession: () => void;
  /** Request status update */
  getStatus: () => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    endpoint = '/api/ide/chat/stream',
    initialMessages = [],
    workspacePath = '/tmp/workspace',
    onToolUse,
    onError,
    maxHistory = 20,
    externalMessages,
    onMessagesChange,
    onToolStart,
    onToolEnd,
    onThinkingStart,
    onThinkingEnd,
    useWebSocket = false,
    backendSessionId,
    onBackendSessionId,
  } = options;

  // WebSocket service ref
  const chatServiceRef = useRef<ChatService | null>(null);
  const wsCleanupRef = useRef<(() => void)[]>([]);

  // Use reducer for predictable state updates
  const [state, dispatch] = useReducer(chatReducer, {
    messages: initialMessages,
    isLoading: false,
    error: null,
    claudeState: 'idle' as ClaudeState,
    currentTool: null,
    isStuck: false,
    stuckDuration: 0,
  });

  // Track connection status
  const isConnectedRef = useRef(true);

  // Use external messages if provided, otherwise internal
  const messages = externalMessages ?? state.messages;

  // Refs for stable access in callbacks
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Callback refs
  const onToolUseRef = useRef(onToolUse);
  const onErrorRef = useRef(onError);
  const onMessagesChangeRef = useRef(onMessagesChange);
  const onToolStartRef = useRef(onToolStart);
  const onToolEndRef = useRef(onToolEnd);
  const onThinkingStartRef = useRef(onThinkingStart);
  const onThinkingEndRef = useRef(onThinkingEnd);
  onToolUseRef.current = onToolUse;
  onErrorRef.current = onError;
  onMessagesChangeRef.current = onMessagesChange;
  onToolStartRef.current = onToolStart;
  onToolEndRef.current = onToolEnd;
  onThinkingStartRef.current = onThinkingStart;
  onThinkingEndRef.current = onThinkingEnd;

  // Refs for WebSocket streaming state
  const wsCurrentBlocksRef = useRef<ContentBlock[]>([]);
  const wsCurrentTextRef = useRef<string>('');
  const wsCurrentThinkingRef = useRef<string>('');
  const wsToolBlocksRef = useRef<Map<string, ToolUseBlock>>(new Map());
  const wsAssistantIdRef = useRef<string | null>(null);
  const onBackendSessionIdRef = useRef(onBackendSessionId);
  onBackendSessionIdRef.current = onBackendSessionId;

  // Helper to update messages (uses external callback or internal state)
  const updateMessages = useCallback((updater: Message[] | ((prev: Message[]) => Message[])) => {
    const currentMessages = messagesRef.current;
    const newMessages = typeof updater === 'function' ? updater(currentMessages) : updater;

    if (onMessagesChangeRef.current) {
      onMessagesChangeRef.current(newMessages);
    } else {
      dispatch({ type: 'SET_MESSAGES', messages: newMessages });
    }
  }, []);

  // Build conversation history for API
  const buildHistory = useCallback(
    (msgs: Message[]) => {
      return msgs.slice(-maxHistory).map((msg) => ({
        role: msg.role,
        content: msg.content
          .filter((b): b is TextBlock => b.type === 'text')
          .map((b) => b.content)
          .join('\n'),
      }));
    },
    [maxHistory]
  );

  // Track the current backend session to detect actual session changes
  const currentBackendSessionRef = useRef<string | undefined>(undefined);

  // WebSocket connection effect
  useEffect(() => {
    if (!useWebSocket || !IDE_FEATURES.persistentChat) {
      return;
    }

    const wsUrl = getChatWebSocketUrl(backendSessionId);

    // Only create a new service if:
    // 1. We don't have one yet (currentBackendSessionRef.current is undefined AND no service)
    // 2. We're switching to a DIFFERENT session (not just receiving our own session ID back)
    const existingService = chatServiceRef.current;
    const isNewSession = backendSessionId !== currentBackendSessionRef.current;
    const isJustReceivingOurSessionId = !currentBackendSessionRef.current && backendSessionId && existingService?.isConnected;

    // Don't recreate if we just received our session ID back from the server
    if (isJustReceivingOurSessionId) {
      console.log('[useChat] Received session ID, keeping existing connection:', backendSessionId);
      currentBackendSessionRef.current = backendSessionId;
      return;
    }

    const shouldCreateNew = !existingService || isNewSession;
    currentBackendSessionRef.current = backendSessionId;

    const service = getChatService({ url: wsUrl }, shouldCreateNew);
    chatServiceRef.current = service;

    // Helper to update assistant message in WebSocket mode
    const updateWsAssistant = (blocks: ContentBlock[], isStreaming = true) => {
      const assistantId = wsAssistantIdRef.current;
      if (!assistantId) return;

      wsCurrentBlocksRef.current = blocks;
      updateMessages((prev) => {
        const newMessages = [...prev];
        const idx = newMessages.findIndex((m) => m.id === assistantId);
        if (idx !== -1) {
          newMessages[idx] = {
            ...newMessages[idx],
            content: [...blocks],
            isStreaming,
          };
        }
        return newMessages;
      });
    };

    // Event handlers
    const cleanups: (() => void)[] = [];

    cleanups.push(service.on('connected', (e) => {
      console.log('[useChat] WebSocket connected, session:', e.sessionId);
      isConnectedRef.current = true;
      // Clear any previous connection errors now that we're connected
      dispatch({ type: 'SET_ERROR', error: null });
      if (e.sessionId) {
        onBackendSessionIdRef.current?.(e.sessionId);
      }
    }));

    cleanups.push(service.on('text', (e) => {
      if (!e.content) return;
      wsCurrentTextRef.current += e.content;
      const textBlockIndex = wsCurrentBlocksRef.current.findIndex(b => b.type === 'text');
      if (textBlockIndex !== -1) {
        wsCurrentBlocksRef.current[textBlockIndex] = {
          type: 'text',
          content: wsCurrentTextRef.current,
        } as TextBlock;
      } else {
        wsCurrentBlocksRef.current.push({
          type: 'text',
          content: wsCurrentTextRef.current,
        } as TextBlock);
      }
      updateWsAssistant(wsCurrentBlocksRef.current);
    }));

    cleanups.push(service.on('thinking', (e) => {
      if (!e.content) return;
      if (!wsCurrentThinkingRef.current) {
        onThinkingStartRef.current?.();
      }
      wsCurrentThinkingRef.current += e.content;
      const thinkingIndex = wsCurrentBlocksRef.current.findIndex(b => b.type === 'thinking');
      if (thinkingIndex !== -1) {
        wsCurrentBlocksRef.current[thinkingIndex] = {
          type: 'thinking',
          content: wsCurrentThinkingRef.current,
          collapsed: true,
        } as ThinkingBlock;
      } else {
        wsCurrentBlocksRef.current.push({
          type: 'thinking',
          content: wsCurrentThinkingRef.current,
          collapsed: true,
        } as ThinkingBlock);
      }
      updateWsAssistant(wsCurrentBlocksRef.current);
    }));

    cleanups.push(service.on('tool_use_start', (e) => {
      if (wsCurrentThinkingRef.current) {
        onThinkingEndRef.current?.();
      }
      const toolBlock: ToolUseBlock = {
        type: 'tool_use',
        id: e.id || '',
        tool: e.tool || '',
        input: e.input || {},
        status: 'running',
      };
      wsToolBlocksRef.current.set(e.id || '', toolBlock);
      wsCurrentBlocksRef.current.push(toolBlock);
      updateWsAssistant(wsCurrentBlocksRef.current);
      onToolUseRef.current?.(e.tool || '', e.input || {});
      onToolStartRef.current?.(e.tool || '', e.input || {}, e.id || '');
    }));

    cleanups.push(service.on('tool_use_output', (e) => {
      const toolBlock = wsToolBlocksRef.current.get(e.id || '');
      if (toolBlock) {
        toolBlock.output = (toolBlock.output || '') + (e.output || '');
        updateWsAssistant(wsCurrentBlocksRef.current);
      }
    }));

    cleanups.push(service.on('tool_use_end', (e) => {
      const toolBlock = wsToolBlocksRef.current.get(e.id || '');
      if (toolBlock) {
        toolBlock.status = e.status || 'success';
        if (e.error) {
          toolBlock.error = e.error;
        }
        updateWsAssistant(wsCurrentBlocksRef.current);
        onToolEndRef.current?.(e.id || '', e.status === 'success' ? 'success' : 'error', e.error);
      }
    }));

    cleanups.push(service.on('done', () => {
      updateWsAssistant(wsCurrentBlocksRef.current, false);
      dispatch({ type: 'SET_LOADING', isLoading: false });
      // Reset streaming state
      wsCurrentBlocksRef.current = [];
      wsCurrentTextRef.current = '';
      wsCurrentThinkingRef.current = '';
      wsToolBlocksRef.current.clear();
      wsAssistantIdRef.current = null;
    }));

    cleanups.push(service.on('error', (e) => {
      const errorMsg = e.error || 'Unknown error';
      dispatch({ type: 'SET_ERROR', error: errorMsg });
      onErrorRef.current?.(errorMsg);
      wsCurrentBlocksRef.current.push({ type: 'error', content: errorMsg } as ErrorBlock);
      updateWsAssistant(wsCurrentBlocksRef.current, false);
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }));

    cleanups.push(service.on('close', () => {
      isConnectedRef.current = false;
    }));

    cleanups.push(service.on('reconnecting', (e) => {
      console.log('[useChat] Reconnecting, attempt:', e.attempt);
    }));

    cleanups.push(service.on('output-buffer', (e) => {
      // Handle buffered output on reconnect
      if (e.data) {
        console.log('[useChat] Received buffered output:', e.data.length, 'chars');
      }
    }));

    // Handle Claude state changes
    cleanups.push(service.on('state-change', (e) => {
      console.log('[useChat] Claude state changed:', e.claudeState, e.currentTool);
      dispatch({
        type: 'SET_CLAUDE_STATE',
        claudeState: e.claudeState || 'unknown',
        currentTool: e.currentTool,
      });
    }));

    // Handle status updates (including stuck detection)
    cleanups.push(service.on('status', (e) => {
      console.log('[useChat] Status update:', e.claudeState, 'stuck:', e.isStuck);
      dispatch({
        type: 'SET_CLAUDE_STATE',
        claudeState: e.claudeState || 'unknown',
        currentTool: e.currentTool,
      });
      if (e.isStuck) {
        dispatch({
          type: 'SET_STUCK',
          isStuck: true,
          stuckDuration: e.stuckDuration,
        });
      }
    }));

    wsCleanupRef.current = cleanups;

    // Connect
    service.connect();

    return () => {
      cleanups.forEach(fn => fn());
      wsCleanupRef.current = [];
      // Don't disconnect - let the service persist for reconnection
    };
  }, [useWebSocket, backendSessionId, updateMessages]);

  // Check connection to chat service
  const checkConnection = useCallback(async () => {
    // If Claude chat is disabled, report as disconnected silently
    if (!IDE_FEATURES.claudeChat) {
      isConnectedRef.current = false;
      return { connected: false, error: 'Claude chat is disabled' };
    }

    try {
      const response = await fetch('/api/ide/chat/status');
      const status = await response.json();
      isConnectedRef.current = status.connected;
      return status;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to check connection';
      isConnectedRef.current = false;
      return { connected: false, error: errorMsg };
    }
  }, []);

  // Abort current stream
  const abort = useCallback(() => {
    // WebSocket mode
    if (useWebSocket && chatServiceRef.current) {
      chatServiceRef.current.abort();
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }
    // HTTP mode
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, [useWebSocket]);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || state.isLoading) return;

      // If Claude chat is disabled, show a friendly message
      if (!IDE_FEATURES.claudeChat) {
        const userMessage: Message = {
          id: generateId(),
          role: 'user',
          content: [{ type: 'text', content } as TextBlock],
          timestamp: new Date(),
        };
        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: [{ type: 'text', content: 'Chat is not available in this environment.' } as TextBlock],
          timestamp: new Date(),
          isStreaming: false,
        };
        updateMessages((prev) => [...prev, userMessage, assistantMessage]);
        return;
      }

      // Clear previous error
      dispatch({ type: 'SET_ERROR', error: null });
      dispatch({ type: 'SET_LOADING', isLoading: true });

      // Add user message
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: [{ type: 'text', content } as TextBlock],
        timestamp: new Date(),
      };

      // Add empty assistant message for streaming
      const assistantId = generateId();
      const assistantMessage: Message = {
        id: assistantId,
        role: 'assistant',
        content: [],
        timestamp: new Date(),
        isStreaming: true,
      };

      // Add both messages
      updateMessages((prev) => [...prev, userMessage, assistantMessage]);

      // WebSocket mode - send via service
      if (useWebSocket && chatServiceRef.current?.isConnected) {
        wsAssistantIdRef.current = assistantId;
        wsCurrentBlocksRef.current = [];
        wsCurrentTextRef.current = '';
        wsCurrentThinkingRef.current = '';
        wsToolBlocksRef.current.clear();
        chatServiceRef.current.sendMessage(content);
        return;
      }

      // HTTP+SSE mode - fall through to existing implementation
      // Create abort controller
      abortControllerRef.current = new AbortController();

      // Track current content blocks for updates
      let currentBlocks: ContentBlock[] = [];
      let currentTextContent = '';
      let currentThinkingContent = '';
      const toolBlocks = new Map<string, ToolUseBlock>();

      // Helper to update assistant message
      const updateAssistant = (blocks: ContentBlock[], isStreaming = true) => {
        currentBlocks = blocks;
        updateMessages((prev) => {
          const newMessages = [...prev];
          const assistantIndex = newMessages.findIndex((m) => m.id === assistantId);
          if (assistantIndex !== -1) {
            newMessages[assistantIndex] = {
              ...newMessages[assistantIndex],
              content: [...blocks],
              isStreaming,
            };
          }
          return newMessages;
        });
      };

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            workspacePath,
            conversationHistory: buildHistory(messagesRef.current),
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;

            const data = line.slice(6).trim();
            if (!data) continue;

            try {
              const event = JSON.parse(data);

              switch (event.type) {
                case 'text':
                  currentTextContent += event.content;
                  {
                    const textBlockIndex = currentBlocks.findIndex(
                      (b) => b.type === 'text'
                    );
                    if (textBlockIndex !== -1) {
                      currentBlocks[textBlockIndex] = {
                        type: 'text',
                        content: currentTextContent,
                      } as TextBlock;
                    } else {
                      currentBlocks.push({
                        type: 'text',
                        content: currentTextContent,
                      } as TextBlock);
                    }
                    updateAssistant(currentBlocks);
                  }
                  break;

                case 'thinking':
                  {
                    // Notify thinking start if this is the first thinking content
                    if (!currentThinkingContent) {
                      onThinkingStartRef.current?.();
                    }
                    currentThinkingContent += event.content;
                    const thinkingIndex = currentBlocks.findIndex(
                      (b) => b.type === 'thinking'
                    );
                    if (thinkingIndex !== -1) {
                      currentBlocks[thinkingIndex] = {
                        type: 'thinking',
                        content: currentThinkingContent,
                        collapsed: true,
                      } as ThinkingBlock;
                    } else {
                      currentBlocks.push({
                        type: 'thinking',
                        content: currentThinkingContent,
                        collapsed: true,
                      } as ThinkingBlock);
                    }
                    updateAssistant(currentBlocks);
                  }
                  break;

                case 'tool_use_start':
                  {
                    // Notify thinking end when tool starts (thinking phase is over)
                    if (currentThinkingContent) {
                      onThinkingEndRef.current?.();
                    }
                    const toolBlock: ToolUseBlock = {
                      type: 'tool_use',
                      id: event.id,
                      tool: event.tool,
                      input: event.input,
                      status: 'running',
                    };
                    toolBlocks.set(event.id, toolBlock);
                    currentBlocks.push(toolBlock);
                    updateAssistant(currentBlocks);
                    onToolUseRef.current?.(event.tool, event.input);
                    // Notify operation tracking
                    onToolStartRef.current?.(event.tool, event.input, event.id);
                  }
                  break;

                case 'tool_use_output':
                  {
                    const toolBlock = toolBlocks.get(event.id);
                    if (toolBlock) {
                      toolBlock.output = (toolBlock.output || '') + event.output;
                      updateAssistant(currentBlocks);
                    }
                  }
                  break;

                case 'tool_use_end':
                  {
                    const toolBlock = toolBlocks.get(event.id);
                    if (toolBlock) {
                      toolBlock.status = event.status;
                      if (event.error) {
                        toolBlock.error = event.error;
                      }
                      updateAssistant(currentBlocks);
                      // Notify operation tracking
                      onToolEndRef.current?.(
                        event.id,
                        event.status === 'success' ? 'success' : 'error',
                        event.error
                      );
                    }
                  }
                  break;

                case 'error':
                  currentBlocks.push({
                    type: 'error',
                    content: event.content,
                  } as ErrorBlock);
                  updateAssistant(currentBlocks);
                  dispatch({ type: 'SET_ERROR', error: event.content });
                  onErrorRef.current?.(event.content);
                  break;

                case 'done':
                  updateAssistant(currentBlocks, false);
                  break;
              }
            } catch (e) {
              console.error('[useChat] Failed to parse event:', e, data);
            }
          }
        }

        // Ensure streaming is marked complete
        updateAssistant(currentBlocks, false);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Aborted - add cancelled message if empty
          if (currentBlocks.length === 0) {
            currentBlocks.push({ type: 'text', content: '(Cancelled)' } as TextBlock);
          }
          updateAssistant(currentBlocks, false);
        } else {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          dispatch({ type: 'SET_ERROR', error: errorMsg });
          onErrorRef.current?.(errorMsg);
          currentBlocks.push({ type: 'error', content: errorMsg } as ErrorBlock);
          updateAssistant(currentBlocks, false);
        }
      } finally {
        dispatch({ type: 'SET_LOADING', isLoading: false });
        abortControllerRef.current = null;
      }
    },
    [endpoint, workspacePath, buildHistory, state.isLoading, updateMessages, useWebSocket]
  );

  // Clear messages
  const clearMessages = useCallback(() => {
    abort();
    updateMessages([]);
    dispatch({ type: 'SET_ERROR', error: null });
  }, [abort, updateMessages]);

  // Set messages (for session restore)
  const setMessages = useCallback((newMessages: Message[]) => {
    updateMessages(newMessages);
  }, [updateMessages]);

  // Toggle thinking block collapse
  const toggleThinking = useCallback((messageId: string, blockIndex: number) => {
    updateMessages((prev) => {
      const newMessages = [...prev];
      const msgIndex = newMessages.findIndex((m) => m.id === messageId);

      if (msgIndex !== -1) {
        const msg = newMessages[msgIndex];
        const block = msg.content[blockIndex];

        if (block && block.type === 'thinking') {
          const newContent = [...msg.content];
          newContent[blockIndex] = {
            ...block,
            collapsed: !(block as ThinkingBlock).collapsed,
          } as ThinkingBlock;
          newMessages[msgIndex] = { ...msg, content: newContent };
        }
      }

      return newMessages;
    });
  }, [updateMessages]);

  // Send Enter key to confirm paste
  const sendEnter = useCallback(() => {
    if (chatServiceRef.current?.isConnected) {
      chatServiceRef.current.sendEnter();
    }
  }, []);

  // Kill and restart session
  const killSession = useCallback(() => {
    if (chatServiceRef.current?.isConnected) {
      chatServiceRef.current.killSession();
      dispatch({ type: 'SET_LOADING', isLoading: false });
      dispatch({ type: 'SET_CLAUDE_STATE', claudeState: 'idle', currentTool: null });
    }
  }, []);

  // Request status update
  const getStatus = useCallback(() => {
    if (chatServiceRef.current?.isConnected) {
      chatServiceRef.current.getStatus();
    }
  }, []);

  return {
    messages,
    isLoading: state.isLoading,
    isConnected: isConnectedRef.current,
    error: state.error,
    claudeState: state.claudeState,
    currentTool: state.currentTool,
    isStuck: state.isStuck,
    stuckDuration: state.stuckDuration,
    sendMessage,
    clearMessages,
    abort,
    setMessages,
    toggleThinking,
    checkConnection,
    sendEnter,
    killSession,
    getStatus,
  };
}
