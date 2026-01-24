import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * IDE Auth Callback Handler
 * Handles GitHub OAuth redirects for the IDE
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle errors from OAuth provider
  if (error) {
    console.error('IDE Auth callback error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/ide/login?error=${encodeURIComponent(errorDescription || error)}`,
        requestUrl.origin
      )
    );
  }

  // Exchange code for session
  if (code) {
    try {
      const supabase = await createServerSupabaseClient();

      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('IDE Code exchange error:', exchangeError);
        return NextResponse.redirect(
          new URL(
            `/ide/login?error=${encodeURIComponent(exchangeError.message)}`,
            requestUrl.origin
          )
        );
      }

      // Successfully authenticated - redirect to setup/repo selection
      return NextResponse.redirect(new URL('/ide/setup', requestUrl.origin));
    } catch (err) {
      console.error('IDE Auth callback exception:', err);
      return NextResponse.redirect(
        new URL(
          `/ide/login?error=${encodeURIComponent('Authentication failed')}`,
          requestUrl.origin
        )
      );
    }
  }

  // No code provided
  return NextResponse.redirect(new URL('/ide/login', requestUrl.origin));
}
