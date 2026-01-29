// =============================================================================
// REAL-TIME CLAUDE CLI JSON PARSER
// Parses Claude CLI --output-format stream-json events into structured messages
// Also handles legacy terminal output with aggressive filtering
// =============================================================================

import type { SkinMessage, SkinTool, ParserState } from './skinTypes';

// =============================================================================
// AGGRESSIVE ANSI/ESCAPE CODE STRIPPING
// =============================================================================

function stripAllTerminalCodes(str: string): string {
  return str
    // Standard ANSI escape sequences (colors, cursor, etc.)
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
    // OSC sequences (title setting, etc.)
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, '')
    // Other escape sequences
    .replace(/\x1b[PX^_][^\x1b]*\x1b\\/g, '')
    .replace(/\x1b[\[\]()#;?]*[0-9;]*[a-zA-Z@`]/g, '')
    // DEC private modes
    .replace(/\x1b\[\?[0-9;]*[a-zA-Z]/g, '')
    // Control characters (except newline, tab)
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
    // Remaining escape character
    .replace(/\x1b/g, '')
    // tmux/screen control sequences that might slip through
    .replace(/\[[\d;]*[mHJKsu]/g, '')
    .replace(/\[\?[\d;]*[hlsr]/g, '')
    // Clean up multiple spaces
    .replace(/  +/g, ' ')
    .trim();
}

// Check if a string is mostly garbage (escape codes, control chars)
function isGarbage(str: string): boolean {
  const cleaned = stripAllTerminalCodes(str);

  // Too short after cleaning
  if (cleaned.length < 3) return true;

  // Mostly brackets and numbers (escape code remnants)
  const bracketCount = (cleaned.match(/[\[\]]/g) || []).length;
  const numberCount = (cleaned.match(/\d/g) || []).length;
  if (bracketCount + numberCount > cleaned.length * 0.5) return true;

  // Contains obvious terminal garbage patterns
  if (/^\[?\d+[;mHJK]/.test(cleaned)) return true;
  if (/\[\?\d+[lh]/.test(cleaned)) return true;
  if (/\[\d+;\d+[Hr]/.test(cleaned)) return true;

  // tmux status line patterns
  if (/lide_term\d*:/.test(cleaned)) return true;
  if (/^\d+:\d+\s+\d+-\w+-\d+/.test(cleaned)) return true; // Time/date patterns

  // Mostly non-printable or special chars
  const printable = cleaned.replace(/[^\x20-\x7e]/g, '');
  if (printable.length < cleaned.length * 0.7) return true;

  return false;
}

// =============================================================================
// JSON EVENT TYPES (from Claude CLI stream-json format)
// =============================================================================

interface ClaudeEvent {
  type: string;
  [key: string]: unknown;
}

interface AssistantEvent extends ClaudeEvent {
  type: 'assistant';
  message: {
    content: Array<{
      type: 'text' | 'thinking' | 'tool_use';
      text?: string;
      thinking?: string;
      id?: string;
      name?: string;
      input?: Record<string, unknown>;
    }>;
  };
}

interface ContentBlockStartEvent extends ClaudeEvent {
  type: 'content_block_start';
  content_block: {
    type: 'text' | 'thinking' | 'tool_use';
    id?: string;
    name?: string;
  };
}

interface ContentBlockDeltaEvent extends ClaudeEvent {
  type: 'content_block_delta';
  delta: {
    type: 'text_delta' | 'thinking_delta' | 'input_json_delta';
    text?: string;
    thinking?: string;
    partial_json?: string;
  };
}

interface ResultEvent extends ClaudeEvent {
  type: 'result';
  tool_use_id?: string;
  is_error?: boolean;
  error?: string;
  content?: string;
}

// =============================================================================
// PARSER STATE
// =============================================================================

export function createParserState(): ParserState {
  return {
    currentRole: null,
    currentContent: '',
    currentTools: [],
    isStreaming: false,
    isThinking: false,
    lastProcessedIndex: 0,
  };
}

// =============================================================================
// JSON LINE PARSER
// =============================================================================

function tryParseJsonLine(line: string): ClaudeEvent | null {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.startsWith('{')) return null;

  try {
    return JSON.parse(trimmed) as ClaudeEvent;
  } catch {
    return null;
  }
}

// =============================================================================
// INCREMENTAL PARSER
// =============================================================================

export interface ParseResult {
  messages: SkinMessage[];
  state: ParserState;
}

export function parseIncremental(
  buffer: string,
  existingMessages: SkinMessage[],
  state: ParserState
): ParseResult {
  // Only process new content
  const newContent = buffer.slice(state.lastProcessedIndex);
  if (!newContent) {
    return { messages: existingMessages, state };
  }

  const lines = newContent.split('\n');
  const messages = [...existingMessages];
  let currentState = { ...state };
  let messageIdCounter = messages.length;

  // Track current assistant message being built
  let currentMessage: SkinMessage | null = null;

  // Find any incomplete message to continue
  const lastMsg = messages[messages.length - 1];
  if (lastMsg && !lastMsg.isComplete) {
    currentMessage = lastMsg;
  }

  for (const line of lines) {
    const event = tryParseJsonLine(line);
    if (!event) {
      // Not JSON - might be user input or other terminal output
      // Clean and check if it's garbage
      const cleaned = stripAllTerminalCodes(line);
      if (!cleaned || isGarbage(cleaned)) {
        continue; // Skip garbage
      }

      // Skip system messages
      if (cleaned.includes('[Session restored') ||
          cleaned.includes('server exited') ||
          cleaned.includes('Reconnected')) {
        continue;
      }

      // Check if it looks like user input (not during assistant response)
      if (currentState.currentRole !== 'assistant') {
        // Finish any current message
        if (currentMessage && currentMessage.role === 'assistant') {
          currentMessage.isComplete = true;
          currentMessage = null;
        }

        // Check if this might be a continuation of user input
        const lastUserMsg = messages.filter(m => m.role === 'user').pop();
        if (lastUserMsg && !lastUserMsg.isComplete && Date.now() - lastUserMsg.timestamp < 5000) {
          lastUserMsg.content += '\n' + cleaned;
        } else if (!messages.some(m => m.role === 'user' && m.content === cleaned)) {
          // New user message
          messages.push({
            id: `msg-${Date.now()}-${messageIdCounter++}`,
            role: 'user',
            content: cleaned,
            tools: [],
            timestamp: Date.now(),
            isComplete: true, // User messages are complete immediately
          });
        }
      }
      continue;
    }

    switch (event.type) {
      case 'assistant': {
        const assistantEvent = event as AssistantEvent;
        // Full assistant message (non-streaming)
        const content = assistantEvent.message?.content || [];
        let text = '';
        const tools: SkinTool[] = [];

        for (const block of content) {
          if (block.type === 'text' && block.text) {
            text += block.text;
          } else if (block.type === 'tool_use' && block.name) {
            tools.push({
              name: block.name,
              args: JSON.stringify(block.input || {}),
              status: 'done',
              startTime: Date.now(),
              endTime: Date.now(),
            });
          }
        }

        if (text || tools.length > 0) {
          messages.push({
            id: `msg-${Date.now()}-${messageIdCounter++}`,
            role: 'assistant',
            content: text,
            tools,
            timestamp: Date.now(),
            isComplete: true,
          });
        }
        currentMessage = null;
        break;
      }

      case 'content_block_start': {
        const blockStart = event as ContentBlockStartEvent;
        const block = blockStart.content_block;

        // Start a new assistant message if needed
        if (!currentMessage || currentMessage.role !== 'assistant') {
          currentMessage = {
            id: `msg-${Date.now()}-${messageIdCounter++}`,
            role: 'assistant',
            content: '',
            tools: [],
            timestamp: Date.now(),
            isComplete: false,
          };
          messages.push(currentMessage);
        }

        if (block.type === 'tool_use' && block.name) {
          currentMessage.tools.push({
            name: block.name,
            status: 'running',
            startTime: Date.now(),
          });
          currentState.isStreaming = true;
          currentState.currentRole = 'assistant';
        } else if (block.type === 'thinking') {
          currentState.isThinking = true;
        } else if (block.type === 'text') {
          currentState.isStreaming = true;
        }
        break;
      }

      case 'content_block_delta': {
        const delta = event as ContentBlockDeltaEvent;

        if (!currentMessage) {
          currentMessage = {
            id: `msg-${Date.now()}-${messageIdCounter++}`,
            role: 'assistant',
            content: '',
            tools: [],
            timestamp: Date.now(),
            isComplete: false,
          };
          messages.push(currentMessage);
        }

        if (delta.delta.type === 'text_delta' && delta.delta.text) {
          // Clean the text in case there are any escape codes
          const cleanText = stripAllTerminalCodes(delta.delta.text);
          if (cleanText) {
            currentMessage.content += cleanText;
          }
        } else if (delta.delta.type === 'thinking_delta' && delta.delta.thinking) {
          // Could show thinking in UI, for now just append to content
          if (!currentMessage.content.includes('[Thinking]')) {
            currentMessage.content = '[Thinking] ' + currentMessage.content;
          }
        }
        break;
      }

      case 'content_block_stop': {
        // Content block finished
        currentState.isThinking = false;
        break;
      }

      case 'message_stop':
      case 'message_delta': {
        // Message finished
        if (currentMessage) {
          currentMessage.isComplete = true;
          // Mark all tools as done
          for (const tool of currentMessage.tools) {
            if (tool.status === 'running') {
              tool.status = 'done';
              tool.endTime = Date.now();
            }
          }
        }
        currentState.isStreaming = false;
        currentState.currentRole = null;
        currentMessage = null;
        break;
      }

      case 'result': {
        const result = event as ResultEvent;
        // Tool result
        if (currentMessage && currentMessage.tools.length > 0) {
          const lastTool = currentMessage.tools[currentMessage.tools.length - 1];
          lastTool.status = result.is_error ? 'error' : 'done';
          lastTool.endTime = Date.now();
        }
        break;
      }

      case 'error': {
        // Error occurred
        if (currentMessage) {
          currentMessage.content += `\n\n[Error: ${(event as any).error?.message || 'Unknown error'}]`;
          currentMessage.isComplete = true;
        }
        break;
      }

      case 'system':
        // System messages - ignore for display
        break;

      default:
        // Unknown event type - ignore
        break;
    }
  }

  // Update processed index
  currentState.lastProcessedIndex = buffer.length;

  return { messages, state: currentState };
}

// =============================================================================
// FULL BUFFER PARSE (for initial load)
// =============================================================================

export function parseFullBuffer(buffer: string): SkinMessage[] {
  const result = parseIncremental(buffer, [], createParserState());
  return result.messages;
}
