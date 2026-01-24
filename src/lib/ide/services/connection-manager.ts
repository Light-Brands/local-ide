/**
 * Connection Manager
 *
 * Centralized service for managing WebSocket connections with:
 * - Automatic protocol detection (ws/wss)
 * - Connection state machine
 * - Automatic reconnection with exponential backoff
 * - Event-based updates (no React re-renders during streaming)
 * - Singleton pattern for shared state
 */

// =============================================================================
// TYPES
// =============================================================================

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface ConnectionConfig {
  /** Base path for WebSocket (e.g., '/ws/terminal') */
  path: string;
  /** Port for local development */
  localPort?: number;
  /** Max reconnection attempts */
  maxReconnectAttempts?: number;
  /** Base delay for reconnection (ms) */
  reconnectDelay?: number;
  /** Enable heartbeat pings */
  heartbeat?: boolean;
  /** Heartbeat interval (ms) */
  heartbeatInterval?: number;
}

export interface ConnectionEvents {
  stateChange: (state: ConnectionState, prevState: ConnectionState) => void;
  message: (data: unknown) => void;
  error: (error: Error) => void;
  reconnectAttempt: (attempt: number, maxAttempts: number) => void;
}

type EventHandler<T extends keyof ConnectionEvents> = ConnectionEvents[T];

// =============================================================================
// ENVIRONMENT DETECTION
// =============================================================================

/**
 * Detects the current environment and returns appropriate WebSocket URL
 */
export function getWebSocketUrl(path: string, localPort: number = 4001): string {
  // Server-side rendering - return placeholder
  if (typeof window === 'undefined') {
    return `ws://localhost:${localPort}${path}`;
  }

  const { protocol, host, hostname } = window.location;
  const isSecure = protocol === 'https:';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalhost) {
    // Local development - use localhost with specified port
    return `ws://localhost:${localPort}${path}`;
  }

  // Remote access (tunnel, production) - use same host with wss
  const wsProtocol = isSecure ? 'wss:' : 'ws:';
  return `${wsProtocol}//${host}${path}`;
}

/**
 * Check if we're in a secure context (HTTPS or localhost)
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false;
  return window.isSecureContext;
}

/**
 * Get the current environment type
 */
export function getEnvironment(): 'local' | 'tunnel' | 'production' {
  if (typeof window === 'undefined') return 'local';

  const { hostname } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'local';
  }

  // Check for common tunnel domains
  if (hostname.includes('.trycloudflare.com') ||
      hostname.includes('.ngrok.') ||
      hostname.includes('.loca.lt')) {
    return 'tunnel';
  }

  return 'production';
}

// =============================================================================
// CONNECTION MANAGER CLASS
// =============================================================================

export class ConnectionManager {
  private ws: WebSocket | null = null;
  private config: Required<ConnectionConfig>;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Map<keyof ConnectionEvents, Set<EventHandler<any>>> = new Map();
  private messageBuffer: unknown[] = [];
  private intentionallyClosed = false;

  constructor(config: ConnectionConfig) {
    this.config = {
      path: config.path,
      localPort: config.localPort ?? 4001,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
      reconnectDelay: config.reconnectDelay ?? 1000,
      heartbeat: config.heartbeat ?? true,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
    };
  }

  // ===========================================================================
  // STATE MACHINE
  // ===========================================================================

  private setState(newState: ConnectionState): void {
    if (newState === this.state) return;

    const prevState = this.state;
    this.state = newState;

    console.log(`[ConnectionManager] State: ${prevState} -> ${newState}`);
    this.emit('stateChange', newState, prevState);
  }

  getState(): ConnectionState {
    return this.state;
  }

  isConnected(): boolean {
    return this.state === 'connected';
  }

  // ===========================================================================
  // CONNECTION LIFECYCLE
  // ===========================================================================

  connect(): void {
    if (this.state === 'connected' || this.state === 'connecting') {
      console.log('[ConnectionManager] Already connected or connecting');
      return;
    }

    this.intentionallyClosed = false;
    this.setState('connecting');

    const url = this.buildUrl();
    console.log('[ConnectionManager] Connecting to:', url);

    try {
      this.ws = new WebSocket(url);
      this.setupWebSocketHandlers();
    } catch (error) {
      console.error('[ConnectionManager] Failed to create WebSocket:', error);
      this.setState('error');
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.intentionallyClosed = true;
    this.stopHeartbeat();
    this.cancelReconnect();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.setState('disconnected');
  }

  reconnect(): void {
    this.disconnect();
    this.intentionallyClosed = false;
    this.reconnectAttempt = 0;

    // Small delay to ensure clean disconnect
    setTimeout(() => this.connect(), 100);
  }

  // ===========================================================================
  // WEBSOCKET SETUP
  // ===========================================================================

  private buildUrl(): string {
    const baseUrl = getWebSocketUrl(this.config.path, this.config.localPort);
    return baseUrl;
  }

  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('[ConnectionManager] Connected');
      this.reconnectAttempt = 0;
      this.setState('connected');
      this.startHeartbeat();
      this.flushMessageBuffer();
    };

    this.ws.onclose = (event) => {
      console.log('[ConnectionManager] Disconnected:', event.code, event.reason);
      this.stopHeartbeat();

      if (!this.intentionallyClosed && this.shouldReconnect()) {
        this.scheduleReconnect();
      } else if (!this.intentionallyClosed) {
        this.setState('error');
      } else {
        this.setState('disconnected');
      }
    };

    this.ws.onerror = (event) => {
      console.error('[ConnectionManager] WebSocket error:', event);
      this.emit('error', new Error('WebSocket connection error'));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = typeof event.data === 'string'
          ? JSON.parse(event.data)
          : event.data;

        // Handle pong (heartbeat response)
        if (data.type === 'pong') {
          return;
        }

        this.emit('message', data);
      } catch {
        // Not JSON, emit raw data
        this.emit('message', event.data);
      }
    };
  }

  // ===========================================================================
  // MESSAGING
  // ===========================================================================

  send(data: unknown): boolean {
    if (this.state !== 'connected' || !this.ws) {
      // Buffer messages when not connected
      this.messageBuffer.push(data);
      return false;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
      return true;
    } catch (error) {
      console.error('[ConnectionManager] Send error:', error);
      this.messageBuffer.push(data);
      return false;
    }
  }

  private flushMessageBuffer(): void {
    while (this.messageBuffer.length > 0 && this.state === 'connected') {
      const message = this.messageBuffer.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  // ===========================================================================
  // HEARTBEAT
  // ===========================================================================

  private startHeartbeat(): void {
    if (!this.config.heartbeat) return;

    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ===========================================================================
  // RECONNECTION
  // ===========================================================================

  private shouldReconnect(): boolean {
    return this.reconnectAttempt < this.config.maxReconnectAttempts;
  }

  private scheduleReconnect(): void {
    this.cancelReconnect();
    this.reconnectAttempt++;

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempt - 1),
      30000 // Max 30 seconds
    );

    console.log(`[ConnectionManager] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt}/${this.config.maxReconnectAttempts})`);

    this.setState('reconnecting');
    this.emit('reconnectAttempt', this.reconnectAttempt, this.config.maxReconnectAttempts);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // ===========================================================================
  // EVENT EMITTER
  // ===========================================================================

  on<T extends keyof ConnectionEvents>(
    event: T,
    handler: EventHandler<T>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  off<T extends keyof ConnectionEvents>(
    event: T,
    handler: EventHandler<T>
  ): void {
    this.listeners.get(event)?.delete(handler);
  }

  private emit<T extends keyof ConnectionEvents>(
    event: T,
    ...args: Parameters<ConnectionEvents[T]>
  ): void {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        (handler as (...args: unknown[]) => void)(...args);
      } catch (error) {
        console.error(`[ConnectionManager] Event handler error (${event}):`, error);
      }
    });
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  dispose(): void {
    this.disconnect();
    this.listeners.clear();
    this.messageBuffer = [];
  }
}

// =============================================================================
// SINGLETON INSTANCES
// =============================================================================

const connections = new Map<string, ConnectionManager>();

/**
 * Get or create a connection manager for a specific path
 */
export function getConnection(config: ConnectionConfig): ConnectionManager {
  const key = `${config.path}:${config.localPort ?? 4001}`;

  if (!connections.has(key)) {
    connections.set(key, new ConnectionManager(config));
  }

  return connections.get(key)!;
}

/**
 * Get the terminal connection manager
 */
export function getTerminalConnection(): ConnectionManager {
  return getConnection({
    path: '/ws/terminal',
    localPort: 4001,
    heartbeat: true,
  });
}

/**
 * Dispose all connections
 */
export function disposeAllConnections(): void {
  connections.forEach((conn) => conn.dispose());
  connections.clear();
}
