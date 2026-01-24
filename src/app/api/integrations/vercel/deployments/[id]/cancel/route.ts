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
    let url = `https://api.vercel.com/v12/deployments/${id}/cancel`;
    if (vercelConfig.teamId) {
      url += `?teamId=${vercelConfig.teamId}`;
    }

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${vercelConfig.token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to cancel deployment' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      deployment: {
        id: data.id || data.uid,
        state: data.state || 'CANCELED',
      },
    });
  } catch (error) {
    console.error('Vercel cancel deployment error:', error);
    return NextResponse.json({ error: 'Failed to cancel deployment' }, { status: 500 });
  }
}
