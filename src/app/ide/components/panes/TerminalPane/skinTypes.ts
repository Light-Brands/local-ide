// =============================================================================
// TERMINAL SKIN TYPES
// =============================================================================

export interface SkinMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tools: SkinTool[];
  timestamp: number; // Unix timestamp for serialization
  isComplete: boolean;
  rawOutput?: string; // Original terminal output for this message
}

export interface SkinTool {
  name: string;
  args?: string;
  status: 'running' | 'done' | 'error';
  startTime: number;
  endTime?: number;
}

export interface SkinSession {
  id: string;
  name: string;
  terminalSessionId: string; // Links to terminal/tmux session
  messages: SkinMessage[];
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

export interface SkinState {
  sessions: SkinSession[];
  activeSessionId: string | null;
}

// Parser state for incremental parsing
export interface ParserState {
  currentRole: 'user' | 'assistant' | null;
  currentContent: string;
  currentTools: SkinTool[];
  isStreaming: boolean;
  isThinking: boolean;
  lastProcessedIndex: number; // Track where we are in the buffer
}

// Claude CLI visual patterns
export const CLAUDE_PATTERNS = {
  // Status indicators
  STREAMING: '⏺',
  THINKING: '✻',
  READY: '⏵⏵',

  // Box drawing
  BOX_TOP: '╭',
  BOX_BOTTOM: '╰',
  BOX_SIDE: '│',
  BOX_HORIZONTAL: '─',

  // Tool patterns
  TOOL_START: /^(Read|Edit|Write|Bash|Grep|Glob|Task|WebFetch|WebSearch|MultiEdit)\s*[\(]/i,
  TOOL_RUNNING: /^\s*(Reading|Editing|Writing|Running|Searching|Fetching)/i,

  // User input detection
  USER_PROMPT: /^[>❯›\$]\s*/,
  PASTED_TEXT: /\[Pasted text #\d+/,

  // Message boundaries
  HUMAN_TURN: /Human:/i,
  ASSISTANT_TURN: /Assistant:/i,
} as const;
