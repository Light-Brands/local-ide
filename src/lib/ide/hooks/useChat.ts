/**
 * useChat Hook (Robust Version)
 *
 * A more robust chat implementation that:
 * - Uses refs to avoid re-renders during streaming
 * - Batches state updates
 * - Handles errors gracefully
 * - Provides stable callbacks
 * - Uses existing Message/ContentBlock types for compatibility
 */

'use client';

import { useCallback, useRef, useReducer } from 'react';
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
};

type ChatAction =
  | { type: 'ADD_USER_MESSAGE'; message: Message }
  | { type: 'ADD_ASSISTANT_MESSAGE'; message: Message }
  | { type: 'UPDATE_ASSISTANT_MESSAGE'; id: string; content: ContentBlock[]; isStreaming?: boolean }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_MESSAGES'; messages: Message[] };

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
      return { ...state, messages: [], error: null };

    case 'SET_MESSAGES':
      return { ...state, messages: action.messages };

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
  } = options;

  // Use reducer for predictable state updates
  const [state, dispatch] = useReducer(chatReducer, {
    messages: initialMessages,
    isLoading: false,
    error: null,
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
  onToolUseRef.current = onToolUse;
  onErrorRef.current = onError;
  onMessagesChangeRef.current = onMessagesChange;

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

  // Check connection to chat service
  const checkConnection = useCallback(async () => {
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || state.isLoading) return;

      // Clear previous error
      dispatch({ type: 'SET_ERROR', error: null });
      dispatch({ type: 'SET_LOADING', isLoading: true });

      // Create abort controller
      abortControllerRef.current = new AbortController();

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
                  currentThinkingContent += event.content;
                  {
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
    [endpoint, workspacePath, buildHistory, state.isLoading, updateMessages]
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

  return {
    messages,
    isLoading: state.isLoading,
    isConnected: isConnectedRef.current,
    error: state.error,
    sendMessage,
    clearMessages,
    abort,
    setMessages,
    toggleThinking,
    checkConnection,
  };
}
