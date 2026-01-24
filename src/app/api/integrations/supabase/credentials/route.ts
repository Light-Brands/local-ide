import { NextResponse } from 'next/server';
import { getIntegration } from '@/lib/storage/configStorage';

/**
 * GET /api/integrations/supabase/credentials
 * Returns the full Supabase credentials for the IDE to use.
 * This is safe for a local IDE but should not be exposed in production web apps.
 */
export async function GET() {
  try {
    const supabase = await getIntegration('supabase');

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 404 }
      );
    }

    // Return full credentials for the IDE
    return NextResponse.json({
      url: supabase.url,
      anonKey: supabase.anonKey,
      serviceRoleKey: supabase.serviceKey,
    });
  } catch (error) {
    console.error('Error getting Supabase credentials:', error);
    return NextResponse.json(
      { error: 'Failed to get Supabase credentials' },
      { status: 500 }
    );
  }
}
