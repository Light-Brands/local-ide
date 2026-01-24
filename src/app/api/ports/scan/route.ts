import { NextResponse } from 'next/server';
import { createConnection, Socket } from 'net';

// Force Node.js runtime (not Edge) to use net module
export const runtime = 'nodejs';

const PORT_RANGE_START = 3000;
const PORT_RANGE_END = 3999;
const CONNECTION_TIMEOUT = 100; // ms per port check
const CONCURRENT_CHECKS = 50; // Check multiple ports at once

/**
 * Check if a port is open by attempting a TCP connection
 */
async function isPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket: Socket = createConnection({ port, host: '127.0.0.1' });

    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, CONNECTION_TIMEOUT);

    socket.on('connect', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(true);
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(false);
    });
  });
}

/**
 * Scan a range of ports in batches
 */
async function scanPorts(start: number, end: number): Promise<number[]> {
  const openPorts: number[] = [];
  const ports = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  // Process in batches
  for (let i = 0; i < ports.length; i += CONCURRENT_CHECKS) {
    const batch = ports.slice(i, i + CONCURRENT_CHECKS);
    const results = await Promise.all(
      batch.map(async (port) => {
        const isOpen = await isPortOpen(port);
        return isOpen ? port : null;
      })
    );
    openPorts.push(...results.filter((p): p is number => p !== null));
  }

  return openPorts.sort((a, b) => a - b);
}

/**
 * GET /api/ports/scan
 * Scans ports 3000-3999 for open servers
 */
export async function GET() {
  try {
    const openPorts = await scanPorts(PORT_RANGE_START, PORT_RANGE_END);

    return NextResponse.json({
      success: true,
      ports: openPorts,
      range: { start: PORT_RANGE_START, end: PORT_RANGE_END },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Port scan error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to scan ports', ports: [] },
      { status: 500 }
    );
  }
}
