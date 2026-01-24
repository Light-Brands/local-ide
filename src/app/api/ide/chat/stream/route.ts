/**
 * Claude CLI Streaming Chat API
 * Spawns Claude CLI process and streams responses as Server-Sent Events
 */

import { spawn, type ChildProcess } from 'child_process';
import { accessSync } from 'fs';
import { NextRequest } from 'next/server';
import type { ChatRequest, ChatEvent } from '@/types/chat';

// Get CLI path from environment or common locations
async function getClaudePath(): Promise<string> {
  // Check environment variable
  if (process.env.CLAUDE_CLI_PATH) {
    console.log('[Claude CLI] Using path from env:', process.env.CLAUDE_CLI_PATH);
    return process.env.CLAUDE_CLI_PATH;
  }

  // Finally, check common installation paths
  const commonPaths = [
    '/opt/homebrew/bin/claude',  // macOS with Homebrew (ARM)
    '/usr/local/bin/claude',      // macOS with Homebrew (Intel) or manual install
    '/usr/bin/claude',            // Linux system-wide
  ];

  for (const p of commonPaths) {
    try {
      accessSync(p);
      console.log('[Claude CLI] Found at:', p);
      return p;
    } catch {
      // Path doesn't exist, continue
    }
  }

  // Fallback
  console.log('[Claude CLI] Not found, defaulting to /opt/homebrew/bin/claude');
  return '/opt/homebrew/bin/claude';
}

// Build conversation history into prompt format
function buildPromptWithHistory(
  message: string,
  conversationHistory?: ChatRequest['conversationHistory']
): string {
  if (!conversationHistory || conversationHistory.length === 0) {
    return message;
  }

  // Build context from history (last 10 exchanges max)
  const recentHistory = conversationHistory.slice(-20);
  const historyText = recentHistory
    .map((entry) => {
      const roleLabel = entry.role === 'user' ? 'Human' : 'Assistant';
      return `${roleLabel}: ${entry.content}`;
    })
    .join('\n\n');

  return `Previous conversation:\n${historyText}\n\nHuman: ${message}`;
}

// Parse Claude CLI JSON stream events into our ChatEvent format
// CLI format is different from API streaming format
function parseClaudeEvent(json: Record<string, unknown>): ChatEvent | null {
  const type = json.type as string;

  switch (type) {
    case 'system':
      // Init event - ignore
      return null;

    case 'assistant': {
      // CLI format: message.content[] contains the response
      const message = json.message as Record<string, unknown>;
      const content = message?.content as Array<Record<string, unknown>>;

      if (content && Array.isArray(content)) {
        // Extract text from content blocks
        for (const block of content) {
          if (block.type === 'text' && block.text) {
            return {
              type: 'text',
              content: block.text as string,
            };
          }
          if (block.type === 'thinking' && block.thinking) {
            return {
              type: 'thinking',
              content: block.thinking as string,
            };
          }
        }
      }

      // Fallback: return message_start if no content yet
      return {
        type: 'message_start',
        id: message?.id as string || crypto.randomUUID(),
      };
    }

    case 'result': {
      // Final result event - contains the complete response
      const resultText = json.result as string;
      if (resultText && !json.tool_use_id) {
        // This is the final text result, not a tool result
        // We already sent the text via 'assistant' event, so just signal done
        return null;
      }

      // Tool result
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
        return {
          type: 'thinking',
          content: '',
        };
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
        return {
          type: 'text',
          content: delta.text as string,
        };
      }
      if (delta?.type === 'thinking_delta') {
        return {
          type: 'thinking',
          content: delta.thinking as string,
        };
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
        content: (json.error as Record<string, unknown>)?.message as string || json.message as string || 'Unknown error',
        code: (json.error as Record<string, unknown>)?.type as string,
      };

    default:
      console.log('[Claude CLI] Unknown event type:', type);
      return null;
  }
}

export async function POST(request: NextRequest) {
  let claude: ChildProcess | null = null;

  try {
    const body = (await request.json()) as ChatRequest;
    const { message, workspacePath, conversationHistory } = body;

    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get CLI path from integrations config (or auto-detect)
    const claudePath = await getClaudePath();

    // Use project root as workspace (guaranteed to exist)
    const actualWorkspace = process.cwd();

    // Build CLI arguments
    const args = [
      '--print',
      '--output-format', 'stream-json',
      '--verbose',
      '--add-dir', actualWorkspace,
      '--dangerously-skip-permissions',
    ];

    // Build prompt with conversation history
    const prompt = buildPromptWithHistory(message, conversationHistory);

    // Escape the prompt for shell
    const escapedPrompt = prompt.replace(/'/g, "'\\''");

    // Build the full command with echo piping (like terminal)
    const fullCommand = `echo '${escapedPrompt}' | ${claudePath} ${args.join(' ')}`;
    console.log('[Claude CLI] Running command via shell');

    // Build spawn environment
    const spawnEnv = {
      ...process.env,
      NO_COLOR: '1',
      HOME: process.env.HOME || '/Users/lawless',
      PATH: `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.HOME}/.local/bin:${process.env.PATH || ''}`,
    };

    // Use project root as cwd
    const cwd = process.cwd();

    // Spawn via shell to properly pipe input
    claude = spawn('/bin/bash', ['-c', fullCommand], {
      env: spawnEnv,
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Create readable stream for SSE
    const encoder = new TextEncoder();
    let buffer = '';
    let isClosed = false;

    const stream = new ReadableStream({
      start(controller) {
        // Safe enqueue that checks if closed
        const safeEnqueue = (data: Uint8Array) => {
          if (!isClosed) {
            try {
              controller.enqueue(data);
            } catch {
              // Controller already closed
            }
          }
        };

        // Safe close that only closes once
        const safeClose = () => {
          if (!isClosed) {
            isClosed = true;
            try {
              controller.close();
            } catch {
              // Already closed
            }
          }
        };

        // Handle stdout data
        claude?.stdout?.on('data', (chunk: Buffer) => {
          const chunkStr = chunk.toString();
          console.log('[Claude CLI] Raw stdout chunk:', chunkStr.slice(0, 200));
          buffer += chunkStr;

          // Process complete JSON lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
              const json = JSON.parse(trimmed);
              const event = parseClaudeEvent(json);

              if (event) {
                const sseData = `data: ${JSON.stringify(event)}\n\n`;
                safeEnqueue(encoder.encode(sseData));
              }
            } catch (e) {
              // Not valid JSON - might be raw text output
              console.log('[Claude CLI] Non-JSON output:', trimmed);

              // If it looks like actual content, emit as text
              if (trimmed && !trimmed.startsWith('{')) {
                const textEvent: ChatEvent = {
                  type: 'text',
                  content: trimmed + '\n',
                };
                const sseData = `data: ${JSON.stringify(textEvent)}\n\n`;
                safeEnqueue(encoder.encode(sseData));
              }
            }
          }
        });

        // Handle stderr
        claude?.stderr?.on('data', (chunk: Buffer) => {
          const text = chunk.toString();
          console.error('[Claude CLI stderr]:', text);

          // Check for authentication errors
          if (text.includes('not logged in') || text.includes('authentication')) {
            const errorEvent: ChatEvent = {
              type: 'error',
              content: 'Claude CLI is not authenticated. Run "claude login" in your terminal.',
              code: 'AUTH_ERROR',
            };
            const sseData = `data: ${JSON.stringify(errorEvent)}\n\n`;
            safeEnqueue(encoder.encode(sseData));
          }
        });

        // Handle process close
        claude?.on('close', (code) => {
          console.log('[Claude CLI] Process closed with code:', code);

          // Process any remaining buffer
          if (buffer.trim()) {
            try {
              const json = JSON.parse(buffer.trim());
              const event = parseClaudeEvent(json);
              if (event) {
                const sseData = `data: ${JSON.stringify(event)}\n\n`;
                safeEnqueue(encoder.encode(sseData));
              }
            } catch {
              // Ignore parse errors on close
            }
          }

          // Send done event
          const doneEvent: ChatEvent = { type: 'done' };
          const sseData = `data: ${JSON.stringify(doneEvent)}\n\n`;
          safeEnqueue(encoder.encode(sseData));

          safeClose();
        });

        // Handle errors
        claude?.on('error', (error) => {
          console.error('[Claude CLI] Process error:', error);

          const errorEvent: ChatEvent = {
            type: 'error',
            content: `Failed to run Claude CLI: ${error.message}`,
            code: 'SPAWN_ERROR',
          };
          const sseData = `data: ${JSON.stringify(errorEvent)}\n\n`;
          safeEnqueue(encoder.encode(sseData));

          const doneEvent: ChatEvent = { type: 'done' };
          safeEnqueue(encoder.encode(`data: ${JSON.stringify(doneEvent)}\n\n`));

          safeClose();
        });
      },

      cancel() {
        // Kill process if stream is cancelled
        if (claude && !claude.killed) {
          console.log('[Claude CLI] Killing process due to stream cancel');
          claude.kill('SIGTERM');
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error('[Claude CLI] Error:', error);

    // Clean up process if it exists
    if (claude && !claude.killed) {
      claude.kill('SIGTERM');
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
