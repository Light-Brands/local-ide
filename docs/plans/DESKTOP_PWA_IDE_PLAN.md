# Desktop PWA IDE Plan - Lawless AI Integration

## Executive Summary

Integrate the **Lawless AI IDE architecture** into Local-IDE to create a unified mobile/desktop experience. Both platforms will share the same pane components, state management, and service integrations. The key insight is that Lawless AI's architecture already solves the mobile/desktop challenge elegantly - we just need to adopt it.

**Key Principle**: One codebase, shared components, responsive by design.

---

## Table of Contents

1. [Architecture Comparison](#1-architecture-comparison)
2. [Integration Strategy](#2-integration-strategy)
3. [File-by-File Migration](#3-file-by-file-migration)
4. [Unified Store Design](#4-unified-store-design)
5. [Shared Pane Components](#5-shared-pane-components)
6. [Desktop Layout (Portal Pattern)](#6-desktop-layout-portal-pattern)
7. [Mobile Layout (Two-Zone)](#7-mobile-layout-two-zone)
8. [Implementation Phases](#8-implementation-phases)
9. [Dependency Changes](#9-dependency-changes)

---

## 1. Architecture Comparison

### What Lawless AI Does Right

| Pattern | Description | Benefit |
|---------|-------------|---------|
| **Portal Pattern** | Pane content rendered once, portaled to visible panels | Terminal state preserved when toggling panes |
| **react-resizable-panels** | Professional resizable panel library | Smooth desktop panel resizing |
| **Unified Store** | Single Zustand store for mobile + desktop | No state duplication |
| **Two-Zone Mobile** | Main pane + bottom zone (terminal/chat) | Natural thumb-reach UI |
| **Shared Panes** | Same component renders on both platforms | Each pane handles its own `isMobile` check |
| **IDEContext** | Provides owner/repo/session to all children | Clean dependency injection |

### Current Local-IDE vs Lawless AI

| Feature | Local-IDE (Current) | Lawless AI | Action |
|---------|---------------------|------------|--------|
| Desktop Layout | Skeleton only | Full react-resizable-panels | **Adopt** |
| Mobile Layout | Working two-zone | Same pattern | Keep, enhance |
| Pane Components | Basic implementations | Full-featured (~900 lines each) | **Adopt** |
| Store | 602 lines, good structure | 555 lines, better organization | **Merge** |
| Terminal | Custom ANSI parser | xterm.js | **Adopt** |
| Editor | Textarea | CodeMirror 6 | **Adopt** |
| Services | Working (GitHub, Claude, etc.) | Similar | Keep ours |
| Auth | GitHub OAuth + Supabase | Similar | Keep ours |

---

## 2. Integration Strategy

### Core Principle: Adopt Lawless AI Patterns, Keep Local-IDE Services

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LOCAL-IDE FINAL STRUCTURE                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    FROM LAWLESS AI                           │    │
│  │  • Desktop Layout (IDELayout.tsx + Portal pattern)          │    │
│  │  • Mobile Layout (MobileIDELayout.tsx + Two-Zone)           │    │
│  │  • Pane Components (Editor, Chat, Terminal, etc.)           │    │
│  │  • Unified Zustand Store structure                          │    │
│  │  • Context Providers (IDEContext)                           │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    FROM LOCAL-IDE (KEEP)                     │    │
│  │  • Services (github.ts, claude.ts, vercel.ts, supabase-db.ts)│    │
│  │  • Auth flow (login, setup, onboarding, OAuth callback)      │    │
│  │  • Activity tracking service                                 │    │
│  │  • Tailwind CSS styling (adapt Lawless CSS to Tailwind)     │    │
│  │  • PWA configuration (new)                                   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### What Gets Replaced vs Enhanced

| Component | Action | Notes |
|-----------|--------|-------|
| `src/lib/ide/store.ts` | **Merge** | Add Lawless AI patterns to existing store |
| `src/app/ide/components/IDELayout.tsx` | **Replace** | Use Lawless AI portal pattern |
| `src/app/ide/components/DesktopIDELayout.tsx` | **Replace** | Use Lawless AI IDELayout |
| `src/app/ide/components/MobileIDELayout.tsx` | **Replace** | Use Lawless AI MobileIDELayout |
| `src/app/ide/components/panes/*` | **Replace** | Use Lawless AI pane components |
| `src/app/ide/components/bottom-drawer/*` | **Replace** | Use MobileBottomZone pattern |
| `src/lib/ide/services/*` | **Keep** | Our services work fine |
| `src/app/ide/login/*` | **Keep** | Our auth flow works fine |
| `src/app/ide/setup/*` | **Keep** | Our repo selection works fine |
| `src/app/ide/onboarding/*` | **Keep** | Our onboarding works fine |

---

## 3. File-by-File Migration

### New Directory Structure

```
src/app/ide/
├── page.tsx                           # Keep (entry point)
├── layout.tsx                         # Keep (layout wrapper)
├── login/                             # Keep (auth flow)
├── setup/                             # Keep (repo selection)
├── onboarding/                        # Keep (service config)
├── auth/callback/                     # Keep (OAuth)
│
├── stores/
│   └── ideStore.ts                    # NEW: Unified store (from Lawless)
│
├── contexts/
│   ├── IDEContext.tsx                 # NEW: IDE context (from Lawless)
│   └── ServiceContext.tsx             # NEW: Service connections (from Lawless)
│
├── components/
│   ├── IDELayout.tsx                  # REPLACE: Desktop layout with portals
│   ├── PaneContainer.tsx              # NEW: Pane wrapper (from Lawless)
│   ├── Icons.tsx                      # NEW: Icon components (from Lawless)
│   │
│   ├── mobile/
│   │   ├── MobileIDELayout.tsx        # REPLACE: Two-zone layout
│   │   ├── MobileHeader.tsx           # REPLACE: Mobile header
│   │   ├── MobileBottomNav.tsx        # REPLACE: Bottom navigation
│   │   └── MobileBottomZone.tsx       # NEW: Terminal/Chat toggle zone
│   │
│   ├── panes/
│   │   ├── EditorPane/
│   │   │   ├── index.tsx              # REPLACE: Full editor (from Lawless)
│   │   │   ├── FileTree.tsx           # NEW: Recursive file tree
│   │   │   ├── CodeEditor.tsx         # NEW: CodeMirror wrapper
│   │   │   └── FileTabs.tsx           # NEW: Open file tabs
│   │   ├── ChatPane/
│   │   │   ├── index.tsx              # REPLACE: Full chat (from Lawless)
│   │   │   ├── MessageList.tsx        # NEW: Message rendering
│   │   │   └── ContextPanel.tsx       # NEW: Context sidebar
│   │   ├── TerminalPane/
│   │   │   ├── index.tsx              # REPLACE: xterm.js terminal
│   │   │   ├── TerminalTabs.tsx       # NEW: Multi-terminal tabs
│   │   │   └── KeyboardToolbar.tsx    # NEW: Mobile keyboard helpers
│   │   ├── PreviewPane/
│   │   │   └── index.tsx              # REPLACE: Enhanced preview
│   │   ├── DatabasePane/
│   │   │   └── index.tsx              # REPLACE: Full database browser
│   │   ├── DeploymentsPane/
│   │   │   └── index.tsx              # REPLACE: Vercel deployments
│   │   ├── ActivityPane/
│   │   │   └── index.tsx              # REPLACE: Activity timeline
│   │   └── SettingsPane/
│   │       └── index.tsx              # NEW: IDE settings
│   │
│   └── shared/
│       ├── PaneSkeleton.tsx           # NEW: Loading skeleton
│       └── StatusIndicator.tsx        # Keep if exists
│
├── hooks/
│   ├── useMobileDetect.ts             # Keep (already exists)
│   ├── useTerminal.ts                 # NEW: xterm.js management
│   ├── usePortScanner.ts              # NEW: Dev server detection
│   └── useKeyboardShortcuts.ts        # NEW: Keyboard handler
│
└── styles/
    └── ide.css                        # NEW: IDE-specific styles (from Lawless, converted to Tailwind)

src/lib/ide/
├── store.ts                           # DELETE: Move to app/ide/stores/
├── auth.tsx                           # Keep (auth context)
├── hooks/                             # Keep existing, add new
└── services/                          # Keep all (github, claude, vercel, supabase-db, terminal, activity)
```

### Key Files to Copy from Lawless AI

| Lawless AI File | Local-IDE Destination | Lines | Adapt? |
|-----------------|----------------------|-------|--------|
| `app/ide/stores/ideStore.ts` | `src/app/ide/stores/ideStore.ts` | 555 | Merge with existing |
| `app/ide/contexts/IDEContext.tsx` | `src/app/ide/contexts/IDEContext.tsx` | 60 | Direct copy |
| `app/ide/contexts/ServiceContext.tsx` | `src/app/ide/contexts/ServiceContext.tsx` | ~200 | Adapt to our services |
| `app/ide/components/IDELayout.tsx` | `src/app/ide/components/IDELayout.tsx` | 305 | Direct copy |
| `app/ide/components/PaneContainer.tsx` | `src/app/ide/components/PaneContainer.tsx` | 48 | Direct copy |
| `app/ide/components/mobile/MobileIDELayout.tsx` | `src/app/ide/components/mobile/MobileIDELayout.tsx` | 155 | Direct copy |
| `app/ide/components/mobile/MobileBottomZone.tsx` | `src/app/ide/components/mobile/MobileBottomZone.tsx` | 154 | Direct copy |
| `app/ide/components/mobile/MobileHeader.tsx` | `src/app/ide/components/mobile/MobileHeader.tsx` | ~100 | Direct copy |
| `app/ide/components/mobile/MobileBottomNav.tsx` | `src/app/ide/components/mobile/MobileBottomNav.tsx` | ~100 | Direct copy |
| `app/ide/components/panes/EditorPane/index.tsx` | `src/app/ide/components/panes/EditorPane/index.tsx` | 911 | Adapt imports |
| `app/ide/components/panes/ChatPane/index.tsx` | `src/app/ide/components/panes/ChatPane/index.tsx` | 999 | Adapt to our Claude service |
| `app/ide/components/panes/TerminalPane/index.tsx` | `src/app/ide/components/panes/TerminalPane/index.tsx` | 935 | Adapt |
| `app/ide/components/panes/PreviewPane/index.tsx` | `src/app/ide/components/panes/PreviewPane/index.tsx` | ~500 | Adapt |
| `app/ide/components/panes/DatabasePane/index.tsx` | `src/app/ide/components/panes/DatabasePane/index.tsx` | ~600 | Adapt to our Supabase service |
| `app/ide/components/panes/DeploymentsPane/index.tsx` | `src/app/ide/components/panes/DeploymentsPane/index.tsx` | ~200 | Adapt to our Vercel service |
| `app/ide/components/panes/ActivityPane/index.tsx` | `src/app/ide/components/panes/ActivityPane/index.tsx` | ~200 | Adapt to our activity service |
| `app/ide/hooks/useTerminal.ts` | `src/app/ide/hooks/useTerminal.ts` | ~300 | Adapt |
| `app/ide/hooks/useMobileDetection.ts` | Already have | - | Keep ours |

---

## 4. Unified Store Design

### Merged Store Structure

The new store combines the best of both:

```typescript
// src/app/ide/stores/ideStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types from Lawless AI
export interface TerminalTab {
  tabId: string;
  name: string;
  index: number;
  worktreePath: string;
  branchName: string;
  baseBranch: string;
}

export interface PortInfo {
  port: number;
  detectedAt: Date;
  source: 'terminal' | 'scan';
  label?: string;
  tabId?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: any[];
}

// Combined interface
interface IDEStore {
  // === PROJECT ISOLATION ===
  resetProjectState: () => void;

  // === PANE STATE (Desktop) ===
  paneOrder: number[];
  paneVisibility: Record<number, boolean>;
  paneWidths: Record<number, number>;
  maxPanesReached: boolean;
  togglePane: (pane: number) => void;
  setPaneVisibility: (pane: number, visible: boolean) => void;
  setPaneWidth: (pane: number, width: number) => void;
  reorderPanes: (order: number[]) => void;
  setMaxPanesReached: (reached: boolean) => void;

  // === MOBILE STATE (Two-Zone) ===
  mobile: {
    mainPane: 'preview' | 'editor' | 'database' | 'deployments' | 'activity' | 'settings';
    bottomZoneHeight: 'collapsed' | 'half' | 'expanded' | 'fullscreen';
    bottomZoneTab: 'terminal' | 'chat';
    chatUnreadCount: number;
  };
  setMobileMainPane: (pane: typeof mobile.mainPane) => void;
  setMobileBottomZoneHeight: (height: typeof mobile.bottomZoneHeight) => void;
  setMobileBottomZoneTab: (tab: 'terminal' | 'chat') => void;
  toggleMobileBottomZone: () => void;
  expandMobileBottomZone: () => void;
  collapseMobileBottomZone: () => void;
  incrementMobileChatUnread: () => void;
  clearMobileChatUnread: () => void;

  // === EDITOR STATE ===
  activeFile: string | null;
  openFiles: string[];
  unsavedFiles: Set<string>;
  fileTree: FileNode[] | null;
  fileTreeLoading: boolean;
  fileTreeCollapsed: boolean;
  splitView: boolean;
  setActiveFile: (path: string | null) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  markFileUnsaved: (path: string) => void;
  markFileSaved: (path: string) => void;
  setFileTree: (tree: FileNode[]) => void;
  setFileTreeLoading: (loading: boolean) => void;
  setFileTreeCollapsed: (collapsed: boolean) => void;
  setSplitView: (enabled: boolean) => void;

  // === CHAT STATE ===
  chatMode: 'terminal' | 'workspace';
  terminalMessages: Message[];
  workspaceMessages: Message[];
  setChatMode: (mode: 'terminal' | 'workspace') => void;
  addMessage: (mode: 'terminal' | 'workspace', message: Omit<Message, 'id' | 'timestamp'>) => void;

  // === PREVIEW STATE ===
  previewMode: 'local' | 'deployed';
  serverStatus: 'stopped' | 'starting' | 'running' | 'error';
  serverPort: number | null;
  activePorts: Record<number, PortInfo>;
  selectedPort: number | null;
  setPreviewMode: (mode: 'local' | 'deployed') => void;
  setServerStatus: (status: typeof serverStatus) => void;
  setServerPort: (port: number | null) => void;
  addPort: (port: number, source: 'terminal' | 'scan', label?: string, tabId?: string) => void;
  removePort: (port: number) => void;
  setSelectedPort: (port: number | null) => void;
  syncPortsFromScan: (ports: number[]) => void;

  // === TERMINAL STATE ===
  terminalTabs: TerminalTab[];
  activeTabId: string | null;
  addTerminalTab: (tab: TerminalTab) => void;
  removeTerminalTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  setTerminalTabs: (tabs: TerminalTab[]) => void;

  // === DATABASE STATE ===
  activeTable: string | null;
  queryHistory: string[];
  currentQuery: string;
  setActiveTable: (table: string | null) => void;
  addQueryToHistory: (query: string) => void;
  setCurrentQuery: (query: string) => void;

  // === DEPLOYMENT STATE ===
  deploymentStatus: 'idle' | 'building' | 'ready' | 'failed';
  setDeploymentStatus: (status: typeof deploymentStatus) => void;

  // === ACTIVITY STATE (from Local-IDE) ===
  activityFilter: 'all' | 'files' | 'terminal' | 'ai' | 'deploy' | 'database';
  activitySearch: string;
  setActivityFilter: (filter: typeof activityFilter) => void;
  setActivitySearch: (search: string) => void;

  // === COMMAND PALETTE ===
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // === IDE SETTINGS ===
  settings: {
    editorFontSize: number;
    terminalFontSize: number;
    autoSave: boolean;
    hapticFeedback: boolean;
    reducedMotion: boolean;
    theme: 'dark' | 'light' | 'system';
  };
  updateSettings: (updates: Partial<typeof settings>) => void;

  // === UI STATE ===
  isMobile: boolean;
  showSettings: boolean;
  isOnboardingComplete: boolean;
  setIsMobile: (mobile: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;

  // === INTEGRATIONS (from Local-IDE) ===
  integrations: {
    github: { connected: boolean; owner: string | null; repo: string | null; branch: string };
    vercel: { connected: boolean; projectId: string | null; teamId: string | null };
    supabase: { connected: boolean; url: string | null; projectRef: string | null };
    claude: { connected: boolean; model: string };
  };
  setIntegration: (service: keyof typeof integrations, data: Partial<typeof integrations[typeof service]>) => void;
}
```

---

## 5. Shared Pane Components

### How Panes Handle Responsive Design

Each pane component from Lawless AI follows this pattern:

```typescript
// Example: EditorPane
export function EditorPane() {
  const isMobile = useMobileDetection();

  // Mobile-specific state
  const [mobileMode, setMobileMode] = useState<'browser' | 'editor'>('browser');

  if (isMobile) {
    return (
      <div className="editor-pane-mobile">
        {mobileMode === 'browser' ? (
          <MobileFileBrowser onFileSelect={() => setMobileMode('editor')} />
        ) : (
          <MobileEditor onBack={() => setMobileMode('browser')} />
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="editor-pane-desktop">
      <FileTreeSidebar />
      <div className="editor-main">
        <FileTabs />
        <CodeEditor />
        <StatusBar />
      </div>
    </div>
  );
}
```

### Pane Mapping

| Pane # | Name | Mobile Behavior | Desktop Behavior |
|--------|------|-----------------|------------------|
| 1 | Chat | Bottom zone tab | Resizable panel |
| 2 | Editor | Full-screen with browser/editor toggle | File tree + editor + tabs |
| 3 | Preview | Iframe with pull-to-refresh | Iframe with device frames |
| 4 | Database | Drill-down navigation | Table browser + SQL editor |
| 5 | Deployments | List with detail drill-down | List with inline logs |
| 6 | Activity | Scrollable timeline | Timeline with filters |
| 7 | Terminal | Bottom zone tab | Resizable panel with tabs |

---

## 6. Desktop Layout (Portal Pattern)

### Why Portals?

The terminal (xterm.js) has complex internal state. If we unmount/remount it when toggling pane visibility, we lose:
- Terminal history
- Active sessions
- WebSocket connections

**Solution**: Render ALL pane content once, use React portals to move visible content to panel positions.

```typescript
// Simplified portal pattern
function IDELayout() {
  const [portalTargets, setPortalTargets] = useState<Record<number, HTMLDivElement | null>>({});

  return (
    <PanePortalContext.Provider value={{ targets: portalTargets, registerTarget }}>
      {/* 1. Render all pane content ONCE (in consistent order) */}
      <div className="pane-content-holder" style={{ display: 'none' }}>
        {paneOrder.map(paneId => (
          <PaneContentPortal key={paneId} paneId={paneId} isVisible={paneVisibility[paneId]}>
            <PaneComponent />
          </PaneContentPortal>
        ))}
      </div>

      {/* 2. Visible panels with resize handles */}
      <PanelGroup orientation="horizontal">
        {visiblePanes.map(paneId => (
          <Panel key={paneId}>
            <PaneContainer>
              {/* Portal target - content will be rendered here */}
              <PanePortalTarget paneId={paneId} />
            </PaneContainer>
          </Panel>
        ))}
      </PanelGroup>
    </PanePortalContext.Provider>
  );
}
```

---

## 7. Mobile Layout (Two-Zone)

### Layout Structure

```
┌─────────────────────────────────────────┐
│  MobileHeader                           │  ← Safe area top
│  [repo/branch] [settings]               │
├─────────────────────────────────────────┤
│                                         │
│  Main Pane Area (flex: 1)               │  ← Swipe left/right
│  (Preview | Editor | Database |         │
│   Deployments | Activity | Settings)    │
│                                         │
├─────────────────────────────────────────┤
│  ▲ Terminal ═══════╤══════ Chat (2) ▲   │  ← Bottom zone toggle
├─────────────────────────────────────────┤
│                                         │
│  Bottom Zone Content                    │  ← 0-50% height
│  (Terminal OR Chat)                     │     collapsed/half/expanded/fullscreen
│                                         │
├─────────────────────────────────────────┤
│  👁️ Preview | 📝 Editor | 🗄️ DB |      │  ← Bottom nav
│  🚀 Deploy | 📋 Activity               │     Safe area bottom
└─────────────────────────────────────────┘
```

### Height States

| State | Main Pane | Bottom Zone | Use Case |
|-------|-----------|-------------|----------|
| `collapsed` | 100% | 44px (toggle only) | Viewing content |
| `half` | 50% | 50% | Balanced work |
| `expanded` | 25% | 75% | Heavy terminal/chat use |
| `fullscreen` | 0% | 100% | Immersive terminal/chat |

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal**: Set up the new architecture without breaking existing functionality.

- [ ] Install dependencies (`react-resizable-panels`, `xterm`, `@codemirror/*`)
- [ ] Create `src/app/ide/stores/ideStore.ts` (merged store)
- [ ] Create `src/app/ide/contexts/IDEContext.tsx`
- [ ] Create `src/app/ide/contexts/ServiceContext.tsx` (adapted to our services)
- [ ] Create `src/app/ide/components/Icons.tsx`
- [ ] Create `src/app/ide/components/PaneContainer.tsx`
- [ ] Update `src/app/ide/page.tsx` to use new structure
- [ ] Add CSS files for IDE styling

**Deliverable**: New architecture in place, old components still work

### Phase 2: Desktop Layout (Week 2)

**Goal**: Working desktop layout with portal pattern.

- [ ] Create `src/app/ide/components/IDELayout.tsx` (from Lawless)
- [ ] Implement `PanePortalContext` and portal targets
- [ ] Add keyboard shortcuts (Cmd+1-7 for pane toggling)
- [ ] Implement collapsed pane icons sidebar
- [ ] Test panel resizing

**Deliverable**: Desktop layout works with placeholder panes

### Phase 3: Mobile Layout (Week 3)

**Goal**: Working mobile layout with two-zone architecture.

- [ ] Create `src/app/ide/components/mobile/MobileIDELayout.tsx`
- [ ] Create `src/app/ide/components/mobile/MobileHeader.tsx`
- [ ] Create `src/app/ide/components/mobile/MobileBottomNav.tsx`
- [ ] Create `src/app/ide/components/mobile/MobileBottomZone.tsx`
- [ ] Implement swipe gestures for main pane navigation
- [ ] Implement swipe gestures for bottom zone height
- [ ] Add haptic feedback

**Deliverable**: Mobile layout works with placeholder panes

### Phase 4: Pane Components - Editor (Week 4)

**Goal**: Full-featured code editor pane.

- [ ] Create `src/app/ide/components/panes/EditorPane/index.tsx`
- [ ] Implement recursive `FileTree.tsx`
- [ ] Implement `CodeEditor.tsx` with CodeMirror 6
- [ ] Implement `FileTabs.tsx` for open files
- [ ] Mobile: browser/editor toggle mode
- [ ] Connect to existing GitHub service for file operations

**Deliverable**: Full editor working on mobile and desktop

### Phase 5: Pane Components - Terminal (Week 5)

**Goal**: xterm.js terminal with multi-tab support.

- [ ] Create `src/app/ide/components/panes/TerminalPane/index.tsx`
- [ ] Implement `useTerminal.ts` hook
- [ ] Implement `TerminalTabs.tsx`
- [ ] Implement `KeyboardToolbar.tsx` for mobile
- [ ] Add server detection from terminal output
- [ ] Connect to existing terminal service

**Deliverable**: Full terminal working on mobile and desktop

### Phase 6: Pane Components - Chat (Week 6)

**Goal**: AI chat pane with Claude integration.

- [ ] Create `src/app/ide/components/panes/ChatPane/index.tsx`
- [ ] Implement `MessageList.tsx` with streaming support
- [ ] Implement `ContextPanel.tsx` for context display
- [ ] Add slash commands and @ mentions
- [ ] Connect to existing Claude service

**Deliverable**: Full chat working on mobile and desktop

### Phase 7: Pane Components - Preview, Database, Deployments (Week 7)

**Goal**: Complete remaining panes.

- [ ] Create `PreviewPane` with iframe and device frames
- [ ] Create `DatabasePane` with table browser and SQL editor
- [ ] Create `DeploymentsPane` with Vercel integration
- [ ] Create `ActivityPane` with timeline view
- [ ] Create `SettingsPane` for IDE settings

**Deliverable**: All panes working

### Phase 8: Polish & PWA (Week 8)

**Goal**: Production-ready PWA.

- [ ] Add `manifest.json` for PWA
- [ ] Implement service worker for offline caching
- [ ] Add install prompt
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Testing on all platforms

**Deliverable**: Production-ready desktop PWA

---

## 9. Dependency Changes

### Add to package.json

```json
{
  "dependencies": {
    "react-resizable-panels": "^2.1.0",
    "xterm": "^5.3.0",
    "xterm-addon-fit": "^0.8.0",
    "xterm-addon-web-links": "^0.9.0",
    "@codemirror/view": "^6.0.0",
    "@codemirror/state": "^6.0.0",
    "@codemirror/lang-javascript": "^6.0.0",
    "@codemirror/lang-html": "^6.0.0",
    "@codemirror/lang-css": "^6.0.0",
    "@codemirror/lang-json": "^6.0.0",
    "@codemirror/lang-markdown": "^6.0.0",
    "marked": "^12.0.0",
    "mermaid": "^10.0.0",
    "highlight.js": "^11.0.0",
    "next-pwa": "^5.6.0"
  }
}
```

### Styling Approach

Lawless AI uses CSS modules. We'll convert to Tailwind while maintaining the same structure:

```css
/* Lawless AI */
.pane-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
}

/* Local-IDE (Tailwind) */
/* className="flex flex-col h-full bg-neutral-900" */
```

---

## Summary

This integration plan brings the battle-tested Lawless AI IDE architecture into Local-IDE while preserving our existing services and auth flow. The key benefits:

1. **Shared Components**: Same pane components work on mobile and desktop
2. **Portal Pattern**: Terminal state preserved when toggling panes
3. **Unified Store**: Single source of truth for all state
4. **Two-Zone Mobile**: Natural thumb-reach UI pattern
5. **react-resizable-panels**: Professional desktop panel management
6. **xterm.js + CodeMirror**: Production-grade editor and terminal

The implementation is broken into 8 phases, each delivering working functionality. By the end, we'll have a fully-featured PWA that works identically (with responsive adaptations) on mobile and desktop.

---

*Document Version: 2.0*
*Created: January 2025*
*Author: Claude (with human direction)*
*Status: **READY FOR IMPLEMENTATION***
