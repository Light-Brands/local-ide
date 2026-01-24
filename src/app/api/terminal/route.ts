import { NextResponse } from 'next/server';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { isVercel } from '@/lib/ide/env';

const execAsync = promisify(exec);

const TERMINAL_PORT = 4001;
const TERMINAL_HEALTH_URL = `http://localhost:${TERMINAL_PORT}/health`;

// Build WebSocket URL based on request origin
function getWebSocketUrl(request: Request): string {
  const host = request.headers.get('host') || 'localhost:4000';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

  if (isLocalhost) {
    // Local development - connect directly to terminal server
    return `ws://localhost:${TERMINAL_PORT}/ws/terminal`;
  } else {
    // Tunnel/remote - use same host with wss://
    // The /ws/* path is routed to the terminal server by Cloudflare tunnel
    return `wss://${host}/ws/terminal`;
  }
}

// Track the spawned process
let terminalProcess: ReturnType<typeof spawn> | null = null;

async function isTerminalServerRunning(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(TERMINAL_HEALTH_URL, {
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

async function startTerminalServer(): Promise<{ success: boolean; message: string }> {
  // Check if already running
  if (await isTerminalServerRunning()) {
    return { success: true, message: 'Terminal server already running' };
  }

  // Find the project root (where server/ directory is)
  const projectRoot = process.cwd();
  const serverPath = path.join(projectRoot, 'server', 'terminal-server.ts');

  try {
    // Spawn tsx to run the TypeScript server directly
    terminalProcess = spawn('npx', ['tsx', serverPath], {
      cwd: projectRoot,
      env: {
        ...process.env,
        IDE_PROJECT_PATH: process.env.IDE_PROJECT_PATH || projectRoot,
      },
      detached: true,
      stdio: 'ignore',
    });

    // Unref so the parent process can exit independently
    terminalProcess.unref();

    // Wait a moment for server to start
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Verify it started
    if (await isTerminalServerRunning()) {
      return { success: true, message: 'Terminal server started successfully' };
    } else {
      return { success: false, message: 'Terminal server failed to start' };
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to start terminal server: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// GET - Check terminal server status and auto-start if needed
export async function GET(request: Request) {
  // Return graceful response in production (Vercel)
  if (isVercel) {
    return NextResponse.json({
      status: 'not_available',
      reason: 'Terminal requires local server',
    });
  }

  const url = new URL(request.url);
  const autoStart = url.searchParams.get('autoStart') !== 'false';

  const isRunning = await isTerminalServerRunning();
  const wsUrl = getWebSocketUrl(request);

  if (isRunning) {
    return NextResponse.json({
      status: 'running',
      port: TERMINAL_PORT,
      wsUrl,
    });
  }

  if (autoStart) {
    const result = await startTerminalServer();

    if (result.success) {
      return NextResponse.json({
        status: 'started',
        port: TERMINAL_PORT,
        wsUrl,
        message: result.message,
      });
    } else {
      return NextResponse.json(
        {
          status: 'error',
          message: result.message,
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    status: 'stopped',
    port: TERMINAL_PORT,
  });
}

// POST - Explicitly start the terminal server
export async function POST(request: Request) {
  // Return graceful response in production (Vercel)
  if (isVercel) {
    return NextResponse.json({
      status: 'not_available',
      reason: 'Terminal requires local server',
    });
  }

  const result = await startTerminalServer();
  const wsUrl = getWebSocketUrl(request);

  if (result.success) {
    return NextResponse.json({
      status: 'started',
      port: TERMINAL_PORT,
      wsUrl,
      message: result.message,
    });
  } else {
    return NextResponse.json(
      {
        status: 'error',
        message: result.message,
      },
      { status: 500 }
    );
  }
}
