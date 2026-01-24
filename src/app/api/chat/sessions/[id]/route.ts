/**
 * Chat Session Delete API
 * Proxies to the chat server to kill a specific session
 */

import { NextRequest, NextResponse } from 'next/server';

const CHAT_SERVER_URL = process.env.CHAT_SERVER_URL || 'http://localhost:4002';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${CHAT_SERVER_URL}/kill-session?session=${encodeURIComponent(sessionId)}`,
      {
        method: 'GET', // The chat server uses GET for this endpoint
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to kill session' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Kill chat session error:', error);
    return NextResponse.json(
      { error: 'Chat server unavailable' },
      { status: 503 }
    );
  }
}
