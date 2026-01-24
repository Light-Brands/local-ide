import { NextRequest, NextResponse } from 'next/server';
import { getIntegration } from '@/lib/storage/configStorage';

/**
 * POST /api/integrations/supabase/sql
 * Execute SQL directly against the Supabase database.
 * Uses either the Management API (if accessToken available) or direct pg connection.
 */
export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json();

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json(
        { success: false, error: 'SQL query is required' },
        { status: 400 }
      );
    }

    const supabase = await getIntegration('supabase');

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 404 }
      );
    }

    const { accessToken, projectRef, url, serviceKey } = supabase;

    // Try Management API first (if we have access token and project ref)
    if (accessToken && projectRef) {
      try {
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
          const results = await mgmtResponse.json();
          return NextResponse.json({
            success: true,
            results: Array.isArray(results) ? results : [results],
            rowCount: Array.isArray(results) ? results.length : 1,
            source: 'management-api',
          });
        }

        // If management API fails with auth error, try fallback
        if (mgmtResponse.status !== 401 && mgmtResponse.status !== 403) {
          const error = await mgmtResponse.text();
          return NextResponse.json(
            {
              success: false,
              error: `Management API error: ${error}`,
              hint: 'Check that your access token has the required permissions'
            },
            { status: mgmtResponse.status }
          );
        }
      } catch (mgmtError) {
        console.warn('Management API failed, trying PostgREST:', mgmtError);
      }
    }

    // Fallback: Try PostgREST RPC if we have URL and service key
    if (url && serviceKey) {
      try {
        // Try the exec_sql RPC function if it exists
        const rpcResponse = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: sql }),
        });

        if (rpcResponse.ok) {
          const results = await rpcResponse.json();
          return NextResponse.json({
            success: true,
            results: Array.isArray(results) ? results : [results],
            rowCount: Array.isArray(results) ? results.length : 1,
            source: 'rpc',
          });
        }

        // If RPC doesn't exist, return error with hint
        if (rpcResponse.status === 404) {
          return NextResponse.json(
            {
              success: false,
              error: 'SQL execution not available',
              hint: 'Create an exec_sql RPC function in your database or provide a Management API access token'
            },
            { status: 501 }
          );
        }

        const error = await rpcResponse.text();
        return NextResponse.json(
          { success: false, error: `RPC error: ${error}` },
          { status: rpcResponse.status }
        );
      } catch (rpcError) {
        console.error('RPC execution failed:', rpcError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'No SQL execution method available',
        hint: 'Configure either a Management API access token or create an exec_sql RPC function'
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error executing SQL:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute SQL'
      },
      { status: 500 }
    );
  }
}
