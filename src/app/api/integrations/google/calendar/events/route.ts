import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/auth-utils';

import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

interface GoogleCalendarTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  scope: string;
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

    // Token expired - would need refresh logic here
    return null;
  } catch (error) {
    console.error('Error getting valid access token:', error);
    return null;
  }
}

async function handlePOST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      startTime,
      endTime,
      location,
      attendees,
      calendarId = 'primary'
    } = body;

    const accessToken = await getValidAccessToken(user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google Calendar not connected or tokens expired' },
        { status: 401 }
      );
    }

    // Create event in Google Calendar
    const eventData = {
      summary: title,
      description,
      location,
      start: {
        dateTime: startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: attendees?.map((email: string) => ({ email })),
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create Google Calendar event:', errorText);
      throw new Error(`Failed to create event: ${response.status}`);
    }

    const event = await response.json();

    console.log('Successfully created Google Calendar event:', {
      userId: user.id,
      eventId: event.id,
      title: event.summary,
    });

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        location: event.location,
        htmlLink: event.htmlLink,
        status: event.status,
      },
    });
  } catch (error) {
    console.error('Google Calendar create event error:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

async function handlePATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { eventId, updates, calendarId = 'primary' } = body;

    const accessToken = await getValidAccessToken(user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google Calendar not connected or tokens expired' },
        { status: 401 }
      );
    }

    // Update event in Google Calendar
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to update Google Calendar event:', errorText);
      throw new Error(`Failed to update event: ${response.status}`);
    }

    const event = await response.json();

    console.log('Successfully updated Google Calendar event:', {
      userId: user.id,
      eventId: event.id,
    });

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        location: event.location,
        htmlLink: event.htmlLink,
        status: event.status,
      },
    });
  } catch (error) {
    console.error('Google Calendar update event error:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

async function handleDELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const calendarId = searchParams.get('calendarId') || 'primary';

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const accessToken = await getValidAccessToken(user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google Calendar not connected or tokens expired' },
        { status: 401 }
      );
    }

    // Delete event from Google Calendar
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      console.error('Failed to delete Google Calendar event:', errorText);
      throw new Error(`Failed to delete event: ${response.status}`);
    }

    console.log('Successfully deleted Google Calendar event:', {
      userId: user.id,
      eventId,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Google Calendar delete event error:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return await handlePOST(req);
}
export async function PATCH(req: NextRequest) {
  return await handlePATCH(req);
}
export async function DELETE(req: NextRequest) {
  return await handleDELETE(req);
}