import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy for Supabase Management API - Project API Keys
 * Avoids CORS issues by making requests from the server
 */
export async function POST(request: NextRequest) {
  try {
    const { accessToken, projectRef } = await request.json();

    if (!accessToken || !projectRef) {
      return NextResponse.json(
        { error: 'Access token and project ref are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch API keys', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract the keys we need
    const keys: { anonKey?: string; serviceKey?: string } = {};
    for (const key of data) {
      if (key.name === 'anon') {
        keys.anonKey = key.api_key;
      } else if (key.name === 'service_role') {
        keys.serviceKey = key.api_key;
      }
    }

    return NextResponse.json({ data: keys });
  } catch (error) {
    console.error('Supabase API keys error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}
