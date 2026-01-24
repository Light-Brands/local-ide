/**
 * Chat Types for Claude CLI Integration
 * Content block types for streaming chat with tool support
 */

// =============================================================================
// CONTENT BLOCK TYPES
// =============================================================================

export interface TextBlock {
  type: 'text';
  content: string;
}

export interface ThinkingBlock {
  type: 'thinking';
  content: string;
  collapsed: boolean;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  tool: string;
  input: Record<string, unknown>;
  status: 'running' | 'success' | 'error';
  output?: string;
  error?: string;
}

export interface ToolResultBlock {
  type: 'tool_result';
  toolUseId: string;
  content: string;
  isError?: boolean;
}

export interface ErrorBlock {
  type: 'error';
  content: string;
  code?: string;
}

export type ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock | ToolResultBlock | ErrorBlock;

// =============================================================================
// MESSAGE TYPE
// =============================================================================

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: ContentBlock[];
  timestamp: Date;
  isStreaming?: boolean;
}

// =============================================================================
// CHAT EVENT TYPES (SSE)
// =============================================================================

export interface TextChunkEvent {
  type: 'text';
  content: string;
}

export interface ThinkingEvent {
  type: 'thinking';
  content: string;
}

export interface ToolUseStartEvent {
  type: 'tool_use_start';
  id: string;
  tool: string;
  input: Record<string, unknown>;
}

export interface ToolUseOutputEvent {
  type: 'tool_use_output';
  id: string;
  output: string;
}

export interface ToolUseEndEvent {
  type: 'tool_use_end';
  id: string;
  status: 'success' | 'error';
  error?: string;
}

export interface ErrorEvent {
  type: 'error';
  content: string;
  code?: string;
}

export interface DoneEvent {
  type: 'done';
}

export interface MessageStartEvent {
  type: 'message_start';
  id: string;
}

export type ChatEvent =
  | TextChunkEvent
  | ThinkingEvent
  | ToolUseStartEvent
  | ToolUseOutputEvent
  | ToolUseEndEvent
  | ErrorEvent
  | DoneEvent
  | MessageStartEvent;

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isTextBlock(block: ContentBlock): block is TextBlock {
  return block.type === 'text';
}

export function isThinkingBlock(block: ContentBlock): block is ThinkingBlock {
  return block.type === 'thinking';
}

export function isToolUseBlock(block: ContentBlock): block is ToolUseBlock {
  return block.type === 'tool_use';
}

export function isToolResultBlock(block: ContentBlock): block is ToolResultBlock {
  return block.type === 'tool_result';
}

export function isErrorBlock(block: ContentBlock): block is ErrorBlock {
  return block.type === 'error';
}

// =============================================================================
// CHAT STATUS TYPES
// =============================================================================

export interface ClaudeCliStatus {
  connected: boolean;
  version?: string;
  error?: string;
}

// =============================================================================
// CHAT REQUEST/RESPONSE TYPES
// =============================================================================

export interface ChatRequest {
  message: string;
  workspacePath: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ConversationHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}
