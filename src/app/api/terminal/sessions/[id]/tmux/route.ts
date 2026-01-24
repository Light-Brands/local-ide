import { NextResponse } from 'next/server';

const TERMINAL_SERVER_URL = process.env.TERMINAL_SERVER_URL || 'http://localhost:4001';

// GET - Check if tmux session exists for a given session ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  if (!sessionId) {
    return NextResponse.json(
      { exists: false, error: 'Session ID required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${TERMINAL_SERVER_URL}/tmux-check?session=${sessionId}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json(
        { exists: false, error: 'Terminal server unavailable' },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      exists: data.exists === true,
      tmuxName: data.tmuxName,
    });
  } catch (error) {
    return NextResponse.json({
      exists: false,
      error: 'Terminal server not available',
    });
  }
}
