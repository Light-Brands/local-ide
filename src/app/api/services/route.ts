import { NextResponse } from 'next/server';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { isVercel } from '@/lib/ide/env';

const execAsync = promisify(exec);

type ServiceId = 'terminal' | 'chat' | 'ide' | 'preview' | 'tunnel';

interface ServiceConfig {
  id: ServiceId;
  name: string;
  port: number;
  healthUrl: string;
  serverFile?: string;
  npmScript?: string;
  canManage: boolean;
}

const SERVICES: ServiceConfig[] = [
  {
    id: 'ide',
    name: 'IDE Server',
    port: 4000,
    healthUrl: 'http://localhost:4000/api/health',
    canManage: false,
  },
  {
    id: 'preview',
    name: 'Preview',
    port: 3000,
    healthUrl: 'http://localhost:3000',
    npmScript: 'app',
    canManage: true,
  },
  {
    id: 'terminal',
    name: 'Terminal Server',
    port: 4001,
    healthUrl: 'http://localhost:4001/health',
    serverFile: 'server/terminal-server.ts',
    canManage: true,
  },
  {
    id: 'chat',
    name: 'Chat Server',
    port: 4002,
    healthUrl: 'http://localhost:4002/health',
    serverFile: 'server/chat-server.ts',
    canManage: true,
  },
  {
    id: 'tunnel',
    name: 'Cloudflare Tunnel',
    port: 0,
    healthUrl: '',
    canManage: false, // Managed via /api/tunnel
  },
];

async function checkHealth(url: string, timeout = 2000): Promise<boolean> {
  if (!url) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

async function getServiceStatus(service: ServiceConfig): Promise<{
  id: ServiceId;
  name: string;
  port: number;
  status: 'healthy' | 'unhealthy' | 'unknown';
}> {
  const isHealthy = await checkHealth(service.healthUrl);
  return {
    id: service.id,
    name: service.name,
    port: service.port,
    status: isHealthy ? 'healthy' : 'unhealthy',
  };
}

async function killProcess(port: number): Promise<boolean> {
  try {
    // Find process on port and kill it
    await execAsync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
    // Wait for process to die
    await new Promise((resolve) => setTimeout(resolve, 500));
    return true;
  } catch {
    return false;
  }
}

async function startService(service: ServiceConfig): Promise<{ success: boolean; message: string }> {
  if (!service.canManage || (!service.serverFile && !service.npmScript)) {
    return { success: false, message: `Service ${service.name} cannot be started via API` };
  }

  // Check if already running
  if (await checkHealth(service.healthUrl)) {
    return { success: true, message: `${service.name} is already running` };
  }

  const projectRoot = process.cwd();

  try {
    let serverProcess;

    if (service.npmScript) {
      // Start via npm script
      serverProcess = spawn('npm', ['run', service.npmScript], {
        cwd: projectRoot,
        env: {
          ...process.env,
          IDE_PROJECT_PATH: process.env.IDE_PROJECT_PATH || projectRoot,
        },
        detached: true,
        stdio: 'ignore',
      });
    } else if (service.serverFile) {
      // Start via tsx
      const serverPath = path.join(projectRoot, service.serverFile);
      serverProcess = spawn('npx', ['tsx', serverPath], {
        cwd: projectRoot,
        env: {
          ...process.env,
          IDE_PROJECT_PATH: process.env.IDE_PROJECT_PATH || projectRoot,
        },
        detached: true,
        stdio: 'ignore',
      });
    } else {
      return { success: false, message: `No start method for ${service.name}` };
    }

    serverProcess.unref();

    // Wait for server to start (longer for Next.js)
    const waitTime = service.npmScript ? 5000 : 1500;
    await new Promise((resolve) => setTimeout(resolve, waitTime));

    // Verify it started
    if (await checkHealth(service.healthUrl)) {
      return { success: true, message: `${service.name} started successfully` };
    } else {
      return { success: false, message: `${service.name} failed to start` };
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to start ${service.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function restartService(service: ServiceConfig): Promise<{ success: boolean; message: string }> {
  if (!service.canManage) {
    return { success: false, message: `Service ${service.name} cannot be restarted via API` };
  }

  // Kill existing process
  await killProcess(service.port);

  // Start new process
  return startService(service);
}

async function getSessionCounts(): Promise<{ chat: number; terminal: number; tmux: number }> {
  let chat = 0;
  let terminal = 0;
  let tmux = 0;

  try {
    // Get chat session count
    const chatResponse = await fetch('http://localhost:4002/health');
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      chat = chatData.activeSessions || 0;
    }
  } catch {}

  try {
    // Get terminal session count
    const terminalResponse = await fetch('http://localhost:4001/health');
    if (terminalResponse.ok) {
      const terminalData = await terminalResponse.json();
      terminal = terminalData.activeSessions || 0;
    }
  } catch {}

  try {
    // Get tmux session count - try common paths
    const tmuxPaths = ['/opt/homebrew/bin/tmux', '/usr/local/bin/tmux', '/usr/bin/tmux', 'tmux'];
    for (const tmuxPath of tmuxPaths) {
      try {
        const { stdout } = await execAsync(`${tmuxPath} ls 2>/dev/null | wc -l`);
        tmux = parseInt(stdout.trim()) || 0;
        break;
      } catch {
        // Try next path
      }
    }
  } catch {}

  return { chat, terminal, tmux };
}

// GET - Return status of all services
export async function GET() {
  if (isVercel) {
    return NextResponse.json({
      status: 'not_available',
      reason: 'Service management requires local server',
    });
  }

  const statuses = await Promise.all(
    SERVICES.filter((s) => s.id !== 'tunnel').map(getServiceStatus)
  );

  // Check tunnel separately
  try {
    const tunnelResponse = await fetch('http://localhost:4000/api/tunnel');
    const tunnelData = await tunnelResponse.json();
    statuses.push({
      id: 'tunnel',
      name: 'Cloudflare Tunnel',
      port: 0,
      status: tunnelData.config?.isRunning ? 'healthy' : 'unhealthy',
    });
  } catch {
    statuses.push({
      id: 'tunnel',
      name: 'Cloudflare Tunnel',
      port: 0,
      status: 'unhealthy',
    });
  }

  // Get session counts
  const sessions = await getSessionCounts();

  return NextResponse.json({
    success: true,
    services: statuses,
    sessions,
  });
}

async function clearAllSessions(): Promise<{ success: boolean; message: string }> {
  try {
    // Kill all tmux sessions - use full path since Next.js might not have it in PATH
    // Try common paths for tmux
    const tmuxPaths = ['/opt/homebrew/bin/tmux', '/usr/local/bin/tmux', '/usr/bin/tmux', 'tmux'];
    let tmuxKilled = false;

    for (const tmuxPath of tmuxPaths) {
      try {
        await execAsync(`${tmuxPath} kill-server 2>/dev/null`);
        tmuxKilled = true;
        break;
      } catch {
        // Try next path
      }
    }

    // Kill Claude processes spawned for chat
    await execAsync('pkill -f "claude.*stream-json" 2>/dev/null || true');

    return { success: true, message: tmuxKilled ? 'All sessions cleared' : 'Sessions cleared (tmux not found)' };
  } catch (error) {
    return {
      success: false,
      message: `Failed to clear sessions: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// POST - Start/restart services
export async function POST(request: Request) {
  if (isVercel) {
    return NextResponse.json({
      status: 'not_available',
      reason: 'Service management requires local server',
    });
  }

  try {
    const body = await request.json();
    const { action, services: serviceIds } = body as {
      action: 'start' | 'restart' | 'clear-sessions';
      services?: string[];
    };

    // Handle clear sessions action
    if (action === 'clear-sessions') {
      const result = await clearAllSessions();
      return NextResponse.json(result);
    }

    // For start/restart actions, services array is required
    if (!serviceIds || serviceIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing services parameter' },
        { status: 400 }
      );
    }

    // Determine which services to act on
    const targetServices =
      serviceIds.includes('all')
        ? SERVICES.filter((s) => s.canManage)
        : SERVICES.filter((s) => serviceIds.includes(s.id) && s.canManage);

    if (targetServices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No manageable services specified' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      targetServices.map(async (service) => {
        const result =
          action === 'restart'
            ? await restartService(service)
            : await startService(service);
        return { id: service.id, ...result };
      })
    );

    const allSuccess = results.every((r) => r.success);

    return NextResponse.json({
      success: allSuccess,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
