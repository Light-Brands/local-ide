import { NextResponse } from 'next/server';

const TERMINAL_SERVER_URL = process.env.TERMINAL_SERVER_URL || 'http://localhost:4001';

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    if (sessionId) {
      // Relay to terminal server - fire and forget
      await fetch(`${TERMINAL_SERVER_URL}/save-output?session=${sessionId}`, {
        method: 'POST',
      }).catch(() => {
        // Ignore errors - this is best-effort
      });
    }
    return NextResponse.json({ success: true });
  } catch {
    // Always return success for sendBeacon (browser doesn't wait for response)
    return NextResponse.json({ success: true });
  }
}
