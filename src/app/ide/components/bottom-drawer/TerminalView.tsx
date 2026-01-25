'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useIDEStore } from '../../stores/ideStore';
import { getTerminalService, resetTerminalService, getTerminalWebSocketUrl } from '@/lib/ide/services/terminal';
import type { TerminalEvent } from '@/lib/ide/services/terminal';
import { Trash2, Terminal, Wifi, WifiOff } from 'lucide-react';
import { ToolingIndicator } from '@/app/ide/components/common/ToolingIndicator';

// Session persistence key (same as useTerminal)
const SESSION_STORAGE_KEY = 'local-ide-terminal-session';

// Get or create a persistent session ID
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    console.log('[TerminalView] SSR context - generating temporary session ID');
    return `term_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  console.log('[TerminalView] localStorage session ID:', sessionId);
  if (!sessionId) {
    sessionId = `term_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    console.log('[TerminalView] Created new session ID:', sessionId);
  } else {
    console.log('[TerminalView] Reusing existing session ID:', sessionId);
  }
  return sessionId;
}

// Clear the stored session (for starting fresh)
function clearStoredSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

export function TerminalView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [output, setOutput] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const drawerHeight = useIDEStore((state) => state.drawer.height);

  // Initialize terminal service - connect to real terminal server
  // Auto-start Claude CLI session on connection
  useEffect(() => {
    // Reset service to ensure we use the correct session ID URL on page load
    resetTerminalService();

    const baseWsUrl = getTerminalWebSocketUrl();
    const currentSessionId = getOrCreateSessionId();
    setSessionId(currentSessionId);
    const terminalWsUrl = `${baseWsUrl}?session=${currentSessionId}&startClaude=true`;
    const terminal = getTerminalService({ url: terminalWsUrl }, true);

    // Set up event handlers
    const unsubOpen = terminal.on('open', (event: TerminalEvent) => {
      setIsConnected(true);
      setReconnectAttempt(0);
      // Update session ID if server provides one
      if (event.sessionId) {
        setSessionId(event.sessionId);
        if (typeof window !== 'undefined') {
          localStorage.setItem(SESSION_STORAGE_KEY, event.sessionId);
        }
      }
    });

    const unsubClose = terminal.on('close', () => {
      setIsConnected(false);
    });

    const unsubData = terminal.on('data', (event: TerminalEvent) => {
      if (event.data) {
        setOutput((prev) => prev + event.data);
      }
    });

    const unsubReconnecting = terminal.on('reconnecting', (event: TerminalEvent) => {
      setReconnectAttempt(event.attempt || 0);
    });

    const unsubError = terminal.on('error', (event: TerminalEvent) => {
      setOutput((prev) => prev + `\r\n\x1b[31mError: ${event.error?.message || 'Unknown error'}\x1b[0m\r\n`);
    });

    // Connect
    terminal.connect();

    // Cleanup
    return () => {
      unsubOpen();
      unsubClose();
      unsubData();
      unsubReconnecting();
      unsubError();
    };
  }, []);

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

  // Auto-scroll to bottom when new content
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output]);

  // Focus container when drawer opens
  useEffect(() => {
    if (drawerHeight !== 'collapsed' && containerRef.current) {
      setTimeout(() => containerRef.current?.focus(), 200);
    }
  }, [drawerHeight]);

  // Handle keyboard input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const terminal = getTerminalService();

    // Prevent default for most keys to handle them ourselves
    if (e.key.length === 1 || ['Enter', 'Backspace', 'Tab', 'Escape'].includes(e.key)) {
      e.preventDefault();
    }

    // Handle Ctrl+C
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      terminal.send('\x03');
      return;
    }

    // Handle Ctrl+D
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      terminal.send('\x04');
      return;
    }

    // Handle Ctrl+L (clear)
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      handleClear();
      return;
    }

    // Handle special keys
    switch (e.key) {
      case 'Enter':
        terminal.send('\r');
        break;
      case 'Backspace':
        terminal.send('\x7f');
        break;
      case 'Tab':
        terminal.send('\t');
        break;
      case 'Escape':
        terminal.send('\x1b');
        break;
      case 'ArrowUp':
        terminal.send('\x1b[A');
        break;
      case 'ArrowDown':
        terminal.send('\x1b[B');
        break;
      case 'ArrowRight':
        terminal.send('\x1b[C');
        break;
      case 'ArrowLeft':
        terminal.send('\x1b[D');
        break;
      default:
        // Regular character
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          terminal.send(e.key);
        }
    }
  }, []);

  // Handle clear
  const handleClear = useCallback(() => {
    setOutput('');
    const terminal = getTerminalService();
    terminal.send('clear\r');
  }, []);

  // Handle reconnect
  const handleReconnect = useCallback(() => {
    resetTerminalService();
    setOutput('');
    const baseWsUrl = getTerminalWebSocketUrl();
    const currentSessionId = getOrCreateSessionId();
    setSessionId(currentSessionId);
    const terminalWsUrl = `${baseWsUrl}?session=${currentSessionId}&startClaude=true`;
    const terminal = getTerminalService({ url: terminalWsUrl }, true);
    terminal.connect();
  }, []);

  // Parse ANSI escape codes and convert to styled spans
  const parseAnsi = (text: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    let currentStyle: string[] = [];
    let buffer = '';
    let key = 0;

    const flushBuffer = () => {
      if (buffer) {
        const className = currentStyle.join(' ') || 'text-neutral-300';
        nodes.push(
          <span key={key++} className={className}>
            {buffer}
          </span>
        );
        buffer = '';
      }
    };

    const styleMap: Record<string, string> = {
      '0': '', // Reset
      '1': 'font-bold',
      '2': 'opacity-75',
      '3': 'italic',
      '4': 'underline',
      '30': 'text-neutral-900 dark:text-neutral-100',
      '31': 'text-red-500',
      '32': 'text-green-500',
      '33': 'text-yellow-500',
      '34': 'text-blue-500',
      '35': 'text-purple-500',
      '36': 'text-cyan-500',
      '37': 'text-neutral-300',
      '90': 'text-neutral-500',
      '91': 'text-red-400',
      '92': 'text-green-400',
      '93': 'text-yellow-400',
      '94': 'text-blue-400',
      '95': 'text-purple-400',
      '96': 'text-cyan-400',
      '97': 'text-white',
    };

    // Simple ANSI parser
    const regex = /\x1b\[([0-9;]*)m/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before this escape sequence
      buffer += text.slice(lastIndex, match.index);
      flushBuffer();

      // Parse codes
      const codes = match[1].split(';').filter(Boolean);
      if (codes.length === 0 || codes[0] === '0') {
        currentStyle = [];
      } else {
        for (const code of codes) {
          const style = styleMap[code];
          if (style) {
            currentStyle.push(style);
          }
        }
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    buffer += text.slice(lastIndex);
    flushBuffer();

    return nodes;
  };

  // Process output for display (handle \r\n, clear sequences, etc.)
  const processOutput = (text: string): string => {
    // Handle clear screen
    text = text.replace(/\x1b\[2J\x1b\[H/g, '');

    // Convert \r\n to \n
    text = text.replace(/\r\n/g, '\n');

    // Handle carriage return (move to line start)
    const lines = text.split('\n');
    const processedLines = lines.map((line) => {
      if (line.includes('\r')) {
        // Take the last segment after \r
        const segments = line.split('\r');
        return segments[segments.length - 1];
      }
      return line;
    });

    return processedLines.join('\n');
  };

  // Handle mobile quick keys
  const handleQuickKey = (key: string) => {
    const terminal = getTerminalService();
    switch (key) {
      case 'Tab':
        terminal.send('\t');
        break;
      case 'Esc':
        terminal.send('\x1b');
        break;
      case 'Ctrl+C':
        terminal.send('\x03');
        break;
      case 'Ctrl+D':
        terminal.send('\x04');
        break;
      case '↑':
        terminal.send('\x1b[A');
        break;
      case '↓':
        terminal.send('\x1b[B');
        break;
    }
    containerRef.current?.focus();
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950">
      {/* Terminal header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-neutral-800 bg-neutral-900">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-neutral-500" />
          <span className="text-xs font-medium text-neutral-400">Terminal</span>
          {isConnected ? (
            <div className="flex items-center gap-1 text-xs text-green-500">
              <Wifi className="w-3 h-3" />
              <span>Connected</span>
            </div>
          ) : reconnectAttempt > 0 ? (
            <span className="text-xs text-yellow-500">
              Reconnecting ({reconnectAttempt})...
            </span>
          ) : (
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <WifiOff className="w-3 h-3" />
              <span>Disconnected</span>
            </div>
          )}

          {/* Divider */}
          <div className="w-px h-3 bg-neutral-700" />

          {/* Tooling indicator */}
          <ToolingIndicator showLabel={false} compact />
        </div>
        <div className="flex items-center gap-1">
          {!isConnected && (
            <button
              onClick={handleReconnect}
              className="px-2 py-0.5 rounded text-xs bg-primary-600 hover:bg-primary-700 text-white transition-colors"
            >
              Reconnect
            </button>
          )}
          <button
            onClick={handleClear}
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-neutral-400 transition-colors"
            aria-label="Clear terminal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal output */}
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex-1 overflow-hidden focus:outline-none cursor-text"
        onClick={() => containerRef.current?.focus()}
      >
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto p-3 font-mono text-sm"
          style={{
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="whitespace-pre-wrap break-all">
            {parseAnsi(processOutput(output))}
          </div>
        </div>
      </div>

      {/* Keyboard toolbar (mobile) */}
      <div className="flex-shrink-0 flex gap-1 p-2 border-t border-neutral-800 overflow-x-auto md:hidden">
        {['Tab', 'Esc', 'Ctrl+C', 'Ctrl+D', '↑', '↓'].map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleQuickKey(key)}
            className="flex-shrink-0 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-mono text-neutral-300 transition-colors active:bg-neutral-600"
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
