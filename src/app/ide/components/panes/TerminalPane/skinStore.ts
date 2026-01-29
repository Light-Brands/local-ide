// =============================================================================
// TERMINAL SKIN SESSION STORE
// Handles persistence of chat sessions to localStorage (upgradeable to DB)
// =============================================================================

import type { SkinSession, SkinMessage, SkinState } from './skinTypes';

const STORAGE_KEY = 'terminal-skin-sessions';
const MAX_SESSIONS = 50; // Keep last 50 sessions

// =============================================================================
// STORAGE OPERATIONS
// =============================================================================

function loadState(): SkinState {
  if (typeof window === 'undefined') {
    return { sessions: [], activeSessionId: null };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const state = JSON.parse(stored) as SkinState;
      // Mark all sessions as inactive on load (fresh start)
      state.sessions = state.sessions.map(s => ({ ...s, isActive: false }));
      return state;
    }
  } catch (error) {
    console.warn('[SkinStore] Failed to load state:', error);
  }

  return { sessions: [], activeSessionId: null };
}

function saveState(state: SkinState): void {
  if (typeof window === 'undefined') return;

  try {
    // Trim to max sessions (keep most recent)
    const trimmedSessions = state.sessions
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_SESSIONS);

    const toSave: SkinState = {
      ...state,
      sessions: trimmedSessions,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.warn('[SkinStore] Failed to save state:', error);
  }
}

// =============================================================================
// SESSION OPERATIONS
// =============================================================================

export function createSession(terminalSessionId: string): SkinSession {
  const now = Date.now();
  const session: SkinSession = {
    id: `skin-${now}-${Math.random().toString(36).slice(2, 8)}`,
    name: `Session ${new Date(now).toLocaleString()}`,
    terminalSessionId,
    messages: [],
    createdAt: now,
    updatedAt: now,
    isActive: true,
  };

  const state = loadState();

  // Deactivate any existing active sessions
  state.sessions = state.sessions.map(s => ({ ...s, isActive: false }));

  // Add new session
  state.sessions.unshift(session);
  state.activeSessionId = session.id;

  saveState(state);

  console.log('[SkinStore] Created session:', session.id);
  return session;
}

export function getSession(sessionId: string): SkinSession | null {
  const state = loadState();
  return state.sessions.find(s => s.id === sessionId) || null;
}

export function getSessionByTerminalId(terminalSessionId: string): SkinSession | null {
  const state = loadState();
  // Find most recent session for this terminal
  return state.sessions.find(s => s.terminalSessionId === terminalSessionId) || null;
}

export function getActiveSession(): SkinSession | null {
  const state = loadState();
  if (!state.activeSessionId) return null;
  return state.sessions.find(s => s.id === state.activeSessionId) || null;
}

export function getAllSessions(): SkinSession[] {
  const state = loadState();
  return state.sessions.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function updateSession(sessionId: string, updates: Partial<SkinSession>): SkinSession | null {
  const state = loadState();
  const index = state.sessions.findIndex(s => s.id === sessionId);

  if (index === -1) return null;

  state.sessions[index] = {
    ...state.sessions[index],
    ...updates,
    updatedAt: Date.now(),
  };

  saveState(state);
  return state.sessions[index];
}

export function addMessage(sessionId: string, message: SkinMessage): void {
  const state = loadState();
  const session = state.sessions.find(s => s.id === sessionId);

  if (!session) {
    console.warn('[SkinStore] Session not found:', sessionId);
    return;
  }

  session.messages.push(message);
  session.updatedAt = Date.now();

  saveState(state);
}

export function updateLastMessage(sessionId: string, updates: Partial<SkinMessage>): void {
  const state = loadState();
  const session = state.sessions.find(s => s.id === sessionId);

  if (!session || session.messages.length === 0) return;

  const lastIndex = session.messages.length - 1;
  session.messages[lastIndex] = {
    ...session.messages[lastIndex],
    ...updates,
  };
  session.updatedAt = Date.now();

  saveState(state);
}

export function deleteSession(sessionId: string): void {
  const state = loadState();
  state.sessions = state.sessions.filter(s => s.id !== sessionId);

  if (state.activeSessionId === sessionId) {
    state.activeSessionId = state.sessions[0]?.id || null;
  }

  saveState(state);
}

export function setActiveSession(sessionId: string): void {
  const state = loadState();

  // Deactivate all, activate the one
  state.sessions = state.sessions.map(s => ({
    ...s,
    isActive: s.id === sessionId,
  }));
  state.activeSessionId = sessionId;

  saveState(state);
}

export function clearAllSessions(): void {
  saveState({ sessions: [], activeSessionId: null });
}

// =============================================================================
// EXPORT TO FILE (for future DB migration)
// =============================================================================

export function exportSession(sessionId: string): string | null {
  const session = getSession(sessionId);
  if (!session) return null;
  return JSON.stringify(session, null, 2);
}

export function exportAllSessions(): string {
  const state = loadState();
  return JSON.stringify(state, null, 2);
}
