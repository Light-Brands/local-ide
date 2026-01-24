import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getIntegration } from '@/lib/storage/configStorage';

const PROJECT_ROOT = process.cwd();
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'supabase', 'migrations');

export interface MigrationFile {
  version: string;
  name: string;
  displayName: string;
  path: string;
  status: 'applied' | 'pending';
  appliedAt?: string;
  createdAt?: string;
  sql?: string;
}

export interface MigrationSummary {
  total: number;
  applied: number;
  pending: number;
}

/**
 * Parse migration filename into version and name
 * Expected format: YYYYMMDDHHMMSS_name.sql
 */
function parseMigrationFilename(filename: string): { version: string; name: string; displayName: string } | null {
  const match = filename.match(/^(\d{14})_(.+)\.sql$/);
  if (!match) return null;

  const version = match[1];
  const name = match[2];

  // Convert snake_case to human-readable
  const displayName = name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return { version, name, displayName };
}

/**
 * Format version timestamp for display
 */
function formatVersion(version: string): string {
  // YYYYMMDDHHMMSS -> YYYY-MM-DD HH:MM:SS
  if (version.length !== 14) return version;

  const year = version.slice(0, 4);
  const month = version.slice(4, 6);
  const day = version.slice(6, 8);
  const hour = version.slice(8, 10);
  const min = version.slice(10, 12);
  const sec = version.slice(12, 14);

  return `${year}-${month}-${day} ${hour}:${min}:${sec}`;
}

/**
 * GET /api/ide/migrations
 * List all migrations from the local supabase/migrations directory
 * and check their applied status in the database.
 */
export async function GET() {
  try {
    // Check if migrations directory exists
    let files: string[] = [];
    try {
      files = await fs.readdir(MIGRATIONS_DIR);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json({
          success: true,
          migrations: [],
          summary: { total: 0, applied: 0, pending: 0 },
          migrationsDir: MIGRATIONS_DIR,
          exists: false,
        });
      }
      throw error;
    }

    // Filter to only .sql files and parse
    const migrationFiles = files
      .filter(f => f.endsWith('.sql'))
      .map(f => parseMigrationFilename(f))
      .filter((m): m is NonNullable<typeof m> => m !== null);

    // Get applied migrations from database
    const appliedVersions = new Set<string>();
    const appliedTimestamps: Record<string, string> = {};

    const supabase = await getIntegration('supabase');

    if (supabase?.accessToken && supabase?.projectRef) {
      try {
        const sql = `
          SELECT version, inserted_at
          FROM supabase_migrations.schema_migrations
          ORDER BY version
        `;

        const response = await fetch(
          `https://api.supabase.com/v1/projects/${supabase.projectRef}/database/query`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabase.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: sql }),
          }
        );

        if (response.ok) {
          const rows = await response.json();
          for (const row of rows) {
            appliedVersions.add(row.version);
            if (row.inserted_at) {
              appliedTimestamps[row.version] = row.inserted_at;
            }
          }
        }
      } catch (error) {
        console.warn('Could not fetch applied migrations:', error);
      }
    }

    // Build migration list with status
    const migrations: MigrationFile[] = migrationFiles.map(m => ({
      version: m.version,
      name: m.name,
      displayName: m.displayName,
      path: path.join(MIGRATIONS_DIR, `${m.version}_${m.name}.sql`),
      status: appliedVersions.has(m.version) ? 'applied' : 'pending',
      appliedAt: appliedTimestamps[m.version],
      createdAt: formatVersion(m.version),
    }));

    // Sort by version descending (newest first)
    migrations.sort((a, b) => b.version.localeCompare(a.version));

    const summary: MigrationSummary = {
      total: migrations.length,
      applied: migrations.filter(m => m.status === 'applied').length,
      pending: migrations.filter(m => m.status === 'pending').length,
    };

    return NextResponse.json({
      success: true,
      migrations,
      summary,
      migrationsDir: MIGRATIONS_DIR,
      exists: true,
    });
  } catch (error) {
    console.error('Error listing migrations:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list migrations'
      },
      { status: 500 }
    );
  }
}
