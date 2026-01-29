/**
 * Terminal WebSocket Server
 *
 * This server provides real PTY (pseudo-terminal) connections via WebSocket.
 * It uses node-pty to spawn actual shell processes that can run any command,
 * including Claude CLI.
 *
 * Sessions are persisted to SQLite for reconnection support.
 */

import { WebSocketServer, WebSocket } from 'ws';
import * as pty from 'node-pty';
import { createServer, IncomingMessage } from 'http';
import { parse } from 'url';
import { execSync } from 'child_process';
import * as db from './database';

// =============================================================================
// TYPES
// =============================================================================

interface ActiveSession {
  pty: pty.IPty;
  ws: WebSocket | null;
  projectPath: string;
  outputBuffer: string;
  lastActivity: number;
  jsonMode?: boolean; // Use JSON output format for skin mode
}

interface TerminalMessage {
  type: 'input' | 'resize' | 'restart-claude' | 'ping' | 'get-output';
  data?: string;
  cols?: number;
  rows?: number;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const PORT = parseInt(process.env.TERMINAL_PORT || '4001', 10);
const DEFAULT_COLS = 120;
const DEFAULT_ROWS = 30;
const PING_INTERVAL = 30000; // 30 seconds
const SESSION_TIMEOUT = 600000; // 10 minutes of inactivity
const OUTPUT_BUFFER_MAX = 50000; // Keep last 50KB of output per session
const OUTPUT_SAVE_INTERVAL = 5000; // Save output to DB every 5 seconds

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

// In-memory active sessions (PTY processes)
const activeSessions = new Map<string, ActiveSession>();

// Track sessions with dirty output buffers
const dirtyOutputSessions = new Set<string>();

function generateSessionId(): string {
  return `term_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function cleanupSession(sessionId: string, removeFromDb: boolean = false, killTmux: boolean = false): void {
  const session = activeSessions.get(sessionId);
  if (session) {
    // Save final output before cleanup
    if (session.outputBuffer) {
      db.saveOutput(sessionId, session.outputBuffer);
    }

    try {
      session.pty.kill();  // Kill the PTY attachment, not tmux itself
    } catch (e) {
      // PTY already dead, ignore
    }
    activeSessions.delete(sessionId);
    dirtyOutputSessions.delete(sessionId);
    console.log(`[Terminal] Session ${sessionId} cleaned up from memory`);
  }

  // Only kill tmux if explicitly requested (e.g., "New Session" button)
  if (killTmux && isTmuxAvailable()) {
    killTmuxSession(sessionId);
  }

  if (removeFromDb) {
    db.removeSession(sessionId);
    console.log(`[Terminal] Session ${sessionId} removed from database`);
  } else {
    // Mark as inactive but keep in database for potential reconnection
    db.markSessionInactive(sessionId);
  }
}

// Periodically save dirty output buffers to database
setInterval(() => {
  for (const sessionId of dirtyOutputSessions) {
    const session = activeSessions.get(sessionId);
    if (session) {
      db.saveOutput(sessionId, session.outputBuffer);
    }
  }
  dirtyOutputSessions.clear();
}, OUTPUT_SAVE_INTERVAL);

// Cleanup inactive sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of activeSessions) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      console.log(`[Terminal] Session ${sessionId} timed out`);
      cleanupSession(sessionId, false); // Keep in DB for later reconnection
    }
  }

  // Also cleanup very old inactive sessions from database
  const cleaned = db.cleanupSessions();
  if (cleaned > 0) {
    console.log(`[Terminal] Cleaned up ${cleaned} old sessions from database`);
  }
}, 60000); // Check every minute

// =============================================================================
// TMUX SESSION MANAGEMENT
// =============================================================================

let tmuxAvailable: boolean | null = null;

// Common tmux paths to check
const TMUX_PATHS = [
  'tmux',                        // System PATH
  '/opt/homebrew/bin/tmux',      // macOS Homebrew (Apple Silicon)
  '/usr/local/bin/tmux',         // macOS Homebrew (Intel) / Linux
  '/usr/bin/tmux',               // Linux system
];

let tmuxPath: string | null = null;

function findTmux(): string | null {
  for (const path of TMUX_PATHS) {
    try {
      execSync(`${path} -V`, { stdio: 'ignore' });
      return path;
    } catch {
      // Try next path
    }
  }
  return null;
}

function isTmuxAvailable(): boolean {
  if (tmuxAvailable !== null) return tmuxAvailable;

  tmuxPath = findTmux();
  tmuxAvailable = tmuxPath !== null;

  if (tmuxAvailable) {
    console.log(`[Terminal] tmux is available at ${tmuxPath} - sessions will persist across page reloads`);
  } else {
    console.warn('[Terminal] tmux not found - sessions will not persist across page reloads');
  }
  return tmuxAvailable;
}

function getTmuxSessionName(sessionId: string): string {
  // Create a safe tmux session name from session ID
  return `lide_${sessionId.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}`;
}

function tmuxSessionExists(tmuxName: string): boolean {
  if (!tmuxPath) return false;
  try {
    execSync(`${tmuxPath} has-session -t ${tmuxName} 2>/dev/null`, { stdio: 'ignore' });
    console.log(`[Terminal] tmux session exists: ${tmuxName}`);
    return true;
  } catch {
    console.log(`[Terminal] tmux session does not exist: ${tmuxName}`);
    return false;
  }
}

function killTmuxSession(sessionId: string): void {
  if (!tmuxPath) return;
  const tmuxName = getTmuxSessionName(sessionId);
  try {
    execSync(`${tmuxPath} kill-session -t ${tmuxName} 2>/dev/null`, { stdio: 'ignore' });
    console.log(`[Terminal] Killed tmux session: ${tmuxName}`);
  } catch {
    // tmux session may not exist, ignore
  }
}

function spawnPtyWithTmux(
  projectPath: string,
  sessionId: string,
  cols: number = DEFAULT_COLS,
  rows: number = DEFAULT_ROWS
): { pty: pty.IPty; isExistingTmux: boolean } {
  if (!tmuxPath) {
    throw new Error('tmux not available');
  }

  const tmuxName = getTmuxSessionName(sessionId);
  const existingTmux = tmuxSessionExists(tmuxName);

  if (!existingTmux) {
    // Create new tmux session in background
    // Quote projectPath to handle paths with spaces
    execSync(`${tmuxPath} new-session -d -s ${tmuxName} -c ${JSON.stringify(projectPath)}`, { stdio: 'ignore' });
    console.log(`[Terminal] Created new tmux session: ${tmuxName}`);
  } else {
    console.log(`[Terminal] Reattaching to existing tmux session: ${tmuxName}`);
  }

  // Spawn PTY that attaches to the tmux session
  const ptyProcess = pty.spawn(tmuxPath, ['attach-session', '-t', tmuxName], {
    name: 'xterm-256color',
    cols,
    rows,
    cwd: projectPath,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
    },
  });

  return { pty: ptyProcess, isExistingTmux: existingTmux };
}

// =============================================================================
// PTY MANAGEMENT
// =============================================================================

function isPtyDead(ptyProcess: pty.IPty): boolean {
  try {
    // Try to send a signal 0 to check if process exists
    // This doesn't actually send a signal, just checks if process is alive
    process.kill(ptyProcess.pid, 0);
    return false; // Process is alive
  } catch {
    return true; // Process is dead
  }
}

function spawnPty(
  projectPath: string,
  cols: number = DEFAULT_COLS,
  rows: number = DEFAULT_ROWS
): pty.IPty {
  // Use bash as it's more reliable with node-pty
  const shell = process.platform === 'win32'
    ? 'powershell.exe'
    : '/bin/bash';

  console.log(`[Terminal] Spawning ${shell} in ${projectPath}`);

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols,
    rows,
    cwd: projectPath,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      SHELL: shell,
      // Ensure Claude CLI can be found
      PATH: `${process.env.PATH}:/usr/local/bin:/opt/homebrew/bin`,
    },
  });

  return ptyProcess;
}

// =============================================================================
// WEBSOCKET SERVER
// =============================================================================

const server = createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      activeSessions: activeSessions.size,
      totalSessions: db.findActiveSessions().length,
      uptime: process.uptime(),
    }));
    return;
  }

  // List sessions endpoint
  if (req.url === '/sessions') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    const sessions = db.findActiveSessions();
    res.end(JSON.stringify({
      sessions: sessions.map(s => ({
        ...s,
        isLive: activeSessions.has(s.session_id),
      })),
    }));
    return;
  }

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // Save output endpoint (for sendBeacon on page unload)
  if (req.url?.startsWith('/save-output')) {
    const url = parse(req.url, true);
    const sessionId = url.query.session as string;
    if (sessionId) {
      const session = activeSessions.get(sessionId);
      if (session?.outputBuffer) {
        db.saveOutput(sessionId, session.outputBuffer);
        console.log(`[Terminal] Saved output for session ${sessionId} (${session.outputBuffer.length} bytes)`);
      }
    }
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ saved: true }));
    return;
  }

  // Kill session endpoint (for "New Session" button - kills tmux too)
  if (req.url?.startsWith('/kill-session')) {
    const url = parse(req.url, true);
    const sessionId = url.query.session as string;
    if (sessionId) {
      cleanupSession(sessionId, true, true);  // removeFromDb=true, killTmux=true
      console.log(`[Terminal] Killed session ${sessionId} (including tmux)`);
    }
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ killed: true }));
    return;
  }

  // Get session output endpoint (for restoring output before WebSocket connect)
  if (req.url?.startsWith('/output')) {
    const url = parse(req.url, true);
    const sessionId = url.query.session as string;
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    if (sessionId) {
      // Check in-memory first, then database
      const activeSession = activeSessions.get(sessionId);
      const output = activeSession?.outputBuffer || db.loadOutput(sessionId);
      res.end(JSON.stringify({
        sessionId,
        output: output || '',
        source: activeSession ? 'memory' : 'database',
      }));
    } else {
      res.end(JSON.stringify({ error: 'Session ID required' }));
    }
    return;
  }

  // Check if tmux session exists (SOURCE OF TRUTH for session persistence)
  if (req.url?.startsWith('/tmux-check')) {
    const url = parse(req.url, true);
    const sessionId = url.query.session as string;
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    if (sessionId) {
      const tmuxName = getTmuxSessionName(sessionId);
      const exists = isTmuxAvailable() && tmuxSessionExists(tmuxName);
      console.log(`[Terminal] tmux-check: session=${sessionId}, tmux=${tmuxName}, exists=${exists}`);
      res.end(JSON.stringify({
        sessionId,
        tmuxName,
        exists,
      }));
    } else {
      res.end(JSON.stringify({ error: 'Session ID required', exists: false }));
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const wss = new WebSocketServer({ server, path: '/ws/terminal' });

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  const url = parse(req.url || '', true);
  const query = url.query;

  // Extract connection parameters
  const requestedSessionId = query.session as string | undefined;
  // Use IDE_PROJECT_PATH if set, otherwise fall back to query param or cwd
  const defaultProjectPath = process.env.IDE_PROJECT_PATH || process.cwd();
  const projectPath = (query.path as string) || defaultProjectPath;
  const cols = parseInt(query.cols as string, 10) || DEFAULT_COLS;
  const rows = parseInt(query.rows as string, 10) || DEFAULT_ROWS;
  const startClaude = query.startClaude === 'true';
  const jsonMode = query.jsonMode === 'true'; // Use --output-format stream-json for skin mode

  // Claude command with optional JSON output
  const claudeCommand = jsonMode
    ? 'claude --dangerously-skip-permissions --output-format stream-json\n'
    : 'claude --dangerously-skip-permissions\n';

  let sessionId: string;
  let isReconnection = false;
  let session: ActiveSession;

  // Check if reconnecting to existing session
  if (requestedSessionId) {
    const existingActive = activeSessions.get(requestedSessionId);
    const existingDb = db.findSession(requestedSessionId);
    const tmuxName = getTmuxSessionName(requestedSessionId);
    const tmuxExists = isTmuxAvailable() && tmuxSessionExists(tmuxName);

    console.log(`[Terminal] Connection request: session=${requestedSessionId}`);
    console.log(`[Terminal]   - existingActive: ${!!existingActive}`);
    console.log(`[Terminal]   - existingDb: ${!!existingDb}`);
    console.log(`[Terminal]   - tmuxExists: ${tmuxExists} (${tmuxName})`);
    console.log(`[Terminal]   - startClaude: ${startClaude}`);
    console.log(`[Terminal]   - jsonMode: ${jsonMode}`);

    if (existingActive) {
      // Check if PTY is still alive
      let ptyAlive = false;
      try {
        // Check if the process is still running
        ptyAlive = existingActive.pty.pid > 0 && !isPtyDead(existingActive.pty);
      } catch {
        ptyAlive = false;
      }

      if (ptyAlive) {
        // Reconnect to live session with working PTY
        console.log(`[Terminal] Reconnecting to live session ${requestedSessionId} (PTY alive)`);
        sessionId = requestedSessionId;
        session = existingActive;
        session.ws = ws;
        session.lastActivity = Date.now();
        isReconnection = true;

        // Send buffered output
        if (session.outputBuffer) {
          ws.send(JSON.stringify({ type: 'output', data: session.outputBuffer }));
        }
      } else {
        // PTY is dead - need to respawn and reattach to tmux if it exists
        console.log(`[Terminal] Session ${requestedSessionId} PTY is dead, checking tmux...`);
        sessionId = requestedSessionId;

        // Clean up the dead session from memory (but don't kill tmux or remove from DB)
        activeSessions.delete(requestedSessionId);

        if (isTmuxAvailable()) {
          const { pty: ptyProcess, isExistingTmux } = spawnPtyWithTmux(
            existingActive.projectPath,
            sessionId,
            cols,
            rows
          );
          isReconnection = isExistingTmux;

          session = {
            pty: ptyProcess,
            ws,
            projectPath: existingActive.projectPath,
            outputBuffer: existingActive.outputBuffer, // Keep the old output buffer
            lastActivity: Date.now(),
          };

          activeSessions.set(sessionId, session);
          setupPtyHandlers(sessionId, ptyProcess, ws);

          if (isExistingTmux) {
            console.log(`[Terminal] Reattached to existing tmux session`);
            ws.send(JSON.stringify({
              type: 'output',
              data: '\r\n[Reconnected to existing terminal session]\r\n',
            }));
          } else {
            console.log(`[Terminal] tmux session was gone, created new one`);
            // tmux session was gone, start fresh
            if (startClaude) {
              setTimeout(() => {
                ptyProcess.write(claudeCommand);
              }, 500);
            }
          }
        } else {
          // No tmux, create new regular session
          session = createNewSession(sessionId, existingActive.projectPath, cols, rows, ws, startClaude, jsonMode);
        }
      }
    } else if (existingDb) {
      // Session exists in DB but PTY is dead - restore it using tmux
      console.log(`[Terminal] Restoring session ${requestedSessionId} from database`);
      sessionId = requestedSessionId;

      // Use tmux for persistence if available
      if (isTmuxAvailable()) {
        const { pty: ptyProcess, isExistingTmux } = spawnPtyWithTmux(
          existingDb.project_path,
          sessionId,
          existingDb.cols,
          existingDb.rows
        );
        isReconnection = isExistingTmux;
        const savedOutput = db.loadOutput(sessionId);

        session = {
          pty: ptyProcess,
          ws,
          projectPath: existingDb.project_path,
          outputBuffer: savedOutput,
          lastActivity: Date.now(),
        };

        activeSessions.set(sessionId, session);
        setupPtyHandlers(sessionId, ptyProcess, ws);

        // Only send saved output if it's a truly new connection (tmux didn't exist)
        // If tmux exists, the terminal state is already there
        if (!isExistingTmux && savedOutput) {
          ws.send(JSON.stringify({
            type: 'output',
            data: '\r\n[Session restored from saved output]\r\n' + savedOutput,
          }));
        } else if (isExistingTmux) {
          // Existing tmux session - user will see their actual terminal state
          ws.send(JSON.stringify({
            type: 'output',
            data: '\r\n[Reconnected to existing terminal session]\r\n',
          }));
        }

        // Only start Claude on NEW tmux sessions, not when reattaching
        if (!isExistingTmux && startClaude) {
          setTimeout(() => {
            ptyProcess.write(claudeCommand);
          }, 500);
        }
      } else {
        // Fallback: no tmux available, use regular PTY
        isReconnection = true;
        const ptyProcess = spawnPty(existingDb.project_path, existingDb.cols, existingDb.rows);
        const savedOutput = db.loadOutput(sessionId);

        session = {
          pty: ptyProcess,
          ws,
          projectPath: existingDb.project_path,
          outputBuffer: savedOutput,
          lastActivity: Date.now(),
        };

        activeSessions.set(sessionId, session);
        setupPtyHandlers(sessionId, ptyProcess, ws);

        // Send saved output to client
        if (savedOutput) {
          ws.send(JSON.stringify({
            type: 'output',
            data: '\r\n[Session restored]\r\n' + savedOutput,
          }));
        }
      }
    } else {
      // Session not found, create new one with requested ID
      sessionId = requestedSessionId;
      session = createNewSession(sessionId, projectPath, cols, rows, ws, startClaude, jsonMode);
    }
  } else {
    // Create new session
    sessionId = generateSessionId();
    session = createNewSession(sessionId, projectPath, cols, rows, ws, startClaude, jsonMode);
  }

  console.log(`[Terminal] Connection established: session=${sessionId}, reconnect=${isReconnection}`);

  // Update database
  db.touchSession(sessionId);

  // Send connected message
  ws.send(JSON.stringify({
    type: 'connected',
    sessionId,
    cwd: session.projectPath,
    reconnected: isReconnection,
  }));

  // Handle WebSocket messages
  ws.on('message', (message: Buffer | string) => {
    try {
      const msg: TerminalMessage = JSON.parse(message.toString());
      const currentSession = activeSessions.get(sessionId);

      if (!currentSession) {
        ws.send(JSON.stringify({ type: 'error', message: 'Session not found' }));
        return;
      }

      currentSession.lastActivity = Date.now();
      db.touchSession(sessionId);

      switch (msg.type) {
        case 'input':
          if (msg.data) {
            currentSession.pty.write(msg.data);
          }
          break;

        case 'resize':
          if (msg.cols && msg.rows) {
            currentSession.pty.resize(msg.cols, msg.rows);
            db.resizeSession(sessionId, msg.cols, msg.rows);
          }
          break;

        case 'restart-claude':
          // Send Ctrl+C to kill current process, then start Claude
          currentSession.pty.write('\x03'); // Ctrl+C
          setTimeout(() => {
            const cmd = currentSession.jsonMode
              ? 'claude --dangerously-skip-permissions --output-format stream-json\n'
              : 'claude --dangerously-skip-permissions\n';
            currentSession.pty.write(cmd);
          }, 100);
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        case 'get-output':
          // Send current output buffer
          ws.send(JSON.stringify({
            type: 'output-buffer',
            data: currentSession.outputBuffer,
          }));
          break;

        default:
          console.warn(`[Terminal] Unknown message type: ${(msg as any).type}`);
      }
    } catch (e) {
      console.error('[Terminal] Failed to parse message:', e);
    }
  });

  // Handle WebSocket close
  ws.on('close', () => {
    console.log(`[Terminal] WebSocket closed for session ${sessionId}`);
    const currentSession = activeSessions.get(sessionId);
    if (currentSession) {
      currentSession.ws = null;
      // Save output immediately on disconnect
      db.saveOutput(sessionId, currentSession.outputBuffer);
    }
    // Don't immediately clean up - allow reconnection window
  });

  // Handle WebSocket error
  ws.on('error', (error: Error) => {
    console.error(`[Terminal] WebSocket error for session ${sessionId}:`, error);
  });
});

function createNewSession(
  sessionId: string,
  projectPath: string,
  cols: number,
  rows: number,
  ws: WebSocket,
  startClaude: boolean,
  jsonMode: boolean = false
): ActiveSession {
  // Create in database first
  db.createSession(sessionId, projectPath, cols, rows);

  let ptyProcess: pty.IPty;
  let isExistingTmux = false;

  try {
    // Use tmux for persistence if available
    if (isTmuxAvailable()) {
      const result = spawnPtyWithTmux(projectPath, sessionId, cols, rows);
      ptyProcess = result.pty;
      isExistingTmux = result.isExistingTmux;
    } else {
      ptyProcess = spawnPty(projectPath, cols, rows);
    }
  } catch (error) {
    console.error('[Terminal] Failed to spawn PTY:', error);
    // Send error to client
    ws.send(JSON.stringify({
      type: 'error',
      message: `Failed to spawn terminal: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }));
    // Clean up and throw
    db.removeSession(sessionId);
    throw error;
  }

  const session: ActiveSession = {
    pty: ptyProcess,
    ws,
    projectPath,
    outputBuffer: '',
    lastActivity: Date.now(),
    jsonMode,
  };

  activeSessions.set(sessionId, session);
  setupPtyHandlers(sessionId, ptyProcess, ws);

  // Start Claude CLI if requested AND this is not an existing tmux session
  if (startClaude && !isExistingTmux) {
    const claudeCmd = jsonMode
      ? 'claude --dangerously-skip-permissions --output-format stream-json\n'
      : 'claude --dangerously-skip-permissions\n';
    setTimeout(() => {
      ptyProcess.write(claudeCmd);
    }, 500);
  }

  return session;
}

function setupPtyHandlers(sessionId: string, ptyProcess: pty.IPty, initialWs: WebSocket): void {
  // Forward PTY output to WebSocket and buffer
  ptyProcess.onData((data: string) => {
    const session = activeSessions.get(sessionId);
    if (!session) return;

    // Append to output buffer (with size limit)
    session.outputBuffer += data;
    if (session.outputBuffer.length > OUTPUT_BUFFER_MAX) {
      session.outputBuffer = session.outputBuffer.slice(-OUTPUT_BUFFER_MAX);
    }

    // Mark as dirty for periodic save
    dirtyOutputSessions.add(sessionId);

    // Send to connected WebSocket
    if (session.ws?.readyState === WebSocket.OPEN) {
      session.ws.send(JSON.stringify({ type: 'output', data }));
    }

    session.lastActivity = Date.now();
  });

  // Handle PTY exit
  ptyProcess.onExit(({ exitCode, signal }) => {
    console.log(`[Terminal] PTY exited: session=${sessionId}, code=${exitCode}, signal=${signal}`);
    const session = activeSessions.get(sessionId);
    if (session?.ws?.readyState === WebSocket.OPEN) {
      session.ws.send(JSON.stringify({ type: 'exit', exitCode, signal }));
    }
    cleanupSession(sessionId, false); // Keep in DB
  });
}

// =============================================================================
// PING/PONG HEARTBEAT
// =============================================================================

const pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  });
}, PING_INTERVAL);

wss.on('close', () => {
  clearInterval(pingInterval);
});

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

function shutdown(): void {
  console.log('[Terminal] Shutting down...');

  // Save all output buffers
  for (const [sessionId, session] of activeSessions) {
    if (session.outputBuffer) {
      db.saveOutput(sessionId, session.outputBuffer);
    }
    db.markSessionInactive(sessionId);
    try {
      session.pty.kill();
    } catch (e) {
      // Ignore
    }
  }
  activeSessions.clear();

  // Close WebSocket server
  wss.close(() => {
    server.close(() => {
      console.log('[Terminal] Server shut down');
      db.closeDatabase();
      process.exit(0);
    });
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// =============================================================================
// START SERVER
// =============================================================================

// Log existing sessions on startup
const existingSessions = db.findActiveSessions();
console.log(`[Terminal] Found ${existingSessions.length} existing sessions in database`);

const DEFAULT_PROJECT_PATH = process.env.IDE_PROJECT_PATH || process.cwd();

server.listen(PORT, () => {
  console.log(`
================================================================================
  Terminal Server Started (with SQLite persistence)
================================================================================

  WebSocket URL: ws://localhost:${PORT}/ws/terminal
  Health Check:  http://localhost:${PORT}/health
  Sessions List: http://localhost:${PORT}/sessions

  Project Path:  ${DEFAULT_PROJECT_PATH}
  ${process.env.IDE_PROJECT_PATH ? '(set via IDE_PROJECT_PATH)' : '(using current directory)'}

  Query Parameters:
    - path:        Project directory (default: ${DEFAULT_PROJECT_PATH})
    - session:     Session ID for reconnection
    - cols:        Terminal columns (default: 120)
    - rows:        Terminal rows (default: 30)
    - startClaude: Auto-start Claude CLI (default: false)

  Features:
    - Session persistence across server restarts
    - Output buffer saved to SQLite
    - Automatic reconnection with history restore

  Database: .local-ide/data/terminal.db

================================================================================
`);
});
