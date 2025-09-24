import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { googleCalendar } from '@/lib/integrations/google-calendar';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    const { searchParams } = new URL(req.url);
    
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(new URL('/settings?error=oauth_failed', req.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/settings?error=no_code', req.url));
    }

    if (!userId || state !== userId) {
      console.error('User ID mismatch or unauthorized access');
      return NextResponse.redirect(new URL('/settings?error=unauthorized', req.url));
    }

    // Exchange code for tokens and store them
    await googleCalendar.handleCallback(code, userId);

    // Redirect to settings with success message
    return NextResponse.redirect(new URL('/settings?success=calendar_connected', req.url));
  } catch (error) {
    console.error('Google Calendar callback failed:', error);
    return NextResponse.redirect(new URL('/settings?error=callback_failed', req.url));
  }
}