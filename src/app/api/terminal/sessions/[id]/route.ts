import { NextResponse } from 'next/server';

const TERMINAL_SERVER_URL = process.env.TERMINAL_SERVER_URL || 'http://localhost:4001';

interface SessionValidationResponse {
  valid: boolean;
  session?: {
    session_id: string;
    project_path: string;
    created_at: string;
    last_activity_at: string;
    cols: number;
    rows: number;
    is_active: number;
    isLive: boolean;
  };
  error?: string;
}

// GET - Validate a specific session exists
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  if (!sessionId) {
    return NextResponse.json<SessionValidationResponse>(
      { valid: false, error: 'Session ID required' },
      { status: 400 }
    );
  }

  try {
    // Fetch all sessions and find the requested one
    const response = await fetch(`${TERMINAL_SERVER_URL}/sessions`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json<SessionValidationResponse>(
        { valid: false, error: 'Terminal server unavailable' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const session = data.sessions?.find(
      (s: { session_id: string }) => s.session_id === sessionId
    );

    if (session) {
      return NextResponse.json<SessionValidationResponse>({
        valid: true,
        session,
      });
    } else {
      return NextResponse.json<SessionValidationResponse>({
        valid: false,
        error: 'Session not found',
      });
    }
  } catch (error) {
    // Terminal server not available - session cannot be validated
    return NextResponse.json<SessionValidationResponse>({
      valid: false,
      error: 'Terminal server not available',
    });
  }
}

// DELETE - Kill and remove a session
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: 'Session ID required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${TERMINAL_SERVER_URL}/kill-session?session=${sessionId}`,
      { method: 'POST' }
    );

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to kill session' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Terminal server not available' },
      { status: 502 }
    );
  }
}
