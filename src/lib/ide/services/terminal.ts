/**
 * Terminal WebSocket Service
 * Handles WebSocket connections to terminal servers (ttyd, wetty, etc.)
 */

import { getActivityService } from './activity';
import { IDE_FEATURES } from '../features';

// =============================================================================
// TYPES
// =============================================================================

export interface TerminalConfig {
  url: string;
  cols?: number;
  rows?: number;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface TerminalMessage {
  type: 'output' | 'resize' | 'input' | 'ping' | 'pong';
  data?: string;
  cols?: number;
  rows?: number;
}

export type TerminalEventType = 'open' | 'close' | 'error' | 'data' | 'reconnecting';

export interface TerminalEvent {
  type: TerminalEventType;
  data?: string;
  error?: Error;
  attempt?: number;
  sessionId?: string;
  reconnected?: boolean;
}

type TerminalEventHandler = (event: TerminalEvent) => void;

// =============================================================================
// TERMINAL SERVICE CLASS
// =============================================================================

export class TerminalService {
  private ws: WebSocket | null = null;
  private config: Required<TerminalConfig>;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private handlers: Map<TerminalEventType, Set<TerminalEventHandler>> = new Map();
  private isIntentionallyClosed = false;
  private inputBuffer: string[] = [];

  constructor(config: TerminalConfig) {
    this.config = {
      url: config.url,
      cols: config.cols ?? 80,
      rows: config.rows ?? 24,
      reconnectAttempts: config.reconnectAttempts ?? 5,
      reconnectDelay: config.reconnectDelay ?? 1000,
    };
  }

  // ===========================================================================
  // CONNECTION MANAGEMENT
  // ===========================================================================

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isIntentionallyClosed = false;
    console.log('[TerminalService] Connecting to:', this.config.url);

    try {
      this.ws = new WebSocket(this.config.url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.reconnectAttempt = 0;
        this.emit('open', {});

        // Send initial resize
        this.resize(this.config.cols, this.config.rows);

        // Flush input buffer
        while (this.inputBuffer.length > 0) {
          const input = this.inputBuffer.shift();
          if (input) this.send(input);
        }
      };

      this.ws.onmessage = (event) => {
        let rawData: string;

        if (event.data instanceof ArrayBuffer) {
          rawData = new TextDecoder().decode(event.data);
        } else {
          rawData = event.data;
        }

        // Try to parse as JSON (server sends { type: 'output', data: '...' })
        try {
          const msg = JSON.parse(rawData);
          if (msg.type === 'output' && msg.data) {
            this.emit('data', { data: msg.data });
          } else if (msg.type === 'output-buffer' && msg.data) {
            // Restored output buffer from reconnection
            this.emit('data', { data: msg.data });
          } else if (msg.type === 'connected') {
            console.log('[Terminal] Connected to session:', msg.sessionId, 'cwd:', msg.cwd, 'reconnected:', msg.reconnected);
            // Emit open event with session info
            this.emit('open', { sessionId: msg.sessionId, reconnected: msg.reconnected });
          } else if (msg.type === 'exit') {
            console.log('[Terminal] Session exited:', msg.exitCode);
            this.emit('close', { data: `Session exited with code ${msg.exitCode}` });
          } else if (msg.type === 'error') {
            this.emit('error', { error: new Error(msg.message || 'Terminal error') });
          } else if (msg.type === 'pong') {
            // Heartbeat response, ignore
          }
        } catch {
          // Not JSON, treat as raw terminal data
          this.emit('data', { data: rawData });
        }
      };

      this.ws.onclose = (event) => {
        this.emit('close', { data: `Connection closed: ${event.code}` });

        if (!this.isIntentionallyClosed && this.shouldReconnect()) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (event) => {
        this.emit('error', { error: new Error('WebSocket error') });
      };
    } catch (error) {
      this.emit('error', {
        error: error instanceof Error ? error : new Error('Failed to connect'),
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
    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempt - 1);

    this.emit('reconnecting', { attempt: this.reconnectAttempt });

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // ===========================================================================
  // DATA TRANSMISSION
  // ===========================================================================

  send(data: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      // Send input as JSON message
      this.ws.send(JSON.stringify({ type: 'input', data }));
    } else {
      // Buffer input for when connection is established
      this.inputBuffer.push(data);
    }
  }

  resize(cols: number, rows: number): void {
    this.config.cols = cols;
    this.config.rows = rows;

    if (this.ws?.readyState === WebSocket.OPEN) {
      const resizeMessage = JSON.stringify({
        type: 'resize',
        cols,
        rows,
      });
      this.ws.send(resizeMessage);
    }
  }

  /** Request the server to restart Claude CLI */
  restartClaude(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'restart-claude' }));
    }
  }

  // ===========================================================================
  // EVENT HANDLING
  // ===========================================================================

  on(type: TerminalEventType, handler: TerminalEventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  off(type: TerminalEventType, handler: TerminalEventHandler): void {
    this.handlers.get(type)?.delete(handler);
  }

  private emit(type: TerminalEventType, event: Partial<TerminalEvent>): void {
    const fullEvent: TerminalEvent = { type, ...event };
    this.handlers.get(type)?.forEach((handler) => handler(fullEvent));
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
}

// =============================================================================
// MOCK TERMINAL SERVICE (for development without real terminal server)
// =============================================================================

export class MockTerminalService extends TerminalService {
  private outputBuffer: string[] = [];
  private currentLine = '';
  private mockFileSystem: Record<string, string[]> = {
    '/': ['home', 'var', 'etc', 'usr'],
    '/home': ['user'],
    '/home/user': ['projects', 'documents', '.bashrc'],
    '/home/user/projects': ['my-app', 'website'],
  };
  private cwd = '/home/user';
  private env: Record<string, string> = {
    HOME: '/home/user',
    USER: 'user',
    PATH: '/usr/local/bin:/usr/bin:/bin',
  };

  constructor(config: TerminalConfig) {
    super(config);
  }

  connect(): void {
    // Simulate connection
    setTimeout(() => {
      this['emit']('open', {});
      this.writeOutput('\r\n\x1b[32mWelcome to Local IDE Terminal\x1b[0m\r\n');
      this.writeOutput('Type "help" for available commands.\r\n');
      this.writePrompt();
    }, 100);
  }

  disconnect(): void {
    this['emit']('close', { data: 'Disconnected' });
  }

  send(data: string): void {
    // Handle input character by character
    for (const char of data) {
      this.handleChar(char);
    }
  }

  private handleChar(char: string): void {
    if (char === '\r' || char === '\n') {
      // Enter pressed - execute command
      this.writeOutput('\r\n');
      this.executeCommand(this.currentLine.trim());
      this.currentLine = '';
    } else if (char === '\x7f' || char === '\b') {
      // Backspace
      if (this.currentLine.length > 0) {
        this.currentLine = this.currentLine.slice(0, -1);
        this.writeOutput('\b \b');
      }
    } else if (char === '\x03') {
      // Ctrl+C
      this.writeOutput('^C\r\n');
      this.currentLine = '';
      this.writePrompt();
    } else if (char.charCodeAt(0) >= 32) {
      // Regular character
      this.currentLine += char;
      this.writeOutput(char);
    }
  }

  private executeCommand(cmd: string): void {
    if (!cmd) {
      this.writePrompt();
      return;
    }

    // Track terminal command activity
    try {
      getActivityService().trackTerminalCommand(cmd);
    } catch {
      // Ignore errors from activity service (may not be initialized)
    }

    const [command, ...args] = cmd.split(/\s+/);

    switch (command) {
      case 'help':
        this.cmdHelp();
        break;
      case 'echo':
        this.cmdEcho(args);
        break;
      case 'pwd':
        this.cmdPwd();
        break;
      case 'cd':
        this.cmdCd(args[0]);
        break;
      case 'ls':
        this.cmdLs(args[0]);
        break;
      case 'clear':
        this.cmdClear();
        break;
      case 'whoami':
        this.writeOutput('user\r\n');
        break;
      case 'date':
        this.writeOutput(new Date().toString() + '\r\n');
        break;
      case 'env':
        Object.entries(this.env).forEach(([key, value]) => {
          this.writeOutput(`${key}=${value}\r\n`);
        });
        break;
      case 'export':
        if (args[0]) {
          const [key, value] = args[0].split('=');
          if (key && value) {
            this.env[key] = value;
          }
        }
        break;
      default:
        this.writeOutput(`\x1b[31mbash: ${command}: command not found\x1b[0m\r\n`);
    }

    this.writePrompt();
  }

  private cmdHelp(): void {
    const helpText = `
\x1b[1mAvailable commands:\x1b[0m
  help      - Show this help message
  echo      - Print text to terminal
  pwd       - Print working directory
  cd        - Change directory
  ls        - List directory contents
  clear     - Clear the terminal
  whoami    - Show current user
  date      - Show current date and time
  env       - Show environment variables
  export    - Set environment variable

\x1b[90mNote: This is a mock terminal for development.\x1b[0m
\x1b[90mConnect to a real terminal server for full functionality.\x1b[0m
`;
    this.writeOutput(helpText + '\r\n');
  }

  private cmdEcho(args: string[]): void {
    this.writeOutput(args.join(' ') + '\r\n');
  }

  private cmdPwd(): void {
    this.writeOutput(this.cwd + '\r\n');
  }

  private cmdCd(path?: string): void {
    if (!path || path === '~') {
      this.cwd = this.env.HOME;
      return;
    }

    let newPath = path.startsWith('/') ? path : `${this.cwd}/${path}`;

    // Handle .. and .
    const parts = newPath.split('/').filter(Boolean);
    const resolved: string[] = [];
    for (const part of parts) {
      if (part === '..') {
        resolved.pop();
      } else if (part !== '.') {
        resolved.push(part);
      }
    }
    newPath = '/' + resolved.join('/');

    if (this.mockFileSystem[newPath] !== undefined || newPath === '/') {
      this.cwd = newPath || '/';
    } else {
      this.writeOutput(`\x1b[31mcd: ${path}: No such file or directory\x1b[0m\r\n`);
    }
  }

  private cmdLs(path?: string): void {
    const targetPath = path
      ? path.startsWith('/')
        ? path
        : `${this.cwd}/${path}`
      : this.cwd;

    const contents = this.mockFileSystem[targetPath];
    if (contents) {
      contents.forEach((item) => {
        const isDir = this.mockFileSystem[`${targetPath}/${item}`] !== undefined;
        if (isDir) {
          this.writeOutput(`\x1b[34m${item}/\x1b[0m  `);
        } else {
          this.writeOutput(`${item}  `);
        }
      });
      this.writeOutput('\r\n');
    } else {
      this.writeOutput(`\x1b[31mls: ${path || targetPath}: No such file or directory\x1b[0m\r\n`);
    }
  }

  private cmdClear(): void {
    this.writeOutput('\x1b[2J\x1b[H');
  }

  private writePrompt(): void {
    const shortCwd = this.cwd === this.env.HOME ? '~' : this.cwd.split('/').pop() || '/';
    this.writeOutput(`\x1b[32muser@local-ide\x1b[0m:\x1b[34m${shortCwd}\x1b[0m$ `);
  }

  private writeOutput(text: string): void {
    this['emit']('data', { data: text });
  }

  get isConnected(): boolean {
    return true;
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createTerminalService(
  config: TerminalConfig,
  useMock = false
): TerminalService {
  if (useMock) {
    return new MockTerminalService(config);
  }
  return new TerminalService(config);
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let terminalInstance: TerminalService | null = null;

// Terminal server configuration
// Dynamically determine WebSocket URL based on current protocol
export function getTerminalWebSocketUrl(): string {
  // Check for env override first
  if (process.env.NEXT_PUBLIC_TERMINAL_WS_URL) {
    return process.env.NEXT_PUBLIC_TERMINAL_WS_URL;
  }

  // In browser, determine based on current protocol/host
  if (typeof window !== 'undefined') {
    const isSecure = window.location.protocol === 'https:';
    const host = window.location.host;
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

    if (isLocalhost) {
      // Local development - always use ws:// to localhost:4001
      return 'ws://localhost:4001/ws/terminal';
    } else {
      // Remote access (e.g., Cloudflare tunnel) - use same host with wss://
      return `wss://${host}/ws/terminal`;
    }
  }

  // Server-side fallback
  return 'ws://localhost:4001/ws/terminal';
}

const TERMINAL_SERVER_URL = getTerminalWebSocketUrl();

export function getTerminalService(config?: TerminalConfig, forceNew = false): TerminalService {
  // If terminal is disabled, always return a mock
  if (!IDE_FEATURES.terminal) {
    if (!terminalInstance) {
      console.log('[TerminalService] Terminal disabled, using mock');
      terminalInstance = new MockTerminalService({ url: 'mock' });
    }
    return terminalInstance;
  }

  // If forceNew is true, disconnect and clear the existing instance to use new config
  if (forceNew && terminalInstance) {
    terminalInstance.disconnect();
    terminalInstance = null;
  }

  if (!terminalInstance && config) {
    // Only use mock if explicitly requested
    const useMock = config.url === 'mock';
    console.log('[TerminalService] Creating new instance:', { url: config.url, useMock });
    terminalInstance = createTerminalService(config, useMock);
  }

  if (!terminalInstance) {
    // Default to real terminal server
    console.log('[TerminalService] Creating default instance:', TERMINAL_SERVER_URL);
    terminalInstance = new TerminalService({ url: TERMINAL_SERVER_URL });
  }

  return terminalInstance;
}

export function resetTerminalService(): void {
  if (terminalInstance) {
    terminalInstance.disconnect();
    terminalInstance = null;
  }
}
