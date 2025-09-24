import { NextRequest, NextResponse } from 'next/server';
import { googleCalendar } from '@/lib/integrations/google-calendar';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // User ID passed in state
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        `/settings/integrations?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        '/settings/integrations?error=missing_parameters'
      );
    }

    // Exchange code for tokens and store in database
    await googleCalendar.handleCallback(code, state);
    
    // Initial sync
    try {
      await googleCalendar.syncEvents(state);
    } catch (syncError) {
      console.error('Initial sync error:', syncError);
      // Don't fail the whole flow if initial sync fails
    }

    // Redirect back to settings with success message
    return NextResponse.redirect(
      '/settings/integrations?success=google_connected'
    );
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(
      '/settings/integrations?error=connection_failed'
    );
  }
}