/**
 * Chat Save Output API
 * Called via navigator.sendBeacon on page unload to save chat output
 */

import { NextRequest, NextResponse } from 'next/server';

const CHAT_SERVER_URL = process.env.CHAT_SERVER_URL || 'http://localhost:4002';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${CHAT_SERVER_URL}/save-output?session=${encodeURIComponent(sessionId)}`,
      {
        method: 'GET', // The chat server uses GET for this endpoint
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to save output' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Save chat output error:', error);
    return NextResponse.json(
      { error: 'Chat server unavailable' },
      { status: 503 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
