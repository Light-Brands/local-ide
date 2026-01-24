# Local IDE Terminal & Backend Fix Plan

## Problem Summary

The IDE has all UI components but no backend execution layer. The terminal runs in "mock" mode showing `user@local-ide` instead of a real shell. Files, database, preview, and Claude CLI are all disconnected.

## Architecture Comparison: lawless-ai vs local-ide

### lawless-ai Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                             │
│  - xterm.js terminal                                            │
│  - React components                                             │
│  - WebSocket client                                             │
└─────────────────────────────────────────────────────────────────┘
                              │ WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend Server (Express)                                       │
│  - WebSocket server (ws)                                        │
│  - node-pty for PTY allocation                                  │
│  - tmux for session persistence                                 │
│  - Git worktree management                                      │
│  - SQLite for session metadata                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Terminal Session                                               │
│  - tmux session (lw_{sessionId}_tab_{tabId})                    │
│  - Claude CLI (claude --dangerously-skip-permissions)           │
│  - Git worktree (isolated filesystem)                           │
└─────────────────────────────────────────────────────────────────┘
```

### local-ide Current Architecture (Broken)
```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                             │
│  - xterm.js terminal                                            │
│  - React components                                             │
│  - MockTerminalService (FAKE!)                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                        ❌ NO BACKEND
```

## Solution: Implement Real Backend

### Phase 1: Terminal Server (Critical Path)

#### 1.1 Create WebSocket Terminal Server

Create a Node.js server that:
1. Uses `node-pty` to spawn real shell processes
2. Exposes WebSocket endpoint for bidirectional terminal I/O
3. Manages terminal sessions

**File: `server/terminal-server.ts`**

```typescript
import { WebSocketServer, WebSocket } from 'ws';
import * as pty from 'node-pty';
import { createServer } from 'http';
import express from 'express';
import path from 'path';

interface TerminalSession {
  pty: pty.IPty;
  ws: WebSocket;
}

const sessions = new Map<string, TerminalSession>();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/terminal' });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const sessionId = url.searchParams.get('session') || crypto.randomUUID();
  const projectPath = url.searchParams.get('path') || process.cwd();

  // Spawn PTY with real shell
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 120,
    rows: 30,
    cwd: projectPath,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
    },
  });

  sessions.set(sessionId, { pty: ptyProcess, ws });

  // Send PTY output to WebSocket
  ptyProcess.onData((data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'output', data }));
    }
  });

  ptyProcess.onExit(({ exitCode }) => {
    ws.send(JSON.stringify({ type: 'exit', exitCode }));
    sessions.delete(sessionId);
  });

  // Handle WebSocket messages
  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message.toString());
      switch (msg.type) {
        case 'input':
          ptyProcess.write(msg.data);
          break;
        case 'resize':
          ptyProcess.resize(msg.cols, msg.rows);
          break;
        case 'restart-claude':
          // Kill current process and start Claude CLI
          ptyProcess.write('\x03'); // Ctrl+C
          setTimeout(() => {
            ptyProcess.write('claude --dangerously-skip-permissions\n');
          }, 100);
          break;
      }
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  });

  ws.on('close', () => {
    ptyProcess.kill();
    sessions.delete(sessionId);
  });

  // Send connected message
  ws.send(JSON.stringify({
    type: 'connected',
    sessionId,
    cwd: projectPath
  }));
});

const PORT = process.env.TERMINAL_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Terminal server running on port ${PORT}`);
});
```

#### 1.2 Update Frontend Terminal Service

Replace mock with real WebSocket connection:

**File: `src/lib/ide/services/terminal.ts`**

```typescript
export class RealTerminalService implements ITerminalService {
  private ws: WebSocket | null = null;
  private projectPath: string;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
  }

  connect(): void {
    const wsUrl = `ws://localhost:3001/ws/terminal?path=${encodeURIComponent(this.projectPath)}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => this.emit('open');
    this.ws.onclose = () => this.emit('close');
    this.ws.onerror = (e) => this.emit('error', e);
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'output') {
        this.emit('data', msg.data);
      }
    };
  }

  send(data: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'input', data }));
    }
  }

  resize(cols: number, rows: number): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'resize', cols, rows }));
    }
  }

  startClaude(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'restart-claude' }));
    }
  }
}
```

### Phase 2: File System API

#### 2.1 Create File System Routes

**File: `src/app/api/files/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const PROJECT_ROOT = process.cwd();

// Prevent path traversal attacks
function safePath(filePath: string): string {
  const resolved = path.resolve(PROJECT_ROOT, filePath);
  if (!resolved.startsWith(PROJECT_ROOT)) {
    throw new Error('Invalid path');
  }
  return resolved;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path') || '.';

  try {
    const safe = safePath(filePath);
    const stat = await fs.stat(safe);

    if (stat.isDirectory()) {
      const entries = await fs.readdir(safe, { withFileTypes: true });
      return NextResponse.json({
        type: 'directory',
        entries: entries.map(e => ({
          name: e.name,
          type: e.isDirectory() ? 'directory' : 'file',
          path: path.join(filePath, e.name),
        })),
      });
    } else {
      const content = await fs.readFile(safe, 'utf-8');
      return NextResponse.json({ type: 'file', content });
    }
  } catch (error) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

export async function POST(request: Request) {
  const { path: filePath, content } = await request.json();

  try {
    const safe = safePath(filePath);
    await fs.writeFile(safe, content, 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to write file' }, { status: 500 });
  }
}
```

#### 2.2 Create File Tree Route

**File: `src/app/api/files/tree/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface TreeNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: TreeNode[];
}

const IGNORE_PATTERNS = [
  'node_modules', '.git', '.next', 'dist', 'build', '.turbo',
  '.vercel', '.DS_Store', '*.log'
];

async function buildTree(dirPath: string, basePath: string = ''): Promise<TreeNode[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const nodes: TreeNode[] = [];

  for (const entry of entries) {
    if (IGNORE_PATTERNS.some(p =>
      p.includes('*') ? entry.name.endsWith(p.replace('*', '')) : entry.name === p
    )) continue;

    const entryPath = path.join(basePath, entry.name);
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        type: 'directory',
        path: entryPath,
        children: await buildTree(fullPath, entryPath),
      });
    } else {
      nodes.push({
        name: entry.name,
        type: 'file',
        path: entryPath,
      });
    }
  }

  return nodes.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'directory' ? -1 : 1;
  });
}

export async function GET() {
  try {
    const tree = await buildTree(process.cwd());
    return NextResponse.json({ tree });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read directory' }, { status: 500 });
  }
}
```

### Phase 3: Project Configuration

#### 3.1 Project Path Selection

The IDE needs to know which project folder to work with. Create a configuration system:

**File: `src/app/api/project/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// Store active project path (in production, use proper session management)
let activeProjectPath = process.cwd();

export async function GET() {
  return NextResponse.json({
    path: activeProjectPath,
    name: path.basename(activeProjectPath),
  });
}

export async function POST(request: Request) {
  const { path: projectPath } = await request.json();

  try {
    const stat = await fs.stat(projectPath);
    if (!stat.isDirectory()) {
      return NextResponse.json({ error: 'Not a directory' }, { status: 400 });
    }
    activeProjectPath = projectPath;
    return NextResponse.json({ success: true, path: activeProjectPath });
  } catch {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
}
```

### Phase 4: Integration Points

#### 4.1 Start Claude CLI in Project Context

When terminal connects, automatically start Claude CLI in the project folder:

```typescript
// On terminal connection, send initial command
ws.send(JSON.stringify({
  type: 'input',
  data: `cd "${projectPath}" && claude --dangerously-skip-permissions\n`
}));
```

#### 4.2 Connect Preview to Dev Server

Detect running dev server and proxy to preview pane:

```typescript
// In terminal output handler, detect dev server
const portRegex = /localhost:(\d+)/;
const match = output.match(portRegex);
if (match) {
  setActivePort(parseInt(match[1]));
  // Preview iframe can now load localhost:port
}
```

## Implementation Order

### Sprint 1: Real Terminal (Critical)
1. [ ] Install dependencies: `node-pty`, `ws`
2. [ ] Create terminal server (`server/terminal-server.ts`)
3. [ ] Update TerminalService to use real WebSocket
4. [ ] Add npm script to start terminal server
5. [ ] Test real shell commands work

### Sprint 2: File System
1. [ ] Create `/api/files` route
2. [ ] Create `/api/files/tree` route
3. [ ] Update Editor pane to load real files
4. [ ] Implement file save functionality

### Sprint 3: Claude CLI Integration
1. [ ] Add "Start Claude" button to terminal
2. [ ] Auto-start Claude CLI option
3. [ ] Pass project path to Claude with `--add-dir`

### Sprint 4: Preview & Polish
1. [ ] Connect preview iframe to detected ports
2. [ ] Add project path selector
3. [ ] Persist terminal sessions across page reloads

## Quick Start Commands

```bash
# Install required packages
npm install node-pty ws @types/ws

# Add to package.json scripts
"scripts": {
  "terminal-server": "tsx server/terminal-server.ts",
  "dev:all": "concurrently \"npm run dev\" \"npm run terminal-server\""
}

# Start both servers
npm run dev:all
```

## Environment Variables

```env
# .env.local
TERMINAL_SERVER_PORT=3001
TERMINAL_WS_URL=ws://localhost:3001/ws/terminal
PROJECT_PATH=/Users/lawless/Documents/local-ide
```

## Files to Create/Modify

### New Files
- `server/terminal-server.ts` - WebSocket terminal server
- `src/app/api/files/route.ts` - File read/write API
- `src/app/api/files/tree/route.ts` - File tree API
- `src/app/api/project/route.ts` - Project path management

### Files to Modify
- `src/lib/ide/services/terminal.ts` - Replace mock with real WebSocket
- `src/app/ide/hooks/useTerminal.ts` - Connect to real terminal server
- `src/app/ide/components/panes/TerminalPane/index.tsx` - Add Claude start button
- `src/app/ide/components/panes/EditorPane/index.tsx` - Load real files
- `package.json` - Add dependencies and scripts

## Why This Works

1. **Real PTY**: `node-pty` allocates actual pseudo-terminals, so you get a real shell
2. **WebSocket**: Bidirectional communication for terminal I/O
3. **Project Context**: Terminal starts in project folder, Claude has file access
4. **File API**: Next.js API routes can access filesystem (server-side)
5. **Preview**: Once dev server detected, iframe can load localhost

## Testing Checklist

- [ ] Terminal shows real bash prompt (not `user@local-ide`)
- [ ] `ls` shows actual files in project
- [ ] `pwd` shows correct project path
- [ ] `claude --dangerously-skip-permissions` starts Claude CLI
- [ ] Claude can read/write files in project
- [ ] File tree shows real project structure
- [ ] Editor loads real file contents
- [ ] Saving file persists to disk
