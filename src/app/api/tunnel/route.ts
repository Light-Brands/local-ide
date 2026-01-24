import { NextRequest, NextResponse } from 'next/server';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Store active tunnel processes
const activeTunnels: Map<string, ChildProcess> = new Map();

// Config file path for tunnel settings
const CONFIG_DIR = path.join(process.cwd(), '.cloudflared');
const CONFIG_FILE = path.join(CONFIG_DIR, 'tunnel-config.json');

interface TunnelConfig {
  tunnelId?: string;
  tunnelName?: string;
  subdomain?: string;
  localPort?: number;
  isRunning?: boolean;
  createdAt?: string;
}

async function loadConfig(): Promise<TunnelConfig> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveConfig(config: TunnelConfig): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

async function checkCloudflaredInstalled(): Promise<boolean> {
  try {
    await execAsync('which cloudflared');
    return true;
  } catch {
    return false;
  }
}

async function checkAuthenticated(): Promise<boolean> {
  try {
    // Check if cert.pem exists (indicates logged in)
    const homeDir = process.env.HOME || '/tmp';
    const certPath = path.join(homeDir, '.cloudflared', 'cert.pem');
    await fs.access(certPath);
    return true;
  } catch {
    return false;
  }
}

async function listTunnels(): Promise<{ id: string; name: string; createdAt: string }[]> {
  try {
    const { stdout } = await execAsync('cloudflared tunnel list --output json');
    const tunnels = JSON.parse(stdout);
    return tunnels.map((t: { id: string; name: string; created_at: string }) => ({
      id: t.id,
      name: t.name,
      createdAt: t.created_at,
    }));
  } catch {
    return [];
  }
}

async function getTunnelInfo(tunnelName: string): Promise<{ id: string; name: string; connections: number } | null> {
  try {
    const { stdout } = await execAsync(`cloudflared tunnel info ${tunnelName} --output json`);
    const info = JSON.parse(stdout);
    return {
      id: info.id,
      name: info.name,
      connections: info.connections?.length || 0,
    };
  } catch {
    return null;
  }
}

async function isCloudflaredRunning(tunnelId?: string): Promise<boolean> {
  try {
    // Check if cloudflared tunnel process is running
    // First try to find by tunnel ID in the config path
    if (tunnelId) {
      const { stdout } = await execAsync(`pgrep -f "cloudflared.*${tunnelId}" 2>/dev/null || true`);
      if (stdout.trim().length > 0) return true;
    }

    // Fallback: check for any cloudflared tunnel run process
    const { stdout } = await execAsync(`pgrep -f "cloudflared tunnel.*run" 2>/dev/null || true`);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const installed = await checkCloudflaredInstalled();

    if (!installed) {
      return NextResponse.json({
        installed: false,
        authenticated: false,
        tunnels: [],
        config: {},
        installCommand: 'brew install cloudflared',
      });
    }

    const authenticated = await checkAuthenticated();
    const tunnels = authenticated ? await listTunnels() : [];
    const config = await loadConfig();

    // Get tunnel info if we have one configured
    let tunnelInfo = null;
    if (config.tunnelName && authenticated) {
      tunnelInfo = await getTunnelInfo(config.tunnelName);
    }

    // Check if tunnel is actually running - check multiple sources:
    // 1. In-memory tracking (if started via API)
    // 2. Active connections from tunnel info
    // 3. Running cloudflared process (check by tunnel ID)
    const inMemoryRunning = config.tunnelName ? activeTunnels.has(config.tunnelName) : false;
    const hasConnections = tunnelInfo && tunnelInfo.connections > 0;
    const processRunning = await isCloudflaredRunning(config.tunnelId);
    const isRunning = inMemoryRunning || hasConnections || processRunning;

    return NextResponse.json({
      installed,
      authenticated,
      tunnels,
      config: { ...config, isRunning },
      tunnelInfo,
      processRunning,
      loginCommand: 'cloudflared login',
    });
  } catch (error) {
    console.error('Tunnel status error:', error);
    return NextResponse.json(
      { error: 'Failed to get tunnel status', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, tunnelName, subdomain, domain, localPort } = body;

  try {
    switch (action) {
      case 'create': {
        if (!tunnelName) {
          return NextResponse.json({ error: 'Tunnel name is required' }, { status: 400 });
        }

        // Create the tunnel
        const { stdout } = await execAsync(`cloudflared tunnel create ${tunnelName}`);

        // Extract tunnel ID from output
        const match = stdout.match(/Created tunnel ([a-f0-9-]+)/);
        const tunnelId = match ? match[1] : undefined;

        // Save config
        await saveConfig({
          tunnelId,
          tunnelName,
          subdomain,
          localPort: localPort || 3000,
          createdAt: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          tunnelId,
          tunnelName,
          message: `Tunnel "${tunnelName}" created successfully`,
        });
      }

      case 'configure-dns': {
        if (!tunnelName || !subdomain || !domain) {
          return NextResponse.json(
            { error: 'Tunnel name, subdomain, and domain are required' },
            { status: 400 }
          );
        }

        const fullDomain = `${subdomain}.${domain}`;

        // Route DNS to tunnel
        await execAsync(`cloudflared tunnel route dns ${tunnelName} ${fullDomain}`);

        // Update config
        const config = await loadConfig();
        await saveConfig({ ...config, subdomain: fullDomain });

        return NextResponse.json({
          success: true,
          message: `DNS route created: ${fullDomain} -> ${tunnelName}`,
          url: `https://${fullDomain}`,
        });
      }

      case 'start': {
        const config = await loadConfig();
        const name = tunnelName || config.tunnelName;
        const port = localPort || config.localPort || 3000;

        if (!name) {
          return NextResponse.json({ error: 'No tunnel configured' }, { status: 400 });
        }

        // Check if already running
        if (activeTunnels.has(name)) {
          return NextResponse.json({ error: 'Tunnel is already running' }, { status: 400 });
        }

        // Create ingress config file
        const homeDir = process.env.HOME || '/tmp';
        const tunnelConfigPath = path.join(homeDir, '.cloudflared', `${config.tunnelId}.yml`);

        const ingressConfig = `
tunnel: ${config.tunnelId}
credentials-file: ${homeDir}/.cloudflared/${config.tunnelId}.json

ingress:
  - hostname: ${config.subdomain}
    service: http://localhost:${port}
  - service: http_status:404
`;

        await fs.writeFile(tunnelConfigPath, ingressConfig);

        // Start tunnel in background
        const tunnelProcess = spawn('cloudflared', ['tunnel', '--config', tunnelConfigPath, 'run'], {
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        activeTunnels.set(name, tunnelProcess);

        // Update config
        await saveConfig({ ...config, isRunning: true });

        // Handle process exit
        tunnelProcess.on('exit', async () => {
          activeTunnels.delete(name);
          const currentConfig = await loadConfig();
          await saveConfig({ ...currentConfig, isRunning: false });
        });

        return NextResponse.json({
          success: true,
          message: `Tunnel "${name}" started`,
          url: `https://${config.subdomain}`,
          pid: tunnelProcess.pid,
        });
      }

      case 'stop': {
        const config = await loadConfig();
        const name = tunnelName || config.tunnelName;

        if (!name) {
          return NextResponse.json({ error: 'No tunnel configured' }, { status: 400 });
        }

        const process = activeTunnels.get(name);
        if (process) {
          process.kill();
          activeTunnels.delete(name);
        }

        // Also try to kill any running cloudflared processes for this tunnel
        try {
          await execAsync(`pkill -f "cloudflared tunnel.*${name}"`);
        } catch {
          // Process might not exist
        }

        await saveConfig({ ...config, isRunning: false });

        return NextResponse.json({
          success: true,
          message: `Tunnel "${name}" stopped`,
        });
      }

      case 'delete': {
        const config = await loadConfig();
        const name = tunnelName || config.tunnelName;

        if (!name) {
          return NextResponse.json({ error: 'No tunnel configured' }, { status: 400 });
        }

        // Stop if running
        const process = activeTunnels.get(name);
        if (process) {
          process.kill();
          activeTunnels.delete(name);
        }

        // Delete the tunnel
        try {
          await execAsync(`cloudflared tunnel delete ${name} --force`);
        } catch (error) {
          console.error('Error deleting tunnel:', error);
        }

        // Clear config
        await saveConfig({});

        return NextResponse.json({
          success: true,
          message: `Tunnel "${name}" deleted`,
        });
      }

      case 'save-config': {
        await saveConfig({
          tunnelName,
          subdomain,
          localPort: localPort || 3000,
        });

        return NextResponse.json({
          success: true,
          message: 'Configuration saved',
        });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Tunnel action error:', error);
    return NextResponse.json(
      { error: 'Tunnel action failed', details: String(error) },
      { status: 500 }
    );
  }
}
