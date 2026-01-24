/**
 * Chat Sessions List API
 * Proxies to the chat server to list active sessions
 */

import { NextResponse } from 'next/server';

const CHAT_SERVER_URL = process.env.CHAT_SERVER_URL || 'http://localhost:4002';

export async function GET() {
  try {
    const response = await fetch(`${CHAT_SERVER_URL}/sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch sessions from chat server' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Chat sessions error:', error);
    return NextResponse.json(
      { error: 'Chat server unavailable', sessions: [] },
      { status: 503 }
    );
  }
}
