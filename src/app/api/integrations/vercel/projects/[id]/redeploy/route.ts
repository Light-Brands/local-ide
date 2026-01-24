import { NextRequest, NextResponse } from 'next/server';
import { getIntegration } from '@/lib/storage/configStorage';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const vercelConfig = await getIntegration('vercel');

  if (!vercelConfig?.token) {
    return NextResponse.json(
      { error: 'Vercel not connected. Please connect your Vercel account in settings.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { target = 'production', deploymentId } = body;

    let url = 'https://api.vercel.com/v13/deployments';
    if (vercelConfig.teamId) {
      url += `?teamId=${vercelConfig.teamId}`;
    }

    // Build the request body for redeployment
    let requestBody: Record<string, unknown> = {
      name: id, // Project name or ID
      target,
    };

    if (deploymentId) {
      // Redeploy existing deployment
      requestBody = {
        deploymentId,
        target,
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vercelConfig.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to trigger redeploy' },
        { status: response.status }
      );
    }

    const deployment = await response.json();

    return NextResponse.json({
      success: true,
      deployment: {
        id: deployment.id || deployment.uid,
        url: deployment.url,
        state: deployment.state || deployment.readyState,
        createdAt: deployment.createdAt,
      },
    });
  } catch (error) {
    console.error('Vercel redeploy error:', error);
    return NextResponse.json({ error: 'Failed to trigger redeploy' }, { status: 500 });
  }
}
