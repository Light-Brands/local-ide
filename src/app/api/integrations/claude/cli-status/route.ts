import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CLIStatus {
  installed: boolean;
  authenticated: boolean;
  version: string | null;
  user: string | null;
  path: string | null;
}

/**
 * Check Claude CLI status
 * POST /api/integrations/claude/cli-status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cliPath = body.cliPath || 'claude';

    const status: CLIStatus = {
      installed: false,
      authenticated: false,
      version: null,
      user: null,
      path: null,
    };

    // Check if CLI is installed by trying to get the path
    try {
      const { stdout: whichOutput } = await execAsync(`which ${cliPath}`);
      status.path = whichOutput.trim();
      status.installed = true;
    } catch {
      // CLI not found in PATH, try the specific path directly
      try {
        const { stdout: versionOutput } = await execAsync(`${cliPath} --version`);
        status.installed = true;
        status.path = cliPath;

        // Parse version from output
        const versionMatch = versionOutput.match(/(\d+\.\d+\.\d+)/);
        if (versionMatch) {
          status.version = versionMatch[1];
        }
      } catch {
        // CLI not installed
        return NextResponse.json({
          success: false,
          status,
          message: 'Claude CLI not found',
        });
      }
    }

    // Get version if we haven't already
    if (!status.version) {
      try {
        const { stdout: versionOutput } = await execAsync(`${status.path || cliPath} --version`);
        const versionMatch = versionOutput.match(/(\d+\.\d+\.\d+)/);
        if (versionMatch) {
          status.version = versionMatch[1];
        }
      } catch {
        // Version check failed, but CLI is installed
      }
    }

    // Check authentication by looking for Claude credentials file
    // Running CLI commands from Node.js often times out due to environment differences
    // Instead, we check if the user has authenticated by looking for the credentials file
    try {
      const homeDir = process.env.HOME || '/Users/' + process.env.USER;
      const { stdout: credCheck } = await execAsync(
        `test -f "${homeDir}/.claude.json" && cat "${homeDir}/.claude.json" | head -c 100`,
        { timeout: 5000 }
      );

      // If we can read the .claude.json file and it has content, user is likely authenticated
      if (credCheck && credCheck.trim().length > 0 && credCheck.includes('{')) {
        status.authenticated = true;
      }
    } catch {
      // Credentials file doesn't exist or can't be read - try running a quick CLI test
      try {
        const { stdout } = await execAsync(
          `${status.path || cliPath} -p "OK" 2>&1`,
          { timeout: 30000 }
        );

        const output = stdout.trim();
        console.log('CLI auth check output:', JSON.stringify(output));

        const authErrorPatterns = [
          'not logged in',
          'not authenticated',
          'unauthorized',
          'authentication required',
          'please log in',
          'invalid api key',
        ];

        const hasAuthError = authErrorPatterns.some((pattern) =>
          output.toLowerCase().includes(pattern)
        );

        if (!hasAuthError && output.length > 0) {
          status.authenticated = true;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log('CLI auth check error:', errorMessage);

        // Timeout without auth error usually means CLI is working
        if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('killed')) {
          status.authenticated = true;
        }
      }
    }

    return NextResponse.json({
      success: true,
      status,
      message: status.authenticated
        ? 'Claude CLI is installed and authenticated'
        : status.installed
          ? 'Claude CLI is installed but not authenticated. Run `claude` in your terminal to log in.'
          : 'Claude CLI not found',
    });
  } catch (error) {
    console.error('CLI status check error:', error);
    return NextResponse.json(
      {
        success: false,
        status: {
          installed: false,
          authenticated: false,
          version: null,
          user: null,
          path: null,
        },
        message: 'Failed to check CLI status',
      },
      { status: 500 }
    );
  }
}
