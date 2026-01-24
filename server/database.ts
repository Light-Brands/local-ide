/**
 * SQLite Database for Terminal Session Persistence
 *
 * Stores terminal session metadata to allow reconnection
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
