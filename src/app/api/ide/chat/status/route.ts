/**
 * Claude CLI Status Check API
 * Validates that Claude CLI is installed and authenticated
 */

import { spawn } from 'child_process';
import { accessSync } from 'fs';
import { NextResponse } from 'next/server';
import type { ClaudeCliStatus } from '@/types/chat';

// Get CLI path from environment or common locations
async function getClaudePath(): Promise<string> {
  // Check environment variable
  if (process.env.CLAUDE_CLI_PATH) {
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
      return p;
    } catch {
      // Path doesn't exist, continue
    }
  }

  // Fallback
  return '/opt/homebrew/bin/claude';
}

export async function GET(): Promise<NextResponse<ClaudeCliStatus>> {
  const claudePath = await getClaudePath();

  return new Promise((resolve) => {
    try {
      // Spawn Claude CLI directly with full PATH
      const claude = spawn(claudePath, ['--version'], {
        timeout: 10000,
        env: {
          ...process.env,
          PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`,
          HOME: process.env.HOME || '/Users/lawless',
        },
      });

      let stdout = '';
      let stderr = '';

      claude.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      claude.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      claude.on('error', (error) => {
        resolve(
          NextResponse.json(
            {
              connected: false,
              error: `Failed to execute Claude CLI at ${claudePath}: ${error.message}. Make sure Claude CLI is installed.`,
            },
            { status: 200 }
          )
        );
      });

      claude.on('close', (code) => {
        if (code === 0) {
          const version = stdout.trim() || 'unknown';
          resolve(
            NextResponse.json({
              connected: true,
              version,
            })
          );
        } else {
          resolve(
            NextResponse.json(
              {
                connected: false,
                error: stderr.trim() || `Claude CLI exited with code ${code}. Make sure you're logged in with 'claude login'.`,
              },
              { status: 200 }
            )
          );
        }
      });

      // Timeout fallback
      setTimeout(() => {
        claude.kill();
        resolve(
          NextResponse.json(
            {
              connected: false,
              error: 'Claude CLI check timed out',
            },
            { status: 200 }
          )
        );
      }, 10000);
    } catch (error) {
      resolve(
        NextResponse.json(
          {
            connected: false,
            error: error instanceof Error ? error.message : 'Unknown error checking Claude CLI',
          },
          { status: 200 }
        )
      );
    }
  });
}
