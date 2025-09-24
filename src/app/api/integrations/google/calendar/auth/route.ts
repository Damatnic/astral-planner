import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { googleCalendar } from '@/lib/integrations/google-calendar';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const authUrl = googleCalendar.getAuthUrl(userId);
    
    return NextResponse.json({ 
      authUrl,
      success: true 
    });
  } catch (error) {
    console.error('Google Calendar auth URL generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}