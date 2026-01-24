/**
 * File System API
 *
 * Provides read/write access to files in the project directory.
 * Includes path traversal protection.
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Project root - IDE_PROJECT_PATH allows isolating IDE from project files
const PROJECT_ROOT = process.env.IDE_PROJECT_PATH || process.env.PROJECT_PATH || process.cwd();

/**
 * Prevents path traversal attacks by ensuring the resolved path
 * stays within the project root.
 */
function safePath(filePath: string): string {
  // Resolve to absolute path
  const resolved = path.resolve(PROJECT_ROOT, filePath);

  // Ensure it's within project root
  if (!resolved.startsWith(PROJECT_ROOT)) {
    throw new Error('Path traversal detected');
  }

  return resolved;
}

/**
 * GET /api/files?path=<filepath>
 *
 * Read a file or list directory contents
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get('path') || '.';

  try {
    const resolvedPath = safePath(filePath);
    const stat = await fs.stat(resolvedPath);

    if (stat.isDirectory()) {
      // List directory contents
      const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
      return NextResponse.json({
        type: 'directory',
        path: filePath,
        entries: entries.map(entry => ({
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          path: path.join(filePath, entry.name),
        })),
      });
    } else {
      // Read file contents
      const content = await fs.readFile(resolvedPath, 'utf-8');
      return NextResponse.json({
        type: 'file',
        path: filePath,
        content,
        size: stat.size,
        modified: stat.mtime.toISOString(),
      });
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json(
        { error: 'File not found', path: filePath },
        { status: 404 }
      );
    }
    if ((error as Error).message === 'Path traversal detected') {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 403 }
      );
    }
    console.error('[Files API] Error reading:', error);
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/files
 *
 * Write content to a file
 * Body: { path: string, content: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path: filePath, content } = body;

    if (!filePath || content === undefined) {
      return NextResponse.json(
        { error: 'Missing path or content' },
        { status: 400 }
      );
    }

    const resolvedPath = safePath(filePath);

    // Ensure parent directory exists
    const parentDir = path.dirname(resolvedPath);
    await fs.mkdir(parentDir, { recursive: true });

    // Write file
    await fs.writeFile(resolvedPath, content, 'utf-8');

    return NextResponse.json({
      success: true,
      path: filePath,
    });
  } catch (error) {
    if ((error as Error).message === 'Path traversal detected') {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 403 }
      );
    }
    console.error('[Files API] Error writing:', error);
    return NextResponse.json(
      { error: 'Failed to write file' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files?path=<filepath>
 *
 * Delete a file
 */
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json(
      { error: 'Missing path parameter' },
      { status: 400 }
    );
  }

  try {
    const resolvedPath = safePath(filePath);
    await fs.unlink(resolvedPath);

    return NextResponse.json({
      success: true,
      path: filePath,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    if ((error as Error).message === 'Path traversal detected') {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 403 }
      );
    }
    console.error('[Files API] Error deleting:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
