/**
 * useConnection Hook
 *
 * React hook for using the ConnectionManager with proper lifecycle management.
 * Provides stable callbacks and minimal re-renders.
 */

'use client';

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import {
  ConnectionManager,
  getConnection,
  type ConnectionConfig,
  type ConnectionState,
} from '../services/connection-manager';

// =============================================================================
// TYPES
// =============================================================================

export interface UseConnectionOptions extends ConnectionConfig {
  /** Auto-connect on mount */
  autoConnect?: boolean;
  /** Callback when message received */
  onMessage?: (data: unknown) => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
  /** Callback when state changes */
  onStateChange?: (state: ConnectionState, prevState: ConnectionState) => void;
}

export interface UseConnectionReturn {
  /** Current connection state */
  state: ConnectionState;
  /** Whether currently connected */
  isConnected: boolean;
  /** Whether currently reconnecting */
  isReconnecting: boolean;
  /** Current reconnect attempt number */
  reconnectAttempt: number;
  /** Connect to the WebSocket */
  connect: () => void;
  /** Disconnect from the WebSocket */
  disconnect: () => void;
  /** Reconnect (disconnect then connect) */
  reconnect: () => void;
  /** Send data through the WebSocket */
  send: (data: unknown) => boolean;
  /** The underlying ConnectionManager instance */
  manager: ConnectionManager;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook for managing WebSocket connections with the ConnectionManager
 */
export function useConnection(options: UseConnectionOptions): UseConnectionReturn {
  const {
    autoConnect = true,
    onMessage,
    onError,
    onStateChange,
    ...config
  } = options;

  // Get stable reference to connection manager
  const managerRef = useRef<ConnectionManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = getConnection(config);
  }
  const manager = managerRef.current;

  // Track reconnect attempts separately to avoid re-render on every attempt
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  // Use refs for callbacks to avoid re-subscribing on every render
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onStateChangeRef = useRef(onStateChange);

  onMessageRef.current = onMessage;
  onErrorRef.current = onError;
  onStateChangeRef.current = onStateChange;

  // Use useSyncExternalStore for connection state
  // This ensures we get updates without causing unnecessary re-renders
  const state = useSyncExternalStore(
    useCallback(
      (onStoreChange) => {
        return manager.on('stateChange', () => {
          onStoreChange();
        });
      },
      [manager]
    ),
    useCallback(() => manager.getState(), [manager]),
    useCallback(() => 'disconnected' as ConnectionState, [])
  );

  // Derived state
  const isConnected = state === 'connected';
  const isReconnecting = state === 'reconnecting';

  // Set up event listeners
  useEffect(() => {
    const unsubMessage = manager.on('message', (data) => {
      onMessageRef.current?.(data);
    });

    const unsubError = manager.on('error', (error) => {
      onErrorRef.current?.(error);
    });

    const unsubStateChange = manager.on('stateChange', (newState, prevState) => {
      onStateChangeRef.current?.(newState, prevState);
    });

    const unsubReconnect = manager.on('reconnectAttempt', (attempt) => {
      setReconnectAttempt(attempt);
    });

    return () => {
      unsubMessage();
      unsubError();
      unsubStateChange();
      unsubReconnect();
    };
  }, [manager]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && state === 'disconnected') {
      manager.connect();
    }
  }, [autoConnect, manager, state]);

  // Stable callbacks
  const connect = useCallback(() => {
    manager.connect();
  }, [manager]);

  const disconnect = useCallback(() => {
    manager.disconnect();
  }, [manager]);

  const reconnect = useCallback(() => {
    manager.reconnect();
  }, [manager]);

  const send = useCallback(
    (data: unknown) => {
      return manager.send(data);
    },
    [manager]
  );

  return {
    state,
    isConnected,
    isReconnecting,
    reconnectAttempt,
    connect,
    disconnect,
    reconnect,
    send,
    manager,
  };
}

// =============================================================================
// SPECIALIZED HOOKS
// =============================================================================

/**
 * Hook specifically for terminal connections
 */
export function useTerminalConnection(options?: Partial<UseConnectionOptions>) {
  return useConnection({
    path: '/ws/terminal',
    localPort: 4001,
    heartbeat: true,
    autoConnect: true,
    ...options,
  });
}

/**
 * Hook for chat API streaming (uses fetch, not WebSocket)
 * But manages connection state similarly
 */
export interface UseStreamingOptions {
  /** API endpoint */
  endpoint: string;
  /** Called for each chunk of data */
  onChunk?: (chunk: string) => void;
  /** Called when stream completes */
  onComplete?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

export interface UseStreamingReturn {
  /** Whether currently streaming */
  isStreaming: boolean;
  /** Abort the current stream */
  abort: () => void;
  /** Start streaming with the given body */
  stream: (body: unknown) => Promise<void>;
}

export function useStreaming(options: UseStreamingOptions): UseStreamingReturn {
  const { endpoint, onChunk, onComplete, onError } = options;
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Refs for callbacks
  const onChunkRef = useRef(onChunk);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  onChunkRef.current = onChunk;
  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  }, []);

  const stream = useCallback(
    async (body: unknown) => {
      // Abort any existing stream
      abort();

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      setIsStreaming(true);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          onChunkRef.current?.(chunk);
        }

        onCompleteRef.current?.();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Intentional abort, don't report as error
          return;
        }
        onErrorRef.current?.(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [endpoint, abort]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abort();
    };
  }, [abort]);

  return {
    isStreaming,
    abort,
    stream,
  };
}
