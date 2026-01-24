# Local-IDE Mobile-First IDE Master Plan

## Executive Summary

Build a **mobile-first, self-aware IDE** at `/ide` that integrates Claude AI, terminal, and a unified view of your entire development stack (GitHub, Vercel, Supabase) into a single interface. The IDE can modify itself, has full awareness of all connected services, and uses a two-zone mobile layout with a collapsible bottom drawer for AI chat and terminal.

**Key Differentiator from Lawless AI**: This is a 1-to-1 system. One GitHub repo, one Vercel project, one Supabase instance, one Claude subscription. No multi-tenancy complexity.

---

## Table of Contents

1. [Vision & Core Concepts](#1-vision--core-concepts)
2. [Architecture Overview](#2-architecture-overview)
3. [Mobile-First UI Design](#3-mobile-first-ui-design)
4. [Service Integrations](#4-service-integrations)
5. [AI & MCP Configuration](#5-ai--mcp-configuration)
6. [Admin Settings Integration](#6-admin-settings-integration)
7. [Session & State Management](#7-session--state-management)
8. [Technical Implementation](#8-technical-implementation)
9. [Database Schema](#9-database-schema)
10. [Implementation Phases](#10-implementation-phases)
11. [Risk Assessment & Mitigations](#11-risk-assessment--mitigations)
12. [Success Criteria](#12-success-criteria)
13. [Open Questions](#13-open-questions)

---

## 1. Vision & Core Concepts

### 1.1 The Self-Aware IDE

This IDE is **aware of everything**:
- Its own source code (can read, modify, and hot-reload itself)
- The database schema and live data (Supabase)
- Deployment state and logs (Vercel)
- Repository structure and git state (GitHub)
- User's Claude AI conversation history

**The AI can literally build new features for itself** while you watch, then hot-reload to make them immediately available.

### 1.2 The 1-to-1 Model

Unlike Lawless AI's multi-tenant architecture, Local-IDE uses a simplified model:

| Resource | Lawless AI | Local-IDE |
|----------|-----------|-----------|
| GitHub Repos | Many per user | **One** (this repo) |
| Vercel Projects | Many per user | **One** (this project) |
| Supabase Instances | Many per user | **One** (this database) |
| Claude Account | Per session | **One** subscription |
| Sessions | Multiple concurrent | **One** active workspace |

This dramatically simplifies:
- No resource selection UIs
- No session isolation complexity
- No multi-tenant database design
- Direct file system access
- Simpler state management

### 1.3 Mobile-First Philosophy

**Design for mobile, enhance for desktop**:
- Touch-first interactions
- Bottom-up drawer pattern (natural thumb reach)
- Single-pane focus with quick-switch navigation
- Keyboard optional, not required
- Works offline for viewing (queues actions for sync)

### 1.4 Core User Flows

```
┌─────────────────────────────────────────────────────────────┐
│                     PRIMARY USER FLOWS                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. CODE FROM ANYWHERE                                      │
│     Phone → /ide → Swipe up chat → "Add dark mode" →       │
│     Watch AI edit files → See preview update instantly      │
│                                                             │
│  2. DIAGNOSE PRODUCTION ISSUES                              │
│     Alert on phone → Open /ide → See error in Activity →   │
│     AI has context → "Fix this error" → Deploy fix         │
│                                                             │
│  3. DATABASE MANAGEMENT                                     │
│     Phone → Database pane → View/edit rows →               │
│     Run SQL queries → Schema exploration                    │
│                                                             │
│  4. DEPLOYMENT CONTROL                                      │
│     Phone → Deployments pane → View status →               │
│     Rollback if needed → Check logs                         │
│                                                             │
│  5. IDE SELF-IMPROVEMENT                                    │
│     "Add a button to export this data" → AI creates it →   │
│     Hot reload → New feature appears immediately            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Overview

### 2.1 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER'S BROWSER                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         /ide (React SPA)                               │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │  │  Preview │ │  Editor  │ │ Database │ │  Deploy  │ │ Activity │    │  │
│  │  │   Pane   │ │   Pane   │ │   Pane   │ │   Pane   │ │   Pane   │    │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │  │
│  │                                                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Bottom Drawer (Swipe Up)                      │  │  │
│  │  │   ┌─────────────────────┬─────────────────────┐                 │  │  │
│  │  │   │      Terminal       │      AI Chat        │                 │  │  │
│  │  │   │   (Claude CLI)      │   (Conversation)    │                 │  │  │
│  │  │   └─────────────────────┴─────────────────────┘                 │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
           ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
           │   Next.js    │  │    Claude    │  │     MCP      │
           │   API Routes │  │     CLI      │  │   Servers    │
           │   /api/*     │  │   (Local)    │  │              │
           └──────────────┘  └──────────────┘  └──────────────┘
                    │                 │                 │
                    │                 │                 │
                    ▼                 ▼                 ▼
    ┌───────────────────────────────────────────────────────────────┐
    │                     EXTERNAL SERVICES                          │
    │  ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
    │  │  GitHub  │    │  Vercel  │    │ Supabase │                 │
    │  │   API    │    │   API    │    │   API    │                 │
    │  └──────────┘    └──────────┘    └──────────┘                 │
    └───────────────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

```
/src
├── app/
│   ├── ide/                           # Main IDE route
│   │   ├── page.tsx                   # IDE entry point
│   │   ├── layout.tsx                 # IDE layout (no admin chrome)
│   │   └── components/
│   │       ├── IDELayout.tsx          # Responsive layout switcher
│   │       ├── MobileIDELayout.tsx    # Mobile two-zone layout
│   │       ├── DesktopIDELayout.tsx   # Desktop multi-pane layout
│   │       │
│   │       ├── panes/
│   │       │   ├── PreviewPane.tsx    # Browser preview iframe
│   │       │   ├── EditorPane.tsx     # File browser + code editor
│   │       │   ├── DatabasePane.tsx   # Supabase table viewer/editor
│   │       │   ├── DeployPane.tsx     # Vercel deployments
│   │       │   └── ActivityPane.tsx   # Activity timeline + logs
│   │       │
│   │       ├── bottom-drawer/
│   │       │   ├── BottomDrawer.tsx   # Collapsible drawer container
│   │       │   ├── DrawerToggle.tsx   # Terminal ↔ Chat toggle
│   │       │   ├── TerminalView.tsx   # Terminal emulator
│   │       │   └── ChatView.tsx       # AI conversation UI
│   │       │
│   │       ├── navigation/
│   │       │   ├── MobileNav.tsx      # Bottom tab navigation
│   │       │   ├── MobileHeader.tsx   # Minimal header
│   │       │   └── PaneSelector.tsx   # Pane switching logic
│   │       │
│   │       └── shared/
│   │           ├── FileTree.tsx       # Reusable file browser
│   │           ├── CodeEditor.tsx     # Monaco/CodeMirror wrapper
│   │           ├── DataTable.tsx      # Generic data table
│   │           └── DiffViewer.tsx     # Code diff display
│   │
│   ├── (admin)/admin/
│   │   └── settings/
│   │       └── development/           # NEW: Development settings
│   │           ├── page.tsx           # Main dev settings page
│   │           ├── github/            # GitHub OAuth + settings
│   │           ├── vercel/            # Vercel OAuth + settings
│   │           ├── supabase/          # Supabase connection
│   │           ├── claude/            # Claude CLI config
│   │           └── mcp/               # MCP server configuration
│   │
│   └── api/
│       ├── ide/
│       │   ├── session/route.ts       # Session CRUD
│       │   ├── files/route.ts         # File operations
│       │   └── terminal/route.ts      # Terminal WebSocket
│       │
│       ├── integrations/
│       │   ├── github/
│       │   │   ├── oauth/route.ts     # GitHub OAuth callback
│       │   │   ├── repo/route.ts      # Repo info
│       │   │   └── contents/route.ts  # File contents
│       │   ├── vercel/
│       │   │   ├── oauth/route.ts     # Vercel OAuth callback
│       │   │   ├── deployments/route.ts
│       │   │   └── logs/route.ts
│       │   └── supabase/
│       │       ├── tables/route.ts    # Table listing
│       │       ├── query/route.ts     # SQL execution
│       │       └── schema/route.ts    # Schema introspection
│       │
│       └── mcp/
│           └── [...path]/route.ts     # MCP server proxy
│
├── lib/
│   ├── ide/
│   │   ├── store.ts                   # Zustand IDE state store
│   │   ├── hooks/
│   │   │   ├── useIDE.ts              # Main IDE hook
│   │   │   ├── useTerminal.ts         # Terminal management
│   │   │   ├── useChat.ts             # AI chat state
│   │   │   ├── usePanes.ts            # Pane visibility/state
│   │   │   └── useMobileLayout.ts     # Mobile-specific logic
│   │   └── services/
│   │       ├── file-service.ts        # File operations
│   │       ├── terminal-service.ts    # Terminal communication
│   │       └── session-service.ts     # Session persistence
│   │
│   └── integrations/
│       ├── github.ts                  # GitHub API wrapper
│       ├── vercel.ts                  # Vercel API wrapper
│       ├── supabase-admin.ts          # Supabase management API
│       └── claude.ts                  # Claude CLI interface
│
└── components/
    └── ide/                           # Shared IDE components
        ├── ToolCard.tsx               # Tool invocation display
        ├── MessageBubble.tsx          # Chat message component
        └── StatusIndicator.tsx        # Loading/success/error states
```

### 2.3 State Management Architecture

```typescript
// lib/ide/store.ts - Zustand store structure

interface IDEStore {
  // ============ SESSION STATE ============
  session: {
    id: string;
    startedAt: Date;
    lastActivity: Date;
  };

  // ============ PANE STATE ============
  panes: {
    activePane: 'preview' | 'editor' | 'database' | 'deploy' | 'activity';

    preview: {
      mode: 'local' | 'deployed';
      localPort: number | null;
      deployedUrl: string | null;
    };

    editor: {
      openFiles: string[];
      activeFile: string | null;
      unsavedChanges: Map<string, string>;
      fileTreeExpanded: string[];
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
  };

  // ============ BOTTOM DRAWER STATE ============
  drawer: {
    height: 'collapsed' | 'half' | 'expanded' | 'fullscreen';
    activeTab: 'terminal' | 'chat';

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
      teamId: string | null;
    };

    supabase: {
      connected: boolean;
      url: string | null;
      tables: string[];
    };

    claude: {
      connected: boolean;
      model: string;
    };
  };

  // ============ UI STATE ============
  ui: {
    isMobile: boolean;
    theme: 'light' | 'dark';
    showSettings: boolean;
  };

  // ============ ACTIONS ============
  actions: {
    // Pane actions
    setActivePane: (pane: PaneId) => void;

    // Drawer actions
    setDrawerHeight: (height: DrawerHeight) => void;
    setDrawerTab: (tab: 'terminal' | 'chat') => void;
    toggleDrawer: () => void;

    // Terminal actions
    executeCommand: (command: string) => Promise<void>;
    clearTerminal: () => void;

    // Chat actions
    sendMessage: (message: string) => Promise<void>;
    clearChat: () => void;

    // Editor actions
    openFile: (path: string) => Promise<void>;
    saveFile: (path: string) => Promise<void>;
    closeFile: (path: string) => void;

    // Session actions
    saveSession: () => Promise<void>;
    loadSession: () => Promise<void>;
  };
}
```

---

## 3. Mobile-First UI Design

### 3.1 Two-Zone Mobile Layout

The mobile interface is divided into two zones:

1. **Main Pane (Top)**: Content viewing area
2. **Bottom Drawer**: Terminal + AI Chat (swipeable)

```
┌─────────────────────────────────────┐
│  🏠 local-ide          main ▼  ≡   │  ← Header: repo, branch, menu
├─────────────────────────────────────┤
│                                     │
│                                     │
│         MAIN PANE AREA              │  ← Preview (default)
│                                     │     Editor, Database,
│     (swipe left/right to switch)    │     Deploy, Activity
│                                     │
│                                     │
├─────────────────────────────────────┤
│  ▲  ⌨️ Terminal  ═══╤═══  💬 Chat   │  ← Swipe up handle + toggle
├─────────────────────────────────────┤
│  $ claude                           │
│  > Starting Claude...               │  ← Active bottom zone content
│  $ _                                │
├─────────────────────────────────────┤
│  👁️  📝  🗄️  🚀  📋               │  ← Bottom nav (pane switcher)
└─────────────────────────────────────┘
     ↑    ↑    ↑    ↑    ↑
  Preview Edit DB Deploy Activity
```

### 3.2 Bottom Drawer States

**Collapsed** (viewing mode):
```
┌─────────────────────────────────────┐
│  Header                             │
├─────────────────────────────────────┤
│                                     │
│                                     │
│     Preview / Main Pane             │
│     (Nearly Full Height)            │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  ▲  ⌨️ Terminal  ═╤═  💬 Chat (2)  │  ← Just the toggle bar
├─────────────────────────────────────┤
│  👁️  📝  🗄️  🚀  📋               │
└─────────────────────────────────────┘
```

**Half** (balanced):
```
┌─────────────────────────────────────┐
│  Header                             │
├─────────────────────────────────────┤
│                                     │
│     Preview (50%)                   │
│                                     │
├─────────────────────────────────────┤
│  ▼  ⌨️ Terminal  ═╤═  💬 Chat      │
├─────────────────────────────────────┤
│  $ npm run dev                      │
│  > Ready on :3000                   │
│  $ _                                │
├─────────────────────────────────────┤
│ Tab │ Esc │ ⌃C │ ↑ │ ↓ │ Clear    │  ← Keyboard helpers
├─────────────────────────────────────┤
│  👁️  📝  🗄️  🚀  📋               │
└─────────────────────────────────────┘
```

**Expanded** (input focused):
```
┌─────────────────────────────────────┐
│  Header                             │
├─────────────────────────────────────┤
│  Preview (minimized)           ▼    │
├─────────────────────────────────────┤
│  ▼  ⌨️ Terminal  ═╤═  💬 Chat      │
├─────────────────────────────────────┤
│                                     │
│     Terminal or Chat                │
│     (70% height)                    │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ Tab │ Esc │ ⌃C │ ↑ │ ↓ │ Clear    │
├─────────────────────────────────────┤
│  👁️  📝  🗄️  🚀  📋               │
└─────────────────────────────────────┘
```

**Fullscreen** (immersive):
```
┌─────────────────────────────────────┐
│  Header                    ✕ Close  │
├─────────────────────────────────────┤
│  ▼  ⌨️ Terminal  ═╤═  💬 Chat      │
├─────────────────────────────────────┤
│                                     │
│                                     │
│     Terminal or Chat                │
│     (Full Screen)                   │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ Tab │ Esc │ ⌃C │ ⌃D │ ↑ │ ↓      │
└─────────────────────────────────────┘
```

### 3.3 Gesture Controls

| Gesture | Location | Action |
|---------|----------|--------|
| Swipe up | Drawer handle | Expand drawer (collapsed→half→expanded→fullscreen) |
| Swipe down | Drawer handle | Collapse drawer |
| Tap | Terminal/Chat toggle | Switch between terminal and chat |
| Double-tap | Drawer handle | Toggle fullscreen |
| Swipe left | Main pane | Next pane in navigation order |
| Swipe right | Main pane | Previous pane |
| Long-press | Bottom nav item | Quick actions for that pane |
| Pinch | Preview pane | Zoom in/out |

### 3.4 Mobile Navigation Bar

The bottom navigation controls the **main pane only** (not the drawer):

| Icon | Pane | Description |
|------|------|-------------|
| 👁️ | Preview | Browser preview of running app |
| 📝 | Editor | File browser + code editor |
| 🗄️ | Database | Supabase tables, rows, SQL |
| 🚀 | Deploy | Vercel deployments, logs |
| 📋 | Activity | Event timeline, errors, logs |

### 3.5 Desktop Enhancement

On desktop (≥1024px), the layout expands:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  🏠 local-ide    main ▼         [⌘K] Command Palette         Settings    👤      │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────┐  ┌────────────────────────────────────────────────┐ │
│  │                        │  │                                                │ │
│  │     File Tree          │  │            Code Editor                         │ │
│  │     (Collapsible)      │  │            (Monaco)                            │ │
│  │                        │  │                                                │ │
│  │                        │  │                                                │ │
│  └────────────────────────┘  └────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │    👁️ Preview  │  🗄️ Database  │  🚀 Deploy  │  📋 Activity              │ │
│  ├────────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                            │ │
│  │                    Preview / Database / Deploy Pane                        │ │
│  │                                                                            │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │   ⌨️ Terminal  │  💬 Chat                                         ▲ ▼ ✕   │ │
│  ├────────────────────────────────────────────────────────────────────────────┤ │
│  │  $ claude                                                                  │ │
│  │  > Ready                                                                   │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Service Integrations

### 4.1 GitHub Integration

**Purpose**: Repository access, file operations, git commands

**OAuth Flow**:
1. User clicks "Connect GitHub" in Admin → Settings → Development → GitHub
2. Redirect to GitHub OAuth with scopes: `repo`, `read:user`
3. Callback saves access token encrypted in Supabase
4. IDE uses token for API calls

**Features**:
- Read repository contents
- Create/update files via commits
- Branch management
- Pull request creation
- Webhook for push events (triggers hot reload)

**API Wrapper** (`/lib/integrations/github.ts`):
```typescript
class GitHubService {
  async getRepoContents(path: string): Promise<FileNode[]>
  async getFileContent(path: string): Promise<string>
  async updateFile(path: string, content: string, message: string): Promise<void>
  async createBranch(name: string, fromRef: string): Promise<void>
  async createPR(title: string, body: string, head: string, base: string): Promise<void>
  async getCommits(limit: number): Promise<Commit[]>
}
```

### 4.2 Vercel Integration

**Purpose**: Deployment management, logs, environment variables

**OAuth Flow**:
1. User clicks "Connect Vercel" in Admin → Settings → Development → Vercel
2. Redirect to Vercel OAuth with scopes: `read`, `write`
3. Callback saves access token encrypted in Supabase
4. IDE queries for deployments

**Features**:
- List deployments with status
- View build logs (streaming)
- Trigger redeployment
- Rollback to previous deployment
- Environment variable management
- Domain configuration

**API Wrapper** (`/lib/integrations/vercel.ts`):
```typescript
class VercelService {
  async getDeployments(): Promise<Deployment[]>
  async getDeployment(id: string): Promise<DeploymentDetail>
  async getBuildLogs(deploymentId: string): AsyncGenerator<LogLine>
  async redeploy(deploymentId: string): Promise<Deployment>
  async rollback(deploymentId: string): Promise<void>
  async getEnvVars(): Promise<EnvVar[]>
  async setEnvVar(key: string, value: string, target: string[]): Promise<void>
}
```

### 4.3 Supabase Integration

**Purpose**: Database management, schema exploration, CRUD operations

**Connection Method**:
1. User enters Supabase URL and service role key in Admin → Settings → Development → Supabase
2. Credentials encrypted and stored
3. IDE uses management API for schema, client API for data

**Features**:
- Table listing with row counts
- Schema introspection (columns, types, relationships)
- Data viewer with pagination
- Inline row editing (CRUD)
- SQL query editor with history
- Migration status
- Realtime subscriptions for live updates

**API Wrapper** (`/lib/integrations/supabase-admin.ts`):
```typescript
class SupabaseAdminService {
  async getTables(): Promise<Table[]>
  async getTableSchema(tableName: string): Promise<Column[]>
  async getRows(tableName: string, options: QueryOptions): Promise<Row[]>
  async insertRow(tableName: string, data: Record<string, any>): Promise<Row>
  async updateRow(tableName: string, id: string, data: Record<string, any>): Promise<Row>
  async deleteRow(tableName: string, id: string): Promise<void>
  async executeSQL(query: string): Promise<QueryResult>
  async getMigrations(): Promise<Migration[]>
}
```

### 4.4 Claude CLI Integration

**Purpose**: AI-powered coding assistant via local Claude CLI

**Connection Method**:
1. User has Claude Max subscription with CLI access
2. User configures Claude CLI path in Admin → Settings → Development → Claude
3. IDE spawns Claude CLI process and communicates via stdio

**Features**:
- Full Claude Code capabilities
- Tool use (Read, Write, Edit, Bash, Glob, Grep)
- Conversation persistence
- Context injection (file contents, errors, schema)
- MCP server access

**Process Management** (`/lib/integrations/claude.ts`):
```typescript
class ClaudeCLIService {
  private process: ChildProcess | null;

  async start(): Promise<void>
  async sendMessage(message: string): AsyncGenerator<StreamEvent>
  async stop(): Promise<void>

  // Context injection
  async injectContext(context: IDEContext): Promise<void>
}

interface StreamEvent {
  type: 'text' | 'tool_use' | 'tool_result' | 'thinking';
  content?: string;
  tool?: ToolInvocation;
}
```

---

## 5. AI & MCP Configuration

### 5.1 MCP Server Architecture

MCP (Model Context Protocol) servers give Claude real-time access to external data:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLAUDE CLI                                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     MCP CONNECTIONS                         │ │
│  │                                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │   GitHub     │  │   Vercel     │  │  Supabase    │     │ │
│  │  │  MCP Server  │  │  MCP Server  │  │  MCP Server  │     │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │ │
│  │         │                 │                 │               │ │
│  └─────────┼─────────────────┼─────────────────┼───────────────┘ │
│            │                 │                 │                  │
└────────────┼─────────────────┼─────────────────┼──────────────────┘
             │                 │                 │
             ▼                 ▼                 ▼
      ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
      │   GitHub     │  │   Vercel     │  │  Supabase    │
      │     API      │  │     API      │  │     API      │
      └──────────────┘  └──────────────┘  └──────────────┘
```

### 5.2 MCP Server Configurations

Each integration has its own MCP server config:

**GitHub MCP** (`.mcp/github.json`):
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

**Supabase MCP** (`.mcp/supabase.json`):
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_KEY": "${SUPABASE_SERVICE_KEY}"
      }
    }
  }
}
```

**Filesystem MCP** (for self-editing):
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/local-ide"],
      "env": {}
    }
  }
}
```

### 5.3 AI Context Injection

The AI always has access to contextual information:

```typescript
interface AIContext {
  // Current workspace state
  workspace: {
    openFiles: string[];
    activeFile: string | null;
    unsavedChanges: string[];
  };

  // Recent activity
  activity: {
    lastError: Error | null;
    recentCommands: string[];
    recentFiles: string[];
  };

  // Integration state
  integrations: {
    github: {
      currentBranch: string;
      uncommittedChanges: string[];
    };
    vercel: {
      lastDeployment: Deployment | null;
      hasErrors: boolean;
    };
    supabase: {
      recentQueries: string[];
      lastMigration: Migration | null;
    };
  };

  // IDE-specific (for self-modification)
  ide: {
    currentRoute: string;
    availableComponents: string[];
    designTokens: DesignTokens;
  };
}
```

### 5.4 AI Self-Modification Protocol

For the IDE to modify itself:

1. **Context Awareness**: AI knows the IDE's own structure via filesystem MCP
2. **Safe Editing**: All edits go through git with automatic commit
3. **Hot Reload**: Next.js Fast Refresh detects changes and updates UI
4. **Rollback**: If something breaks, git revert to previous state

```typescript
// Self-modification flow
async function handleSelfModification(change: CodeChange) {
  // 1. Validate change doesn't break critical paths
  const validation = await validateChange(change);
  if (!validation.safe) {
    throw new Error(`Unsafe modification: ${validation.reason}`);
  }

  // 2. Apply change via git
  await github.updateFile(change.path, change.content, `AI: ${change.description}`);

  // 3. Wait for hot reload
  await waitForHotReload();

  // 4. Verify change worked
  const verification = await verifyChange(change);
  if (!verification.success) {
    // Auto-rollback
    await github.revert(change.commitSha);
    throw new Error(`Change verification failed: ${verification.error}`);
  }
}
```

---

## 6. Admin Settings Integration

### 6.1 Development Settings Section

New admin route: `/admin/settings/development`

```
Admin Dashboard
├── Dashboard
├── Users
├── Analytics
├── Feedback
├── Settings
│   ├── General
│   ├── Appearance
│   └── Development ← NEW
│       ├── Overview (connection status)
│       ├── GitHub
│       ├── Vercel
│       ├── Supabase
│       ├── Claude
│       └── MCP Servers
└── Developer Tools (existing)
```

### 6.2 Settings Pages

**Overview** (`/admin/settings/development`):
- Connection status cards for each service
- Quick connect/disconnect buttons
- Health check indicators
- Link to /ide

**GitHub Settings** (`/admin/settings/development/github`):
- OAuth connect button
- Connected account info (avatar, username)
- Repository selection (for 1-to-1 mapping)
- Branch configuration
- Webhook setup

**Vercel Settings** (`/admin/settings/development/vercel`):
- OAuth connect button
- Connected team/account info
- Project selection
- Environment variable overview
- Deployment notifications toggle

**Supabase Settings** (`/admin/settings/development/supabase`):
- URL input
- Service role key input (encrypted storage)
- Connection test button
- Database stats (tables, rows)
- Realtime toggle

**Claude Settings** (`/admin/settings/development/claude`):
- CLI path configuration
- Model selection (claude-3-opus, claude-3-sonnet, etc.)
- Default context settings
- API key (if using API instead of CLI)

**MCP Servers** (`/admin/settings/development/mcp`):
- List of configured MCP servers
- Enable/disable toggles
- Add custom MCP server
- Connection status indicators

### 6.3 Settings Data Model

```typescript
interface DevelopmentSettings {
  github: {
    accessToken: string; // Encrypted
    owner: string;
    repo: string;
    defaultBranch: string;
    webhookSecret: string;
  } | null;

  vercel: {
    accessToken: string; // Encrypted
    teamId: string | null;
    projectId: string;
  } | null;

  supabase: {
    url: string;
    serviceKey: string; // Encrypted
    anonKey: string;
  } | null;

  claude: {
    mode: 'cli' | 'api';
    cliPath: string;
    apiKey: string | null; // Encrypted
    model: string;
    maxTokens: number;
  };

  mcp: {
    servers: MCPServerConfig[];
    autoConnect: boolean;
  };
}
```

---

## 7. Session & State Management

### 7.1 Session Persistence

Sessions are stored in Supabase and restored on page load:

```typescript
interface IDESession {
  id: string;
  userId: string;

  // Timestamps
  createdAt: Date;
  lastActiveAt: Date;

  // Pane state
  activePaneId: string;
  paneStates: Record<string, PaneState>;

  // Drawer state
  drawerHeight: DrawerHeight;
  drawerTab: 'terminal' | 'chat';

  // Editor state
  openFiles: string[];
  activeFile: string | null;
  unsavedChanges: Record<string, string>;
  cursorPositions: Record<string, CursorPosition>;

  // Terminal state
  terminalHistory: TerminalLine[];
  terminalScrollPosition: number;

  // Chat state
  chatMessages: ChatMessage[];
  chatScrollPosition: number;

  // Activity state
  activityFilter: string;
  activitySearch: string;
}
```

### 7.2 Auto-Save Strategy

```typescript
// Save triggers
const SAVE_TRIGGERS = {
  // Debounced saves (500ms after last change)
  FILE_CONTENT_CHANGE: 'debounce',
  CURSOR_POSITION_CHANGE: 'debounce',
  SCROLL_POSITION_CHANGE: 'debounce',

  // Immediate saves
  FILE_OPEN: 'immediate',
  FILE_CLOSE: 'immediate',
  PANE_SWITCH: 'immediate',
  DRAWER_STATE_CHANGE: 'immediate',

  // Periodic saves (every 30s)
  HEARTBEAT: 'periodic',

  // Before unload
  PAGE_UNLOAD: 'immediate',
};
```

### 7.3 Offline Support

```typescript
// Offline queue for actions that require network
interface OfflineQueue {
  actions: QueuedAction[];

  add(action: QueuedAction): void;
  process(): Promise<void>;
  clear(): void;
}

interface QueuedAction {
  id: string;
  type: 'file_save' | 'terminal_command' | 'chat_message';
  payload: any;
  createdAt: Date;
  retryCount: number;
}
```

---

## 8. Technical Implementation

### 8.1 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 15 (App Router) | Already using, RSC support |
| UI | React 19 + Tailwind CSS 4 | Already using, design system ready |
| State | Zustand | Simple, TypeScript-first |
| Terminal | xterm.js | Industry standard, mobile support |
| Editor | Monaco / CodeMirror 6 | Monaco for desktop, CM6 for mobile |
| Database | Supabase | Already integrated |
| Realtime | Supabase Realtime | Live updates |
| Auth | Supabase Auth | Already integrated |
| Animations | Framer Motion | Already using |
| Gestures | @use-gesture/react | Touch handling |

### 8.2 Key Technical Decisions

**1. Terminal Implementation**
- Use xterm.js for terminal emulation
- WebSocket connection to backend for PTY
- Local Claude CLI process spawned per session
- Keyboard toolbar for mobile (Tab, Esc, Ctrl+C, arrows)

**2. Code Editor**
- Monaco Editor for desktop (full VS Code experience)
- CodeMirror 6 for mobile (better touch, smaller bundle)
- Dynamic import based on device detection
- Shared state layer for both editors

**3. Hot Reload for Self-Modification**
- Next.js Fast Refresh handles .tsx/.ts changes
- CSS changes via Tailwind hot reload
- WebSocket notification from file watcher
- Auto-refresh fallback if HMR fails

**4. Real-time Updates**
- Supabase Realtime for database changes
- Server-Sent Events for deployment logs
- WebSocket for terminal output
- Polling fallback for environments without WebSocket

### 8.3 Performance Considerations

```typescript
// Lazy loading strategy
const PreviewPane = dynamic(() => import('./panes/PreviewPane'), {
  loading: () => <PaneSkeleton />,
});

const DatabasePane = dynamic(() => import('./panes/DatabasePane'), {
  loading: () => <PaneSkeleton />,
});

// Only load Monaco on desktop
const CodeEditor = dynamic(
  () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return import('./editors/MonacoEditor');
    }
    return import('./editors/CodeMirrorEditor');
  },
  { ssr: false }
);
```

### 8.4 Security Considerations

1. **Token Storage**: All OAuth tokens encrypted at rest in Supabase
2. **API Proxying**: External API calls go through Next.js API routes (no tokens in browser)
3. **CSRF Protection**: Built into Next.js
4. **Input Sanitization**: SQL queries sanitized before execution
5. **File Access**: Scoped to repository root, no escape to system files
6. **Rate Limiting**: API routes rate-limited to prevent abuse

---

## 9. Database Schema

### 9.1 New Tables

```sql
-- IDE Sessions
CREATE TABLE ide_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),

  -- Pane state (JSONB for flexibility)
  active_pane TEXT DEFAULT 'preview',
  pane_states JSONB DEFAULT '{}',

  -- Drawer state
  drawer_height TEXT DEFAULT 'half',
  drawer_tab TEXT DEFAULT 'terminal',

  -- Editor state
  open_files TEXT[] DEFAULT '{}',
  active_file TEXT,
  unsaved_changes JSONB DEFAULT '{}',
  cursor_positions JSONB DEFAULT '{}',

  -- Terminal state
  terminal_history JSONB DEFAULT '[]',

  -- Chat state
  chat_messages JSONB DEFAULT '[]',

  -- Indexes
  CONSTRAINT valid_drawer_height CHECK (drawer_height IN ('collapsed', 'half', 'expanded', 'fullscreen')),
  CONSTRAINT valid_drawer_tab CHECK (drawer_tab IN ('terminal', 'chat')),
  CONSTRAINT valid_active_pane CHECK (active_pane IN ('preview', 'editor', 'database', 'deploy', 'activity'))
);

CREATE INDEX idx_ide_sessions_user ON ide_sessions(user_id);
CREATE INDEX idx_ide_sessions_last_active ON ide_sessions(last_active_at DESC);

-- Development Settings
CREATE TABLE development_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- GitHub
  github_access_token TEXT, -- Encrypted
  github_owner TEXT,
  github_repo TEXT,
  github_default_branch TEXT DEFAULT 'main',
  github_webhook_secret TEXT,

  -- Vercel
  vercel_access_token TEXT, -- Encrypted
  vercel_team_id TEXT,
  vercel_project_id TEXT,

  -- Supabase (self-referential, for different instances)
  supabase_url TEXT,
  supabase_service_key TEXT, -- Encrypted
  supabase_anon_key TEXT,

  -- Claude
  claude_mode TEXT DEFAULT 'cli',
  claude_cli_path TEXT DEFAULT '/usr/local/bin/claude',
  claude_api_key TEXT, -- Encrypted
  claude_model TEXT DEFAULT 'claude-3-opus',

  -- MCP
  mcp_servers JSONB DEFAULT '[]',
  mcp_auto_connect BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activity Log
CREATE TABLE ide_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES ide_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL, -- 'file_save', 'terminal_command', 'ai_response', 'deploy', 'error'
  event_data JSONB NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Indexes
  CONSTRAINT valid_event_type CHECK (event_type IN ('file_save', 'file_open', 'terminal_command', 'ai_message', 'deploy', 'error', 'db_query'))
);

CREATE INDEX idx_ide_activity_session ON ide_activity(session_id, created_at DESC);
CREATE INDEX idx_ide_activity_type ON ide_activity(event_type, created_at DESC);

-- Encryption helper (use Supabase Vault in production)
CREATE OR REPLACE FUNCTION encrypt_value(plaintext TEXT)
RETURNS TEXT AS $$
BEGIN
  -- In production, use proper encryption (Supabase Vault or pg_crypto)
  -- This is a placeholder
  RETURN encode(convert_to(plaintext, 'UTF8'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_value(ciphertext TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN convert_from(decode(ciphertext, 'base64'), 'UTF8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 9.2 Row Level Security

```sql
-- IDE Sessions: Users can only access their own sessions
ALTER TABLE ide_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own sessions"
ON ide_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Development Settings: Users can only access their own settings
ALTER TABLE development_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own settings"
ON development_settings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Activity: Users can only view their own activity
ALTER TABLE ide_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity"
ON ide_activity FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
ON ide_activity FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## 10. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
**Goal**: Basic IDE shell with navigation

- [ ] Create `/ide` route with responsive layout
- [ ] Implement `MobileIDELayout` and `DesktopIDELayout`
- [ ] Build bottom drawer with gesture support
- [ ] Create mobile navigation bar
- [ ] Implement pane switching logic
- [ ] Set up Zustand store for IDE state
- [ ] Add basic session persistence (Supabase)

**Deliverable**: Empty IDE shell that responds to navigation

### Phase 2: Terminal & Chat Foundation (Weeks 3-4)
**Goal**: Working terminal and chat UI

- [ ] Integrate xterm.js terminal emulator
- [ ] Create terminal WebSocket backend
- [ ] Build chat message UI components
- [ ] Implement Terminal ↔ Chat toggle
- [ ] Add keyboard toolbar for mobile
- [ ] Create drawer height states and gestures
- [ ] Style for dark/light themes

**Deliverable**: Functional terminal and chat (no AI yet)

### Phase 3: Admin Settings (Week 5)
**Goal**: Service configuration UI

- [ ] Create `/admin/settings/development` route structure
- [ ] Build GitHub OAuth flow and settings page
- [ ] Build Vercel OAuth flow and settings page
- [ ] Build Supabase connection settings page
- [ ] Build Claude CLI configuration page
- [ ] Create MCP server management UI
- [ ] Add database tables and migrations

**Deliverable**: Users can connect all services

### Phase 4: GitHub & File Editor (Weeks 6-7)
**Goal**: Full file editing capability

- [ ] Implement GitHub API wrapper
- [ ] Build file tree component
- [ ] Integrate Monaco Editor (desktop)
- [ ] Integrate CodeMirror 6 (mobile)
- [ ] Implement file save via git commit
- [ ] Add unsaved changes indicators
- [ ] Build diff viewer for changes
- [ ] Test hot reload of local changes

**Deliverable**: Can browse and edit files

### Phase 5: Claude AI Integration (Weeks 8-9)
**Goal**: AI-powered development

- [ ] Build Claude CLI service wrapper
- [ ] Implement streaming response handling
- [ ] Create tool use display (Read, Write, Edit, etc.)
- [ ] Add MCP server integration
- [ ] Implement context injection
- [ ] Build thinking/reasoning display
- [ ] Add conversation persistence
- [ ] Test self-modification capability

**Deliverable**: AI can read, write, and modify code

### Phase 6: Preview Pane (Week 10)
**Goal**: Browser preview of running app

- [ ] Build preview iframe component
- [ ] Implement local port detection
- [ ] Add deployed URL toggle
- [ ] Create refresh/navigation controls
- [ ] Add device frame options
- [ ] Implement zoom controls
- [ ] Handle iframe security (same-origin)

**Deliverable**: Can preview running app

### Phase 7: Database Pane (Weeks 11-12)
**Goal**: Full Supabase database management

- [ ] Build Supabase admin API wrapper
- [ ] Create table list view
- [ ] Implement schema viewer
- [ ] Build data table with pagination
- [ ] Add inline row editing (CRUD)
- [ ] Create SQL query editor
- [ ] Add query history
- [ ] Implement real-time updates

**Deliverable**: Full database management

### Phase 8: Deploy Pane (Week 13)
**Goal**: Vercel deployment management

- [ ] Build Vercel API wrapper
- [ ] Create deployment list view
- [ ] Implement build log streaming
- [ ] Add redeploy functionality
- [ ] Build rollback capability
- [ ] Create environment variables editor
- [ ] Add deployment status notifications

**Deliverable**: Full deployment control

### Phase 9: Activity Pane (Week 14)
**Goal**: Unified activity timeline

- [ ] Create activity timeline component
- [ ] Implement event filtering
- [ ] Build search functionality
- [ ] Add event detail views
- [ ] Connect to real-time events
- [ ] Style different event types
- [ ] Add jump-to-source for errors

**Deliverable**: Activity feed working

### Phase 10: Polish & Performance (Weeks 15-16)
**Goal**: Production-ready quality

- [ ] Performance optimization (bundle size, lazy loading)
- [ ] Add loading states and skeletons
- [ ] Implement error boundaries
- [ ] Add offline support with queue
- [ ] Test on real mobile devices
- [ ] Fix accessibility issues (ARIA, keyboard nav)
- [ ] Add haptic feedback
- [ ] Create onboarding flow
- [ ] Write documentation

**Deliverable**: Production-ready IDE

---

## 11. Risk Assessment & Mitigations

### High Risk

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Hot reload breaks app | High | Medium | Git-based auto-rollback on verification failure |
| Claude CLI rate limits | High | Low | Implement request queuing and backoff |
| Mobile performance issues | High | Medium | Profile early, lazy load aggressively |
| OAuth token expiry | Medium | High | Implement refresh token flow, graceful re-auth |

### Medium Risk

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| xterm.js mobile keyboard issues | Medium | Medium | Custom keyboard toolbar, test extensively |
| Monaco too heavy for mobile | Medium | High | Use CodeMirror 6 for mobile only |
| Iframe preview CORS issues | Medium | Medium | Use proxy for cross-origin previews |
| Supabase RLS complexity | Medium | Low | Thorough testing, simple policies |

### Low Risk

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Design system conflicts | Low | Low | Use IDE-specific component variants |
| Session state bloat | Low | Medium | Implement state pruning/cleanup |
| API rate limiting (GitHub/Vercel) | Low | Low | Implement caching, batch requests |

---

## 12. Success Criteria

### Must Have (MVP)
- [ ] Mobile-first two-zone layout functional
- [ ] Bottom drawer with terminal and chat
- [ ] GitHub file browsing and editing
- [ ] Claude AI integration working
- [ ] Basic session persistence
- [ ] Admin settings for all services
- [ ] Preview pane with local/deployed toggle

### Should Have
- [ ] Full CRUD database management
- [ ] Vercel deployment management
- [ ] Activity timeline
- [ ] Hot reload self-modification
- [ ] Offline support
- [ ] MCP server integration

### Nice to Have
- [ ] Voice input for chat
- [ ] Haptic feedback
- [ ] Desktop keyboard shortcuts
- [ ] Split-pane views on tablet
- [ ] Push notifications
- [ ] Collaboration features

---

## 13. Resolved Decisions

All architectural decisions have been finalized:

### Architecture Decisions
| Question | Decision | Rationale |
|----------|----------|-----------|
| Terminal backend | **Wetty/ttyd** | Battle-tested, full PTY support, good mobile compatibility |
| File sync | **Manual commits** | Clean git history, explicit control, no noise |
| Preview sandbox | **Minimal** | Allow scripts/forms for full app functionality |

### UX Decisions
| Question | Decision | Rationale |
|----------|----------|-----------|
| Onboarding | **Guided wizard** | Step-by-step: GitHub login → repo select → connect services |
| Error recovery | **Silent recovery** | Auto-fix with notification, don't interrupt flow |
| Keyboard shortcuts | **VS Code bindings** | Familiar to developers, industry standard |

### Integration Decisions
| Question | Decision | Rationale |
|----------|----------|-----------|
| Webhooks | **Vercel serverless** | Use Next.js API routes, no extra infrastructure |
| MCP servers | **Local only** | Run alongside Claude CLI, no server costs |
| AI context | **Full context** | Open files, errors, DB schema, deploy status - AI knows everything |

### Business Decisions
| Question | Decision | Rationale |
|----------|----------|-----------|
| Authentication | **GitHub OAuth primary** | Login via GitHub = auth + GitHub connection in one step |
| Telemetry | **Opt-in only** | Ask permission first, respect privacy |
| Rate limits | **Queue with backoff** | Exponential backoff, progress indicator, graceful handling |

### Authentication Flow (Key Decision)

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User visits /ide (or any protected route)                   │
│     └─ Redirect to GitHub OAuth login                           │
│                                                                  │
│  2. GitHub OAuth completes                                       │
│     ├─ Supabase Auth creates/updates user                       │
│     └─ GitHub access token stored (encrypted)                   │
│                                                                  │
│  3. First-time user: Repo Selection                             │
│     ├─ Fetch user's repositories from GitHub                    │
│     ├─ User selects which repo to work with                     │
│     └─ Store selection in user settings                         │
│                                                                  │
│  4. Onboarding Wizard                                           │
│     ├─ Connect Vercel (OAuth)                                   │
│     ├─ Connect Supabase (URL + keys)                            │
│     ├─ Configure Claude CLI (path + verify)                     │
│     └─ All settings saved under Developer Tools > Integrations  │
│                                                                  │
│  5. IDE Ready                                                    │
│     └─ Full access to /ide with all services connected          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Settings Location

All integration settings live under:
```
Admin Dashboard
└── Developer Tools
    └── Integrations
        ├── GitHub (connected via auth, repo selector)
        ├── Vercel (OAuth + project selector)
        ├── Supabase (URL + keys)
        ├── Claude (CLI path + model)
        └── MCP Servers (local config)
```

---

## Appendix A: Component Reference

### Mobile-Specific Components

```
/src/app/ide/components/
├── MobileIDELayout.tsx      # Main mobile layout
├── MobileHeader.tsx         # Minimal header (repo, branch, menu)
├── MobileBottomNav.tsx      # Bottom navigation tabs
├── BottomDrawer.tsx         # Collapsible drawer container
├── DrawerHandle.tsx         # Swipe handle with gestures
├── DrawerToggle.tsx         # Terminal ↔ Chat toggle
├── KeyboardToolbar.tsx      # Mobile keyboard helpers
└── GestureHandler.tsx       # Touch gesture utilities
```

### Shared Components

```
/src/components/ide/
├── ToolCard.tsx             # Tool invocation display
├── MessageBubble.tsx        # Chat message
├── CodeBlock.tsx            # Syntax-highlighted code
├── DiffViewer.tsx           # Side-by-side diff
├── FileTree.tsx             # Hierarchical file browser
├── StatusIndicator.tsx      # Loading/success/error
├── EmptyState.tsx           # Empty pane placeholder
└── Skeleton.tsx             # Loading skeletons
```

---

## Appendix B: API Route Reference

```
/api/
├── ide/
│   ├── session/
│   │   ├── GET    - Get current session
│   │   ├── POST   - Create new session
│   │   ├── PATCH  - Update session state
│   │   └── DELETE - End session
│   │
│   ├── files/
│   │   ├── GET    - Read file contents
│   │   ├── POST   - Create file
│   │   ├── PUT    - Update file
│   │   └── DELETE - Delete file
│   │
│   └── terminal/
│       └── WebSocket - Terminal PTY connection
│
├── integrations/
│   ├── github/
│   │   ├── oauth/callback - OAuth callback
│   │   ├── repo           - Repository info
│   │   ├── contents       - File/directory contents
│   │   ├── commits        - Commit history
│   │   └── branches       - Branch list
│   │
│   ├── vercel/
│   │   ├── oauth/callback - OAuth callback
│   │   ├── deployments    - List deployments
│   │   ├── logs           - Build logs (SSE)
│   │   └── env            - Environment variables
│   │
│   └── supabase/
│       ├── tables         - List tables
│       ├── schema         - Table schema
│       ├── rows           - CRUD rows
│       └── query          - Execute SQL
│
└── mcp/
    └── [...path]          - MCP server proxy
```

---

## Appendix C: Design Tokens Reference

Use existing design system tokens from `/src/design-system/tokens.ts`:

```typescript
// IDE-specific semantic tokens (extend existing)
const ideTokens = {
  // Drawer
  drawer: {
    bg: 'bg-background',
    border: 'border-border',
    handle: 'bg-neutral-400 dark:bg-neutral-600',
  },

  // Terminal
  terminal: {
    bg: 'bg-neutral-950',
    text: 'text-neutral-100',
    prompt: 'text-green-400',
    error: 'text-red-400',
  },

  // Chat
  chat: {
    userBubble: 'bg-primary-500 text-white',
    aiBubble: 'bg-neutral-100 dark:bg-neutral-800',
    thinking: 'text-neutral-500 italic',
  },

  // Panes
  pane: {
    active: 'text-primary-500',
    inactive: 'text-neutral-400',
    indicator: 'bg-primary-500',
  },

  // Status
  status: {
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
    pending: 'text-neutral-400',
  },
};
```

---

*Document Version: 1.1*
*Created: January 2025*
*Updated: January 2025*
*Author: Claude (with human direction)*
*Status: **APPROVED** - Ready for Implementation*

---

## Changelog

### v1.1 (January 2025)
- Resolved all 12 open questions
- Added Authentication Flow diagram
- Documented GitHub OAuth as primary auth
- Added Settings Location structure
- Changed status to APPROVED
