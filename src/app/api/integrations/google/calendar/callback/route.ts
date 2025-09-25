import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import Logger from '@/lib/logger';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/calendar/callback`;

async function handleGET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This contains the user ID
    const error = searchParams.get('error');

    if (error) {
      Logger.error('Google OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?google_error=${error}`);
    }

    if (!code || !state) {
      Logger.error('Missing code or state in Google OAuth callback');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?google_error=missing_params`);
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      Logger.error('Google OAuth credentials not configured');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?google_error=not_configured`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      Logger.error('Failed to exchange code for token:', await tokenResponse.text());
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?google_error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    
    // Store tokens in user record
    await db.update(users)
      .set({
        googleCalendarTokens: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: Date.now() + (tokenData.expires_in * 1000),
          scope: tokenData.scope,
        },
        updatedAt: new Date(),
      })
      .where(eq(users.id, state));

    Logger.info('Successfully stored Google Calendar tokens for user:', { userId: state });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?google_connected=true`);
  } catch (error) {
    Logger.error('Google Calendar callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?google_error=callback_failed`);
  }
}

export const GET = handleGET;