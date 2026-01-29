/**
 * Chat WebSocket Service
 * Handles WebSocket connections to the persistent chat server
 */

import { IDE_FEATURES } from '../features';

// =============================================================================
// TYPES
// =============================================================================

export interface ChatConfig {
  url: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

// Claude CLI visual state indicators
export type ClaudeState =
  | 'idle'           // Ready for input
  | 'thinking'       // Thinking/Precipitating
  | 'responding'     // Generating response
  | 'tool_running'   // Running a tool
  | 'waiting_confirm' // Waiting for paste confirmation
  | 'unknown';

export type ChatEventType =
  | 'connected'
  | 'text'
  | 'thinking'
  | 'tool_use_start'
  | 'tool_use_end'
  | 'tool_use_output'
  | 'done'
  | 'error'
  | 'history'
  | 'output-buffer'
  | 'close'
  | 'reconnecting'
  | 'status'         // Status update with Claude state
  | 'state-change';  // Claude state changed

export interface ChatEvent {
  type: ChatEventType;
  sessionId?: string;
  reconnected?: boolean;
  content?: string;
  id?: string;
  tool?: string;
  input?: Record<string, unknown>;
  status?: 'success' | 'error';
  output?: string;
  error?: string;
  messages?: ChatMessage[];
  data?: string;
  attempt?: number;
  // Status update fields
  claudeState?: ClaudeState;
  currentTool?: string | null;
  lastActivity?: number;
  isStuck?: boolean;
  stuckDuration?: number;
}

export interface ChatMessage {
  id: number;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

type ChatEventHandler = (event: ChatEvent) => void;

// =============================================================================
// CHAT SERVICE CLASS
// =============================================================================

export class ChatService {
  private ws: WebSocket | null = null;
  private config: Required<ChatConfig>;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private handlers: Map<ChatEventType, Set<ChatEventHandler>> = new Map();
  private isIntentionallyClosed = false;
  private inputBuffer: string[] = [];
  private sessionId: string | null = null;

  constructor(config: ChatConfig) {
    this.config = {
      url: config.url,
      reconnectAttempts: config.reconnectAttempts ?? 10,
      reconnectDelay: config.reconnectDelay ?? 1000,
    };
  }

  // ===========================================================================
  // CONNECTION MANAGEMENT
  // ===========================================================================

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isIntentionallyClosed = false;

    // Check if chat server is available before attempting WebSocket connection
    // Use the proxied API route to avoid CORS issues
    try {
      const healthCheck = await fetch('/api/services', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      if (healthCheck.ok) {
        const data = await healthCheck.json();
        const chatService = data.services?.find((s: { id: string }) => s.id === 'chat');
        if (chatService?.status !== 'healthy') {
          console.warn('[ChatService] Chat server not ready');
          if (this.shouldReconnect()) {
            this.scheduleReconnect();
          }
          return;
        }
      }
      // Small delay to ensure WebSocket endpoint is ready
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch {
      // If health check fails, still try WebSocket - it might work
      console.warn('[ChatService] Could not verify chat server status, attempting connection anyway');
    }

    console.log('[ChatService] Connecting to:', this.config.url);

    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => {
        this.reconnectAttempt = 0;
        console.log('[ChatService] WebSocket connected');

        // Flush input buffer
        while (this.inputBuffer.length > 0) {
          const input = this.inputBuffer.shift();
          if (input) this.sendMessage(input);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as ChatEvent;

          // Store session ID on connect
          if (msg.type === 'connected' && msg.sessionId) {
            this.sessionId = msg.sessionId;
          }

          this.emit(msg.type, msg);
        } catch (e) {
          console.error('[ChatService] Failed to parse message:', e);
        }
      };

      this.ws.onclose = (event) => {
        console.log('[ChatService] WebSocket closed:', event.code);
        this.emit('close', { type: 'close', error: `Connection closed: ${event.code}` });

        if (!this.isIntentionallyClosed && this.shouldReconnect()) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        // Only log and emit errors after multiple failed attempts
        // Initial connection failures are expected during startup
        if (this.reconnectAttempt >= 3) {
          console.error('[ChatService] WebSocket connection failed after retries');
          this.emit('error', { type: 'error', error: 'Chat server unavailable' });
        } else {
          console.warn('[ChatService] WebSocket connection attempt failed, will retry...');
        }
      };
    } catch (error) {
      console.error('[ChatService] Connection failed:', error);
      this.emit('error', {
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to connect',
      });
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private shouldReconnect(): boolean {
    return this.reconnectAttempt < this.config.reconnectAttempts;
  }

  private scheduleReconnect(): void {
    this.reconnectAttempt++;
    // Exponential backoff: 1s -> 2s -> 4s -> 8s -> 16s, max 30s
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempt - 1),
      30000
    );

    console.log(`[ChatService] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt})`);
    this.emit('reconnecting', { type: 'reconnecting', attempt: this.reconnectAttempt });

    this.reconnectTimer = setTimeout(() => {
      void this.connect();
    }, delay);
  }

  // ===========================================================================
  // DATA TRANSMISSION
  // ===========================================================================

  sendMessage(content: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'input', data: content }));
    } else {
      // Buffer input for when connection is established
      this.inputBuffer.push(content);
    }
  }

  abort(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'abort' }));
    }
  }

  getHistory(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'get-history' }));
    }
  }

  ping(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  /**
   * Send Enter key to confirm paste (for when Claude CLI is waiting)
   */
  sendEnter(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'send-enter' }));
    }
  }

  /**
   * Kill and restart the chat session
   */
  killSession(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'kill-session' }));
    }
  }

  /**
   * Request current session status
   */
  getStatus(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'get-status' }));
    }
  }

  // ===========================================================================
  // EVENT HANDLING
  // ===========================================================================

  on(type: ChatEventType, handler: ChatEventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  off(type: ChatEventType, handler: ChatEventHandler): void {
    this.handlers.get(type)?.delete(handler);
  }

  private emit(type: ChatEventType, event: ChatEvent): void {
    this.handlers.get(type)?.forEach((handler) => handler(event));
  }

  // ===========================================================================
  // STATUS
  // ===========================================================================

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Get the WebSocket URL for the chat server
 */
export function getChatWebSocketUrl(sessionId?: string): string {
  // Check for env override first
  if (process.env.NEXT_PUBLIC_CHAT_WS_URL) {
    const baseUrl = process.env.NEXT_PUBLIC_CHAT_WS_URL;
    return sessionId ? `${baseUrl}?session=${sessionId}` : baseUrl;
  }

  // In browser, determine based on current protocol/host
  if (typeof window !== 'undefined') {
    const isSecure = window.location.protocol === 'https:';
    const host = window.location.host;
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

    let baseUrl: string;
    if (isLocalhost) {
      // Local development - always use ws:// to localhost:4002
      baseUrl = 'ws://localhost:4002/ws/chat';
    } else {
      // Remote access - use same host with wss://
      baseUrl = `wss://${host}/ws/chat`;
    }

    return sessionId ? `${baseUrl}?session=${sessionId}` : baseUrl;
  }

  // Server-side fallback
  const baseUrl = 'ws://localhost:4002/ws/chat';
  return sessionId ? `${baseUrl}?session=${sessionId}` : baseUrl;
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let chatInstance: ChatService | null = null;

export function getChatService(config?: ChatConfig, forceNew = false): ChatService {
  // If persistent chat is disabled, return a mock-like service that does nothing
  if (!IDE_FEATURES.persistentChat) {
    if (!chatInstance) {
      console.log('[ChatService] Persistent chat disabled, creating placeholder');
      chatInstance = new ChatService({ url: 'ws://disabled' });
    }
    return chatInstance;
  }

  if (forceNew && chatInstance) {
    chatInstance.disconnect();
    chatInstance = null;
  }

  if (!chatInstance && config) {
    console.log('[ChatService] Creating new instance:', { url: config.url });
    chatInstance = new ChatService(config);
  }

  if (!chatInstance) {
    console.log('[ChatService] Creating default instance');
    chatInstance = new ChatService({ url: getChatWebSocketUrl() });
  }

  return chatInstance;
}

export function resetChatService(): void {
  if (chatInstance) {
    chatInstance.disconnect();
    chatInstance = null;
  }
}
