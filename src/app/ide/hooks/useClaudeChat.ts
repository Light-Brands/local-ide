'use client';

/**
 * useClaudeChat Hook
 * Manages chat state and streams messages from Claude CLI API
 */

import { useState, useCallback, useRef } from 'react';
import type {
  Message,
  ContentBlock,
  ChatEvent,
  ConversationHistoryEntry,
  TextBlock,
  ThinkingBlock,
  ToolUseBlock,
  ErrorBlock,
  ClaudeCliStatus,
} from '@/types/chat';

export interface UseClaudeChatOptions {
  workspacePath?: string;
  onToolUse?: (tool: string, input: Record<string, unknown>) => void;
  onError?: (error: string) => void;
  // External message state (for session support)
  externalMessages?: Message[];
  onMessagesChange?: (messages: Message[]) => void;
}

export interface UseClaudeChatReturn {
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  toggleThinking: (messageId: string, blockIndex: number) => void;
  checkConnection: () => Promise<ClaudeCliStatus>;
  abortStream: () => void;
}

export function useClaudeChat(options: UseClaudeChatOptions = {}): UseClaudeChatReturn {
  const { workspacePath, onToolUse, onError, externalMessages, onMessagesChange } = options;

  // Use internal state if no external messages provided
  const [internalMessages, setInternalMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Use external messages if provided, otherwise internal
  const messages = externalMessages ?? internalMessages;

  // Store refs for stable callback access (avoids recreating setMessages on every message change)
  const messagesRef = useRef(messages);
  const onMessagesChangeRef = useRef(onMessagesChange);
  messagesRef.current = messages;
  onMessagesChangeRef.current = onMessagesChange;

  // Stable setMessages callback that doesn't depend on messages state
  const setMessages = useCallback((updater: Message[] | ((prev: Message[]) => Message[])) => {
    const currentMessages = messagesRef.current;
    const newMessages = typeof updater === 'function'
      ? updater(currentMessages)
      : updater;

    if (onMessagesChangeRef.current) {
      onMessagesChangeRef.current(newMessages);
    } else {
      setInternalMessages(newMessages);
    }
  }, []); // Empty deps - uses refs for stable access

  // Check CLI connection status
  const checkConnection = useCallback(async (): Promise<ClaudeCliStatus> => {
    try {
      const response = await fetch('/api/ide/chat/status');
      const status: ClaudeCliStatus = await response.json();
      setIsConnected(status.connected);
      return status;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to check connection';
      setIsConnected(false);
      return { connected: false, error: errorMsg };
    }
  }, []);

  // Build conversation history for context
  const buildHistory = useCallback((msgs: Message[]): ConversationHistoryEntry[] => {
    return msgs.slice(-20).map((msg) => ({
      role: msg.role,
      content: msg.content
        .filter((block): block is TextBlock => block.type === 'text')
        .map((block) => block.content)
        .join('\n'),
    }));
  }, []);

  // Abort current stream
  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  // Store refs for stable callback access
  const isLoadingRef = useRef(isLoading);
  const workspacePathRef = useRef(workspacePath);
  const onToolUseRef = useRef(onToolUse);
  const onErrorRef = useRef(onError);
  const buildHistoryRef = useRef(buildHistory);

  isLoadingRef.current = isLoading;
  workspacePathRef.current = workspacePath;
  onToolUseRef.current = onToolUse;
  onErrorRef.current = onError;
  buildHistoryRef.current = buildHistory;

  // Send a message and stream the response
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoadingRef.current) return;

      setError(null);
      setIsLoading(true);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Add user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: [{ type: 'text', content }],
        timestamp: new Date(),
      };

      // Add empty assistant message for streaming
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: [],
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      const assistantId = assistantMessage.id;

      try {
        // CLI path is now read server-side from integrations config
        const response = await fetch('/api/ide/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            workspacePath: workspacePathRef.current || '/tmp/workspace',
            conversationHistory: buildHistoryRef.current(messagesRef.current),
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        // Track current state for building content blocks
        let currentTextContent = '';
        let currentThinkingContent = '';
        let isInThinking = false;
        const toolUseBlocks: Map<string, ToolUseBlock> = new Map();

        // Helper to update assistant message
        const updateAssistantMessage = (updater: (blocks: ContentBlock[]) => ContentBlock[]) => {
          setMessages((prev) => {
            const newMessages = [...prev];
            const assistantIndex = newMessages.findIndex((m) => m.id === assistantId);
            if (assistantIndex !== -1) {
              newMessages[assistantIndex] = {
                ...newMessages[assistantIndex],
                content: updater([...newMessages[assistantIndex].content]),
              };
            }
            return newMessages;
          });
        };

        // Process stream
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
              const event: ChatEvent = JSON.parse(data);

              switch (event.type) {
                case 'text': {
                  currentTextContent += event.content;

                  updateAssistantMessage((blocks) => {
                    // Find or create text block
                    const textBlockIndex = blocks.findIndex(
                      (b) => b.type === 'text' && !isInThinking
                    );

                    if (textBlockIndex !== -1) {
                      const updated = [...blocks];
                      (updated[textBlockIndex] as TextBlock).content = currentTextContent;
                      return updated;
                    } else {
                      return [...blocks, { type: 'text', content: currentTextContent } as TextBlock];
                    }
                  });
                  break;
                }

                case 'thinking': {
                  isInThinking = true;
                  currentThinkingContent += event.content;

                  updateAssistantMessage((blocks) => {
                    // Find or create thinking block
                    const thinkingIndex = blocks.findIndex((b) => b.type === 'thinking');

                    if (thinkingIndex !== -1) {
                      const updated = [...blocks];
                      (updated[thinkingIndex] as ThinkingBlock).content = currentThinkingContent;
                      return updated;
                    } else {
                      return [
                        ...blocks,
                        {
                          type: 'thinking',
                          content: currentThinkingContent,
                          collapsed: true,
                        } as ThinkingBlock,
                      ];
                    }
                  });
                  break;
                }

                case 'tool_use_start': {
                  const toolBlock: ToolUseBlock = {
                    type: 'tool_use',
                    id: event.id,
                    tool: event.tool,
                    input: event.input,
                    status: 'running',
                  };
                  toolUseBlocks.set(event.id, toolBlock);

                  // Callback for tool use tracking
                  onToolUseRef.current?.(event.tool, event.input);

                  updateAssistantMessage((blocks) => [...blocks, toolBlock]);
                  break;
                }

                case 'tool_use_output': {
                  const toolBlock = toolUseBlocks.get(event.id);
                  if (toolBlock) {
                    toolBlock.output = (toolBlock.output || '') + event.output;

                    updateAssistantMessage((blocks) => {
                      const updated = [...blocks];
                      const idx = updated.findIndex(
                        (b) => b.type === 'tool_use' && (b as ToolUseBlock).id === event.id
                      );
                      if (idx !== -1) {
                        updated[idx] = { ...toolBlock };
                      }
                      return updated;
                    });
                  }
                  break;
                }

                case 'tool_use_end': {
                  const toolBlock = toolUseBlocks.get(event.id);
                  if (toolBlock) {
                    toolBlock.status = event.status;
                    if (event.error) {
                      toolBlock.error = event.error;
                    }

                    updateAssistantMessage((blocks) => {
                      const updated = [...blocks];
                      const idx = updated.findIndex(
                        (b) => b.type === 'tool_use' && (b as ToolUseBlock).id === event.id
                      );
                      if (idx !== -1) {
                        updated[idx] = { ...toolBlock };
                      }
                      return updated;
                    });
                  }
                  break;
                }

                case 'error': {
                  const errorBlock: ErrorBlock = {
                    type: 'error',
                    content: event.content,
                    code: event.code,
                  };

                  updateAssistantMessage((blocks) => [...blocks, errorBlock]);
                  setError(event.content);
                  onErrorRef.current?.(event.content);
                  break;
                }

                case 'done': {
                  // Mark message as not streaming
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const assistantIndex = newMessages.findIndex((m) => m.id === assistantId);
                    if (assistantIndex !== -1) {
                      newMessages[assistantIndex] = {
                        ...newMessages[assistantIndex],
                        isStreaming: false,
                      };
                    }
                    return newMessages;
                  });
                  break;
                }

                case 'message_start':
                  // Message started - nothing to do
                  break;
              }
            } catch (e) {
              console.error('[useClaudeChat] Failed to parse event:', e, data);
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Stream was aborted - clean up
          setMessages((prev) => {
            const newMessages = [...prev];
            const assistantIndex = newMessages.findIndex((m) => m.id === assistantId);
            if (assistantIndex !== -1) {
              const blocks = newMessages[assistantIndex].content;
              if (blocks.length === 0) {
                blocks.push({ type: 'text', content: '(Cancelled)' } as TextBlock);
              }
              newMessages[assistantIndex] = {
                ...newMessages[assistantIndex],
                isStreaming: false,
              };
            }
            return newMessages;
          });
        } else {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          setError(errorMsg);
          onErrorRef.current?.(errorMsg);

          // Add error to message
          setMessages((prev) => {
            const newMessages = [...prev];
            const assistantIndex = newMessages.findIndex((m) => m.id === assistantId);
            if (assistantIndex !== -1) {
              newMessages[assistantIndex] = {
                ...newMessages[assistantIndex],
                content: [
                  ...newMessages[assistantIndex].content,
                  { type: 'error', content: errorMsg } as ErrorBlock,
                ],
                isStreaming: false,
              };
            }
            return newMessages;
          });
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [setMessages] // All other deps are accessed via refs for stability
  );

  // Clear all messages
  const clearMessages = useCallback(() => {
    if (isLoading) {
      abortStream();
    }
    setMessages([]);
    setError(null);
  }, [isLoading, abortStream]);

  // Toggle thinking block collapsed state
  const toggleThinking = useCallback((messageId: string, blockIndex: number) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      const msgIndex = newMessages.findIndex((m) => m.id === messageId);

      if (msgIndex !== -1) {
        const msg = newMessages[msgIndex];
        const block = msg.content[blockIndex];

        if (block && block.type === 'thinking') {
          const newContent = [...msg.content];
          newContent[blockIndex] = {
            ...block,
            collapsed: !block.collapsed,
          };
          newMessages[msgIndex] = { ...msg, content: newContent };
        }
      }

      return newMessages;
    });
  }, []);

  return {
    messages,
    isLoading,
    isConnected,
    error,
    sendMessage,
    clearMessages,
    toggleThinking,
    checkConnection,
    abortStream,
  };
}
