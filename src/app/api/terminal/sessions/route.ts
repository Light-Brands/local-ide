import { NextResponse } from 'next/server';
import { isVercel } from '@/lib/ide/env';

const TERMINAL_SERVER_URL = process.env.TERMINAL_SERVER_URL || 'http://localhost:4001';

export interface TerminalSessionInfo {
  session_id: string;
  project_path: string;
  created_at: string;
  last_activity_at: string;
  cols: number;
  rows: number;
  is_active: number;
  isLive: boolean;
}

// GET - List all terminal sessions
export async function GET() {
  // Return empty sessions in production (Vercel)
  if (isVercel) {
    return NextResponse.json({
      sessions: [],
      available: false,
      reason: 'Terminal requires local server',
    });
  }
  try {
    const response = await fetch(`${TERMINAL_SERVER_URL}/sessions`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch sessions from terminal server' },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Terminal server might not be running
    return NextResponse.json(
      {
        sessions: [],
        error: 'Terminal server not available',
      },
      { status: 200 }  // Return 200 with empty sessions to allow graceful degradation
    );
  }
}
