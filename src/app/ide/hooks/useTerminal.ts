'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import type { Terminal } from 'xterm';
import type { FitAddon } from 'xterm-addon-fit';
import type { WebLinksAddon } from 'xterm-addon-web-links';
import { getTerminalService, resetTerminalService, type TerminalEvent } from '@/lib/ide/services/terminal';
import { useIDEStore } from '../stores/ideStore';

interface UseTerminalOptions {
  onData?: (data: string) => void;
  onResize?: (cols: number, rows: number) => void;
  onServerDetected?: (port: number) => void;
}

interface UseTerminalReturn {
  terminalRef: React.RefObject<HTMLDivElement | null>;
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempt: number;
  sessionId: string | null;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  newSession: () => void;
  write: (data: string) => void;
  clear: () => void;
  focus: () => void;
  fit: () => void;
}

// Port detection patterns
const PORT_PATTERNS = [
  /(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d{4,5})/gi,
  /running (?:on|at) (?:http:\/\/)?(?:localhost|127\.0\.0\.1)?:?(\d{4,5})/gi,
  /listening on(?: port)? (\d{4,5})/gi,
  /started (?:server )?(?:on|at) (?:port )?(\d{4,5})/gi,
  /Local:\s+http:\/\/localhost:(\d{4,5})/gi,
  /Network:\s+http:\/\/\d+\.\d+\.\d+\.\d+:(\d{4,5})/gi,
];

// Session persistence keys
const SESSION_STORAGE_KEY = 'local-ide-terminal-session';

// Get or create a persistent session ID
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    console.log('[useTerminal] SSR context - generating temporary session ID');
    return `term_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  console.log('[useTerminal] localStorage session ID:', sessionId);
  if (!sessionId) {
    sessionId = `term_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    console.log('[useTerminal] Created new session ID:', sessionId);
  } else {
    console.log('[useTerminal] Reusing existing session ID:', sessionId);
  }
  return sessionId;
}

// Clear the stored session (for starting fresh)
function clearStoredSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

// Ensure terminal server is running before connecting
async function ensureTerminalServer(): Promise<string | null> {
  try {
    const response = await fetch('/api/terminal?autoStart=true');
    const data = await response.json();

    if (data.status === 'running' || data.status === 'started') {
      return data.wsUrl;
    }

    console.error('[useTerminal] Failed to start terminal server:', data.message);
    return null;
  } catch (error) {
    console.error('[useTerminal] Error checking terminal server:', error);
    return null;
  }
}

export function useTerminal(options: UseTerminalOptions = {}): UseTerminalReturn {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const setServerPort = useIDEStore((state) => state.setServerPort);
  const setServerStatus = useIDEStore((state) => state.setServerStatus);
  const addTerminalHistory = useIDEStore((state) => state.addTerminalHistory);

  // Store options in ref to avoid re-render loops
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Detect server ports from terminal output
  const detectPorts = useCallback((data: string) => {
    for (const pattern of PORT_PATTERNS) {
      pattern.lastIndex = 0; // Reset regex state
      const match = pattern.exec(data);
      if (match && match[1]) {
        const port = parseInt(match[1], 10);
        if (port >= 1024 && port <= 65535) {
          setServerPort(port);
          setServerStatus('running');
          optionsRef.current.onServerDetected?.(port);
          return;
        }
      }
    }
  }, [setServerPort, setServerStatus]);

  // Initialize xterm
  useEffect(() => {
    if (!terminalRef.current) return;

    let terminal: Terminal;
    let fitAddon: FitAddon;
    let webLinksAddon: WebLinksAddon;

    const initTerminal = async () => {
      // Reset service to ensure we use the correct session ID URL on page load
      resetTerminalService();

      // Dynamic imports for xterm (client-side only)
      const { Terminal } = await import('xterm');
      const { FitAddon } = await import('xterm-addon-fit');
      const { WebLinksAddon } = await import('xterm-addon-web-links');

      // xterm CSS is imported via globals.css

      terminal = new Terminal({
        cursorBlink: true,
        cursorStyle: 'block',
        fontSize: 14,
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        lineHeight: 1.2,
        theme: {
          background: '#0a0a0a',
          foreground: '#d4d4d4',
          cursor: '#d4d4d4',
          cursorAccent: '#0a0a0a',
          selectionBackground: '#5a6df240',
          black: '#0a0a0a',
          red: '#f87171',
          green: '#4ade80',
          yellow: '#facc15',
          blue: '#60a5fa',
          magenta: '#c084fc',
          cyan: '#22d3ee',
          white: '#d4d4d4',
          brightBlack: '#525252',
          brightRed: '#fca5a5',
          brightGreen: '#86efac',
          brightYellow: '#fde047',
          brightBlue: '#93c5fd',
          brightMagenta: '#d8b4fe',
          brightCyan: '#67e8f9',
          brightWhite: '#fafafa',
        },
        allowProposedApi: true,
        scrollback: 10000,
      });

      fitAddon = new FitAddon();
      webLinksAddon = new WebLinksAddon();

      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);

      // Wait for container to have dimensions before opening
      const container = terminalRef.current!;
      const waitForDimensions = (): Promise<void> => {
        return new Promise((resolve) => {
          const check = () => {
            if (container.clientWidth > 0 && container.clientHeight > 0) {
              resolve();
            } else {
              requestAnimationFrame(check);
            }
          };
          check();
        });
      };

      await waitForDimensions();
      terminal.open(container);

      // Safe fit with delay
      const safeFit = () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const terminalAny = terminal as any;
          if (container.clientWidth > 0 && container.clientHeight > 0 && terminalAny._core?._renderService) {
            fitAddon.fit();
          }
        } catch {
          // Ignore fit errors
        }
      };

      setTimeout(safeFit, 50);
      setTimeout(safeFit, 150);

      xtermRef.current = terminal;
      fitAddonRef.current = fitAddon;

      // Ensure terminal server is running (auto-start if needed)
      terminal.write('\x1b[90mConnecting to terminal server...\x1b[0m\r\n');
      const wsUrl = await ensureTerminalServer();

      if (!wsUrl) {
        terminal.write('\x1b[31mFailed to start terminal server. Please run: npm run dev:terminal\x1b[0m\r\n');
        return () => {
          terminal.dispose();
        };
      }

      // Get or create persistent session ID for reconnection
      const currentSessionId = getOrCreateSessionId();
      setSessionId(currentSessionId);

      // Set up terminal service connection with real terminal server
      // Include session ID for persistence and auto-start Claude CLI
      const terminalWsUrl = `${wsUrl}?session=${currentSessionId}&startClaude=true`;
      terminal.write(`\x1b[90mSession: ${currentSessionId}\x1b[0m\r\n`);
      const service = getTerminalService({ url: terminalWsUrl }, true);

      // Handle data from service
      const unsubData = service.on('data', (event: TerminalEvent) => {
        if (event.data) {
          terminal.write(event.data);
          detectPorts(event.data);
          optionsRef.current.onData?.(event.data);
        }
      });

      // Handle connection events
      const unsubOpen = service.on('open', (event: TerminalEvent) => {
        setIsConnected(true);
        setIsReconnecting(false);
        setReconnectAttempt(0);

        // Update session ID if server provides one
        if (event.sessionId) {
          setSessionId(event.sessionId);
          // Store it for future reconnections
          if (typeof window !== 'undefined') {
            localStorage.setItem(SESSION_STORAGE_KEY, event.sessionId);
          }
        }

        // Show reconnection status
        if (event.reconnected) {
          terminal.write('\x1b[32m✓ Reconnected to existing session\x1b[0m\r\n');
        }
      });

      const unsubClose = service.on('close', () => {
        setIsConnected(false);
      });

      const unsubReconnecting = service.on('reconnecting', (event: TerminalEvent) => {
        setIsReconnecting(true);
        setReconnectAttempt(event.attempt || 0);
      });

      const unsubError = service.on('error', (event: TerminalEvent) => {
        terminal.write(`\r\n\x1b[31mError: ${event.error?.message || 'Unknown error'}\x1b[0m\r\n`);
      });

      // Handle user input
      terminal.onData((data) => {
        service.send(data);
      });

      // Handle resize
      terminal.onResize(({ cols, rows }) => {
        service.resize(cols, rows);
        optionsRef.current.onResize?.(cols, rows);
      });

      // Set up resize observer
      resizeObserverRef.current = new ResizeObserver(() => {
        if (fitAddonRef.current) {
          try {
            fitAddonRef.current.fit();
          } catch {
            // Ignore fit errors during resize
          }
        }
      });
      resizeObserverRef.current.observe(terminalRef.current!);

      // Connect to terminal service
      service.connect();

      // Cleanup function
      return () => {
        unsubData();
        unsubOpen();
        unsubClose();
        unsubReconnecting();
        unsubError();
        resizeObserverRef.current?.disconnect();
        terminal.dispose();
      };
    };

    let cleanup: (() => void) | undefined;

    initTerminal().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      cleanup?.();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [detectPorts]);

  // Save output on page unload using sendBeacon
  useEffect(() => {
    const handleUnload = () => {
      const id = sessionId || localStorage.getItem(SESSION_STORAGE_KEY);
      if (id) {
        navigator.sendBeacon('/api/terminal/save-output', JSON.stringify({ sessionId: id }));
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [sessionId]);

  // Connect
  const connect = useCallback(async () => {
    const wsUrl = await ensureTerminalServer();
    if (!wsUrl) return;

    const currentSessionId = getOrCreateSessionId();
    const terminalWsUrl = `${wsUrl}?session=${currentSessionId}&startClaude=true`;
    const service = getTerminalService({ url: terminalWsUrl }, true);
    service.connect();
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    const service = getTerminalService();
    service.disconnect();
  }, []);

  // Reconnect to existing session
  const reconnect = useCallback(async () => {
    resetTerminalService();

    // Ensure server is running before reconnecting
    const wsUrl = await ensureTerminalServer();
    if (wsUrl) {
      // Use existing session ID for reconnection
      const currentSessionId = getOrCreateSessionId();
      setSessionId(currentSessionId);
      const terminalWsUrl = `${wsUrl}?session=${currentSessionId}&startClaude=true`;
      const service = getTerminalService({ url: terminalWsUrl }, true);
      service.connect();
    }
  }, []);

  // Start a completely new session (clears stored session and kills tmux)
  const newSession = useCallback(async () => {
    // Kill the old tmux session on the server first
    const oldSessionId = sessionId || localStorage.getItem(SESSION_STORAGE_KEY);
    if (oldSessionId) {
      try {
        // Use relative URL so it works through tunnel
        await fetch(`/ws/kill-session?session=${oldSessionId}`, {
          method: 'POST',
        });
      } catch {
        // Server might not be running, ignore
      }
    }

    resetTerminalService();
    clearStoredSession();

    // Clear the terminal display
    xtermRef.current?.clear();
    xtermRef.current?.write('\x1b[90mStarting new session...\x1b[0m\r\n');

    // Ensure server is running
    const wsUrl = await ensureTerminalServer();
    if (wsUrl) {
      // Create new session ID
      const newSessionId = getOrCreateSessionId();
      setSessionId(newSessionId);
      const terminalWsUrl = `${wsUrl}?session=${newSessionId}&startClaude=true`;
      const service = getTerminalService({ url: terminalWsUrl }, true);
      service.connect();
    }
  }, [sessionId]);

  // Write to terminal
  const write = useCallback((data: string) => {
    const service = getTerminalService();
    service.send(data);
  }, []);

  // Clear terminal
  const clear = useCallback(() => {
    xtermRef.current?.clear();
    write('clear\r');
  }, [write]);

  // Focus terminal
  const focus = useCallback(() => {
    xtermRef.current?.focus();
  }, []);

  // Fit terminal
  const fit = useCallback(() => {
    try {
      fitAddonRef.current?.fit();
    } catch {
      // Ignore fit errors
    }
  }, []);

  return {
    terminalRef,
    isConnected,
    isReconnecting,
    reconnectAttempt,
    sessionId,
    connect,
    disconnect,
    reconnect,
    newSession,
    write,
    clear,
    focus,
    fit,
  };
}
