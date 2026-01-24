import { NextResponse } from 'next/server';

const TERMINAL_SERVER_URL = process.env.TERMINAL_SERVER_URL || 'http://localhost:4001';

// GET - Fetch saved output for a session
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${TERMINAL_SERVER_URL}/output?session=${sessionId}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      return NextResponse.json(
        { output: '', error: 'Failed to fetch output' },
        { status: 200 }  // Return 200 to allow graceful degradation
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Terminal server not available
    return NextResponse.json(
      { output: '', error: 'Terminal server not available' },
      { status: 200 }
    );
  }
}
