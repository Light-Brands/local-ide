import { NextRequest, NextResponse } from 'next/server';

/**
 * Integrations Settings API
 *
 * Returns all integration configurations for the IDE.
 * The IDE (running on port 4000) calls this to get settings
 * configured in the dashboard (running on port 3000).
 */

// Storage keys for integrations (localStorage on client, could be DB in future)
const STORAGE_KEYS = {
  github: 'ide-github-integration',
  vercel: 'ide-vercel-integration',
  supabase: 'ide-supabase-integration',
  claude: 'claude-api-key',
};

// In-memory cache for server-side (since we can't use localStorage on server)
// In a real app, this would be a database
const serverCache: Record<string, unknown> = {};

export async function GET() {
  // Return integrations from server cache or defaults
  // Note: In production, this would fetch from a database
  const integrations = {
    github: serverCache.github || { connected: false },
    vercel: serverCache.vercel || { connected: false },
    supabase: serverCache.supabase || { connected: false },
    claude: {
      configured: !!serverCache.claudeApiKey,
      // Don't send the actual API key over the network for security
    },
  };

  return NextResponse.json(integrations, {
    headers: {
      // Allow CORS from IDE port
      'Access-Control-Allow-Origin': 'http://localhost:4000',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, settings } = body;

    if (!type || !settings) {
      return NextResponse.json(
        { error: 'Missing type or settings' },
        { status: 400 }
      );
    }

    // Store in server cache
    serverCache[type] = settings;

    return NextResponse.json({ success: true, type, settings });
  } catch (error) {
    console.error('Integrations PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to save integration' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:4000',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
