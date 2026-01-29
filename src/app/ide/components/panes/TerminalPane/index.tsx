'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useIDEStore, type TerminalTab as StoreTerminalTab } from '../../../stores/ideStore';
import { useMobileDetect } from '../../../hooks';
import { useTerminalAvailability } from '../../../hooks/useTerminalAvailability';
import { TerminalService, type TerminalEvent, getTerminalWebSocketUrl } from '@/lib/ide/services/terminal';
import { KeyboardToolbar } from '../../mobile/KeyboardToolbar';
import { TerminalTabs, type TerminalTab } from './TerminalTabs';
import { SessionManager } from './SessionManager';
import { TerminalUnavailable } from './TerminalUnavailable';
import {
  Terminal,
  Trash2,
  Wifi,
  WifiOff,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  ClipboardPaste,
  AlertCircle,
  Plus,
  List,
  Play,
} from 'lucide-react';
import { ToolingIndicator } from '@/app/ide/components/common/ToolingIndicator';
import { ContextProvider, useContextState } from '../../context';
import { ChatInput } from '../../chat/ChatInput';
import { TerminalSkin } from './TerminalSkin';

// =============================================================================
// TYPES
// =============================================================================

interface TerminalInstance {
  terminal: any;  // xterm.Terminal
  fitAddon: any;  // FitAddon
  service: TerminalService;
  sessionId: string;
  isConnected: boolean;
  outputBuffer: string;
  jsonMode: boolean; // Whether this session uses JSON output format
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function generateSessionId(): string {
  return `term_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateTabId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Note: Server handles session validation and tmux internally
// We just need to connect with the session ID - server does the rest

// =============================================================================
// READ INITIAL STATE FROM LOCALSTORAGE (before React hydration)
// =============================================================================

function getInitialTabsFromStorage(): { tabs: StoreTerminalTab[], activeId: string | null } {
  if (typeof window === 'undefined') return { tabs: [], activeId: null };

  try {
    const stored = localStorage.getItem('local-ide-store-v2');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Try both structures - Zustand persist might use 'state' wrapper or not
      const tabs = parsed.state?.terminalTabs || parsed.terminalTabs || [];
      const activeId = parsed.state?.activeTabId || parsed.activeTabId || null;

      console.log('[TerminalPane] localStorage structure:', {
        hasStateWrapper: !!parsed.state,
        topKeys: Object.keys(parsed).slice(0, 5),
        tabsFound: tabs.length,
      });

      if (tabs.length > 0) {
        console.log('[TerminalPane] Found stored tabs:', tabs.map((t: StoreTerminalTab) => t.sessionId));
        return { tabs, activeId };
      }
    } else {
      console.log('[TerminalPane] No localStorage entry found for local-ide-store-v2');
    }
  } catch (e) {
    console.error('[TerminalPane] Failed to read localStorage:', e);
  }
  return { tabs: [], activeId: null };
}

// =============================================================================
// TERMINAL HEADER COMPONENT
// =============================================================================

interface TerminalHeaderProps {
  isReconnecting: boolean;
  reconnectAttempt: number;
  isConnected: boolean;
  isMobile: boolean;
  isFullscreen: boolean;
  onShowSessionManager: () => void;
  onNewSession: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onReconnect: () => void;
  onClear: () => void;
  onToggleFullscreen: () => void;
}

function TerminalHeader({
  isReconnecting,
  reconnectAttempt,
  isConnected,
  isMobile,
  isFullscreen,
  onShowSessionManager,
  onNewSession,
  onCopy,
  onPaste,
  onReconnect,
  onClear,
  onToggleFullscreen,
}: TerminalHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-neutral-400" />
          <span className="text-xs text-neutral-400 font-medium">Terminal</span>

          {/* Connection status */}
          {isReconnecting ? (
            <span className="flex items-center gap-1 text-xs text-yellow-400">
              <RotateCcw className="w-3 h-3 animate-spin" />
              Reconnecting ({reconnectAttempt})
            </span>
          ) : isConnected ? (
            <Wifi className="w-3 h-3 text-green-400" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-400" />
          )}

          {/* Divider */}
          <div className="w-px h-3 bg-neutral-700" />

          {/* Tooling indicator */}
          <ToolingIndicator showLabel={false} compact />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onShowSessionManager}
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
            title="Manage sessions"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onNewSession}
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
            title="New session"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onCopy}
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
            title="Copy selection"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onPaste}
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
            title="Paste from clipboard"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onReconnect}
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
            title="Reconnect"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClear}
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
            title="Clear"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {isMobile && (
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// =============================================================================
// TERMINAL INPUT WRAPPER - Accesses context inside ContextProvider
// =============================================================================

interface TerminalInputWrapperProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isConnected: boolean;
  contextStateRef: React.MutableRefObject<ReturnType<typeof useContextState> | null>;
}

function TerminalInputWrapper({
  value,
  onChange,
  onSubmit,
  isLoading,
  isConnected,
  contextStateRef,
}: TerminalInputWrapperProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [shouldPulseSubmit, setShouldPulseSubmit] = useState(false);

  // Access context state inside ContextProvider
  const contextState = useContextState();

  // Store in ref so parent can access it
  useEffect(() => {
    contextStateRef.current = contextState;
  }, [contextState, contextStateRef]);

  // Auto-focus the input on mount - this is the default input method
  // Users can click on the terminal area to type directly in CLI
  useEffect(() => {
    const focusInput = () => {
      const textarea = document.querySelector('[data-terminal-input] textarea') as HTMLTextAreaElement;
      textarea?.focus();
    };
    // Small delay to ensure DOM is ready
    const timer = setTimeout(focusInput, 100);
    return () => clearTimeout(timer);
  }, []);

  // Listen for terminal input priming events (from element selection in preview)
  useEffect(() => {
    const handlePrimeTerminalInput = (event: CustomEvent) => {
      const { message, focusInput, pulseSubmit } = event.detail;

      if (message) {
        onChange(message);
      }

      if (focusInput) {
        // Focus the chat input's textarea (accessed via parent)
        setTimeout(() => {
          const textarea = document.querySelector('[data-terminal-input] textarea') as HTMLTextAreaElement;
          textarea?.focus();
        }, 50);
      }

      if (pulseSubmit) {
        setShouldPulseSubmit(true);
        // Auto-clear pulse after 5 seconds
        setTimeout(() => setShouldPulseSubmit(false), 5000);
      }
    };

    window.addEventListener('ide:prime-terminal-input', handlePrimeTerminalInput as EventListener);
    return () => window.removeEventListener('ide:prime-terminal-input', handlePrimeTerminalInput as EventListener);
  }, [onChange]);

  // Clear pulse when input changes
  useEffect(() => {
    if (value.length === 0) {
      setShouldPulseSubmit(false);
    }
  }, [value]);

  return (
    <div
      className={cn(
        "flex-shrink-0 p-2 border-t border-neutral-800 bg-neutral-900 transition-all duration-300",
        shouldPulseSubmit && "ring-2 ring-primary-500/50 bg-primary-500/5"
      )}
      data-terminal-input
    >
      <ChatInput
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        placeholder="Type command or use / @ ~ for autocomplete..."
        disabled={isLoading || !isConnected}
        isLoading={isLoading}
      />
      <div className="mt-1 text-[10px] text-neutral-600 text-center">
        <kbd className="px-1 py-0.5 rounded bg-neutral-800 text-blue-400 font-mono">/</kbd> commands
        <span className="mx-1">·</span>
        <kbd className="px-1 py-0.5 rounded bg-neutral-800 text-purple-400 font-mono">@</kbd> agents
        <span className="mx-1">·</span>
        <kbd className="px-1 py-0.5 rounded bg-neutral-800 text-orange-400 font-mono">~</kbd> workflows
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TerminalPane() {
  const isMobile = useMobileDetect();
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermContainerRef = useRef<HTMLDivElement>(null);
  const instancesRef = useRef<Map<string, TerminalInstance>>(new Map());
  const initializingRef = useRef(false);
  const activeInstanceRef = useRef<TerminalInstance | null>(null);

  // Read initial tabs from localStorage ONCE on first render
  const initialStorageRef = useRef<{ tabs: StoreTerminalTab[], activeId: string | null } | null>(null);
  if (initialStorageRef.current === null) {
    initialStorageRef.current = getInitialTabsFromStorage();
  }

  // Check terminal availability (handles production/Vercel gracefully)
  const { isAvailable, isChecking: isCheckingAvailability, reason, retryCheck } = useTerminalAvailability();

  // Store state
  const terminalTabs = useIDEStore((state) => state.terminalTabs);
  const activeTabId = useIDEStore((state) => state.activeTabId);
  const addTerminalTab = useIDEStore((state) => state.addTerminalTab);
  const removeTerminalTab = useIDEStore((state) => state.removeTerminalTab);
  const setActiveTab = useIDEStore((state) => state.setActiveTab);
  const setTerminalTabs = useIDEStore((state) => state.setTerminalTabs);
  const setServerPort = useIDEStore((state) => state.setServerPort);
  const setServerStatus = useIDEStore((state) => state.setServerStatus);

  // UI state
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConnectionError, setShowConnectionError] = useState(false);
  const [isValidatingSession, setIsValidatingSession] = useState(true);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [hasNoSessions, setHasNoSessions] = useState(false);

  // Rich input state for terminal
  const [terminalInput, setTerminalInput] = useState('');
  const [isTerminalInputLoading, setIsTerminalInputLoading] = useState(false);

  // Chat skin state
  const [skinVisible, setSkinVisible] = useState(false);
  const [outputBuffer, setOutputBuffer] = useState('');
  const [currentJsonMode, setCurrentJsonMode] = useState(false);

  // Debug: Log whenever terminalTabs changes
  useEffect(() => {
    console.log('[TerminalPane] terminalTabs changed:', terminalTabs.length, terminalTabs.map(t => t.sessionId));
  }, [terminalTabs]);

  // Convert store tabs to component tabs format
  const tabs: TerminalTab[] = terminalTabs.map((t) => ({
    id: t.tabId,
    name: t.name,
    isActive: t.tabId === activeTabId,
  }));

  // Port detection
  const detectPorts = useCallback((data: string) => {
    const patterns = [
      /(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d{4,5})/gi,
      /running (?:on|at) (?:http:\/\/)?(?:localhost|127\.0\.0\.1)?:?(\d{4,5})/gi,
      /listening on(?: port)? (\d{4,5})/gi,
      /Local:\s+http:\/\/localhost:(\d{4,5})/gi,
    ];

    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(data);
      if (match && match[1]) {
        const port = parseInt(match[1], 10);
        if (port >= 1024 && port <= 65535) {
          setServerPort(port);
          setServerStatus('running');
          return;
        }
      }
    }
  }, [setServerPort, setServerStatus]);

  // Create a new terminal instance for a tab
  // startClaude: true ONLY when user explicitly clicked "New Session" button
  const createTerminalInstance = useCallback(async (
    tabId: string,
    sessionId: string,
    container: HTMLDivElement,
    startClaude: boolean  // Only true when explicitly creating new session via button
  ): Promise<TerminalInstance | null> => {
    try {
      const { Terminal } = await import('xterm');
      const { FitAddon } = await import('xterm-addon-fit');
      const { WebLinksAddon } = await import('xterm-addon-web-links');

      const terminal = new Terminal({
        cursorBlink: true,
        cursorStyle: 'block',
        fontSize: isMobile ? 12 : 14,
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
        scrollback: 100000,
        scrollOnUserInput: false, // Don't auto-scroll to bottom when typing (allows reviewing history)
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();

      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);

      // Create terminal service with session ID
      // Server will check if tmux session exists - only start Claude if explicitly requested AND no tmux
      // ALWAYS use JSON mode for new sessions - enables proper skin parsing
      const baseWsUrl = getTerminalWebSocketUrl();
      const useJsonMode = startClaude; // Use JSON mode whenever starting Claude (new sessions)
      const terminalWsUrl = `${baseWsUrl}?session=${sessionId}&startClaude=${startClaude}&jsonMode=${useJsonMode}`;

      console.log(`[TerminalPane] Creating terminal instance:`, {
        tabId,
        sessionId,
        startClaude,
        jsonMode: useJsonMode,
        wsUrl: terminalWsUrl,
      });

      // Use forceNew to create a separate service instance for this tab
      const service = new TerminalService({ url: terminalWsUrl });

      const instance: TerminalInstance = {
        terminal,
        fitAddon,
        service,
        sessionId,
        isConnected: false,
        outputBuffer: '',
        jsonMode: useJsonMode,
      };

      // Handle terminal output
      const unsubData = service.on('data', (event: TerminalEvent) => {
        if (event.data) {
          terminal.write(event.data);
          instance.outputBuffer += event.data;
          detectPorts(event.data);
          // Update component-level buffer for skin
          if (activeInstanceRef.current === instance) {
            setOutputBuffer(instance.outputBuffer);
          }
        }
      });

      // Handle connection events
      const unsubOpen = service.on('open', (event: TerminalEvent) => {
        instance.isConnected = true;
        if (activeInstanceRef.current === instance) {
          setIsConnected(true);
          setIsReconnecting(false);
          setReconnectAttempt(0);
          setShowConnectionError(false);
        }
        console.log(`[TerminalPane] Connected to session ${sessionId}, reconnected: ${event.reconnected}`);

        // Clear any garbage escape sequences in the input line
        // This happens when reconnecting to tmux sessions
        if (!startClaude) {
          setTimeout(() => {
            service.send('\x15'); // Ctrl+U - clear line
          }, 200);
        }
      });

      const unsubClose = service.on('close', () => {
        instance.isConnected = false;
        if (activeInstanceRef.current === instance) {
          setIsConnected(false);
        }
      });

      const unsubReconnecting = service.on('reconnecting', (event: TerminalEvent) => {
        if (activeInstanceRef.current === instance) {
          setIsReconnecting(true);
          setReconnectAttempt(event.attempt || 0);
        }
      });

      const unsubError = service.on('error', (event: TerminalEvent) => {
        terminal.write(`\r\n\x1b[31mError: ${event.error?.message || 'Connection failed'}\x1b[0m\r\n`);
        if (activeInstanceRef.current === instance) {
          setShowConnectionError(true);
        }
      });

      // Handle user input - users can type directly in xterm OR use the ChatInput below
      // Direct typing: click in terminal and type (traditional CLI experience)
      // ChatInput: use autocomplete, context injection, agents/commands (@, /, ~)
      terminal.onData((data: string) => {
        // Check if this looks like a large paste (xterm sends pasted content through onData)
        // For large pastes, we want to chunk them
        if (data.length > 1024) {
          // Large paste detected - chunk it
          console.log('[TerminalPane] Large onData detected, chunking:', data.length);
          const CHUNK_SIZE = 4096;

          // Send with bracketed paste mode
          service.send('\x1b[200~');

          for (let i = 0; i < data.length; i += CHUNK_SIZE) {
            const chunk = data.slice(i, i + CHUNK_SIZE);
            service.send(chunk);
          }

          service.send('\x1b[201~');
        } else {
          service.send(data);
        }
      });

      // Handle resize
      terminal.onResize(({ cols, rows }: { cols: number; rows: number }) => {
        service.resize(cols, rows);
      });

      // Store cleanup handlers on the instance
      (instance as any)._cleanup = () => {
        unsubData();
        unsubOpen();
        unsubClose();
        unsubReconnecting();
        unsubError();
        service.disconnect();
        terminal.dispose();
      };

      return instance;
    } catch (error) {
      console.error('[TerminalPane] Failed to create terminal instance:', error);
      return null;
    }
  }, [isMobile, detectPorts]);

  // Initialize terminal tabs on mount
  // Fetch live sessions from the server - this is the source of truth
  useEffect(() => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    const initializeTerminals = async () => {
      console.log('[TerminalPane] Init starting, fetching server sessions...');

      // If store already has tabs, use those (user already interacted)
      if (terminalTabs.length > 0) {
        console.log('[TerminalPane] Store has tabs, using those:', terminalTabs.map(t => t.sessionId));
        setHasNoSessions(false);
        setIsValidatingSession(false);
        setIsInitialized(true);
        return;
      }

      try {
        // Fetch live sessions from terminal server
        const response = await fetch('/api/terminal/sessions');
        const data = await response.json();
        const liveSessions = data.sessions?.filter((s: any) => s.isLive) || [];

        console.log('[TerminalPane] Server has live sessions:', liveSessions.length);

        if (liveSessions.length > 0) {
          // Create tabs for live sessions
          const restoredTabs: StoreTerminalTab[] = liveSessions.map((s: any, i: number) => ({
            tabId: `tab_restored_${s.session_id}`,
            sessionId: s.session_id,
            name: `Terminal ${i + 1}`,
            index: i,
          }));

          console.log('[TerminalPane] Restoring tabs from server:', restoredTabs.map(t => t.sessionId));
          setTerminalTabs(restoredTabs);
          setActiveTab(restoredTabs[0].tabId);
          setHasNoSessions(false);
        } else {
          console.log('[TerminalPane] No live sessions - showing New Session button');
          setHasNoSessions(true);
        }
      } catch (err) {
        console.error('[TerminalPane] Failed to fetch sessions:', err);
        setHasNoSessions(true);
      }

      setIsValidatingSession(false);
      setIsInitialized(true);
    };

    initializeTerminals();

    return () => {
      instancesRef.current.forEach((instance) => {
        (instance as any)._cleanup?.();
      });
      instancesRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track which tabs were created via "New Session" button (need to start Claude)
  const newSessionTabsRef = useRef<Set<string>>(new Set());

  // Create/attach terminal for active tab
  useEffect(() => {
    if (!isInitialized || !activeTabId || !xtermContainerRef.current) return;
    if (hasNoSessions) return; // Don't try to create terminal if showing "New Session" UI

    const activeTab = terminalTabs.find(t => t.tabId === activeTabId);
    if (!activeTab) return;

    // Check if we already have an instance for this tab
    let instance: TerminalInstance | undefined = instancesRef.current.get(activeTabId);

    const setupTerminal = async () => {
      // Clear container
      const container = xtermContainerRef.current;
      if (!container) return;
      container.innerHTML = '';

      if (instance) {
        // Reattach existing terminal (already connected, just switching tabs)
        instance.terminal.open(container);
        activeInstanceRef.current = instance;
        setIsConnected(instance.isConnected);
        setCurrentJsonMode(instance.jsonMode);
        setOutputBuffer(instance.outputBuffer);

        // Fit after a short delay
        setTimeout(() => {
          try {
            instance!.fitAddon.fit();
          } catch {
            // Ignore fit errors
          }
        }, 50);
      } else {
        // Create new terminal instance
        // startClaude is ONLY true if this tab was created via "New Session" button
        const shouldStartClaude = newSessionTabsRef.current.has(activeTab.tabId);

        // Remove from set after using (one-time flag)
        if (shouldStartClaude) {
          newSessionTabsRef.current.delete(activeTab.tabId);
        }

        console.log(`[TerminalPane] Setting up terminal for tab ${activeTab.tabId}:`, {
          sessionId: activeTab.sessionId,
          shouldStartClaude,
          reason: shouldStartClaude ? 'New Session button clicked' : 'Reconnecting to existing session',
        });

        const newInstance = await createTerminalInstance(
          activeTab.tabId,
          activeTab.sessionId,
          container,
          shouldStartClaude  // ONLY true for explicit new session creation
        );

        if (!newInstance) {
          setShowConnectionError(true);
          return;
        }

        instance = newInstance;

        instancesRef.current.set(activeTabId, instance);
        activeInstanceRef.current = instance;
        setCurrentJsonMode(instance.jsonMode);

        // Open terminal in container
        instance.terminal.open(container);

        // Fit and connect
        setTimeout(() => {
          try {
            instance!.fitAddon.fit();
          } catch {
            // Ignore fit errors
          }
          instance!.service.connect();
        }, 50);
      }
    };

    setupTerminal();
  }, [isInitialized, activeTabId, terminalTabs, hasNoSessions, createTerminalInstance]);

  // Set up resize observer
  useEffect(() => {
    if (!xtermContainerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      const instance = activeInstanceRef.current;
      if (instance) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            try {
              instance.fitAddon.fit();
            } catch {
              // Ignore fit errors
            }
          }, 50);
        });
      }
    });

    resizeObserver.observe(xtermContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isInitialized]);

  // Refit on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && activeInstanceRef.current) {
        setTimeout(() => {
          try {
            activeInstanceRef.current?.fitAddon.fit();
          } catch {
            // Ignore fit errors
          }
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Save output on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const activeTab = terminalTabs.find(t => t.tabId === activeTabId);
      if (activeTab) {
        // Use sendBeacon for reliable delivery
        navigator.sendBeacon(
          '/api/terminal/save-output',
          JSON.stringify({ sessionId: activeTab.sessionId })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeTabId, terminalTabs]);

  // Intercept native paste events on the terminal container
  // This ensures we handle large pastes properly instead of relying on xterm's default
  useEffect(() => {
    const container = xtermContainerRef.current;
    if (!container) return;

    const handleNativePaste = async (e: ClipboardEvent) => {
      const instance = activeInstanceRef.current;
      if (!instance) return;

      // Get the pasted text
      const text = e.clipboardData?.getData('text');
      if (!text) return;

      // Prevent default xterm paste handling for large content
      if (text.length > 512) {
        e.preventDefault();
        e.stopPropagation();

        console.log('[TerminalPane] Intercepted large native paste:', text.length);

        const CHUNK_SIZE = 4096;

        // Send with bracketed paste mode
        instance.service.send('\x1b[200~');

        for (let i = 0; i < text.length; i += CHUNK_SIZE) {
          const chunk = text.slice(i, i + CHUNK_SIZE);
          instance.service.send(chunk);

          // Small delay between chunks for very large content
          if (text.length > CHUNK_SIZE * 4 && i + CHUNK_SIZE < text.length) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }

        instance.service.send('\x1b[201~');
        console.log('[TerminalPane] Native paste handled');
      }
    };

    container.addEventListener('paste', handleNativePaste, true);
    return () => container.removeEventListener('paste', handleNativePaste, true);
  }, [isInitialized]);

  // Handle wheel events to scroll terminal history (not command history)
  // This intercepts scroll events and manually scrolls the terminal buffer
  // Note: When Claude CLI is in "alternate screen" mode (like vim/less), scrollback is limited
  // The full scrollback (100k lines) is available when CLI returns to normal mode
  useEffect(() => {
    const container = xtermContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const instance = activeInstanceRef.current;
      if (!instance) return;

      // Prevent default to stop any application-level scroll handling
      e.preventDefault();
      e.stopPropagation();

      // Calculate scroll amount based on delta mode
      let scrollLines: number;
      if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        // Already in lines - multiply for faster scrolling
        scrollLines = Math.round(e.deltaY * 3);
      } else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        // In pages, convert to lines
        scrollLines = Math.round(e.deltaY * 30);
      } else {
        // DOM_DELTA_PIXEL (trackpad) - more responsive scrolling
        scrollLines = Math.round(e.deltaY / 10);
      }

      // Clamp to reasonable range but allow faster scrolling
      scrollLines = Math.max(-30, Math.min(30, scrollLines));

      // Scroll the terminal buffer
      if (scrollLines !== 0) {
        instance.terminal.scrollLines(scrollLines);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [isInitialized]);

  // Handlers
  const handleKeyPress = useCallback((key: string) => {
    activeInstanceRef.current?.service.send(key);
    activeInstanceRef.current?.terminal.focus();
  }, []);

  const handleClear = useCallback(() => {
    activeInstanceRef.current?.terminal.clear();
    activeInstanceRef.current?.service.send('clear\r');
  }, []);

  const handleReconnect = useCallback(() => {
    const instance = activeInstanceRef.current;
    if (instance) {
      instance.service.disconnect();
      setShowConnectionError(false);
      setTimeout(() => {
        instance.service.connect();
      }, 100);
    }
  }, []);

  const handleCopy = useCallback(() => {
    const selection = activeInstanceRef.current?.terminal.getSelection();
    if (selection) {
      navigator.clipboard.writeText(selection);
    }
  }, []);

  // Dedicated paste handler that properly reads clipboard and sends to terminal
  // Handles large content by chunking to avoid WebSocket/JSON issues
  const handlePaste = useCallback(async () => {
    const instance = activeInstanceRef.current;
    if (!instance) return;

    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        console.log('[TerminalPane] Clipboard is empty');
        return;
      }

      console.log('[TerminalPane] Pasting content, length:', text.length);

      // For small content, send directly
      // For larger content, chunk it to avoid WebSocket message size limits
      const CHUNK_SIZE = 4096; // 4KB chunks

      if (text.length <= CHUNK_SIZE) {
        // Small content - send directly with bracketed paste mode
        const bracketedPasteStart = '\x1b[200~';
        const bracketedPasteEnd = '\x1b[201~';
        instance.service.send(bracketedPasteStart + text + bracketedPasteEnd);
      } else {
        // Large content - chunk it
        console.log('[TerminalPane] Large paste, chunking into', Math.ceil(text.length / CHUNK_SIZE), 'chunks');

        // Send start of bracketed paste
        instance.service.send('\x1b[200~');

        // Send content in chunks with small delays to prevent overwhelming the connection
        for (let i = 0; i < text.length; i += CHUNK_SIZE) {
          const chunk = text.slice(i, i + CHUNK_SIZE);
          instance.service.send(chunk);

          // Small delay between chunks for very large content
          if (text.length > CHUNK_SIZE * 4) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }

        // Send end of bracketed paste
        instance.service.send('\x1b[201~');
      }

      // Focus the terminal after paste
      instance.terminal.focus();
      console.log('[TerminalPane] Paste completed');
    } catch (err) {
      console.error('[TerminalPane] Paste failed:', err);

      // Fallback: try direct send without bracketed mode
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          console.log('[TerminalPane] Fallback paste, length:', text.length);
          activeInstanceRef.current?.service.send(text);
        }
      } catch (fallbackErr) {
        console.error('[TerminalPane] Fallback paste also failed:', fallbackErr);
      }
    }
  }, []);

  const handleContainerClick = useCallback(() => {
    activeInstanceRef.current?.terminal.focus();
  }, []);

  // Ref to store context state for use in submit handler
  const contextStateRef = useRef<ReturnType<typeof useContextState> | null>(null);

  // Handle submit from the rich terminal input
  const handleTerminalInputSubmit = useCallback(() => {
    const instance = activeInstanceRef.current;
    if (!instance || !terminalInput.trim()) return;

    setIsTerminalInputLoading(true);

    try {
      // Build prompt with context if available
      let textToSend = terminalInput.trim();
      const contextState = contextStateRef.current;

      if (contextState?.hasContext) {
        // Build enhanced prompt with context
        textToSend = contextState.buildPrompt(terminalInput.trim());
        // Clear context after using it
        contextState.clearAll();
      }

      console.log('[TerminalPane] Sending rich input:', textToSend.length, 'chars');

      // Send to terminal with bracketed paste mode for proper handling
      const CHUNK_SIZE = 4096;

      if (textToSend.length <= CHUNK_SIZE) {
        // Small content - send directly
        instance.service.send('\x1b[200~' + textToSend + '\x1b[201~');
      } else {
        // Large content - chunk it
        instance.service.send('\x1b[200~');
        for (let i = 0; i < textToSend.length; i += CHUNK_SIZE) {
          instance.service.send(textToSend.slice(i, i + CHUNK_SIZE));
        }
        instance.service.send('\x1b[201~');
      }

      // Send Enter to confirm paste (Claude CLI paste detection)
      instance.service.send('\r');

      // Send another Enter after a short delay to execute the command
      // Claude CLI shows "[Pasted text #1 +X lines]" and waits for confirmation
      setTimeout(() => {
        instance.service.send('\r');
      }, 100);

      // Clear input
      setTerminalInput('');

      // Focus terminal
      instance.terminal.focus();
    } catch (err) {
      console.error('[TerminalPane] Submit failed:', err);
    } finally {
      setIsTerminalInputLoading(false);
    }
  }, [terminalInput]);

  // Tab management
  const handleTabSelect = useCallback((id: string) => {
    if (id === activeTabId) return;

    // Disconnect current instance (but keep it in memory)
    const currentInstance = activeInstanceRef.current;
    if (currentInstance) {
      // Save current output
      const currentTab = terminalTabs.find(t => t.tabId === activeTabId);
      if (currentTab) {
        fetch('/api/terminal/save-output', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: currentTab.sessionId }),
        }).catch(() => {});
      }
    }

    setActiveTab(id);
  }, [activeTabId, terminalTabs, setActiveTab]);

  const handleTabClose = useCallback((id: string) => {
    const tab = terminalTabs.find(t => t.tabId === id);
    if (!tab) return;

    // Cleanup instance
    const instance = instancesRef.current.get(id);
    if (instance) {
      (instance as any)._cleanup?.();
      instancesRef.current.delete(id);
    }

    // Kill session on backend (kills tmux too)
    fetch(`/api/terminal/sessions/${tab.sessionId}`, {
      method: 'DELETE',
    }).catch(() => {});

    // If closing active tab, switch to another
    if (id === activeTabId) {
      const remaining = terminalTabs.filter(t => t.tabId !== id);
      if (remaining.length > 0) {
        setActiveTab(remaining[0].tabId);
      }
    }

    removeTerminalTab(id);

    // If no tabs left, show "New Session" button (don't auto-create)
    if (terminalTabs.length <= 1) {
      setHasNoSessions(true);
    }
  }, [activeTabId, terminalTabs, removeTerminalTab, setActiveTab]);

  // Create new terminal session - ONLY called from button click
  const handleNewSession = useCallback(() => {
    const newSessionId = generateSessionId();
    const newTabId = generateTabId();
    const index = terminalTabs.length;

    // Mark this tab as needing to start Claude (explicit user action)
    newSessionTabsRef.current.add(newTabId);

    console.log(`[TerminalPane] Creating NEW session via button:`, {
      tabId: newTabId,
      sessionId: newSessionId,
      willStartClaude: true,
    });

    addTerminalTab({
      tabId: newTabId,
      sessionId: newSessionId,
      name: `Terminal ${index + 1}`,
      index,
    });
    setActiveTab(newTabId);
    setHasNoSessions(false);
  }, [terminalTabs.length, addTerminalTab, setActiveTab]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    setTimeout(() => {
      try {
        activeInstanceRef.current?.fitAddon.fit();
      } catch {
        // Ignore fit errors
      }
    }, 100);
  }, []);

  // Handle selecting a session from the SessionManager
  const handleSelectSession = useCallback((sessionId: string) => {
    // Check if we already have a tab for this session
    const existingTab = terminalTabs.find(t => t.sessionId === sessionId);
    if (existingTab) {
      setActiveTab(existingTab.tabId);
    } else {
      // Create a new tab for this session
      const newTabId = generateTabId();
      const index = terminalTabs.length;
      addTerminalTab({
        tabId: newTabId,
        sessionId: sessionId,
        name: `Terminal ${index + 1}`,
        index,
      });
      setActiveTab(newTabId);
    }
    setShowSessionManager(false);
  }, [terminalTabs, addTerminalTab, setActiveTab]);

  // Get current session ID for the SessionManager
  const currentSessionId = terminalTabs.find(t => t.tabId === activeTabId)?.sessionId;

  // Show unavailable UI in production or when terminal server is not running
  if (!isAvailable && !isCheckingAvailability) {
    return <TerminalUnavailable reason={reason} onRetry={retryCheck} />;
  }

  // Loading state while checking availability
  if (isCheckingAvailability) {
    return (
      <div className="h-full flex flex-col bg-neutral-950">
        <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-neutral-400" />
            <span className="text-xs text-neutral-400 font-medium">Terminal</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RotateCcw className="w-6 h-6 text-neutral-400 animate-spin mb-2 mx-auto" />
            <span className="text-sm text-neutral-400">Checking terminal availability...</span>
          </div>
        </div>
      </div>
    );
  }

  // Loading state while validating sessions
  if (isValidatingSession) {
    return (
      <div className="h-full flex flex-col bg-neutral-950">
        <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-neutral-400" />
            <span className="text-xs text-neutral-400 font-medium">Terminal</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RotateCcw className="w-6 h-6 text-neutral-400 animate-spin mb-2 mx-auto" />
            <span className="text-sm text-neutral-400">Checking for existing sessions...</span>
          </div>
        </div>
      </div>
    );
  }

  // No sessions - show "New Session" button
  if (hasNoSessions) {
    return (
      <div className="h-full flex flex-col bg-neutral-950">
        <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-neutral-400" />
            <span className="text-xs text-neutral-400 font-medium">Terminal</span>
          </div>
          <button
            onClick={() => setShowSessionManager(true)}
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
            title="Manage sessions"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Terminal className="w-12 h-12 text-neutral-600 mb-4 mx-auto" />
            <p className="text-neutral-400 mb-4">No active terminal sessions</p>
            <button
              onClick={handleNewSession}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              New Session
            </button>
          </div>
        </div>
        <SessionManager
          isOpen={showSessionManager}
          onClose={() => setShowSessionManager(false)}
          onSelectSession={handleSelectSession}
          currentSessionId={currentSessionId}
        />
      </div>
    );
  }

  return (
    <ContextProvider>
      <div
        ref={containerRef}
        className={cn(
          'h-full flex flex-col bg-neutral-950',
          isFullscreen && 'fixed inset-0 z-50'
        )}
      >
        {/* Header */}
        <TerminalHeader
          isReconnecting={isReconnecting}
          reconnectAttempt={reconnectAttempt}
          isConnected={isConnected}
          isMobile={isMobile}
          isFullscreen={isFullscreen}
          onShowSessionManager={() => setShowSessionManager(true)}
          onNewSession={handleNewSession}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onReconnect={handleReconnect}
          onClear={handleClear}
          onToggleFullscreen={toggleFullscreen}
        />

        {/* Tabs */}
        {tabs.length > 0 && (
          <TerminalTabs
            tabs={tabs}
            activeTabId={activeTabId || ''}
            onTabSelect={handleTabSelect}
            onTabClose={handleTabClose}
            onNewTab={handleNewSession}
          />
        )}

        {/* Terminal container */}
        <div className="flex-1 overflow-hidden relative">
          {/* Connection error overlay */}
          {showConnectionError && !isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/90 z-10">
              <div className="text-center p-6">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-neutral-300 mb-4">Terminal connection failed</p>
                <button
                  onClick={handleReconnect}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  Reconnect
                </button>
              </div>
            </div>
          )}

          {/* xterm container - click here to focus terminal for direct typing */}
          <div
            ref={xtermContainerRef}
            className={cn(
              'h-full w-full p-2 cursor-text transition-all duration-300',
              skinVisible && 'opacity-50'
            )}
            style={{ minHeight: isMobile ? '200px' : '300px' }}
            onClick={handleContainerClick}
          />

          {/* Chat skin overlay - AI interpreting AI */}
          <TerminalSkin
            isVisible={skinVisible}
            onToggle={() => setSkinVisible(!skinVisible)}
            outputBuffer={outputBuffer}
            terminalSessionId={currentSessionId || ''}
            isConnected={isConnected}
            jsonMode={currentJsonMode}
          />
        </div>

        {/* Rich input with autocomplete */}
        <TerminalInputWrapper
          value={terminalInput}
          onChange={setTerminalInput}
          onSubmit={handleTerminalInputSubmit}
          isLoading={isTerminalInputLoading}
          isConnected={isConnected}
          contextStateRef={contextStateRef}
        />

        {/* Mobile keyboard toolbar */}
        {isMobile && (
          <div className="flex-shrink-0 safe-area-bottom">
            <KeyboardToolbar onKey={handleKeyPress} />
          </div>
        )}

        {/* Session Manager Modal */}
        <SessionManager
          isOpen={showSessionManager}
          onClose={() => setShowSessionManager(false)}
          onSelectSession={handleSelectSession}
          currentSessionId={currentSessionId}
        />
      </div>
    </ContextProvider>
  );
}
