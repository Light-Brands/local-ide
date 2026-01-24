import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { useState, useEffect } from 'react';
import type { Message as ChatMessage, ContentBlock } from '@/types/chat';
import type { Operation, OperationFilter } from '@/lib/ide/services/operations';

// =============================================================================
// TYPES
// =============================================================================

export interface TerminalTab {
  tabId: string;
  sessionId: string;  // Backend session ID for persistence
  name: string;
  index: number;
  worktreePath?: string;
  branchName?: string;
  baseBranch?: string;
}

// Chat session uses the rich Message type with ContentBlock[]
export interface ChatSession {
  id: string;
  name: string;
  createdAt: Date;
  lastActiveAt: Date;
  messages: ChatMessage[];
  backendSessionId?: string;      // Server-side session for reconnection
  isServerPersistent?: boolean;   // Has server-side persistence via tmux
}

export interface PortInfo {
  port: number;
  detectedAt: Date;
  source: 'terminal' | 'scan' | 'ide';
  label?: string;
  tabId?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: any[];
  isStreaming?: boolean;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export interface Activity {
  id: string;
  type: 'file' | 'terminal' | 'ai' | 'deploy' | 'database' | 'error' | 'info';
  title: string;
  description?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Migration types
export interface MigrationFile {
  version: string;
  name: string;
  displayName: string;
  path: string;
  status: 'applied' | 'pending';
  appliedAt?: string;
  createdAt?: string;
}

export interface MigrationRunResult {
  version: string;
  success: boolean;
  message: string;
  error?: string;
  alreadyApplied?: boolean;
  timestamp: number;
}

export interface MigrationSummary {
  total: number;
  applied: number;
  pending: number;
}

// Mobile main pane types
export type MobileMainPane = 'preview' | 'editor' | 'database' | 'deployments' | 'activity' | 'settings';
export type BottomZoneHeight = 'collapsed' | 'half' | 'expanded' | 'fullscreen';
export type BottomZoneTab = 'terminal' | 'chat';

// Desktop pane IDs (1-7)
export type DesktopPaneId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Backward compatibility type aliases for legacy components
export type PaneId = 'preview' | 'editor' | 'database' | 'deploy' | 'activity';
export type DrawerHeight = BottomZoneHeight;
export type DrawerTab = BottomZoneTab;

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface IDEStore {
  // === PROJECT ISOLATION ===
  resetProjectState: () => void;

  // === DESKTOP PANE STATE ===
  paneOrder: number[];
  paneVisibility: Record<number, boolean>;
  paneWidths: Record<number, number>;
  maxPanesReached: boolean;
  togglePane: (pane: number) => void;
  setPaneVisibility: (pane: number, visible: boolean) => void;
  setPaneWidth: (pane: number, width: number) => void;
  reorderPanes: (order: number[]) => void;
  setMaxPanesReached: (reached: boolean) => void;
  activityPanelOpen: boolean;
  setActivityPanelOpen: (open: boolean) => void;
  toggleActivityPanel: () => void;

  // === MOBILE STATE (Two-Zone) ===
  mobile: {
    mainPane: MobileMainPane;
    bottomZoneHeight: BottomZoneHeight;
    bottomZoneTab: BottomZoneTab;
    chatUnreadCount: number;
  };
  setMobileMainPane: (pane: MobileMainPane) => void;
  setMobileBottomZoneHeight: (height: BottomZoneHeight) => void;
  setMobileBottomZoneTab: (tab: BottomZoneTab) => void;
  toggleMobileBottomZone: () => void;
  expandMobileBottomZone: () => void;
  collapseMobileBottomZone: () => void;
  incrementMobileChatUnread: () => void;
  clearMobileChatUnread: () => void;

  // === EDITOR STATE ===
  activeFile: string | null;
  openFiles: string[];
  unsavedFiles: Set<string>;
  fileTree: FileNode[];
  fileTreeLoading: boolean;
  fileTreeCollapsed: boolean;
  expandedFolders: string[];
  fileContents: Record<string, { content: string; sha: string }>;
  splitView: boolean;
  editorError: string | null;
  // Backward compat properties
  unsavedChanges: Record<string, string>;
  isLoadingTree: boolean;
  isLoadingFile: boolean;
  setActiveFile: (path: string | null) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  markFileUnsaved: (path: string) => void;
  markFileSaved: (path: string) => void;
  setFileTree: (tree: FileNode[]) => void;
  setFileTreeLoading: (loading: boolean) => void;
  setFileTreeCollapsed: (collapsed: boolean) => void;
  toggleFolder: (path: string) => void;
  setFileContent: (path: string, content: string, sha: string) => void;
  setSplitView: (enabled: boolean) => void;
  setEditorError: (error: string | null) => void;

  // === CHAT STATE ===
  chatMode: 'terminal' | 'workspace';
  terminalMessages: Message[];
  workspaceMessages: Message[];
  isTyping: boolean;
  setChatMode: (mode: 'terminal' | 'workspace') => void;
  addMessage: (mode: 'terminal' | 'workspace', message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateLastMessage: (modeOrContent: 'terminal' | 'workspace' | string, content?: string) => void;
  setIsTyping: (typing: boolean) => void;
  clearMessages: (mode: 'terminal' | 'workspace') => void;

  // === CHAT SESSIONS ===
  chatSessions: ChatSession[];
  activeChatSessionId: string | null;
  addChatSession: (name?: string) => string;
  removeChatSession: (sessionId: string) => void;
  setActiveChatSession: (sessionId: string) => void;
  renameChatSession: (sessionId: string, name: string) => void;
  updateChatSessionMessages: (sessionId: string, messages: ChatMessage[]) => void;
  clearSessionMessages: (sessionId: string) => void;
  getActiveSession: () => ChatSession | null;
  setChatSessionBackend: (frontendId: string, backendSessionId: string) => void;

  // === PREVIEW STATE ===
  previewMode: 'local' | 'deployed';
  serverStatus: 'stopped' | 'starting' | 'running' | 'error';
  serverPort: number | null;
  activePorts: Record<number, PortInfo>;
  selectedPort: number | null;
  deployedUrl: string | null;
  setPreviewMode: (mode: 'local' | 'deployed') => void;
  setServerStatus: (status: 'stopped' | 'starting' | 'running' | 'error') => void;
  setServerPort: (port: number | null) => void;
  addPort: (port: number, source: 'terminal' | 'scan', label?: string, tabId?: string) => void;
  removePort: (port: number) => void;
  setSelectedPort: (port: number | null) => void;
  syncPortsFromScan: (ports: number[]) => void;
  setDeployedUrl: (url: string | null) => void;

  // === TERMINAL STATE ===
  terminalTabs: TerminalTab[];
  activeTabId: string | null;
  terminalHistory: string[];
  addTerminalTab: (tab: TerminalTab) => void;
  removeTerminalTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  setTerminalTabs: (tabs: TerminalTab[]) => void;
  addTerminalHistory: (command: string) => void;

  // === DATABASE STATE ===
  activeTable: string | null;
  queryHistory: string[];
  currentQuery: string;
  setActiveTable: (table: string | null) => void;
  addQueryToHistory: (query: string) => void;
  setCurrentQuery: (query: string) => void;

  // === MIGRATIONS STATE ===
  migrations: MigrationFile[];
  migrationsLoading: boolean;
  migrationsSummary: MigrationSummary | null;
  migrationRunResults: Record<string, MigrationRunResult>;
  autoApplyMigrations: boolean;
  setMigrations: (migrations: MigrationFile[], summary: MigrationSummary | null) => void;
  setMigrationsLoading: (loading: boolean) => void;
  setMigrationRunResult: (version: string, result: MigrationRunResult) => void;
  clearMigrationRunResult: (version: string) => void;
  setAutoApplyMigrations: (auto: boolean) => void;

  // === DEPLOYMENT STATE ===
  deploymentStatus: 'idle' | 'building' | 'ready' | 'failed';
  selectedDeployment: string | null;
  showDeployLogs: boolean;
  setDeploymentStatus: (status: 'idle' | 'building' | 'ready' | 'failed') => void;
  setSelectedDeployment: (id: string | null) => void;
  setShowDeployLogs: (show: boolean) => void;

  // === ACTIVITY STATE ===
  activities: Activity[];
  activityFilter: 'all' | 'files' | 'terminal' | 'ai' | 'deploy' | 'database';
  activitySearch: string;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  setActivityFilter: (filter: 'all' | 'files' | 'terminal' | 'ai' | 'deploy' | 'database') => void;
  setActivitySearch: (search: string) => void;
  clearActivities: () => void;

  // === COMMAND PALETTE ===
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // === OPERATIONS TRACKING ===
  operations: Operation[];
  operationsPanelOpen: boolean;
  operationsFilter: OperationFilter;
  setOperations: (operations: Operation[]) => void;
  toggleOperationsPanel: () => void;
  setOperationsPanelOpen: (open: boolean) => void;
  setOperationsFilter: (filter: OperationFilter) => void;

  // === COMMAND DICTIONARY ===
  commandDictionaryOpen: boolean;
  commandDictionaryPillar: 'planning' | 'development';
  setCommandDictionaryOpen: (open: boolean) => void;
  setCommandDictionaryPillar: (pillar: 'planning' | 'development') => void;
  openCommandDictionary: (pillar?: 'planning' | 'development') => void;

  // === BACKWARD COMPATIBILITY (Legacy Components) ===
  // These map to the new state structure for old components during migration
  activePane: PaneId;
  setActivePane: (pane: PaneId) => void;
  drawer: {
    height: DrawerHeight;
    tab: DrawerTab;
    activeTab: DrawerTab; // Alias for tab
  };
  setDrawerHeight: (height: DrawerHeight) => void;
  setDrawerTab: (tab: DrawerTab) => void;
  toggleDrawer: () => void;
  expandDrawer: () => void;
  collapseDrawer: () => void;
  // Legacy terminal object
  terminal: {
    isRunning: boolean;
  };
  // Legacy chat object
  chat: {
    unreadCount: number;
    messages: Message[];
    isTyping: boolean;
  };
  addChatMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setChatTyping: (typing: boolean) => void;
  clearChat: () => void;
  // Legacy UI object
  ui: {
    showSettings: boolean;
  };
  // Legacy preview object
  preview: {
    mode: 'local' | 'deployed';
    localPort: number | null;
    deployedUrl: string | null;
  };
  // Legacy editor object
  editor: {
    openFiles: string[];
    activeFile: string | null;
    unsavedChanges: Record<string, string>;
    fileTree: FileNode[];
    expandedFolders: string[];
    fileContents: Record<string, { content: string; sha: string }>;
    isLoadingTree: boolean;
    isLoadingFile: boolean;
    error: string | null;
  };
  setUnsavedChange: (path: string, content: string) => void;
  clearUnsavedChange: (path: string) => void;
  setEditorLoading: (type: 'tree' | 'file', loading: boolean) => void;
  // Legacy database object
  database: {
    activeTable: string | null;
    queryHistory: string[];
    currentQuery: string;
  };

  // === IDE SETTINGS ===
  settings: {
    editorFontSize: number;
    terminalFontSize: number;
    autoSave: boolean;
    hapticFeedback: boolean;
    reducedMotion: boolean;
    theme: 'dark' | 'light' | 'system';
  };
  updateSettings: (updates: Partial<IDEStore['settings']>) => void;

  // === UI STATE ===
  isMobile: boolean;
  showSettings: boolean;
  isOnboardingComplete: boolean;
  setIsMobile: (mobile: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;

  // === INTEGRATIONS ===
  integrations: {
    github: {
      connected: boolean;
      owner: string | null;
      repo: string | null;
      branch: string;
    };
    vercel: {
      connected: boolean;
      projectId: string | null;
      teamId: string | null;
      teamSlug: string | null;
      ownerSlug: string | null;
      projectName: string | null;
    };
    supabase: {
      connected: boolean;
      url: string | null;
      projectId: string | null;
      projectRef: string | null;
      projectName: string | null;
      orgId: string | null;
      orgName: string | null;
    };
    claude: {
      connected: boolean;
      model: string;
    };
  };
  setGitHubConnection: (data: Partial<IDEStore['integrations']['github']>) => void;
  setVercelConnection: (data: Partial<IDEStore['integrations']['vercel']>) => void;
  setSupabaseConnection: (data: Partial<IDEStore['integrations']['supabase']>) => void;
  setClaudeConnection: (data: Partial<IDEStore['integrations']['claude']>) => void;

  // === SESSION ===
  session: {
    id: string | null;
    startedAt: Date | null;
    lastActivity: Date | null;
  };
  initSession: () => void;
  updateActivity: () => void;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  // Desktop pane state - default: Developer + Preview visible (Activity is slide-out, not a pane)
  // Order: Editor(2) -> Database(5) -> Developer(1) -> Preview(4) -> Deployments(6)
  // Pane 3 (Terminal) is hidden - it's now part of the Developer pane
  paneOrder: [2, 5, 1, 4, 6],
  paneVisibility: { 1: true, 2: false, 3: false, 4: true, 5: false, 6: false } as Record<number, boolean>,
  paneWidths: { 1: 350, 2: 500, 3: 400, 4: 400, 5: 350, 6: 350 } as Record<number, number>,
  maxPanesReached: false,
  activityPanelOpen: false,

  // Mobile state
  mobile: {
    mainPane: 'preview' as MobileMainPane,
    bottomZoneHeight: 'half' as BottomZoneHeight,
    bottomZoneTab: 'terminal' as BottomZoneTab,
    chatUnreadCount: 0,
  },

  // Editor state
  activeFile: null as string | null,
  openFiles: [] as string[],
  unsavedFiles: new Set<string>(),
  fileTree: [] as FileNode[],
  fileTreeLoading: false,
  fileTreeCollapsed: false,
  expandedFolders: [] as string[],
  fileContents: {} as Record<string, { content: string; sha: string }>,
  splitView: false,
  editorError: null as string | null,

  // Chat state
  chatMode: 'workspace' as 'terminal' | 'workspace',
  terminalMessages: [] as Message[],
  workspaceMessages: [] as Message[],
  isTyping: false,

  // Chat sessions
  chatSessions: [] as ChatSession[],
  activeChatSessionId: null as string | null,

  // Preview state
  // Default to port 4000 (the IDE/App port) for self-evolving architecture
  previewMode: 'local' as 'local' | 'deployed',
  serverStatus: 'running' as 'stopped' | 'starting' | 'running' | 'error',
  serverPort: 4000 as number | null,
  activePorts: { 4000: { port: 4000, detectedAt: new Date(), source: 'ide' } } as Record<number, PortInfo>,
  selectedPort: 4000 as number | null,
  deployedUrl: null as string | null,

  // Terminal state
  terminalTabs: [] as TerminalTab[],
  activeTabId: null as string | null,
  terminalHistory: [] as string[],

  // Database state
  activeTable: null as string | null,
  queryHistory: [] as string[],
  currentQuery: '',

  // Migrations state
  migrations: [] as MigrationFile[],
  migrationsLoading: false,
  migrationsSummary: null as MigrationSummary | null,
  migrationRunResults: {} as Record<string, MigrationRunResult>,
  autoApplyMigrations: false,

  // Deployment state
  deploymentStatus: 'idle' as 'idle' | 'building' | 'ready' | 'failed',
  selectedDeployment: null as string | null,
  showDeployLogs: false,

  // Activity state
  activities: [] as Activity[],
  activityFilter: 'all' as 'all' | 'files' | 'terminal' | 'ai' | 'deploy' | 'database',
  activitySearch: '',

  // Command palette
  commandPaletteOpen: false,

  // Operations tracking
  operations: [] as Operation[],
  operationsPanelOpen: false,
  operationsFilter: 'all' as OperationFilter,

  // Command dictionary
  commandDictionaryOpen: false,
  commandDictionaryPillar: 'planning' as 'planning' | 'development',

  // Backward compatibility state (legacy components)
  unsavedChanges: {} as Record<string, string>,
  isLoadingTree: false,
  isLoadingFile: false,

  // IDE Settings
  settings: {
    editorFontSize: 14,
    terminalFontSize: 13,
    autoSave: false,
    hapticFeedback: true,
    reducedMotion: false,
    theme: 'dark' as 'dark' | 'light' | 'system',
  },

  // UI state
  isMobile: false,
  showSettings: false,
  isOnboardingComplete: false,

  // Integrations
  integrations: {
    github: {
      connected: false,
      owner: null as string | null,
      repo: null as string | null,
      branch: 'main',
    },
    vercel: {
      connected: false,
      projectId: null as string | null,
      teamId: null as string | null,
      teamSlug: null as string | null,
      ownerSlug: null as string | null,
      projectName: null as string | null,
    },
    supabase: {
      connected: false,
      url: null as string | null,
      projectId: null as string | null,
      projectRef: null as string | null,
      projectName: null as string | null,
      orgId: null as string | null,
      orgName: null as string | null,
    },
    claude: {
      connected: false,
      model: 'claude-sonnet-4-20250514',
    },
  },

  // Session
  session: {
    id: null as string | null,
    startedAt: null as Date | null,
    lastActivity: null as Date | null,
  },
};

// =============================================================================
// STORE
// =============================================================================

export const useIDEStore = create<IDEStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // === PROJECT ISOLATION ===
      resetProjectState: () => set({
        // Sessions
        session: { id: null, startedAt: null, lastActivity: null },
        // Ports - CRITICAL: clear to prevent cross-project port leakage
        activePorts: {},
        selectedPort: null,
        serverPort: null,
        serverStatus: 'stopped',
        // Terminal
        terminalTabs: [],
        activeTabId: null,
        terminalHistory: [],
        // Editor
        activeFile: null,
        openFiles: [],
        unsavedFiles: new Set(),
        fileTree: [],
        fileContents: {},
        // Chat messages
        terminalMessages: [],
        workspaceMessages: [],
        // Chat sessions
        chatSessions: [],
        activeChatSessionId: null,
        // Activities
        activities: [],
        // Deployments
        deploymentStatus: 'idle',
        selectedDeployment: null,
        // Migrations
        migrations: [],
        migrationsSummary: null,
        migrationRunResults: {},
      }),

      // === DESKTOP PANE ACTIONS ===
      togglePane: (pane) => set((state) => {
        const isCurrentlyHidden = !state.paneVisibility[pane];
        if (isCurrentlyHidden) {
          const visibleCount = Object.values(state.paneVisibility).filter(Boolean).length;
          if (visibleCount >= 5) {
            return { maxPanesReached: true };
          }
        }
        return {
          paneVisibility: { ...state.paneVisibility, [pane]: isCurrentlyHidden },
          maxPanesReached: false,
        };
      }),

      setPaneVisibility: (pane, visible) => set((state) => ({
        paneVisibility: { ...state.paneVisibility, [pane]: visible },
      })),

      setPaneWidth: (pane, width) => set((state) => ({
        paneWidths: { ...state.paneWidths, [pane]: width },
      })),

      reorderPanes: (order) => set({ paneOrder: order }),

      setMaxPanesReached: (reached) => set({ maxPanesReached: reached }),

      setActivityPanelOpen: (open) => set({ activityPanelOpen: open }),
      toggleActivityPanel: () => set((state) => ({ activityPanelOpen: !state.activityPanelOpen })),

      // === MOBILE ACTIONS ===
      setMobileMainPane: (pane) => set((state) => ({
        mobile: { ...state.mobile, mainPane: pane },
      })),

      setMobileBottomZoneHeight: (height) => set((state) => ({
        mobile: { ...state.mobile, bottomZoneHeight: height },
      })),

      setMobileBottomZoneTab: (tab) => set((state) => ({
        mobile: {
          ...state.mobile,
          bottomZoneTab: tab,
          chatUnreadCount: tab === 'chat' ? 0 : state.mobile.chatUnreadCount,
        },
      })),

      toggleMobileBottomZone: () => set((state) => ({
        mobile: {
          ...state.mobile,
          bottomZoneHeight: state.mobile.bottomZoneHeight === 'collapsed' ? 'half' : 'collapsed',
        },
      })),

      expandMobileBottomZone: () => set((state) => {
        const order: BottomZoneHeight[] = ['collapsed', 'half', 'expanded', 'fullscreen'];
        const currentIndex = order.indexOf(state.mobile.bottomZoneHeight);
        const nextIndex = Math.min(currentIndex + 1, order.length - 1);
        return { mobile: { ...state.mobile, bottomZoneHeight: order[nextIndex] } };
      }),

      collapseMobileBottomZone: () => set((state) => {
        const order: BottomZoneHeight[] = ['collapsed', 'half', 'expanded', 'fullscreen'];
        const currentIndex = order.indexOf(state.mobile.bottomZoneHeight);
        const prevIndex = Math.max(currentIndex - 1, 0);
        return { mobile: { ...state.mobile, bottomZoneHeight: order[prevIndex] } };
      }),

      incrementMobileChatUnread: () => set((state) => ({
        mobile: {
          ...state.mobile,
          chatUnreadCount: state.mobile.bottomZoneTab === 'chat'
            ? 0
            : state.mobile.chatUnreadCount + 1,
        },
      })),

      clearMobileChatUnread: () => set((state) => ({
        mobile: { ...state.mobile, chatUnreadCount: 0 },
      })),

      // === EDITOR ACTIONS ===
      setActiveFile: (path) => set({ activeFile: path }),

      openFile: (path) => set((state) => ({
        openFiles: state.openFiles.includes(path) ? state.openFiles : [...state.openFiles, path],
        activeFile: path,
      })),

      closeFile: (path) => set((state) => {
        const newOpenFiles = state.openFiles.filter((f) => f !== path);
        const newUnsaved = new Set(state.unsavedFiles);
        newUnsaved.delete(path);
        return {
          openFiles: newOpenFiles,
          unsavedFiles: newUnsaved,
          activeFile: state.activeFile === path ? newOpenFiles[newOpenFiles.length - 1] || null : state.activeFile,
        };
      }),

      markFileUnsaved: (path) => set((state) => {
        const newUnsaved = new Set(state.unsavedFiles);
        newUnsaved.add(path);
        return { unsavedFiles: newUnsaved };
      }),

      markFileSaved: (path) => set((state) => {
        const newUnsaved = new Set(state.unsavedFiles);
        newUnsaved.delete(path);
        return { unsavedFiles: newUnsaved };
      }),

      setFileTree: (tree) => set({ fileTree: tree }),

      setFileTreeLoading: (loading) => set({ fileTreeLoading: loading }),

      setFileTreeCollapsed: (collapsed) => set({ fileTreeCollapsed: collapsed }),

      toggleFolder: (path) => set((state) => ({
        expandedFolders: state.expandedFolders.includes(path)
          ? state.expandedFolders.filter((f) => f !== path)
          : [...state.expandedFolders, path],
      })),

      setFileContent: (path, content, sha) => set((state) => ({
        fileContents: { ...state.fileContents, [path]: { content, sha } },
      })),

      setSplitView: (enabled) => set({ splitView: enabled }),

      setEditorError: (error) => set({ editorError: error }),

      // === CHAT ACTIONS ===
      setChatMode: (mode) => set({ chatMode: mode }),

      addMessage: (mode, message) => {
        const newMessage: Message = {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };
        if (mode === 'terminal') {
          set((state) => ({ terminalMessages: [...state.terminalMessages, newMessage] }));
        } else {
          set((state) => ({ workspaceMessages: [...state.workspaceMessages, newMessage] }));
        }
      },

      updateLastMessage: (modeOrContent, content?) => set((state) => {
        // Support backward compat: single arg = content, defaults to workspace
        let mode: 'terminal' | 'workspace';
        let actualContent: string;

        if (content === undefined) {
          // Single arg: treat as content, default to workspace
          mode = 'workspace';
          actualContent = modeOrContent as string;
        } else {
          // Two args: mode and content
          mode = modeOrContent as 'terminal' | 'workspace';
          actualContent = content;
        }

        const messages = mode === 'terminal' ? [...state.terminalMessages] : [...state.workspaceMessages];
        if (messages.length > 0) {
          messages[messages.length - 1] = { ...messages[messages.length - 1], content: actualContent };
        }
        return mode === 'terminal' ? { terminalMessages: messages } : { workspaceMessages: messages };
      }),

      setIsTyping: (typing) => set({ isTyping: typing }),

      clearMessages: (mode) => set((state) =>
        mode === 'terminal' ? { terminalMessages: [] } : { workspaceMessages: [] }
      ),

      // === CHAT SESSION ACTIONS ===
      addChatSession: (name?) => {
        const currentSessions = get().chatSessions;
        const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Find the highest existing chat number to avoid duplicates
        let maxNumber = 0;
        for (const session of currentSessions) {
          const match = session.name.match(/^Chat (\d+)$/);
          if (match) {
            maxNumber = Math.max(maxNumber, parseInt(match[1], 10));
          }
        }
        const sessionNumber = maxNumber + 1;
        const sessionName = name || `Chat ${sessionNumber}`;

        const newSession: ChatSession = {
          id: sessionId,
          name: sessionName,
          createdAt: new Date(),
          lastActiveAt: new Date(),
          messages: [],
        };

        set((state) => ({
          chatSessions: [...state.chatSessions, newSession],
          activeChatSessionId: sessionId,
        }));

        return sessionId;
      },

      removeChatSession: (sessionId) => {
        // Find the session to get its backend ID before removing
        const session = get().chatSessions.find((s) => s.id === sessionId);
        const backendSessionId = session?.backendSessionId;

        // Update frontend state immediately
        set((state) => {
          const newSessions = state.chatSessions.filter((s) => s.id !== sessionId);
          const newActiveId = state.activeChatSessionId === sessionId
            ? (newSessions[0]?.id ?? null)
            : state.activeChatSessionId;
          return {
            chatSessions: newSessions,
            activeChatSessionId: newActiveId,
          };
        });

        // Kill the backend session asynchronously (fire and forget)
        if (backendSessionId) {
          fetch(`/api/chat/sessions/${encodeURIComponent(backendSessionId)}`, {
            method: 'DELETE',
          }).catch((err) => {
            console.error('[ideStore] Failed to kill backend session:', err);
          });
        }
      },

      setActiveChatSession: (sessionId) => set((state) => {
        // Update lastActiveAt for the session
        const sessions = state.chatSessions.map((s) =>
          s.id === sessionId ? { ...s, lastActiveAt: new Date() } : s
        );
        return {
          chatSessions: sessions,
          activeChatSessionId: sessionId,
        };
      }),

      renameChatSession: (sessionId, name) => set((state) => ({
        chatSessions: state.chatSessions.map((s) =>
          s.id === sessionId ? { ...s, name } : s
        ),
      })),

      updateChatSessionMessages: (sessionId, messages) => set((state) => ({
        chatSessions: state.chatSessions.map((s) =>
          s.id === sessionId
            ? { ...s, messages, lastActiveAt: new Date() }
            : s
        ),
      })),

      clearSessionMessages: (sessionId) => set((state) => ({
        chatSessions: state.chatSessions.map((s) =>
          s.id === sessionId ? { ...s, messages: [] } : s
        ),
      })),

      getActiveSession: () => {
        const state = get();
        return state.chatSessions.find((s) => s.id === state.activeChatSessionId) ?? null;
      },

      setChatSessionBackend: (frontendId, backendSessionId) => set((state) => ({
        chatSessions: state.chatSessions.map((s) =>
          s.id === frontendId
            ? { ...s, backendSessionId, isServerPersistent: true }
            : s
        ),
      })),

      // === PREVIEW ACTIONS ===
      setPreviewMode: (mode) => set({ previewMode: mode }),

      setServerStatus: (status) => set({ serverStatus: status }),

      setServerPort: (port) => set({ serverPort: port }),

      addPort: (port, source, label, tabId) => set((state) => {
        const existing = state.activePorts[port];
        if (existing && source === 'scan' && existing.source === 'terminal') {
          return state;
        }
        return {
          activePorts: {
            ...state.activePorts,
            [port]: { port, detectedAt: new Date(), source, label, tabId },
          },
          selectedPort: state.selectedPort ?? port,
        };
      }),

      removePort: (port) => set((state) => {
        const { [port]: _, ...rest } = state.activePorts;
        const newSelected = state.selectedPort === port
          ? (Object.keys(rest).length > 0 ? parseInt(Object.keys(rest)[0]) : null)
          : state.selectedPort;
        return { activePorts: rest, selectedPort: newSelected };
      }),

      setSelectedPort: (port) => set({ selectedPort: port }),

      syncPortsFromScan: (ports) => set((state) => {
        const IDE_PORT = 4000;
        const portSet = new Set(ports);
        const newPorts = { ...state.activePorts };

        // Remove ports that are no longer detected (except IDE port)
        for (const [p, info] of Object.entries(newPorts)) {
          const portNum = parseInt(p);
          if (info.source === 'scan' && !portSet.has(portNum) && portNum !== IDE_PORT) {
            delete newPorts[portNum];
          }
        }

        // Add newly detected ports
        for (const port of ports) {
          if (!newPorts[port]) {
            newPorts[port] = { port, detectedAt: new Date(), source: 'scan' };
          }
        }

        // Ensure IDE port is always present
        if (!newPorts[IDE_PORT]) {
          newPorts[IDE_PORT] = { port: IDE_PORT, detectedAt: new Date(), source: 'ide' };
        }

        // Keep current selection, or default to IDE port
        const newSelected = state.selectedPort || IDE_PORT;

        return { activePorts: newPorts, selectedPort: newSelected };
      }),

      setDeployedUrl: (url) => set({ deployedUrl: url }),

      // === TERMINAL ACTIONS ===
      addTerminalTab: (tab) => set((state) => {
        const newTabs = [...state.terminalTabs, tab].sort((a, b) => a.index - b.index);
        console.log('[ideStore] addTerminalTab:', {
          tabId: tab.tabId,
          sessionId: tab.sessionId,
          newTabsCount: newTabs.length,
        });
        return {
          terminalTabs: newTabs,
          activeTabId: state.activeTabId ?? tab.tabId,
        };
      }),

      removeTerminalTab: (tabId) => set((state) => {
        const newTabs = state.terminalTabs.filter((t) => t.tabId !== tabId);
        const newActiveTabId = state.activeTabId === tabId
          ? (newTabs[0]?.tabId ?? null)
          : state.activeTabId;
        return { terminalTabs: newTabs, activeTabId: newActiveTabId };
      }),

      setActiveTab: (tabId) => set({ activeTabId: tabId }),

      setTerminalTabs: (tabs) => set({ terminalTabs: tabs }),

      addTerminalHistory: (command) => set((state) => ({
        terminalHistory: [command, ...state.terminalHistory.slice(0, 99)],
      })),

      // === DATABASE ACTIONS ===
      setActiveTable: (table) => set({ activeTable: table }),

      addQueryToHistory: (query) => set((state) => ({
        queryHistory: [query, ...state.queryHistory.slice(0, 49)],
      })),

      setCurrentQuery: (query) => set({ currentQuery: query }),

      // === MIGRATIONS ACTIONS ===
      setMigrations: (migrations, summary) => set({ migrations, migrationsSummary: summary }),

      setMigrationsLoading: (loading) => set({ migrationsLoading: loading }),

      setMigrationRunResult: (version, result) => set((state) => ({
        migrationRunResults: { ...state.migrationRunResults, [version]: result },
      })),

      clearMigrationRunResult: (version) => set((state) => {
        const { [version]: _, ...rest } = state.migrationRunResults;
        return { migrationRunResults: rest };
      }),

      setAutoApplyMigrations: (auto) => set({ autoApplyMigrations: auto }),

      // === DEPLOYMENT ACTIONS ===
      setDeploymentStatus: (status) => set({ deploymentStatus: status }),

      setSelectedDeployment: (id) => set({ selectedDeployment: id }),

      setShowDeployLogs: (show) => set({ showDeployLogs: show }),

      // === ACTIVITY ACTIONS ===
      addActivity: (activity) => set((state) => ({
        activities: [
          { ...activity, id: crypto.randomUUID(), timestamp: new Date() },
          ...state.activities.slice(0, 499),
        ],
      })),

      setActivityFilter: (filter) => set({ activityFilter: filter }),

      setActivitySearch: (search) => set({ activitySearch: search }),

      clearActivities: () => set({ activities: [] }),

      // === COMMAND PALETTE ===
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      // === OPERATIONS TRACKING ===
      setOperations: (operations) => set({ operations }),
      toggleOperationsPanel: () => set((state) => ({ operationsPanelOpen: !state.operationsPanelOpen })),
      setOperationsPanelOpen: (open) => set({ operationsPanelOpen: open }),
      setOperationsFilter: (filter) => set({ operationsFilter: filter }),

      // === COMMAND DICTIONARY ===
      setCommandDictionaryOpen: (open) => set({ commandDictionaryOpen: open }),
      setCommandDictionaryPillar: (pillar) => set({ commandDictionaryPillar: pillar }),
      openCommandDictionary: (pillar) => set({
        commandDictionaryOpen: true,
        ...(pillar && { commandDictionaryPillar: pillar }),
      }),

      // === BACKWARD COMPATIBILITY (Legacy Components) ===
      // Computed activePane - maps mobile mainPane to legacy PaneId
      get activePane(): PaneId {
        const state = get();
        // Defensive check for hydration
        if (!state?.mobile) return 'preview';
        const mainPane = state.mobile.mainPane;
        // Map 'deployments' to 'deploy' for backward compat
        if (mainPane === 'deployments') return 'deploy';
        if (mainPane === 'settings') return 'preview'; // Settings maps to preview
        return mainPane as PaneId;
      },

      setActivePane: (pane: PaneId) => {
        // Map 'deploy' to 'deployments' for new store
        const mappedPane: MobileMainPane = pane === 'deploy' ? 'deployments' : pane;
        set((state) => ({
          mobile: { ...state.mobile, mainPane: mappedPane },
        }));
      },

      // Computed drawer - maps mobile bottom zone state
      get drawer() {
        const state = get();
        // Defensive check for hydration
        if (!state?.mobile) {
          return { height: 'half' as BottomZoneHeight, tab: 'terminal' as BottomZoneTab, activeTab: 'terminal' as BottomZoneTab };
        }
        return {
          height: state.mobile.bottomZoneHeight,
          tab: state.mobile.bottomZoneTab,
          activeTab: state.mobile.bottomZoneTab, // Alias for tab
        };
      },

      setDrawerHeight: (height: DrawerHeight) => set((state) => ({
        mobile: { ...state.mobile, bottomZoneHeight: height },
      })),

      setDrawerTab: (tab: DrawerTab) => set((state) => ({
        mobile: {
          ...state.mobile,
          bottomZoneTab: tab,
          chatUnreadCount: tab === 'chat' ? 0 : state.mobile.chatUnreadCount,
        },
      })),

      toggleDrawer: () => set((state) => ({
        mobile: {
          ...state.mobile,
          bottomZoneHeight: state.mobile.bottomZoneHeight === 'collapsed' ? 'half' : 'collapsed',
        },
      })),

      expandDrawer: () => set((state) => {
        const order: BottomZoneHeight[] = ['collapsed', 'half', 'expanded', 'fullscreen'];
        const currentIndex = order.indexOf(state.mobile.bottomZoneHeight);
        const nextIndex = Math.min(currentIndex + 1, order.length - 1);
        return { mobile: { ...state.mobile, bottomZoneHeight: order[nextIndex] } };
      }),

      collapseDrawer: () => set((state) => {
        const order: BottomZoneHeight[] = ['collapsed', 'half', 'expanded', 'fullscreen'];
        const currentIndex = order.indexOf(state.mobile.bottomZoneHeight);
        const prevIndex = Math.max(currentIndex - 1, 0);
        return { mobile: { ...state.mobile, bottomZoneHeight: order[prevIndex] } };
      }),

      // Computed terminal object for backward compat
      get terminal() {
        const state = get();
        if (!state) return { isRunning: false };
        return {
          isRunning: state.serverStatus === 'running' || state.serverStatus === 'starting',
        };
      },

      // Computed chat object for backward compat
      get chat() {
        const state = get();
        if (!state?.mobile) {
          return { unreadCount: 0, messages: [], isTyping: false };
        }
        return {
          unreadCount: state.mobile.chatUnreadCount,
          messages: state.workspaceMessages ?? [],
          isTyping: state.isTyping ?? false,
        };
      },

      addChatMessage: (message: Omit<Message, 'id' | 'timestamp'>) => {
        const newMessage: Message = {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };
        set((state) => ({ workspaceMessages: [...state.workspaceMessages, newMessage] }));
      },

      setChatTyping: (typing: boolean) => set({ isTyping: typing }),

      clearChat: () => set({ workspaceMessages: [] }),

      // Computed UI object for backward compat
      get ui() {
        const state = get();
        if (!state) return { showSettings: false };
        return {
          showSettings: state.showSettings ?? false,
        };
      },

      // Computed preview object for backward compat
      get preview() {
        const state = get();
        if (!state) return { mode: 'local' as const, localPort: null, deployedUrl: null };
        return {
          mode: state.previewMode ?? 'local',
          localPort: state.serverPort ?? null,
          deployedUrl: state.deployedUrl ?? null,
        };
      },

      // Computed editor object for backward compat
      get editor() {
        const state = get();
        if (!state) {
          return {
            openFiles: [],
            activeFile: null,
            unsavedChanges: {},
            fileTree: [],
            expandedFolders: [],
            fileContents: {},
            isLoadingTree: false,
            isLoadingFile: false,
            error: null,
          };
        }
        return {
          openFiles: state.openFiles ?? [],
          activeFile: state.activeFile ?? null,
          unsavedChanges: state.unsavedChanges ?? {},
          fileTree: state.fileTree ?? [],
          expandedFolders: state.expandedFolders ?? [],
          fileContents: state.fileContents ?? {},
          isLoadingTree: state.isLoadingTree ?? false,
          isLoadingFile: state.isLoadingFile ?? false,
          error: state.editorError ?? null,
        };
      },

      setUnsavedChange: (path: string, content: string) => set((state) => ({
        unsavedChanges: { ...state.unsavedChanges, [path]: content },
      })),

      clearUnsavedChange: (path: string) => set((state) => {
        const { [path]: _, ...rest } = state.unsavedChanges;
        return { unsavedChanges: rest };
      }),

      setEditorLoading: (type: 'tree' | 'file', loading: boolean) => set({
        ...(type === 'tree' ? { isLoadingTree: loading } : { isLoadingFile: loading }),
      }),

      // Computed database object for backward compat
      get database() {
        const state = get();
        if (!state) {
          return { activeTable: null, queryHistory: [], currentQuery: '' };
        }
        return {
          activeTable: state.activeTable ?? null,
          queryHistory: state.queryHistory ?? [],
          currentQuery: state.currentQuery ?? '',
        };
      },

      // === IDE SETTINGS ===
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),

      // === UI ACTIONS ===
      setIsMobile: (mobile) => set({ isMobile: mobile }),

      setShowSettings: (show) => set({ showSettings: show }),

      setOnboardingComplete: (complete) => set({ isOnboardingComplete: complete }),

      // === INTEGRATION ACTIONS ===
      setGitHubConnection: (data) => set((state) => ({
        integrations: {
          ...state.integrations,
          github: { ...state.integrations.github, ...data },
        },
      })),

      setVercelConnection: (data) => set((state) => ({
        integrations: {
          ...state.integrations,
          vercel: { ...state.integrations.vercel, ...data },
        },
      })),

      setSupabaseConnection: (data) => set((state) => ({
        integrations: {
          ...state.integrations,
          supabase: { ...state.integrations.supabase, ...data },
        },
      })),

      setClaudeConnection: (data) => set((state) => ({
        integrations: {
          ...state.integrations,
          claude: { ...state.integrations.claude, ...data },
        },
      })),

      // === SESSION ACTIONS ===
      initSession: () => set((state) => ({
        session: {
          id: state.session.id || crypto.randomUUID(),
          startedAt: state.session.startedAt || new Date(),
          lastActivity: new Date(),
        },
      })),

      updateActivity: () => set((state) => ({
        session: { ...state.session, lastActivity: new Date() },
      })),
    }),
    {
      name: 'local-ide-store-v4',
      partialize: (state) => ({
        // Desktop pane state
        paneOrder: state.paneOrder,
        paneVisibility: state.paneVisibility,
        paneWidths: state.paneWidths,
        // Mobile state
        mobile: state.mobile,
        // Editor (partial)
        openFiles: state.openFiles,
        activeFile: state.activeFile,
        expandedFolders: state.expandedFolders,
        splitView: state.splitView,
        fileTreeCollapsed: state.fileTreeCollapsed,
        // Chat
        chatMode: state.chatMode,
        workspaceMessages: state.workspaceMessages.slice(-50),
        // Chat sessions (CRITICAL for session persistence)
        chatSessions: state.chatSessions.map((s) => ({
          ...s,
          messages: s.messages.slice(-100), // Keep last 100 messages per session
        })),
        activeChatSessionId: state.activeChatSessionId,
        // Preview
        previewMode: state.previewMode,
        // Terminal tabs (CRITICAL for session persistence)
        terminalTabs: state.terminalTabs,
        activeTabId: state.activeTabId,
        // Database
        queryHistory: state.queryHistory.slice(0, 20),
        // Migrations
        autoApplyMigrations: state.autoApplyMigrations,
        // Settings
        settings: state.settings,
        // UI
        isOnboardingComplete: state.isOnboardingComplete,
        // Integrations
        integrations: state.integrations,
        // Session
        session: state.session,
      }),
    }
  )
);

// =============================================================================
// HYDRATION HOOKS
// =============================================================================

// Hook to check if store has been hydrated from localStorage
export function useStoreHydrated() {
  const [hydrated, setHydrated] = useState(() => {
    // Check synchronously on first render
    if (typeof window === 'undefined') return false;
    try {
      return useIDEStore.persist.hasHydrated?.() ?? true;
    } catch {
      return true; // Assume hydrated if API not available
    }
  });

  useEffect(() => {
    // Double-check and subscribe to hydration
    try {
      if (useIDEStore.persist.hasHydrated?.()) {
        setHydrated(true);
        return;
      }

      const unsub = useIDEStore.persist.onFinishHydration?.(() => {
        setHydrated(true);
      });

      // Fallback: if no callback fires within 100ms, assume hydrated
      const timeout = setTimeout(() => setHydrated(true), 100);

      return () => {
        unsub?.();
        clearTimeout(timeout);
      };
    } catch {
      setHydrated(true);
    }
  }, []);

  return hydrated;
}

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

export function useDesktopPanes() {
  return useIDEStore(useShallow((state) => ({
    paneOrder: state.paneOrder,
    paneVisibility: state.paneVisibility,
    paneWidths: state.paneWidths,
    maxPanesReached: state.maxPanesReached,
    togglePane: state.togglePane,
    setPaneVisibility: state.setPaneVisibility,
    setPaneWidth: state.setPaneWidth,
    reorderPanes: state.reorderPanes,
    setMaxPanesReached: state.setMaxPanesReached,
  })));
}

export function useMobileLayout() {
  return useIDEStore(useShallow((state) => ({
    ...state.mobile,
    setMainPane: state.setMobileMainPane,
    setBottomZoneHeight: state.setMobileBottomZoneHeight,
    setBottomZoneTab: state.setMobileBottomZoneTab,
    toggleBottomZone: state.toggleMobileBottomZone,
    expandBottomZone: state.expandMobileBottomZone,
    collapseBottomZone: state.collapseMobileBottomZone,
    incrementChatUnread: state.incrementMobileChatUnread,
    clearChatUnread: state.clearMobileChatUnread,
  })));
}

export function useEditor() {
  return useIDEStore(useShallow((state) => ({
    activeFile: state.activeFile,
    openFiles: state.openFiles,
    unsavedFiles: state.unsavedFiles,
    fileTree: state.fileTree,
    fileTreeLoading: state.fileTreeLoading,
    fileTreeCollapsed: state.fileTreeCollapsed,
    expandedFolders: state.expandedFolders,
    fileContents: state.fileContents,
    splitView: state.splitView,
    error: state.editorError,
    setActiveFile: state.setActiveFile,
    openFile: state.openFile,
    closeFile: state.closeFile,
    markUnsaved: state.markFileUnsaved,
    markSaved: state.markFileSaved,
    setFileTree: state.setFileTree,
    setLoading: state.setFileTreeLoading,
    setCollapsed: state.setFileTreeCollapsed,
    toggleFolder: state.toggleFolder,
    setFileContent: state.setFileContent,
    setSplitView: state.setSplitView,
    setError: state.setEditorError,
  })));
}

export function useChat() {
  return useIDEStore(useShallow((state) => ({
    chatMode: state.chatMode,
    terminalMessages: state.terminalMessages,
    workspaceMessages: state.workspaceMessages,
    isTyping: state.isTyping,
    setChatMode: state.setChatMode,
    addMessage: state.addMessage,
    updateLastMessage: state.updateLastMessage,
    setIsTyping: state.setIsTyping,
    clearMessages: state.clearMessages,
  })));
}

export function useChatSessions() {
  return useIDEStore(useShallow((state) => ({
    sessions: state.chatSessions,
    activeSessionId: state.activeChatSessionId,
    activeSession: state.chatSessions.find((s) => s.id === state.activeChatSessionId) ?? null,
    isTyping: state.isTyping,
    addSession: state.addChatSession,
    removeSession: state.removeChatSession,
    setActiveSession: state.setActiveChatSession,
    renameSession: state.renameChatSession,
    updateMessages: state.updateChatSessionMessages,
    clearMessages: state.clearSessionMessages,
    setIsTyping: state.setIsTyping,
    setBackendSession: state.setChatSessionBackend,
  })));
}

export function usePreview() {
  return useIDEStore(useShallow((state) => ({
    previewMode: state.previewMode,
    serverStatus: state.serverStatus,
    serverPort: state.serverPort,
    activePorts: state.activePorts,
    selectedPort: state.selectedPort,
    deployedUrl: state.deployedUrl,
    setPreviewMode: state.setPreviewMode,
    setServerStatus: state.setServerStatus,
    setServerPort: state.setServerPort,
    addPort: state.addPort,
    removePort: state.removePort,
    setSelectedPort: state.setSelectedPort,
    syncPortsFromScan: state.syncPortsFromScan,
    setDeployedUrl: state.setDeployedUrl,
  })));
}

export function useTerminal() {
  return useIDEStore(useShallow((state) => ({
    terminalTabs: state.terminalTabs,
    activeTabId: state.activeTabId,
    terminalHistory: state.terminalHistory,
    addTab: state.addTerminalTab,
    removeTab: state.removeTerminalTab,
    setActiveTab: state.setActiveTab,
    setTabs: state.setTerminalTabs,
    addHistory: state.addTerminalHistory,
  })));
}

export function useDatabase() {
  return useIDEStore(useShallow((state) => ({
    activeTable: state.activeTable,
    queryHistory: state.queryHistory,
    currentQuery: state.currentQuery,
    setActiveTable: state.setActiveTable,
    addQueryToHistory: state.addQueryToHistory,
    setCurrentQuery: state.setCurrentQuery,
  })));
}

export function useMigrations() {
  return useIDEStore(useShallow((state) => ({
    migrations: state.migrations,
    migrationsLoading: state.migrationsLoading,
    migrationsSummary: state.migrationsSummary,
    migrationRunResults: state.migrationRunResults,
    autoApplyMigrations: state.autoApplyMigrations,
    setMigrations: state.setMigrations,
    setMigrationsLoading: state.setMigrationsLoading,
    setMigrationRunResult: state.setMigrationRunResult,
    clearMigrationRunResult: state.clearMigrationRunResult,
    setAutoApplyMigrations: state.setAutoApplyMigrations,
  })));
}

export function useDeployments() {
  return useIDEStore(useShallow((state) => ({
    deploymentStatus: state.deploymentStatus,
    selectedDeployment: state.selectedDeployment,
    showDeployLogs: state.showDeployLogs,
    setDeploymentStatus: state.setDeploymentStatus,
    setSelectedDeployment: state.setSelectedDeployment,
    setShowDeployLogs: state.setShowDeployLogs,
  })));
}

export function useActivities() {
  return useIDEStore(useShallow((state) => ({
    activities: state.activities,
    filter: state.activityFilter,
    search: state.activitySearch,
    addActivity: state.addActivity,
    setFilter: state.setActivityFilter,
    setSearch: state.setActivitySearch,
    clear: state.clearActivities,
  })));
}

export function useSettings() {
  return useIDEStore(useShallow((state) => ({
    ...state.settings,
    updateSettings: state.updateSettings,
  })));
}

export function useIntegrations() {
  return useIDEStore(useShallow((state) => ({
    github: state.integrations.github,
    vercel: state.integrations.vercel,
    supabase: state.integrations.supabase,
    claude: state.integrations.claude,
    setGitHub: state.setGitHubConnection,
    setVercel: state.setVercelConnection,
    setSupabase: state.setSupabaseConnection,
    setClaude: state.setClaudeConnection,
  })));
}

export function useOperations() {
  return useIDEStore(useShallow((state) => ({
    operations: state.operations,
    panelOpen: state.operationsPanelOpen,
    filter: state.operationsFilter,
    setOperations: state.setOperations,
    togglePanel: state.toggleOperationsPanel,
    setPanelOpen: state.setOperationsPanelOpen,
    setFilter: state.setOperationsFilter,
  })));
}
