/**
 * SQLite Database for Terminal and Chat Session Persistence
 *
 * Stores terminal and chat session metadata to allow reconnection
 * and session recovery across server restarts.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// =============================================================================
// TYPES
// =============================================================================

export interface TerminalSession {
  session_id: string;
  project_path: string;
  created_at: string;
  last_activity_at: string;
  cols: number;
  rows: number;
  is_active: number; // SQLite doesn't have boolean, use 0/1
}

export interface TerminalOutput {
  session_id: string;
  output: string;
  updated_at: string;
}

// Chat session types
export interface ChatSession {
  session_id: string;
  project_path: string;
  created_at: string;
  last_activity_at: string;
  is_active: number;
  tmux_name: string | null;
}

export interface ChatMessage {
  id: number;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatOutput {
  session_id: string;
  output: string;
  updated_at: string;
}

// =============================================================================
// DATABASE SETUP
// =============================================================================

// Store database in .local-ide/data directory
const DATA_DIR = path.join(process.cwd(), '.local-ide', 'data');
const DB_PATH = path.join(DATA_DIR, 'terminal.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// =============================================================================
// SCHEMA INITIALIZATION
// =============================================================================

db.exec(`
  -- Terminal sessions table
  CREATE TABLE IF NOT EXISTS terminal_sessions (
    session_id TEXT PRIMARY KEY,
    project_path TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_activity_at TEXT NOT NULL DEFAULT (datetime('now')),
    cols INTEGER NOT NULL DEFAULT 120,
    rows INTEGER NOT NULL DEFAULT 30,
    is_active INTEGER NOT NULL DEFAULT 1
  );

  -- Terminal output buffer (for reconnection)
  CREATE TABLE IF NOT EXISTS terminal_output (
    session_id TEXT PRIMARY KEY,
    output TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES terminal_sessions(session_id) ON DELETE CASCADE
  );

  -- Indexes for faster queries
  CREATE INDEX IF NOT EXISTS idx_sessions_project ON terminal_sessions(project_path);
  CREATE INDEX IF NOT EXISTS idx_sessions_active ON terminal_sessions(is_active);
  CREATE INDEX IF NOT EXISTS idx_sessions_activity ON terminal_sessions(last_activity_at);

  -- Chat sessions table
  CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id TEXT PRIMARY KEY,
    project_path TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_activity_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_active INTEGER NOT NULL DEFAULT 1,
    tmux_name TEXT
  );

  -- Chat messages (structured conversation history)
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE
  );

  -- Chat output buffer (streaming response in progress)
  CREATE TABLE IF NOT EXISTS chat_output (
    session_id TEXT PRIMARY KEY,
    output TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE
  );

  -- Indexes for chat tables
  CREATE INDEX IF NOT EXISTS idx_chat_sessions_project ON chat_sessions(project_path);
  CREATE INDEX IF NOT EXISTS idx_chat_sessions_active ON chat_sessions(is_active);
  CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
`);

console.log('[Database] Initialized at', DB_PATH);

// =============================================================================
// SESSION OPERATIONS
// =============================================================================

const insertSession = db.prepare(`
  INSERT INTO terminal_sessions (session_id, project_path, cols, rows)
  VALUES (?, ?, ?, ?)
`);

const getSession = db.prepare(`
  SELECT * FROM terminal_sessions WHERE session_id = ?
`);

const getActiveSessions = db.prepare(`
  SELECT * FROM terminal_sessions WHERE is_active = 1 ORDER BY last_activity_at DESC
`);

const getSessionsByProject = db.prepare(`
  SELECT * FROM terminal_sessions WHERE project_path = ? AND is_active = 1 ORDER BY last_activity_at DESC
`);

const updateSessionActivity = db.prepare(`
  UPDATE terminal_sessions SET last_activity_at = datetime('now') WHERE session_id = ?
`);

const updateSessionSize = db.prepare(`
  UPDATE terminal_sessions SET cols = ?, rows = ?, last_activity_at = datetime('now') WHERE session_id = ?
`);

const deactivateSession = db.prepare(`
  UPDATE terminal_sessions SET is_active = 0 WHERE session_id = ?
`);

const deleteSession = db.prepare(`
  DELETE FROM terminal_sessions WHERE session_id = ?
`);

const cleanupOldSessions = db.prepare(`
  DELETE FROM terminal_sessions
  WHERE is_active = 0
  AND datetime(last_activity_at) < datetime('now', '-7 days')
`);

// =============================================================================
// OUTPUT BUFFER OPERATIONS
// =============================================================================

const MAX_OUTPUT_SIZE = 100000; // ~100KB of output per session

const upsertOutput = db.prepare(`
  INSERT INTO terminal_output (session_id, output, updated_at)
  VALUES (?, ?, datetime('now'))
  ON CONFLICT(session_id) DO UPDATE SET
    output = ?,
    updated_at = datetime('now')
`);

const getOutput = db.prepare(`
  SELECT output FROM terminal_output WHERE session_id = ?
`);

const deleteOutput = db.prepare(`
  DELETE FROM terminal_output WHERE session_id = ?
`);

// =============================================================================
// EXPORTED FUNCTIONS
// =============================================================================

export function createSession(
  sessionId: string,
  projectPath: string,
  cols: number = 120,
  rows: number = 30
): TerminalSession {
  insertSession.run(sessionId, projectPath, cols, rows);
  return getSession.get(sessionId) as TerminalSession;
}

export function findSession(sessionId: string): TerminalSession | undefined {
  return getSession.get(sessionId) as TerminalSession | undefined;
}

export function findActiveSessions(): TerminalSession[] {
  return getActiveSessions.all() as TerminalSession[];
}

export function findSessionsByProject(projectPath: string): TerminalSession[] {
  return getSessionsByProject.all(projectPath) as TerminalSession[];
}

export function touchSession(sessionId: string): void {
  updateSessionActivity.run(sessionId);
}

export function resizeSession(sessionId: string, cols: number, rows: number): void {
  updateSessionSize.run(cols, rows, sessionId);
}

export function markSessionInactive(sessionId: string): void {
  deactivateSession.run(sessionId);
}

export function removeSession(sessionId: string): void {
  deleteOutput.run(sessionId);
  deleteSession.run(sessionId);
}

export function cleanupSessions(): number {
  const result = cleanupOldSessions.run();
  return result.changes;
}

// Output buffer functions
export function saveOutput(sessionId: string, output: string): void {
  // Truncate output if too large (keep last N characters)
  const truncated = output.length > MAX_OUTPUT_SIZE
    ? output.slice(-MAX_OUTPUT_SIZE)
    : output;
  upsertOutput.run(sessionId, truncated, truncated);
}

export function loadOutput(sessionId: string): string {
  const row = getOutput.get(sessionId) as { output: string } | undefined;
  return row?.output || '';
}

export function clearOutput(sessionId: string): void {
  deleteOutput.run(sessionId);
}

// =============================================================================
// CHAT SESSION OPERATIONS
// =============================================================================

const insertChatSession = db.prepare(`
  INSERT INTO chat_sessions (session_id, project_path, tmux_name)
  VALUES (?, ?, ?)
`);

const getChatSession = db.prepare(`
  SELECT * FROM chat_sessions WHERE session_id = ?
`);

const getActiveChatSessions = db.prepare(`
  SELECT * FROM chat_sessions WHERE is_active = 1 ORDER BY last_activity_at DESC
`);

const getChatSessionsByProject = db.prepare(`
  SELECT * FROM chat_sessions WHERE project_path = ? AND is_active = 1 ORDER BY last_activity_at DESC
`);

const updateChatSessionActivity = db.prepare(`
  UPDATE chat_sessions SET last_activity_at = datetime('now') WHERE session_id = ?
`);

const updateChatSessionTmux = db.prepare(`
  UPDATE chat_sessions SET tmux_name = ?, last_activity_at = datetime('now') WHERE session_id = ?
`);

const deactivateChatSession = db.prepare(`
  UPDATE chat_sessions SET is_active = 0 WHERE session_id = ?
`);

const deleteChatSession = db.prepare(`
  DELETE FROM chat_sessions WHERE session_id = ?
`);

const cleanupOldChatSessions = db.prepare(`
  DELETE FROM chat_sessions
  WHERE is_active = 0
  AND datetime(last_activity_at) < datetime('now', '-7 days')
`);

// Chat message operations
const insertChatMessage = db.prepare(`
  INSERT INTO chat_messages (session_id, role, content)
  VALUES (?, ?, ?)
`);

const getChatMessages = db.prepare(`
  SELECT * FROM chat_messages WHERE session_id = ? ORDER BY id ASC
`);

const deleteChatMessages = db.prepare(`
  DELETE FROM chat_messages WHERE session_id = ?
`);

// Chat output operations
const MAX_CHAT_OUTPUT_SIZE = 100000; // ~100KB of output per session

const upsertChatOutput = db.prepare(`
  INSERT INTO chat_output (session_id, output, updated_at)
  VALUES (?, ?, datetime('now'))
  ON CONFLICT(session_id) DO UPDATE SET
    output = ?,
    updated_at = datetime('now')
`);

const getChatOutput = db.prepare(`
  SELECT output FROM chat_output WHERE session_id = ?
`);

const deleteChatOutput = db.prepare(`
  DELETE FROM chat_output WHERE session_id = ?
`);

// =============================================================================
// CHAT EXPORTED FUNCTIONS
// =============================================================================

export function createChatSession(
  sessionId: string,
  projectPath: string,
  tmuxName: string | null = null
): ChatSession {
  insertChatSession.run(sessionId, projectPath, tmuxName);
  return getChatSession.get(sessionId) as ChatSession;
}

export function findChatSession(sessionId: string): ChatSession | undefined {
  return getChatSession.get(sessionId) as ChatSession | undefined;
}

export function findActiveChatSessions(): ChatSession[] {
  return getActiveChatSessions.all() as ChatSession[];
}

export function findChatSessionsByProject(projectPath: string): ChatSession[] {
  return getChatSessionsByProject.all(projectPath) as ChatSession[];
}

export function touchChatSession(sessionId: string): void {
  updateChatSessionActivity.run(sessionId);
}

export function updateChatSessionTmuxName(sessionId: string, tmuxName: string): void {
  updateChatSessionTmux.run(tmuxName, sessionId);
}

export function markChatSessionInactive(sessionId: string): void {
  deactivateChatSession.run(sessionId);
}

export function removeChatSession(sessionId: string): void {
  deleteChatOutput.run(sessionId);
  deleteChatMessages.run(sessionId);
  deleteChatSession.run(sessionId);
}

export function cleanupChatSessions(): number {
  const result = cleanupOldChatSessions.run();
  return result.changes;
}

// Chat message functions
export function saveChatMessage(sessionId: string, role: 'user' | 'assistant', content: string): void {
  insertChatMessage.run(sessionId, role, content);
}

export function loadChatMessages(sessionId: string): ChatMessage[] {
  return getChatMessages.all(sessionId) as ChatMessage[];
}

export function clearChatMessages(sessionId: string): void {
  deleteChatMessages.run(sessionId);
}

// Chat output buffer functions
export function saveChatOutput(sessionId: string, output: string): void {
  // Truncate output if too large (keep last N characters)
  const truncated = output.length > MAX_CHAT_OUTPUT_SIZE
    ? output.slice(-MAX_CHAT_OUTPUT_SIZE)
    : output;
  upsertChatOutput.run(sessionId, truncated, truncated);
}

export function loadChatOutput(sessionId: string): string {
  const row = getChatOutput.get(sessionId) as { output: string } | undefined;
  return row?.output || '';
}

export function clearChatOutput(sessionId: string): void {
  deleteChatOutput.run(sessionId);
}

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

export function closeDatabase(): void {
  db.close();
  console.log('[Database] Closed');
}

// Handle process exit
process.on('exit', closeDatabase);
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});
process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});
