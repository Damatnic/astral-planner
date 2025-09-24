import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db } from '@/db';
import { calendars, events as eventsTable, integrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: calendar_v3.Calendar;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.calendar = google.calendar({ 
      version: 'v3', 
      auth: this.oauth2Client 
    });
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(userId: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly'
      ],
      state: userId, // Pass user ID in state for security
      prompt: 'consent' // Force consent to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async handleCallback(code: string, userId: string): Promise<void> {
    const { tokens } = await this.oauth2Client.getToken(code);
    
    // Store tokens in database
    await db.insert(integrations).values({
      userId,
      provider: 'google_calendar',
      enabled: true,
      config: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type,
        scope: tokens.scope
      },
      lastSyncAt: new Date()
    }).onConflictDoUpdate({
      target: [integrations.userId, integrations.provider],
      set: {
        config: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date,
          token_type: tokens.token_type,
          scope: tokens.scope
        },
        enabled: true,
        lastSyncAt: new Date()
      }
    });
  }

  /**
   * Set up OAuth client with user's tokens
   */
  async authenticateUser(userId: string): Promise<boolean> {
    const integration = await db.query.integrations.findFirst({
      where: and(
        eq(integrations.userId, userId),
        eq(integrations.provider, 'google_calendar')
      )
    });

    if (!integration?.config) {
      return false;
    }

    const config = integration.config as any;
    this.oauth2Client.setCredentials({
      access_token: config.access_token,
      refresh_token: config.refresh_token,
      expiry_date: config.expiry_date,
      token_type: config.token_type
    });

    // Handle token refresh if needed
    this.oauth2Client.on('tokens', async (tokens) => {
      await db.update(integrations)
        .set({
          config: {
            ...config,
            access_token: tokens.access_token,
            expiry_date: tokens.expiry_date
          }
        })
        .where(
          and(
            eq(integrations.userId, userId),
            eq(integrations.provider, 'google_calendar')
          )
        );
    });

    return true;
  }

  /**
   * List user's Google calendars
   */
  async listCalendars(userId: string): Promise<calendar_v3.Schema$CalendarListEntry[]> {
    const authenticated = await this.authenticateUser(userId);
    if (!authenticated) {
      throw new Error('User not authenticated with Google Calendar');
    }

    const response = await this.calendar.calendarList.list();
    return response.data.items || [];
  }

  /**
   * Sync events from Google Calendar
   */
  async syncEvents(userId: string, calendarId: string = 'primary'): Promise<void> {
    const authenticated = await this.authenticateUser(userId);
    if (!authenticated) {
      throw new Error('User not authenticated with Google Calendar');
    }

    // Get calendar metadata
    const calendarResponse = await this.calendar.calendars.get({
      calendarId
    });

    // Store or update calendar in database
    const [dbCalendar] = await db.insert(calendars).values({
      userId,
      name: calendarResponse.data.summary || 'Google Calendar',
      description: calendarResponse.data.description,
      color: '#4285F4', // Google blue
      provider: 'google',
      externalId: calendarId,
      syncEnabled: true
    }).onConflictDoUpdate({
      target: [calendars.externalId],
      set: {
        name: calendarResponse.data.summary || 'Google Calendar',
        description: calendarResponse.data.description,
        syncEnabled: true,
        updatedAt: new Date()
      }
    }).returning();

    // Fetch events from Google Calendar
    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    const eventsResponse = await this.calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: threeMonthsFromNow.toISOString(),
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime'
    });

    const googleEvents = eventsResponse.data.items || [];

    // Sync events to database
    for (const event of googleEvents) {
      await this.syncEvent(dbCalendar.id, event);
    }

    // Update last sync time
    await db.update(integrations)
      .set({ lastSyncAt: new Date() })
      .where(
        and(
          eq(integrations.userId, userId),
          eq(integrations.provider, 'google_calendar')
        )
      );
  }

  /**
   * Sync individual event
   */
  private async syncEvent(
    calendarId: string, 
    event: calendar_v3.Schema$Event
  ): Promise<void> {
    const startTime = event.start?.dateTime || event.start?.date;
    const endTime = event.end?.dateTime || event.end?.date;

    if (!startTime || !endTime) return;

    await db.insert(eventsTable).values({
      calendarId,
      title: event.summary || 'Untitled Event',
      description: event.description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isAllDay: !event.start?.dateTime,
      location: event.location,
      externalId: event.id,
      externalData: {
        htmlLink: event.htmlLink,
        status: event.status,
        visibility: event.visibility,
        attendees: event.attendees,
        reminders: event.reminders
      }
    }).onConflictDoUpdate({
      target: [eventsTable.externalId],
      set: {
        title: event.summary || 'Untitled Event',
        description: event.description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isAllDay: !event.start?.dateTime,
        location: event.location,
        externalData: {
          htmlLink: event.htmlLink,
          status: event.status,
          visibility: event.visibility,
          attendees: event.attendees,
          reminders: event.reminders
        },
        updatedAt: new Date()
      }
    });
  }

  /**
   * Create event in Google Calendar
   */
  async createEvent(
    userId: string,
    event: {
      title: string;
      description?: string;
      startTime: Date;
      endTime: Date;
      location?: string;
      attendees?: string[];
    },
    calendarId: string = 'primary'
  ): Promise<calendar_v3.Schema$Event> {
    const authenticated = await this.authenticateUser(userId);
    if (!authenticated) {
      throw new Error('User not authenticated with Google Calendar');
    }

    const eventPayload: calendar_v3.Schema$Event = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      attendees: event.attendees?.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 }
        ]
      }
    };

    const response = await this.calendar.events.insert({
      calendarId,
      requestBody: eventPayload,
      sendNotifications: true
    });

    return response.data;
  }

  /**
   * Update event in Google Calendar
   */
  async updateEvent(
    userId: string,
    eventId: string,
    updates: Partial<calendar_v3.Schema$Event>,
    calendarId: string = 'primary'
  ): Promise<calendar_v3.Schema$Event> {
    const authenticated = await this.authenticateUser(userId);
    if (!authenticated) {
      throw new Error('User not authenticated with Google Calendar');
    }

    const response = await this.calendar.events.patch({
      calendarId,
      eventId,
      requestBody: updates
    });

    return response.data;
  }

  /**
   * Delete event from Google Calendar
   */
  async deleteEvent(
    userId: string,
    eventId: string,
    calendarId: string = 'primary'
  ): Promise<void> {
    const authenticated = await this.authenticateUser(userId);
    if (!authenticated) {
      throw new Error('User not authenticated with Google Calendar');
    }

    await this.calendar.events.delete({
      calendarId,
      eventId,
      sendNotifications: true
    });
  }

  /**
   * Watch for calendar changes (webhook)
   */
  async watchCalendar(
    userId: string,
    calendarId: string = 'primary',
    webhookUrl: string
  ): Promise<calendar_v3.Schema$Channel> {
    const authenticated = await this.authenticateUser(userId);
    if (!authenticated) {
      throw new Error('User not authenticated with Google Calendar');
    }

    const response = await this.calendar.events.watch({
      calendarId,
      requestBody: {
        id: `${userId}-${calendarId}-${Date.now()}`,
        type: 'web_hook',
        address: webhookUrl,
        expiration: String(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    return response.data;
  }

  /**
   * Get free/busy information
   */
  async getFreeBusy(
    userId: string,
    timeMin: Date,
    timeMax: Date,
    calendarIds: string[] = ['primary']
  ): Promise<calendar_v3.Schema$FreeBusyResponse> {
    const authenticated = await this.authenticateUser(userId);
    if (!authenticated) {
      throw new Error('User not authenticated with Google Calendar');
    }

    const response = await this.calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: calendarIds.map(id => ({ id }))
      }
    });

    return response.data;
  }
}

export const googleCalendar = new GoogleCalendarService();