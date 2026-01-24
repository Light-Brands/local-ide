import { NextRequest, NextResponse } from 'next/server';
import {
  getIntegrations,
  updateIntegration,
  removeIntegration,
  type IntegrationConfigs,
} from '@/lib/storage/configStorage';

/**
 * Integrations API - Service configurations (GitHub, Vercel, Supabase, Claude)
 */

// GET - Retrieve all integrations (masks sensitive data)
export async function GET() {
  try {
    const integrations = await getIntegrations();

    // Mask sensitive tokens for client response
    const masked: Record<string, unknown> = {};

    if (integrations.github) {
      masked.github = {
        connected: true,
        owner: integrations.github.owner,
        repo: integrations.github.repo,
        branch: integrations.github.branch,
        tokenPreview: integrations.github.token.slice(0, 8) + '...',
      };
    }

    if (integrations.vercel) {
      masked.vercel = {
        connected: true,
        projectId: integrations.vercel.projectId,
        projectName: integrations.vercel.projectName,
        teamId: integrations.vercel.teamId,
        teamSlug: integrations.vercel.teamSlug,
        ownerSlug: integrations.vercel.ownerSlug,
        tokenPreview: integrations.vercel.token.slice(0, 8) + '...',
      };
    }

    if (integrations.supabase) {
      masked.supabase = {
        connected: true,
        url: integrations.supabase.url,
        projectId: integrations.supabase.projectId,
        projectRef: integrations.supabase.projectRef,
        projectName: integrations.supabase.projectName,
        orgId: integrations.supabase.orgId,
        orgName: integrations.supabase.orgName,
        region: integrations.supabase.region,
        hasAnonKey: !!integrations.supabase.anonKey,
        hasServiceKey: !!integrations.supabase.serviceKey,
      };
    }

    if (integrations.claude) {
      masked.claude = {
        connected: true,
        mode: integrations.claude.mode || 'cli',
        model: integrations.claude.model,
        cliPath: integrations.claude.cliPath,
        ...(integrations.claude.apiKey && {
          keyPreview: integrations.claude.apiKey.slice(0, 12) + '...',
        }),
      };
    }

    return NextResponse.json({ data: masked });
  } catch (error) {
    console.error('Integrations GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get integrations' },
      { status: 500 }
    );
  }
}

// POST - Add or update an integration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { service, config } = body as {
      service: keyof IntegrationConfigs;
      config: IntegrationConfigs[keyof IntegrationConfigs];
    };

    if (!service || !config) {
      return NextResponse.json(
        { error: 'Service and config are required' },
        { status: 400 }
      );
    }

    // Validate service type
    if (!['github', 'vercel', 'supabase', 'claude'].includes(service)) {
      return NextResponse.json(
        { error: 'Invalid service type' },
        { status: 400 }
      );
    }

    await updateIntegration(service, config);

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error('Integrations POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save integration' },
      { status: 500 }
    );
  }
}

// DELETE - Remove an integration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service') as keyof IntegrationConfigs;

    if (!service) {
      return NextResponse.json(
        { error: 'Service parameter is required' },
        { status: 400 }
      );
    }

    await removeIntegration(service);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Integrations DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove integration' },
      { status: 500 }
    );
  }
}
