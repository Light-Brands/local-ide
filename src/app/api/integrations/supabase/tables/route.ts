import { NextResponse } from 'next/server';
import { getIntegration } from '@/lib/storage/configStorage';

interface TableInfo {
  name: string;
  schema: string;
  rowCount: number;
  sizeBytes?: number;
}

/**
 * GET /api/integrations/supabase/tables
 * List all tables in the public schema.
 * Uses SQL execution or falls back to OpenAPI spec parsing.
 */
export async function GET() {
  try {
    const supabase = await getIntegration('supabase');

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 404 }
      );
    }

    const { accessToken, projectRef, url, serviceKey, anonKey } = supabase;

    // Method 1: Try Management API SQL
    if (accessToken && projectRef) {
      try {
        const sql = `
          SELECT
            schemaname as schema,
            relname as name,
            n_live_tup as row_count
          FROM pg_stat_user_tables
          WHERE schemaname = 'public'
          ORDER BY relname
        `;

        const mgmtResponse = await fetch(
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

        if (mgmtResponse.ok) {
          const rows = await mgmtResponse.json();
          const tables: TableInfo[] = rows.map((row: Record<string, unknown>) => ({
            name: row.name as string,
            schema: row.schema as string,
            rowCount: parseInt(String(row.row_count || 0)),
          }));

          return NextResponse.json({
            success: true,
            tables,
            source: 'management-api',
          });
        }
      } catch (error) {
        console.warn('Management API failed for tables:', error);
      }
    }

    // Method 2: Parse OpenAPI spec from PostgREST
    const apiKey = serviceKey || anonKey;
    if (url && apiKey) {
      try {
        const openApiResponse = await fetch(`${url}/rest/v1/`, {
          headers: {
            'apikey': apiKey,
            'Accept': 'application/json',
          },
        });

        if (openApiResponse.ok) {
          const spec = await openApiResponse.json();

          // Extract table names from paths
          const tables: TableInfo[] = [];

          if (spec.paths) {
            for (const path of Object.keys(spec.paths)) {
              // Skip RPC functions (they start with /rpc/)
              if (path.startsWith('/rpc/')) continue;

              // Extract table name from path (e.g., "/users" -> "users")
              const match = path.match(/^\/([^/]+)$/);
              if (match) {
                tables.push({
                  name: match[1],
                  schema: 'public',
                  rowCount: 0, // Unknown from OpenAPI
                });
              }
            }
          }

          return NextResponse.json({
            success: true,
            tables: tables.sort((a, b) => a.name.localeCompare(b.name)),
            source: 'openapi',
          });
        }
      } catch (error) {
        console.warn('OpenAPI parsing failed:', error);
      }
    }

    // Method 3: Try information_schema via RPC
    if (url && serviceKey) {
      try {
        const rpcResponse = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              SELECT table_name as name, table_schema as schema
              FROM information_schema.tables
              WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
              ORDER BY table_name
            `
          }),
        });

        if (rpcResponse.ok) {
          const rows = await rpcResponse.json();
          const tables: TableInfo[] = rows.map((row: Record<string, unknown>) => ({
            name: row.name as string,
            schema: row.schema as string,
            rowCount: 0,
          }));

          return NextResponse.json({
            success: true,
            tables,
            source: 'rpc',
          });
        }
      } catch (error) {
        console.warn('RPC tables query failed:', error);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Could not fetch tables',
        hint: 'Ensure Supabase credentials are configured correctly'
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tables'
      },
      { status: 500 }
    );
  }
}
