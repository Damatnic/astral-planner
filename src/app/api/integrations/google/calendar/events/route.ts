import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { googleCalendar } from '@/lib/integrations/google-calendar';
import { z } from 'zod';

const CreateEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
  calendarId: z.string().optional().default('primary')
});

const UpdateEventSchema = z.object({
  eventId: z.string(),
  updates: z.object({
    summary: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    start: z.object({
      dateTime: z.string().optional(),
      timeZone: z.string().optional()
    }).optional(),
    end: z.object({
      dateTime: z.string().optional(),
      timeZone: z.string().optional()
    }).optional()
  }),
  calendarId: z.string().optional().default('primary')
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = CreateEventSchema.parse(body);

    const event = await googleCalendar.createEvent(
      userId,
      {
        title: validated.title,
        description: validated.description,
        startTime: new Date(validated.startTime),
        endTime: new Date(validated.endTime),
        location: validated.location,
        attendees: validated.attendees
      },
      validated.calendarId
    );

    return NextResponse.json({
      event,
      success: true
    });
  } catch (error) {
    console.error('Failed to create Google Calendar event:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = UpdateEventSchema.parse(body);

    const event = await googleCalendar.updateEvent(
      userId,
      validated.eventId,
      validated.updates,
      validated.calendarId
    );

    return NextResponse.json({
      event,
      success: true
    });
  } catch (error) {
    console.error('Failed to update Google Calendar event:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    await googleCalendar.deleteEvent(userId, eventId, calendarId);

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete Google Calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}