import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getIntegration } from '@/lib/storage/configStorage';

const PROJECT_ROOT = process.cwd();
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'supabase', 'migrations');

export interface MigrationRunResult {
  version: string;
  success: boolean;
  message: string;
  error?: string;
  alreadyApplied?: boolean;
  timestamp: number;
}

/**
 * POST /api/ide/migrations/run
 * Run a specific migration file against the database.
 *
 * Body: { version: string } or { markOnly: true, version: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { version, markOnly = false } = await request.json();

    if (!version || typeof version !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Migration version is required' },
        { status: 400 }
      );
    }

    const supabase = await getIntegration('supabase');

    if (!supabase?.accessToken || !supabase?.projectRef) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase Management API credentials required',
          hint: 'Configure your Supabase access token to run migrations'
        },
        { status: 400 }
      );
    }

    const { accessToken, projectRef } = supabase;

    // Check if already applied
    const checkSql = `
      SELECT version FROM supabase_migrations.schema_migrations
      WHERE version = '${version}'
    `;

    const checkResponse = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: checkSql }),
      }
    );

    if (checkResponse.ok) {
      const rows = await checkResponse.json();
      if (rows.length > 0) {
        const result: MigrationRunResult = {
          version,
          success: true,
          message: 'Migration was already applied',
          alreadyApplied: true,
          timestamp: Date.now(),
        };
        return NextResponse.json({ success: true, result });
      }
    }

    // If markOnly, just insert into schema_migrations without running
    if (markOnly) {
      const markSql = `
        INSERT INTO supabase_migrations.schema_migrations (version)
        VALUES ('${version}')
        ON CONFLICT (version) DO NOTHING
      `;

      const markResponse = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: markSql }),
        }
      );

      if (!markResponse.ok) {
        const error = await markResponse.text();
        const result: MigrationRunResult = {
          version,
          success: false,
          message: 'Failed to mark migration as applied',
          error,
          timestamp: Date.now(),
        };
        return NextResponse.json({ success: false, result }, { status: 500 });
      }

      const result: MigrationRunResult = {
        version,
        success: true,
        message: 'Migration marked as applied',
        timestamp: Date.now(),
      };
      return NextResponse.json({ success: true, result });
    }

    // Find and read the migration file
    let files: string[] = [];
    try {
      files = await fs.readdir(MIGRATIONS_DIR);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Migrations directory not found' },
        { status: 404 }
      );
    }

    const migrationFile = files.find(f => f.startsWith(version) && f.endsWith('.sql'));
    if (!migrationFile) {
      return NextResponse.json(
        { success: false, error: `Migration file not found for version ${version}` },
        { status: 404 }
      );
    }

    const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
    const sql = await fs.readFile(migrationPath, 'utf-8');

    // Execute the migration SQL
    const execResponse = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      }
    );

    if (!execResponse.ok) {
      const error = await execResponse.text();
      const result: MigrationRunResult = {
        version,
        success: false,
        message: 'Migration failed',
        error,
        timestamp: Date.now(),
      };
      return NextResponse.json({ success: false, result }, { status: 500 });
    }

    // Record the migration as applied
    const recordSql = `
      INSERT INTO supabase_migrations.schema_migrations (version)
      VALUES ('${version}')
      ON CONFLICT (version) DO NOTHING
    `;

    await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: recordSql }),
      }
    );

    const result: MigrationRunResult = {
      version,
      success: true,
      message: `Migration ${version} applied successfully`,
      timestamp: Date.now(),
    };

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error running migration:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run migration'
      },
      { status: 500 }
    );
  }
}
