import { NextResponse } from 'next/server';

/**
 * Health Check API
 *
 * Simple endpoint to check if the app server is running.
 * Used by the IDE to determine if the app is available.
 */

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: Date.now(),
    port: process.env.PORT || 3000,
  });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
