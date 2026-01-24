import { NextRequest, NextResponse } from 'next/server';
import { getIntegration } from '@/lib/storage/configStorage';

export const runtime = 'nodejs';

export async function GET(
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

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'build'; // build or runtime

  try {
    let url: string;

    if (type === 'build') {
      // Fetch build logs
      url = `https://api.vercel.com/v2/deployments/${id}/events`;
    } else {
      // Fetch runtime logs
      url = `https://api.vercel.com/v2/deployments/${id}/events?type=stdout,stderr`;
    }

    if (vercelConfig.teamId) {
      url += url.includes('?') ? '&' : '?';
      url += `teamId=${vercelConfig.teamId}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${vercelConfig.token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to fetch logs' },
        { status: response.status }
      );
    }

    const events = await response.json();

    // Format logs for display
    const logs = (Array.isArray(events) ? events : []).map((event: any, index: number) => ({
      id: event.id || `log-${index}`,
      timestamp: event.created,
      created: event.created,
      type: event.type,
      text: event.text || event.payload?.text || '',
      level: event.level,
      serial: event.serial || index,
    }));

    return NextResponse.json({ logs, type });
  } catch (error) {
    console.error('Vercel logs fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
