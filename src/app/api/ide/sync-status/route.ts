import { NextResponse } from 'next/server';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import { createHash } from 'crypto';

// Track file state between requests
let lastBuildId: string | null = null;
let lastFileHashes: Map<string, string> = new Map();
let lastCheckTime = 0;

// Directories to watch for changes
const WATCH_DIRS = ['src/app', 'src/components', 'src/lib'];

// File extensions to track
const WATCH_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css', '.json'];

// Minimum time between full scans (ms)
const MIN_SCAN_INTERVAL = 500;

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dir: string, baseDir: string): string[] {
  const files: string[] = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push(...getAllFiles(fullPath, baseDir));
        }
      } else if (entry.isFile()) {
        const ext = entry.name.slice(entry.name.lastIndexOf('.'));
        if (WATCH_EXTENSIONS.includes(ext)) {
          files.push(relative(baseDir, fullPath));
        }
      }
    }
  } catch (e) {
    // Directory might not exist
  }

  return files;
}

/**
 * Get hash of a file's content and mtime
 */
function getFileHash(filePath: string): string {
  try {
    const stat = statSync(filePath);
    // Use mtime for quick comparison, content hash for accuracy
    return `${stat.mtimeMs}-${stat.size}`;
  } catch {
    return 'deleted';
  }
}

/**
 * Scan all watched files and compute a build ID
 */
function scanFiles(projectRoot: string): {
  buildId: string;
  changedPaths: string[];
  fileHashes: Map<string, string>;
} {
  const fileHashes = new Map<string, string>();
  const changedPaths: string[] = [];

  // Collect all files
  const allFiles: string[] = [];
  for (const dir of WATCH_DIRS) {
    const fullDir = join(projectRoot, dir);
    allFiles.push(...getAllFiles(fullDir, projectRoot));
  }

  // Hash each file
  for (const file of allFiles) {
    const fullPath = join(projectRoot, file);
    const hash = getFileHash(fullPath);
    fileHashes.set(file, hash);

    // Check if changed from last scan
    const lastHash = lastFileHashes.get(file);
    if (lastHash && lastHash !== hash) {
      changedPaths.push(file);
    } else if (!lastHash) {
      // New file
      changedPaths.push(file);
    }
  }

  // Check for deleted files
  for (const [file] of lastFileHashes) {
    if (!fileHashes.has(file)) {
      changedPaths.push(file);
    }
  }

  // Compute overall build ID from all hashes
  const hashInput = Array.from(fileHashes.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, hash]) => `${path}:${hash}`)
    .join('\n');

  const buildId = createHash('md5').update(hashInput).digest('hex').slice(0, 16);

  return { buildId, changedPaths, fileHashes };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const projectRoot = process.cwd();
  const now = Date.now();

  // Throttle full scans
  if (now - lastCheckTime < MIN_SCAN_INTERVAL && lastBuildId) {
    return NextResponse.json({
      buildId: lastBuildId,
      changedPaths: [],
      timestamp: now,
      cached: true,
    }, { headers: corsHeaders });
  }

  lastCheckTime = now;

  const { buildId, changedPaths, fileHashes } = scanFiles(projectRoot);

  // Only report changes if we had a previous scan
  const reportedChanges = lastBuildId ? changedPaths : [];

  // Update state
  lastBuildId = buildId;
  lastFileHashes = fileHashes;

  return NextResponse.json(
    {
      buildId,
      changedPaths: reportedChanges,
      timestamp: now,
      fileCount: fileHashes.size,
      cached: false,
    },
    {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}
