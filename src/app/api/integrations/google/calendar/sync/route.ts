import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { googleCalendar } from '@/lib/integrations/google-calendar';

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
    const { calendarId = 'primary' } = body;

    await googleCalendar.syncEvents(userId, calendarId);

    return NextResponse.json({
      success: true,
      message: 'Calendar synced successfully'
    });
  } catch (error) {
    console.error('Google Calendar sync failed:', error);
    return NextResponse.json(
      { error: 'Failed to sync calendar' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const calendars = await googleCalendar.listCalendars(userId);

    return NextResponse.json({
      calendars,
      success: true
    });
  } catch (error) {
    console.error('Failed to list Google calendars:', error);
    return NextResponse.json(
      { error: 'Failed to list calendars' },
      { status: 500 }
    );
  }
}