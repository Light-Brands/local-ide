# IDE Isolation Architecture Plan

## Problem Statement

Currently, the IDE runs from within the same directory as the project being edited. This causes several issues:

1. **Port conflicts**: Running `npm run dev` might start the IDE instead of the project
2. **File confusion**: IDE source files appear in the file browser
3. **Process confusion**: Terminal commands affect the IDE's node_modules
4. **Package.json conflicts**: IDE dependencies mix with project dependencies

## Goal

Completely isolate the IDE application from the projects being developed, similar to how VS Code or other IDEs work - the IDE is a separate application that "opens" projects.

---

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOCAL IDE                                │
│  (Installed at ~/.local-ide or /usr/local/lib/local-ide)        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Next.js    │  │   Terminal   │  │    File      │           │
│  │   Server     │  │   Server     │  │   Watcher    │           │
│  │   :4000      │  │   :4001      │  │              │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│         │                 │                  │                   │
│         └─────────────────┴──────────────────┘                   │
│                           │                                      │
│                    Project Context                               │
│                    (passed as arg)                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      USER PROJECT                                │
│           (e.g., ~/projects/my-awesome-app)                     │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ package.json │  │    src/      │  │  .env.local  │           │
│  │ (project's)  │  │              │  │  (project's) │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  Dev servers run here: :3000, :3001, etc.                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Options

### Option A: Global CLI Tool (Recommended)

The IDE becomes an installable CLI tool that can be run from anywhere.

**Installation:**
```bash
# Install globally
npm install -g @local-ide/cli

# Or run with npx
npx local-ide

# Or install to user directory
~/.local-ide/
```

**Usage:**
```bash
# Start IDE and open current directory
local-ide .

# Start IDE and open specific project
local-ide ~/projects/my-app

# Start IDE without a project (shows project picker)
local-ide
```

**Pros:**
- Clean separation
- Familiar pattern (like `code .` for VS Code)
- Single installation, multiple projects

**Cons:**
- Requires npm publish or manual installation
- Updates require reinstallation

---

### Option B: Docker Container

The IDE runs in a Docker container with the project mounted.

**Usage:**
```bash
docker run -p 4000:4000 -v $(pwd):/workspace local-ide
```

**Pros:**
- Complete isolation
- Consistent environment
- Easy deployment

**Cons:**
- Requires Docker
- Slightly more complex setup
- File permission issues on some systems

---

### Option C: Electron Desktop App

Package the IDE as a standalone desktop application.

**Pros:**
- Native app experience
- Complete isolation
- Can integrate with OS (file associations, etc.)

**Cons:**
- Larger bundle size
- More complex build process
- Different deployment model

---

## Recommended Approach: Option A (Global CLI)

### Phase 1: Restructure for External Installation

1. **Create CLI entry point**
   ```
   packages/
   ├── cli/                    # The CLI launcher
   │   ├── package.json
   │   ├── bin/
   │   │   └── local-ide.js   # Entry point
   │   └── src/
   │       └── index.ts
   │
   └── ide/                    # The IDE application
       ├── package.json
       ├── next.config.ts
       └── src/
           └── app/
   ```

2. **CLI responsibilities:**
   - Parse command line arguments (project path)
   - Start the IDE server
   - Start the terminal server with correct working directory
   - Open browser to IDE URL

3. **Environment variables:**
   ```
   IDE_PROJECT_PATH=/Users/me/projects/my-app
   IDE_PORT=4000
   TERMINAL_PORT=4001
   ```

### Phase 2: Update IDE to Use Project Context

1. **File browser**: Only shows files from `IDE_PROJECT_PATH`
2. **Terminal**: Opens with `cwd` set to `IDE_PROJECT_PATH`
3. **Port scanner**: Scans ports but filters out IDE's own port
4. **Git integration**: Uses project's git repo, not IDE's

### Phase 3: Project Picker UI

1. **No project specified**: Show project picker
   - Recent projects
   - Browse for folder
   - Clone from Git

2. **Project switching**: Ability to switch projects without restarting IDE

### Phase 4: Multi-Project Support (Future)

1. **Workspaces**: Open multiple projects in tabs
2. **Project templates**: Create new projects from templates

---

## Implementation Details

### CLI Entry Point (`bin/local-ide.js`)

```javascript
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const open = require('open');

const projectPath = process.argv[2] || process.cwd();
const resolvedPath = path.resolve(projectPath);

// Validate project path exists
if (!fs.existsSync(resolvedPath)) {
  console.error(`Error: Path does not exist: ${resolvedPath}`);
  process.exit(1);
}

// Set environment
process.env.IDE_PROJECT_PATH = resolvedPath;
process.env.IDE_PORT = process.env.IDE_PORT || '4000';
process.env.TERMINAL_PORT = process.env.TERMINAL_PORT || '4001';

// Start IDE server
const ideDir = path.join(__dirname, '..', 'ide');
const ideProcess = spawn('npm', ['run', 'start'], {
  cwd: ideDir,
  env: process.env,
  stdio: 'inherit'
});

// Start terminal server
const terminalProcess = spawn('node', ['server/terminal-server.js'], {
  cwd: ideDir,
  env: process.env,
  stdio: 'inherit'
});

// Open browser
setTimeout(() => {
  open(`http://localhost:${process.env.IDE_PORT}/ide`);
}, 2000);

// Handle shutdown
process.on('SIGINT', () => {
  ideProcess.kill();
  terminalProcess.kill();
  process.exit();
});
```

### Updated Terminal Server

```typescript
// server/terminal-server.ts
const PROJECT_PATH = process.env.IDE_PROJECT_PATH || process.cwd();

// When spawning shell, use project path
const shell = pty.spawn(shellPath, [], {
  name: 'xterm-256color',
  cols: 80,
  rows: 24,
  cwd: PROJECT_PATH,  // <-- Key change
  env: {
    ...process.env,
    HOME: process.env.HOME,
  },
});
```

### Updated File API

```typescript
// src/app/api/files/route.ts
const PROJECT_PATH = process.env.IDE_PROJECT_PATH || process.cwd();

// Ensure all file operations are scoped to project
function resolvePath(relativePath: string): string {
  const resolved = path.resolve(PROJECT_PATH, relativePath);

  // Security: Prevent path traversal outside project
  if (!resolved.startsWith(PROJECT_PATH)) {
    throw new Error('Access denied: Path outside project');
  }

  return resolved;
}
```

---

## Directory Structure After Refactor

```
local-ide/
├── packages/
│   ├── cli/
│   │   ├── package.json        # @local-ide/cli
│   │   ├── bin/
│   │   │   └── local-ide.js
│   │   └── tsconfig.json
│   │
│   └── ide/
│       ├── package.json        # @local-ide/ide
│       ├── next.config.ts
│       ├── server/
│       │   └── terminal-server.ts
│       └── src/
│           └── app/
│
├── package.json                # Workspace root
├── turbo.json                  # Turborepo config (optional)
└── README.md
```

---

## Migration Steps

### Step 1: Create Monorepo Structure
- [ ] Initialize packages directory
- [ ] Move IDE code to `packages/ide`
- [ ] Create `packages/cli` with launcher

### Step 2: Add Project Path Support
- [ ] Add `IDE_PROJECT_PATH` environment variable
- [ ] Update terminal server to use project path
- [ ] Update file API to scope to project path
- [ ] Update file tree to only show project files

### Step 3: Create CLI
- [ ] Build CLI entry point
- [ ] Add argument parsing (project path, port overrides)
- [ ] Add project validation
- [ ] Add browser auto-open

### Step 4: Update Port Handling
- [ ] IDE always runs on configurable port (default 4000)
- [ ] Terminal server on configurable port (default 4001)
- [ ] Port scanner excludes IDE ports
- [ ] Preview shows only project ports (3000-3999)

### Step 5: Add Project Picker (Optional)
- [ ] Create project picker UI
- [ ] Store recent projects
- [ ] Add "Open Folder" functionality

### Step 6: Package for Distribution
- [ ] Publish CLI to npm
- [ ] Create installation instructions
- [ ] Add update mechanism

---

## Quick Win: Minimal Changes for Immediate Isolation

If full refactor is too much, here's a minimal approach:

1. **Add `IDE_PROJECT_PATH` support to existing code**
2. **Update terminal server to use it**
3. **Update file APIs to use it**
4. **Run IDE with environment variable:**

```bash
# Start IDE pointing to different project
IDE_PROJECT_PATH=/path/to/my-project npm run dev
```

This gives immediate isolation without restructuring.

---

## Questions to Consider

1. **Single vs Multi-project?** Should IDE support multiple projects open at once?
2. **Installation location?** Global npm, user directory, or system-wide?
3. **Update strategy?** Auto-update, manual, or version pinning?
4. **Settings scope?** Per-project settings vs global IDE settings?

---

## Next Steps

1. Decide on approach (full refactor vs quick win)
2. Implement `IDE_PROJECT_PATH` support as first step
3. Test with external project
4. Iterate on CLI experience
