/**
 * Chat WebSocket Server
 *
 * Provides persistent AI chat via tmux + Claude CLI.
 * Sessions survive browser disconnection with output buffering
 * and reconnection support.
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

// Claude CLI visual state indicators
type ClaudeState =
  | 'idle'           // Ready for input (⏵⏵ bypass permissions)
  | 'thinking'       // Thinking/Precipitating
  | 'responding'     // Generating response (⏺)
  | 'tool_running'   // Running a tool (Search, Edit, etc.)
  | 'waiting_confirm' // Waiting for paste confirmation
  | 'unknown';

interface ActiveChatSession {
  claudePty: pty.IPty;
  ws: WebSocket | null;
  projectPath: string;
  outputBuffer: string;         // Current streaming response buffer
  messages: db.ChatMessage[];   // Conversation history
  isResponding: boolean;        // Claude generating response
  lastActivity: number;
  // New fields for enhanced tracking
  claudeState: ClaudeState;     // Current Claude CLI state
  lastStateChange: number;      // Timestamp of last state change
  pasteConfirmTimers: NodeJS.Timeout[]; // Timers for paste confirmation backoff
  lastOutputTime: number;       // Last time we received output
  currentTool: string | null;   // Currently running tool name
}

interface ChatClientMessage {
  type: 'input' | 'abort' | 'ping' | 'get-history' | 'send-enter' | 'kill-session' | 'get-status';
  data?: string;
}

interface ChatServerMessage {
  type: 'connected' | 'text' | 'thinking' | 'tool_use_start' | 'tool_use_end' |
        'tool_use_output' | 'done' | 'error' | 'history' | 'output-buffer' | 'pong' |
        'status' | 'state-change';
  sessionId?: string;
  reconnected?: boolean;
  content?: string;
  id?: string;
  tool?: string;
  input?: Record<string, unknown>;
  status?: 'success' | 'error';
  output?: string;
  error?: string;
  messages?: db.ChatMessage[];
  data?: string;
  // New fields for status updates
  claudeState?: ClaudeState;
  currentTool?: string | null;
  lastActivity?: number;
  isStuck?: boolean;
  stuckDuration?: number;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const PORT = parseInt(process.env.CHAT_PORT || '4002', 10);
const PING_INTERVAL = 30000; // 30 seconds
const SESSION_TIMEOUT = 600000; // 10 minutes of inactivity
const OUTPUT_BUFFER_MAX = 100000; // Keep last 100KB of output per session
const OUTPUT_SAVE_INTERVAL = 5000; // Save output to DB every 5 seconds

// Paste confirmation backoff timers (in ms)
const PASTE_CONFIRM_BACKOFF = [3000, 5000, 10000, 20000];
// Stuck detection threshold (no output for this long = stuck)
const STUCK_THRESHOLD = 30000; // 30 seconds

// =============================================================================
// CLAUDE CLI STATE PARSING
// =============================================================================

/**
 * Parse Claude CLI visual output to determine current state.
 * Claude CLI shows different indicators for different states:
 * - ⏺ = Claude is responding/generating
 * - ✻ Thinking... / Precipitating... = Claude is thinking
 * - ⏵⏵ bypass permissions = Ready for input
 * - [Pasted text #N +X lines] = Waiting for paste confirmation
 * - Tool names like Search(), Edit(), Read(), Write() = Tool running
 */
function parseClaudeState(output: string): { state: ClaudeState; tool?: string } {
  // Check the last ~500 chars of output for state indicators
  const recent = output.slice(-500);

  // Check for paste confirmation waiting
  if (recent.includes('[Pasted text #') && recent.includes('lines]')) {
    return { state: 'waiting_confirm' };
  }

  // Check for ready state (bypass permissions prompt)
  if (recent.includes('⏵⏵') || recent.includes('bypass permissions')) {
    return { state: 'idle' };
  }

  // Check for thinking state
  if (recent.includes('Thinking') || recent.includes('Precipitating') ||
      recent.includes('thinking)') || recent.includes('✻')) {
    return { state: 'thinking' };
  }

  // Check for tool running - look for tool patterns
  const toolPatterns = [
    /⏺\s*(Search|Grep|Glob)\s*\(/i,
    /⏺\s*(Read|Write|Edit)\s*\(/i,
    /⏺\s*(Bash|Task)\s*\(/i,
    /⏺\s*(\w+)\s*\([^)]*\)/,
  ];

  for (const pattern of toolPatterns) {
    const match = recent.match(pattern);
    if (match) {
      return { state: 'tool_running', tool: match[1] };
    }
  }

  // Check for responding state (⏺ without tool)
  if (recent.includes('⏺')) {
    return { state: 'responding' };
  }

  return { state: 'unknown' };
}

/**
 * Clear all paste confirmation timers for a session
 */
function clearPasteConfirmTimers(session: ActiveChatSession): void {
  for (const timer of session.pasteConfirmTimers) {
    clearTimeout(timer);
  }
  session.pasteConfirmTimers = [];
}

/**
 * Schedule paste confirmation Enter keys with exponential backoff
 */
function schedulePasteConfirmation(sessionId: string, session: ActiveChatSession): void {
  // Clear any existing timers
  clearPasteConfirmTimers(session);

  // Schedule Enter keys at backoff intervals
  for (const delay of PASTE_CONFIRM_BACKOFF) {
    const timer = setTimeout(() => {
      // Only send Enter if still waiting for confirmation
      if (session.claudeState === 'waiting_confirm' || session.claudeState === 'unknown') {
        console.log(`[Chat] Sending paste confirmation Enter for ${sessionId} (after ${delay}ms)`);
        session.claudePty.write('\n');
      }
    }, delay);
    session.pasteConfirmTimers.push(timer);
  }
}

/**
 * Update session state and notify client
 */
function updateSessionState(
  sessionId: string,
  session: ActiveChatSession,
  newState: ClaudeState,
  tool?: string
): void {
  const oldState = session.claudeState;

  if (oldState !== newState || session.currentTool !== tool) {
    session.claudeState = newState;
    session.currentTool = tool || null;
    session.lastStateChange = Date.now();

    console.log(`[Chat] State change for ${sessionId}: ${oldState} -> ${newState}${tool ? ` (${tool})` : ''}`);

    // Notify client of state change
    if (session.ws?.readyState === WebSocket.OPEN) {
      sendToClient(session.ws, {
        type: 'state-change',
        claudeState: newState,
        currentTool: tool || null,
      });
    }

    // If Claude started responding, clear paste confirmation timers
    if (newState !== 'waiting_confirm' && newState !== 'unknown' && newState !== 'idle') {
      clearPasteConfirmTimers(session);
    }
  }
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

const activeSessions = new Map<string, ActiveChatSession>();
const dirtyOutputSessions = new Set<string>();

function generateSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function cleanupSession(sessionId: string, removeFromDb: boolean = false, killTmux: boolean = false): void {
  const session = activeSessions.get(sessionId);
  if (session) {
    // Clear any pending paste confirmation timers
    clearPasteConfirmTimers(session);

    // Save final output before cleanup
    if (session.outputBuffer) {
      db.saveChatOutput(sessionId, session.outputBuffer);
    }

    try {
      session.claudePty.kill();
    } catch {
      // PTY already dead, ignore
    }
    activeSessions.delete(sessionId);
    dirtyOutputSessions.delete(sessionId);
    console.log(`[Chat] Session ${sessionId} cleaned up from memory`);
  }

  if (killTmux && isTmuxAvailable()) {
    killTmuxSession(sessionId);
  }

  if (removeFromDb) {
    db.removeChatSession(sessionId);
    console.log(`[Chat] Session ${sessionId} removed from database`);
  } else {
    db.markChatSessionInactive(sessionId);
  }
}

// Periodically save dirty output buffers to database
setInterval(() => {
  for (const sessionId of dirtyOutputSessions) {
    const session = activeSessions.get(sessionId);
    if (session) {
      db.saveChatOutput(sessionId, session.outputBuffer);
    }
  }
  dirtyOutputSessions.clear();
}, OUTPUT_SAVE_INTERVAL);

// Cleanup inactive sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of activeSessions) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      console.log(`[Chat] Session ${sessionId} timed out`);
      cleanupSession(sessionId, false);
    }
  }

  // Also cleanup very old inactive sessions from database
  const cleaned = db.cleanupChatSessions();
  if (cleaned > 0) {
    console.log(`[Chat] Cleaned up ${cleaned} old sessions from database`);
  }
}, 60000);

// Check for stuck sessions periodically and notify clients
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of activeSessions) {
    if (session.isResponding && session.ws?.readyState === WebSocket.OPEN) {
      const timeSinceOutput = now - session.lastOutputTime;
      const isStuck = timeSinceOutput > STUCK_THRESHOLD;

      if (isStuck) {
        console.log(`[Chat] Session ${sessionId} appears stuck (${Math.round(timeSinceOutput / 1000)}s since last output)`);
        sendToClient(session.ws, {
          type: 'status',
          claudeState: session.claudeState,
          currentTool: session.currentTool,
          lastActivity: session.lastOutputTime,
          isStuck: true,
          stuckDuration: timeSinceOutput,
        });
      }
    }
  }
}, 5000); // Check every 5 seconds

// =============================================================================
// TMUX SESSION MANAGEMENT
// =============================================================================

let tmuxAvailable: boolean | null = null;

const TMUX_PATHS = [
  'tmux',
  '/opt/homebrew/bin/tmux',
  '/usr/local/bin/tmux',
  '/usr/bin/tmux',
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
    console.log(`[Chat] tmux is available at ${tmuxPath} - sessions will persist`);
  } else {
    console.warn('[Chat] tmux not found - sessions will not persist');
  }
  return tmuxAvailable;
}

function getTmuxSessionName(sessionId: string): string {
  return `lide_chat_${sessionId.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40)}`;
}

function tmuxSessionExists(tmuxName: string): boolean {
  if (!tmuxPath) return false;
  try {
    execSync(`${tmuxPath} has-session -t ${tmuxName} 2>/dev/null`, { stdio: 'ignore' });
    console.log(`[Chat] tmux session exists: ${tmuxName}`);
    return true;
  } catch {
    console.log(`[Chat] tmux session does not exist: ${tmuxName}`);
    return false;
  }
}

function killTmuxSession(sessionId: string): void {
  if (!tmuxPath) return;
  const tmuxName = getTmuxSessionName(sessionId);
  try {
    execSync(`${tmuxPath} kill-session -t ${tmuxName} 2>/dev/null`, { stdio: 'ignore' });
    console.log(`[Chat] Killed tmux session: ${tmuxName}`);
  } catch {
    // tmux session may not exist, ignore
  }
}

function spawnPtyWithTmux(
  projectPath: string,
  sessionId: string
): { pty: pty.IPty; isExistingTmux: boolean } {
  if (!tmuxPath) {
    throw new Error('tmux not available');
  }

  const tmuxName = getTmuxSessionName(sessionId);
  const existingTmux = tmuxSessionExists(tmuxName);

  if (!existingTmux) {
    // Create new tmux session in background
    execSync(`${tmuxPath} new-session -d -s ${tmuxName} -c ${JSON.stringify(projectPath)}`, { stdio: 'ignore' });
    console.log(`[Chat] Created new tmux session: ${tmuxName}`);
  } else {
    console.log(`[Chat] Reattaching to existing tmux session: ${tmuxName}`);
  }

  // Spawn PTY that attaches to the tmux session
  const ptyProcess = pty.spawn(tmuxPath, ['attach-session', '-t', tmuxName], {
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

  return { pty: ptyProcess, isExistingTmux: existingTmux };
}

// =============================================================================
// PTY MANAGEMENT
// =============================================================================

function isPtyDead(ptyProcess: pty.IPty): boolean {
  try {
    process.kill(ptyProcess.pid, 0);
    return false;
  } catch {
    return true;
  }
}

function spawnPty(projectPath: string): pty.IPty {
  const shell = process.platform === 'win32' ? 'powershell.exe' : '/bin/bash';

  console.log(`[Chat] Spawning ${shell} in ${projectPath}`);

  return pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 120,
    rows: 30,
    cwd: projectPath,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      SHELL: shell,
      PATH: `${process.env.PATH}:/usr/local/bin:/opt/homebrew/bin`,
    },
  });
}

// =============================================================================
// CLAUDE CLI OUTPUT PARSING
// =============================================================================

/**
 * Parse Claude CLI JSON stream events into our message format.
 * The CLI outputs JSON objects with various types.
 */
function parseClaudeEvent(json: Record<string, unknown>): ChatServerMessage | null {
  const type = json.type as string;

  switch (type) {
    case 'system':
      return null;

    case 'assistant': {
      const message = json.message as Record<string, unknown>;
      const content = message?.content as Array<Record<string, unknown>>;

      if (content && Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'text' && block.text) {
            return { type: 'text', content: block.text as string };
          }
          if (block.type === 'thinking' && block.thinking) {
            return { type: 'thinking', content: block.thinking as string };
          }
        }
      }
      return null;
    }

    case 'result': {
      const toolUseId = json.tool_use_id as string;
      if (toolUseId) {
        const isError = json.is_error as boolean;
        return {
          type: 'tool_use_end',
          id: toolUseId,
          status: isError ? 'error' : 'success',
          error: isError ? (json.error as string) : undefined,
        };
      }
      return null;
    }

    case 'content_block_start': {
      const contentBlock = json.content_block as Record<string, unknown>;
      if (contentBlock?.type === 'thinking') {
        return { type: 'thinking', content: '' };
      }
      if (contentBlock?.type === 'tool_use') {
        return {
          type: 'tool_use_start',
          id: contentBlock.id as string,
          tool: contentBlock.name as string,
          input: {},
        };
      }
      return null;
    }

    case 'content_block_delta': {
      const delta = json.delta as Record<string, unknown>;
      if (delta?.type === 'text_delta') {
        return { type: 'text', content: delta.text as string };
      }
      if (delta?.type === 'thinking_delta') {
        return { type: 'thinking', content: delta.thinking as string };
      }
      return null;
    }

    case 'content_block_stop':
    case 'message_stop':
    case 'message_delta':
      return null;

    case 'error':
      return {
        type: 'error',
        error: (json.error as Record<string, unknown>)?.message as string ||
               json.message as string || 'Unknown error',
      };

    default:
      return null;
  }
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
      totalSessions: db.findActiveChatSessions().length,
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
    const sessions = db.findActiveChatSessions();
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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
        db.saveChatOutput(sessionId, session.outputBuffer);
        console.log(`[Chat] Saved output for session ${sessionId} (${session.outputBuffer.length} bytes)`);
      }
    }
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ saved: true }));
    return;
  }

  // Kill session endpoint
  if (req.url?.startsWith('/kill-session')) {
    const url = parse(req.url, true);
    const sessionId = url.query.session as string;
    if (sessionId) {
      cleanupSession(sessionId, true, true);
      console.log(`[Chat] Killed session ${sessionId} (including tmux)`);
    }
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ killed: true }));
    return;
  }

  // Get session output endpoint
  if (req.url?.startsWith('/output')) {
    const url = parse(req.url, true);
    const sessionId = url.query.session as string;
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    if (sessionId) {
      const activeSession = activeSessions.get(sessionId);
      const output = activeSession?.outputBuffer || db.loadChatOutput(sessionId);
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

  // Check if tmux session exists
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

const wss = new WebSocketServer({ server, path: '/ws/chat' });

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  const url = parse(req.url || '', true);
  const query = url.query;

  const requestedSessionId = query.session as string | undefined;
  const defaultProjectPath = process.env.IDE_PROJECT_PATH || process.cwd();
  const projectPath = (query.path as string) || defaultProjectPath;
  const startClaude = query.startClaude !== 'false';

  let sessionId: string;
  let isReconnection = false;
  let session: ActiveChatSession;

  // Check if reconnecting to existing session
  if (requestedSessionId) {
    const existingActive = activeSessions.get(requestedSessionId);
    const existingDb = db.findChatSession(requestedSessionId);
    const tmuxName = getTmuxSessionName(requestedSessionId);
    const tmuxExists = isTmuxAvailable() && tmuxSessionExists(tmuxName);

    console.log(`[Chat] Connection request: session=${requestedSessionId}`);
    console.log(`[Chat]   - existingActive: ${!!existingActive}`);
    console.log(`[Chat]   - existingDb: ${!!existingDb}`);
    console.log(`[Chat]   - tmuxExists: ${tmuxExists}`);

    if (existingActive) {
      let ptyAlive = false;
      try {
        ptyAlive = existingActive.claudePty.pid > 0 && !isPtyDead(existingActive.claudePty);
      } catch {
        ptyAlive = false;
      }

      if (ptyAlive) {
        console.log(`[Chat] Reconnecting to live session ${requestedSessionId}`);
        sessionId = requestedSessionId;
        session = existingActive;
        session.ws = ws;
        session.lastActivity = Date.now();
        isReconnection = true;

        // Send buffered output
        if (session.outputBuffer) {
          sendToClient(ws, { type: 'output-buffer', data: session.outputBuffer });
        }
      } else {
        console.log(`[Chat] Session ${requestedSessionId} PTY is dead, checking tmux...`);
        sessionId = requestedSessionId;
        activeSessions.delete(requestedSessionId);

        if (isTmuxAvailable()) {
          const { pty: ptyProcess, isExistingTmux } = spawnPtyWithTmux(
            existingActive.projectPath,
            sessionId
          );
          isReconnection = isExistingTmux;

          session = {
            claudePty: ptyProcess,
            ws,
            projectPath: existingActive.projectPath,
            outputBuffer: existingActive.outputBuffer,
            messages: existingActive.messages,
            isResponding: false,
            lastActivity: Date.now(),
            claudeState: 'idle',
            lastStateChange: Date.now(),
            pasteConfirmTimers: [],
            lastOutputTime: Date.now(),
            currentTool: null,
          };

          activeSessions.set(sessionId, session);
          setupPtyHandlers(sessionId, ptyProcess, ws);

          if (!isExistingTmux && startClaude) {
            startClaudeCLI(ptyProcess);
          }
        } else {
          session = createNewSession(sessionId, existingActive.projectPath, ws, startClaude);
        }
      }
    } else if (existingDb) {
      console.log(`[Chat] Restoring session ${requestedSessionId} from database`);
      sessionId = requestedSessionId;

      if (isTmuxAvailable()) {
        const { pty: ptyProcess, isExistingTmux } = spawnPtyWithTmux(
          existingDb.project_path,
          sessionId
        );
        isReconnection = isExistingTmux;
        const savedOutput = db.loadChatOutput(sessionId);
        const savedMessages = db.loadChatMessages(sessionId);

        session = {
          claudePty: ptyProcess,
          ws,
          projectPath: existingDb.project_path,
          outputBuffer: savedOutput,
          messages: savedMessages,
          isResponding: false,
          lastActivity: Date.now(),
          claudeState: 'idle',
          lastStateChange: Date.now(),
          pasteConfirmTimers: [],
          lastOutputTime: Date.now(),
          currentTool: null,
        };

        activeSessions.set(sessionId, session);
        setupPtyHandlers(sessionId, ptyProcess, ws);

        if (!isExistingTmux && startClaude) {
          startClaudeCLI(ptyProcess);
        }
      } else {
        const ptyProcess = spawnPty(existingDb.project_path);
        const savedOutput = db.loadChatOutput(sessionId);
        const savedMessages = db.loadChatMessages(sessionId);

        session = {
          claudePty: ptyProcess,
          ws,
          projectPath: existingDb.project_path,
          outputBuffer: savedOutput,
          messages: savedMessages,
          isResponding: false,
          lastActivity: Date.now(),
          claudeState: 'idle',
          lastStateChange: Date.now(),
          pasteConfirmTimers: [],
          lastOutputTime: Date.now(),
          currentTool: null,
        };

        activeSessions.set(sessionId, session);
        setupPtyHandlers(sessionId, ptyProcess, ws);

        if (startClaude) {
          startClaudeCLI(ptyProcess);
        }
      }
    } else {
      sessionId = requestedSessionId;
      session = createNewSession(sessionId, projectPath, ws, startClaude);
    }
  } else {
    sessionId = generateSessionId();
    session = createNewSession(sessionId, projectPath, ws, startClaude);
  }

  console.log(`[Chat] Connection established: session=${sessionId}, reconnect=${isReconnection}`);

  db.touchChatSession(sessionId);

  // Send connected message
  sendToClient(ws, {
    type: 'connected',
    sessionId,
    reconnected: isReconnection,
  });

  // Handle WebSocket messages
  ws.on('message', (message: Buffer | string) => {
    try {
      const msg: ChatClientMessage = JSON.parse(message.toString());
      const currentSession = activeSessions.get(sessionId);

      if (!currentSession) {
        sendToClient(ws, { type: 'error', error: 'Session not found' });
        return;
      }

      currentSession.lastActivity = Date.now();
      db.touchChatSession(sessionId);

      switch (msg.type) {
        case 'input':
          if (msg.data) {
            // Send user message to Claude CLI
            currentSession.claudePty.write(msg.data + '\n');
            currentSession.isResponding = true;
            currentSession.claudeState = 'unknown'; // Will be updated by output parsing

            // Schedule paste confirmation with exponential backoff
            // This handles Claude CLI's paste detection for long messages
            schedulePasteConfirmation(sessionId, currentSession);

            // Save user message to history
            db.saveChatMessage(sessionId, 'user', msg.data);
            currentSession.messages.push({
              id: 0,
              session_id: sessionId,
              role: 'user',
              content: msg.data,
              created_at: new Date().toISOString(),
            });
          }
          break;

        case 'abort':
          // Send Ctrl+C to abort Claude response
          currentSession.claudePty.write('\x03');
          currentSession.isResponding = false;
          clearPasteConfirmTimers(currentSession);
          updateSessionState(sessionId, currentSession, 'idle');
          break;

        case 'ping':
          sendToClient(ws, { type: 'pong' });
          break;

        case 'get-history':
          sendToClient(ws, {
            type: 'history',
            messages: currentSession.messages,
          });
          break;

        case 'send-enter':
          // Manually send Enter (for paste confirmation)
          console.log(`[Chat] Manual Enter sent for ${sessionId}`);
          currentSession.claudePty.write('\n');
          break;

        case 'kill-session':
          // Kill and restart the session
          console.log(`[Chat] Kill session requested for ${sessionId}`);
          clearPasteConfirmTimers(currentSession);
          cleanupSession(sessionId, true, true);
          sendToClient(ws, { type: 'done' });
          break;

        case 'get-status':
          // Return current session status
          {
            const now = Date.now();
            const timeSinceOutput = now - currentSession.lastOutputTime;
            const isStuck = currentSession.isResponding && timeSinceOutput > STUCK_THRESHOLD;

            sendToClient(ws, {
              type: 'status',
              claudeState: currentSession.claudeState,
              currentTool: currentSession.currentTool,
              lastActivity: currentSession.lastOutputTime,
              isStuck,
              stuckDuration: isStuck ? timeSinceOutput : 0,
            });
          }
          break;

        default:
          console.warn(`[Chat] Unknown message type: ${(msg as { type: string }).type}`);
      }
    } catch (e) {
      console.error('[Chat] Failed to parse message:', e);
    }
  });

  ws.on('close', () => {
    console.log(`[Chat] WebSocket closed for session ${sessionId}`);
    const currentSession = activeSessions.get(sessionId);
    if (currentSession) {
      currentSession.ws = null;
      db.saveChatOutput(sessionId, currentSession.outputBuffer);
    }
  });

  ws.on('error', (error: Error) => {
    console.error(`[Chat] WebSocket error for session ${sessionId}:`, error);
  });
});

function sendToClient(ws: WebSocket, msg: ChatServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function createNewSession(
  sessionId: string,
  projectPath: string,
  ws: WebSocket,
  startClaude: boolean
): ActiveChatSession {
  const tmuxName = isTmuxAvailable() ? getTmuxSessionName(sessionId) : null;
  db.createChatSession(sessionId, projectPath, tmuxName);

  let ptyProcess: pty.IPty;
  let isExistingTmux = false;

  try {
    if (isTmuxAvailable()) {
      const result = spawnPtyWithTmux(projectPath, sessionId);
      ptyProcess = result.pty;
      isExistingTmux = result.isExistingTmux;
    } else {
      ptyProcess = spawnPty(projectPath);
    }
  } catch (error) {
    console.error('[Chat] Failed to spawn PTY:', error);
    sendToClient(ws, {
      type: 'error',
      error: `Failed to spawn chat session: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    db.removeChatSession(sessionId);
    throw error;
  }

  const session: ActiveChatSession = {
    claudePty: ptyProcess,
    ws,
    projectPath,
    outputBuffer: '',
    messages: [],
    isResponding: false,
    lastActivity: Date.now(),
    // New fields for enhanced tracking
    claudeState: 'idle',
    lastStateChange: Date.now(),
    pasteConfirmTimers: [],
    lastOutputTime: Date.now(),
    currentTool: null,
  };

  activeSessions.set(sessionId, session);
  setupPtyHandlers(sessionId, ptyProcess, ws);

  // Start Claude CLI if requested and not existing tmux
  if (startClaude && !isExistingTmux) {
    startClaudeCLI(ptyProcess);
  }

  return session;
}

function startClaudeCLI(ptyProcess: pty.IPty): void {
  // Give tmux session time to initialize, then start Claude CLI
  setTimeout(() => {
    ptyProcess.write('claude --dangerously-skip-permissions --output-format stream-json\n');
  }, 500);
}

function setupPtyHandlers(sessionId: string, ptyProcess: pty.IPty, initialWs: WebSocket): void {
  let buffer = '';

  ptyProcess.onData((data: string) => {
    const session = activeSessions.get(sessionId);
    if (!session) return;

    // Update activity tracking
    session.lastOutputTime = Date.now();
    session.lastActivity = Date.now();

    // Append to output buffer
    session.outputBuffer += data;
    if (session.outputBuffer.length > OUTPUT_BUFFER_MAX) {
      session.outputBuffer = session.outputBuffer.slice(-OUTPUT_BUFFER_MAX);
    }

    dirtyOutputSessions.add(sessionId);

    // Parse Claude CLI visual state from terminal output
    const { state: newState, tool } = parseClaudeState(session.outputBuffer);
    updateSessionState(sessionId, session, newState, tool);

    // Try to parse as JSON stream from Claude CLI
    buffer += data;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const json = JSON.parse(trimmed);
        const event = parseClaudeEvent(json);

        if (event && session.ws?.readyState === WebSocket.OPEN) {
          session.ws.send(JSON.stringify(event));
        }

        // Check for message_stop to save assistant response
        if (json.type === 'message_stop' || json.type === 'result') {
          session.isResponding = false;
          updateSessionState(sessionId, session, 'idle');
        }
      } catch {
        // Not JSON - might be raw terminal output, ignore for chat
      }
    }

    session.lastActivity = Date.now();
  });

  ptyProcess.onExit(({ exitCode, signal }) => {
    console.log(`[Chat] PTY exited: session=${sessionId}, code=${exitCode}, signal=${signal}`);
    const session = activeSessions.get(sessionId);
    if (session?.ws?.readyState === WebSocket.OPEN) {
      sendToClient(session.ws, {
        type: 'error',
        error: `Claude CLI exited with code ${exitCode}`,
      });
    }
    cleanupSession(sessionId, false);
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
  console.log('[Chat] Shutting down...');

  for (const [sessionId, session] of activeSessions) {
    if (session.outputBuffer) {
      db.saveChatOutput(sessionId, session.outputBuffer);
    }
    db.markChatSessionInactive(sessionId);
    try {
      session.claudePty.kill();
    } catch {
      // Ignore
    }
  }
  activeSessions.clear();

  wss.close(() => {
    server.close(() => {
      console.log('[Chat] Server shut down');
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

const existingSessions = db.findActiveChatSessions();
console.log(`[Chat] Found ${existingSessions.length} existing sessions in database`);

const DEFAULT_PROJECT_PATH = process.env.IDE_PROJECT_PATH || process.cwd();

server.listen(PORT, () => {
  console.log(`
================================================================================
  Chat Server Started (with SQLite persistence)
================================================================================

  WebSocket URL: ws://localhost:${PORT}/ws/chat
  Health Check:  http://localhost:${PORT}/health
  Sessions List: http://localhost:${PORT}/sessions

  Project Path:  ${DEFAULT_PROJECT_PATH}
  ${process.env.IDE_PROJECT_PATH ? '(set via IDE_PROJECT_PATH)' : '(using current directory)'}

  Query Parameters:
    - path:        Project directory (default: ${DEFAULT_PROJECT_PATH})
    - session:     Session ID for reconnection
    - startClaude: Auto-start Claude CLI (default: true)

  Features:
    - Persistent chat sessions via tmux
    - Output buffer saved to SQLite
    - Automatic reconnection with history restore

  Database: .local-ide/data/terminal.db

================================================================================
`);
});
