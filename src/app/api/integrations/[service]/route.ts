import { NextRequest, NextResponse } from 'next/server';
import {
  getIntegration,
  updateIntegration,
  removeIntegration,
  type IntegrationConfigs,
} from '@/lib/storage/configStorage';

type ServiceType = keyof IntegrationConfigs;

const VALID_SERVICES: ServiceType[] = ['github', 'vercel', 'supabase', 'claude'];

/**
 * Individual Integration API
 */

// GET - Get integration config (full, for server use)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const { service } = await params;

    if (!VALID_SERVICES.includes(service as ServiceType)) {
      return NextResponse.json(
        { error: 'Invalid service' },
        { status: 400 }
      );
    }

    const config = await getIntegration(service as ServiceType);

    if (!config) {
      return NextResponse.json(
        { data: null, connected: false }
      );
    }

    return NextResponse.json({ data: config, connected: true });
  } catch (error) {
    console.error('Integration GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get integration' },
      { status: 500 }
    );
  }
}

// PUT - Update integration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const { service } = await params;

    if (!VALID_SERVICES.includes(service as ServiceType)) {
      return NextResponse.json(
        { error: 'Invalid service' },
        { status: 400 }
      );
    }

    const config = await request.json();
    await updateIntegration(service as ServiceType, config);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Integration PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    );
  }
}

// DELETE - Remove integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const { service } = await params;

    if (!VALID_SERVICES.includes(service as ServiceType)) {
      return NextResponse.json(
        { error: 'Invalid service' },
        { status: 400 }
      );
    }

    await removeIntegration(service as ServiceType);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Integration DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove integration' },
      { status: 500 }
    );
  }
}

// POST - Test connection
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const { service } = await params;
    const config = await request.json();

    if (!VALID_SERVICES.includes(service as ServiceType)) {
      return NextResponse.json(
        { error: 'Invalid service' },
        { status: 400 }
      );
    }

    // Test the connection based on service type
    let testResult: { success: boolean; message: string; data?: unknown };

    switch (service) {
      case 'github':
        testResult = await testGitHub(config);
        break;
      case 'vercel':
        testResult = await testVercel(config);
        break;
      case 'supabase':
        testResult = await testSupabase(config);
        break;
      case 'claude':
        testResult = await testClaude(config);
        break;
      default:
        testResult = { success: false, message: 'Unknown service' };
    }

    if (testResult.success) {
      // Save the config if test passed
      await updateIntegration(service as ServiceType, config);
    }

    return NextResponse.json(testResult);
  } catch (error) {
    console.error('Integration test error:', error);
    return NextResponse.json(
      { success: false, message: 'Connection test failed' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Connection Test Functions
// =============================================================================

async function testGitHub(config: { token: string }) {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Invalid token or unauthorized' };
    }

    const user = await response.json();
    return {
      success: true,
      message: `Connected as ${user.login}`,
      data: { login: user.login, avatar: user.avatar_url },
    };
  } catch {
    return { success: false, message: 'Failed to connect to GitHub' };
  }
}

async function testVercel(config: { token: string }) {
  try {
    const response = await fetch('https://api.vercel.com/v9/projects', {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Invalid token or unauthorized' };
    }

    const data = await response.json();
    return {
      success: true,
      message: `Connected - ${data.projects?.length || 0} projects found`,
      data: {
        projects: data.projects?.map((p: { id: string; name: string }) => ({
          id: p.id,
          name: p.name,
        })),
      },
    };
  } catch {
    return { success: false, message: 'Failed to connect to Vercel' };
  }
}

async function testSupabase(config: { url: string; serviceKey: string }) {
  try {
    const response = await fetch(`${config.url}/rest/v1/`, {
      headers: {
        Authorization: `Bearer ${config.serviceKey}`,
        apikey: config.serviceKey,
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Invalid credentials or unauthorized' };
    }

    return {
      success: true,
      message: 'Connected to Supabase',
      data: { url: config.url },
    };
  } catch {
    return { success: false, message: 'Failed to connect to Supabase' };
  }
}

async function testClaude(config: { apiKey: string; model: string }) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Say "Connected!" in one word.' }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.error?.message || 'Invalid API key',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'API key valid',
      data: { response: data.content?.[0]?.text },
    };
  } catch {
    return { success: false, message: 'Failed to connect to Claude API' };
  }
}
