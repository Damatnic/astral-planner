import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { blocks } from '@/db/schema/blocks';
import { workspaces } from '@/db/schema/workspaces';
import { eq } from 'drizzle-orm';
import Logger from '@/lib/logger';

interface GoogleCalendarTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  scope: string;
}

interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole?: string;
  backgroundColor?: string;
}

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  status?: string;
  htmlLink?: string;
  created?: string;
  updated?: string;
}

async function refreshGoogleToken(refreshToken: string): Promise<GoogleCalendarTokens | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      Logger.error('Failed to refresh Google token:', await response.text());
      return null;
    }

    const tokenData = await response.json();
    return {
      access_token: tokenData.access_token,
      refresh_token: refreshToken, // Keep existing refresh token
      expires_at: Date.now() + (tokenData.expires_in * 1000),
      scope: tokenData.scope,
    };
  } catch (error) {
    Logger.error('Error refreshing Google token:', error);
    return null;
  }
}

async function getValidAccessToken(userId: string): Promise<string | null> {
  try {
    const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userRecord[0];
    
    if (!user?.googleCalendarTokens) {
      return null;
    }

    const tokens = user.googleCalendarTokens as GoogleCalendarTokens;
    
    // Check if token is still valid (with 5-minute buffer)
    if (tokens.expires_at > Date.now() + 5 * 60 * 1000) {
      return tokens.access_token;
    }

    // Token expired, try to refresh
    if (tokens.refresh_token) {
      const newTokens = await refreshGoogleToken(tokens.refresh_token);
      if (newTokens) {
        // Update user with new tokens
        await db.update(users)
          .set({
            googleCalendarTokens: newTokens,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
        
        return newTokens.access_token;
      }
    }

    return null;
  } catch (error) {
    Logger.error('Error getting valid access token:', error);
    return null;
  }
}

async function fetchGoogleCalendars(accessToken: string): Promise<GoogleCalendar[]> {
  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch calendars: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}

async function fetchGoogleCalendarEvents(accessToken: string, calendarId: string): Promise<GoogleCalendarEvent[]> {
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    timeMin: oneMonthAgo.toISOString(),
    timeMax: oneMonthFromNow.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch calendar events: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}

async function syncEventsToDatabase(userId: string, events: GoogleCalendarEvent[], calendarId: string) {
  try {
    // Get user's default workspace
    const userWorkspaces = await db.select().from(workspaces).where(eq(workspaces.ownerId, userId)).limit(1);
    if (userWorkspaces.length === 0) {
      throw new Error('No workspace found for user');
    }
    
    const workspaceId = userWorkspaces[0].id;

    // Sync each event
    for (const event of events) {
      if (!event.start?.dateTime && !event.start?.date) continue;

      const startDate = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date!);
      const endDate = event.end?.dateTime ? new Date(event.end.dateTime) : new Date(event.end.date!);

      // Check if event already exists
      const existingEvent = await db.select()
        .from(blocks)
        .where(eq(blocks.externalId, event.id))
        .limit(1);

      const eventData = {
        type: 'event',
        title: event.summary || 'Untitled Event',
        description: event.description || null,
        workspaceId,
        startDate,
        endDate,
        dueDate: startDate,
        status: event.status === 'cancelled' ? 'cancelled' : 'confirmed',
        externalId: event.id,
        externalSource: 'google_calendar',
        externalUrl: event.htmlLink || null,
        lastSyncAt: new Date(),
        syncStatus: 'synced',
        metadata: {
          calendarId,
          location: event.location,
          timeZone: event.start.timeZone,
          googleUpdated: event.updated,
        },
        createdBy: userId,
        lastEditedBy: userId,
        updatedAt: new Date(),
      };

      if (existingEvent.length > 0) {
        // Update existing event
        await db.update(blocks)
          .set(eventData)
          .where(eq(blocks.id, existingEvent[0].id));
      } else {
        // Create new event
        await db.insert(blocks).values({
          ...eventData,
          createdAt: new Date(),
        });
      }
    }

    Logger.info('Successfully synced Google Calendar events:', {
      userId,
      calendarId,
      eventCount: events.length,
    });
  } catch (error) {
    Logger.error('Error syncing events to database:', error);
    throw error;
  }
}

async function handleGET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = await getValidAccessToken(user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google Calendar not connected or tokens expired' },
        { status: 401 }
      );
    }

    const calendars = await fetchGoogleCalendars(accessToken);

    return NextResponse.json({
      calendars: calendars.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        description: cal.description,
        primary: cal.primary,
        accessRole: cal.accessRole,
        backgroundColor: cal.backgroundColor,
      })),
    });
  } catch (error) {
    Logger.error('Google Calendar sync GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendars' },
      { status: 500 }
    );
  }
}

async function handlePOST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { calendarId = 'primary' } = body;

    const accessToken = await getValidAccessToken(user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google Calendar not connected or tokens expired' },
        { status: 401 }
      );
    }

    // Fetch and sync events
    const events = await fetchGoogleCalendarEvents(accessToken, calendarId);
    await syncEventsToDatabase(user.id, events, calendarId);

    Logger.info('Successfully synced Google Calendar:', {
      userId: user.id,
      calendarId,
      eventCount: events.length,
    });

    return NextResponse.json({
      success: true,
      syncedEvents: events.length,
      calendarId,
    });
  } catch (error) {
    Logger.error('Google Calendar sync POST error:', error);
    return NextResponse.json(
      { error: 'Failed to sync calendar' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const POST = withAuth(handlePOST);