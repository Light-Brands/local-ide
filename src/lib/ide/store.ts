import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export type PaneId = 'preview' | 'editor' | 'database' | 'deploy' | 'activity';
export type DrawerHeight = 'collapsed' | 'half' | 'expanded' | 'fullscreen';
export type DrawerTab = 'terminal' | 'chat';

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolUse?: {
    tool: string;
    input: Record<string, unknown>;
    output?: string;
  };
  isStreaming?: boolean;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface IDEState {
  // ============ SESSION ============
  session: {
    id: string | null;
    startedAt: Date | null;
    lastActivity: Date | null;
  };

  // ============ PANE STATE ============
  activePane: PaneId;

  preview: {
    mode: 'local' | 'deployed';
    localPort: number | null;
    deployedUrl: string | null;
  };

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

  database: {
    activeTable: string | null;
    queryHistory: string[];
    currentQuery: string;
  };

  deploy: {
    selectedDeployment: string | null;
    showLogs: boolean;
  };

  activity: {
    filter: 'all' | 'files' | 'terminal' | 'ai' | 'deploy';
    search: string;
  };

  // ============ BOTTOM DRAWER ============
  drawer: {
    height: DrawerHeight;
    activeTab: DrawerTab;
  };

  terminal: {
    history: TerminalLine[];
    currentCommand: string;
    isRunning: boolean;
  };

  chat: {
    messages: ChatMessage[];
    isTyping: boolean;
    unreadCount: number;
  };

  // ============ UI STATE ============
  ui: {
    isMobile: boolean;
    showSettings: boolean;
    isOnboardingComplete: boolean;
  };

  // ============ INTEGRATION STATE ============
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
    };
    supabase: {
      connected: boolean;
      url: string | null;
    };
    claude: {
      connected: boolean;
      model: string;
    };
  };
}

interface IDEActions {
  // Pane actions
  setActivePane: (pane: PaneId) => void;

  // Drawer actions
  setDrawerHeight: (height: DrawerHeight) => void;
  setDrawerTab: (tab: DrawerTab) => void;
  toggleDrawer: () => void;
  expandDrawer: () => void;
  collapseDrawer: () => void;

  // Terminal actions
  addTerminalLine: (line: Omit<TerminalLine, 'id' | 'timestamp'>) => void;
  setCurrentCommand: (command: string) => void;
  setTerminalRunning: (running: boolean) => void;
  clearTerminal: () => void;

  // Chat actions
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateLastMessage: (content: string) => void;
  setChatTyping: (typing: boolean) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
  clearChat: () => void;

  // Editor actions
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string | null) => void;
  setFileTree: (tree: FileNode[]) => void;
  toggleFolder: (path: string) => void;
  setUnsavedChange: (path: string, content: string) => void;
  clearUnsavedChange: (path: string) => void;
  setFileContent: (path: string, content: string, sha: string) => void;
  setEditorLoading: (type: 'tree' | 'file', loading: boolean) => void;
  setEditorError: (error: string | null) => void;

  // Preview actions
  setPreviewMode: (mode: 'local' | 'deployed') => void;
  setLocalPort: (port: number | null) => void;
  setDeployedUrl: (url: string | null) => void;

  // Database actions
  setActiveTable: (table: string | null) => void;
  setCurrentQuery: (query: string) => void;
  addQueryToHistory: (query: string) => void;

  // UI actions
  setIsMobile: (isMobile: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;

  // Integration actions
  setGitHubConnection: (data: Partial<IDEState['integrations']['github']>) => void;
  setVercelConnection: (data: Partial<IDEState['integrations']['vercel']>) => void;
  setSupabaseConnection: (data: Partial<IDEState['integrations']['supabase']>) => void;
  setClaudeConnection: (data: Partial<IDEState['integrations']['claude']>) => void;

  // Session actions
  initSession: () => void;
  updateActivity: () => void;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: IDEState = {
  session: {
    id: null,
    startedAt: null,
    lastActivity: null,
  },

  activePane: 'preview',

  preview: {
    mode: 'local',
    localPort: null,
    deployedUrl: null,
  },

  editor: {
    openFiles: [],
    activeFile: null,
    unsavedChanges: {},
    fileTree: [],
    expandedFolders: [],
    fileContents: {},
    isLoadingTree: false,
    isLoadingFile: false,
    error: null,
  },

  database: {
    activeTable: null,
    queryHistory: [],
    currentQuery: '',
  },

  deploy: {
    selectedDeployment: null,
    showLogs: false,
  },

  activity: {
    filter: 'all',
    search: '',
  },

  drawer: {
    height: 'half',
    activeTab: 'terminal',
  },

  terminal: {
    history: [],
    currentCommand: '',
    isRunning: false,
  },

  chat: {
    messages: [],
    isTyping: false,
    unreadCount: 0,
  },

  ui: {
    isMobile: false,
    showSettings: false,
    isOnboardingComplete: false,
  },

  integrations: {
    github: {
      connected: false,
      owner: null,
      repo: null,
      branch: 'main',
    },
    vercel: {
      connected: false,
      projectId: null,
    },
    supabase: {
      connected: false,
      url: null,
    },
    claude: {
      connected: false,
      model: 'claude-3-opus',
    },
  },
};

// =============================================================================
// STORE
// =============================================================================

export const useIDEStore = create<IDEState & IDEActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ============ PANE ACTIONS ============
      setActivePane: (pane) => set({ activePane: pane }),

      // ============ DRAWER ACTIONS ============
      setDrawerHeight: (height) =>
        set((state) => ({ drawer: { ...state.drawer, height } })),

      setDrawerTab: (tab) =>
        set((state) => ({
          drawer: { ...state.drawer, activeTab: tab },
          chat:
            tab === 'chat'
              ? { ...state.chat, unreadCount: 0 }
              : state.chat,
        })),

      toggleDrawer: () =>
        set((state) => ({
          drawer: {
            ...state.drawer,
            height: state.drawer.height === 'collapsed' ? 'half' : 'collapsed',
          },
        })),

      expandDrawer: () =>
        set((state) => {
          const order: DrawerHeight[] = ['collapsed', 'half', 'expanded', 'fullscreen'];
          const currentIndex = order.indexOf(state.drawer.height);
          const nextIndex = Math.min(currentIndex + 1, order.length - 1);
          return { drawer: { ...state.drawer, height: order[nextIndex] } };
        }),

      collapseDrawer: () =>
        set((state) => {
          const order: DrawerHeight[] = ['collapsed', 'half', 'expanded', 'fullscreen'];
          const currentIndex = order.indexOf(state.drawer.height);
          const nextIndex = Math.max(currentIndex - 1, 0);
          return { drawer: { ...state.drawer, height: order[nextIndex] } };
        }),

      // ============ TERMINAL ACTIONS ============
      addTerminalLine: (line) =>
        set((state) => ({
          terminal: {
            ...state.terminal,
            history: [
              ...state.terminal.history,
              {
                ...line,
                id: crypto.randomUUID(),
                timestamp: new Date(),
              },
            ],
          },
        })),

      setCurrentCommand: (command) =>
        set((state) => ({ terminal: { ...state.terminal, currentCommand: command } })),

      setTerminalRunning: (running) =>
        set((state) => ({ terminal: { ...state.terminal, isRunning: running } })),

      clearTerminal: () =>
        set((state) => ({ terminal: { ...state.terminal, history: [] } })),

      // ============ CHAT ACTIONS ============
      addChatMessage: (message) =>
        set((state) => ({
          chat: {
            ...state.chat,
            messages: [
              ...state.chat.messages,
              {
                ...message,
                id: crypto.randomUUID(),
                timestamp: new Date(),
              },
            ],
          },
        })),

      updateLastMessage: (content) =>
        set((state) => {
          const messages = [...state.chat.messages];
          if (messages.length > 0) {
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              content,
            };
          }
          return { chat: { ...state.chat, messages } };
        }),

      setChatTyping: (typing) =>
        set((state) => ({ chat: { ...state.chat, isTyping: typing } })),

      incrementUnread: () =>
        set((state) => {
          if (state.drawer.activeTab === 'chat') return state;
          return { chat: { ...state.chat, unreadCount: state.chat.unreadCount + 1 } };
        }),

      clearUnread: () =>
        set((state) => ({ chat: { ...state.chat, unreadCount: 0 } })),

      clearChat: () =>
        set((state) => ({ chat: { ...state.chat, messages: [], unreadCount: 0 } })),

      // ============ EDITOR ACTIONS ============
      openFile: (path) =>
        set((state) => ({
          editor: {
            ...state.editor,
            openFiles: state.editor.openFiles.includes(path)
              ? state.editor.openFiles
              : [...state.editor.openFiles, path],
            activeFile: path,
          },
        })),

      closeFile: (path) =>
        set((state) => {
          const openFiles = state.editor.openFiles.filter((f) => f !== path);
          const activeFile =
            state.editor.activeFile === path
              ? openFiles[openFiles.length - 1] || null
              : state.editor.activeFile;
          const unsavedChanges = { ...state.editor.unsavedChanges };
          delete unsavedChanges[path];
          return {
            editor: { ...state.editor, openFiles, activeFile, unsavedChanges },
          };
        }),

      setActiveFile: (path) =>
        set((state) => ({ editor: { ...state.editor, activeFile: path } })),

      setFileTree: (tree) =>
        set((state) => ({ editor: { ...state.editor, fileTree: tree } })),

      toggleFolder: (path) =>
        set((state) => ({
          editor: {
            ...state.editor,
            expandedFolders: state.editor.expandedFolders.includes(path)
              ? state.editor.expandedFolders.filter((f) => f !== path)
              : [...state.editor.expandedFolders, path],
          },
        })),

      setUnsavedChange: (path, content) =>
        set((state) => ({
          editor: {
            ...state.editor,
            unsavedChanges: { ...state.editor.unsavedChanges, [path]: content },
          },
        })),

      clearUnsavedChange: (path) =>
        set((state) => {
          const unsavedChanges = { ...state.editor.unsavedChanges };
          delete unsavedChanges[path];
          return { editor: { ...state.editor, unsavedChanges } };
        }),

      setFileContent: (path, content, sha) =>
        set((state) => ({
          editor: {
            ...state.editor,
            fileContents: {
              ...state.editor.fileContents,
              [path]: { content, sha },
            },
          },
        })),

      setEditorLoading: (type, loading) =>
        set((state) => ({
          editor: {
            ...state.editor,
            isLoadingTree: type === 'tree' ? loading : state.editor.isLoadingTree,
            isLoadingFile: type === 'file' ? loading : state.editor.isLoadingFile,
          },
        })),

      setEditorError: (error) =>
        set((state) => ({
          editor: { ...state.editor, error },
        })),

      // ============ PREVIEW ACTIONS ============
      setPreviewMode: (mode) =>
        set((state) => ({ preview: { ...state.preview, mode } })),

      setLocalPort: (port) =>
        set((state) => ({ preview: { ...state.preview, localPort: port } })),

      setDeployedUrl: (url) =>
        set((state) => ({ preview: { ...state.preview, deployedUrl: url } })),

      // ============ DATABASE ACTIONS ============
      setActiveTable: (table) =>
        set((state) => ({ database: { ...state.database, activeTable: table } })),

      setCurrentQuery: (query) =>
        set((state) => ({ database: { ...state.database, currentQuery: query } })),

      addQueryToHistory: (query) =>
        set((state) => ({
          database: {
            ...state.database,
            queryHistory: [query, ...state.database.queryHistory.slice(0, 49)],
          },
        })),

      // ============ UI ACTIONS ============
      setIsMobile: (isMobile) =>
        set((state) => ({ ui: { ...state.ui, isMobile } })),

      setShowSettings: (show) =>
        set((state) => ({ ui: { ...state.ui, showSettings: show } })),

      setOnboardingComplete: (complete) =>
        set((state) => ({ ui: { ...state.ui, isOnboardingComplete: complete } })),

      // ============ INTEGRATION ACTIONS ============
      setGitHubConnection: (data) =>
        set((state) => ({
          integrations: {
            ...state.integrations,
            github: { ...state.integrations.github, ...data },
          },
        })),

      setVercelConnection: (data) =>
        set((state) => ({
          integrations: {
            ...state.integrations,
            vercel: { ...state.integrations.vercel, ...data },
          },
        })),

      setSupabaseConnection: (data) =>
        set((state) => ({
          integrations: {
            ...state.integrations,
            supabase: { ...state.integrations.supabase, ...data },
          },
        })),

      setClaudeConnection: (data) =>
        set((state) => ({
          integrations: {
            ...state.integrations,
            claude: { ...state.integrations.claude, ...data },
          },
        })),

      // ============ SESSION ACTIONS ============
      initSession: () =>
        set((state) => ({
          session: {
            id: state.session.id || crypto.randomUUID(),
            startedAt: state.session.startedAt || new Date(),
            lastActivity: new Date(),
          },
        })),

      updateActivity: () =>
        set((state) => ({
          session: { ...state.session, lastActivity: new Date() },
        })),
    }),
    {
      name: 'local-ide-store',
      partialize: (state) => ({
        // Persist these fields
        activePane: state.activePane,
        drawer: state.drawer,
        editor: {
          openFiles: state.editor.openFiles,
          activeFile: state.editor.activeFile,
          expandedFolders: state.editor.expandedFolders,
        },
        preview: state.preview,
        database: {
          queryHistory: state.database.queryHistory,
        },
        chat: {
          messages: state.chat.messages,
        },
        terminal: {
          history: state.terminal.history.slice(-100), // Keep last 100 lines
        },
        ui: {
          isOnboardingComplete: state.ui.isOnboardingComplete,
        },
        integrations: state.integrations,
        session: state.session,
      }),
    }
  )
);

// =============================================================================
// HOOKS
// =============================================================================

export function usePane() {
  return useIDEStore((state) => ({
    activePane: state.activePane,
    setActivePane: state.setActivePane,
  }));
}

export function useDrawer() {
  return useIDEStore((state) => ({
    height: state.drawer.height,
    activeTab: state.drawer.activeTab,
    setHeight: state.setDrawerHeight,
    setTab: state.setDrawerTab,
    toggle: state.toggleDrawer,
    expand: state.expandDrawer,
    collapse: state.collapseDrawer,
  }));
}

export function useTerminal() {
  return useIDEStore((state) => ({
    history: state.terminal.history,
    currentCommand: state.terminal.currentCommand,
    isRunning: state.terminal.isRunning,
    addLine: state.addTerminalLine,
    setCommand: state.setCurrentCommand,
    setRunning: state.setTerminalRunning,
    clear: state.clearTerminal,
  }));
}

export function useChat() {
  return useIDEStore((state) => ({
    messages: state.chat.messages,
    isTyping: state.chat.isTyping,
    unreadCount: state.chat.unreadCount,
    addMessage: state.addChatMessage,
    updateLast: state.updateLastMessage,
    setTyping: state.setChatTyping,
    incrementUnread: state.incrementUnread,
    clearUnread: state.clearUnread,
    clear: state.clearChat,
  }));
}

export function useEditor() {
  return useIDEStore((state) => ({
    openFiles: state.editor.openFiles,
    activeFile: state.editor.activeFile,
    fileTree: state.editor.fileTree,
    expandedFolders: state.editor.expandedFolders,
    unsavedChanges: state.editor.unsavedChanges,
    fileContents: state.editor.fileContents,
    isLoadingTree: state.editor.isLoadingTree,
    isLoadingFile: state.editor.isLoadingFile,
    error: state.editor.error,
    open: state.openFile,
    close: state.closeFile,
    setActive: state.setActiveFile,
    setTree: state.setFileTree,
    toggleFolder: state.toggleFolder,
    setUnsaved: state.setUnsavedChange,
    clearUnsaved: state.clearUnsavedChange,
    setFileContent: state.setFileContent,
    setLoading: state.setEditorLoading,
    setError: state.setEditorError,
  }));
}

export function useIntegrations() {
  return useIDEStore((state) => ({
    github: state.integrations.github,
    vercel: state.integrations.vercel,
    supabase: state.integrations.supabase,
    claude: state.integrations.claude,
    setGitHub: state.setGitHubConnection,
    setVercel: state.setVercelConnection,
    setSupabase: state.setSupabaseConnection,
    setClaude: state.setClaudeConnection,
  }));
}
