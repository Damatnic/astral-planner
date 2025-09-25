import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/auth/user-service';
import { getUserFromRequest } from '@/lib/auth';
import Logger from '@/lib/logger';

async function handlePUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    
    // If no authentication configured, return success with submitted data
    if (!user) {
      console.warn('No authentication configured - settings update simulated');
      const body = await req.json();
      return NextResponse.json({
        success: true,
        settings: body.settings || {},
        aiSettings: body.aiSettings || { enabled: false },
        message: 'Settings saved locally (authentication disabled)'
      });
    }

    const body = await req.json();
    const { settings, aiSettings } = body;

    let updatedUser = null;

    // Update general settings if provided
    if (settings) {
      updatedUser = await UserService.updateSettings(user.id, settings);
    }

    // Update AI settings if provided
    if (aiSettings) {
      updatedUser = await UserService.updateAISettings(user.id, aiSettings);
    }

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      settings: updatedUser.settings,
      aiSettings: updatedUser.aiSettings,
    });
  } catch (error) {
    Logger.error('Settings update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

async function handleGET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    
    // If no authentication configured, return default settings
    if (!user) {
      console.warn('No authentication configured - returning default settings');
      return NextResponse.json({
        settings: {
          appearance: {
            theme: 'dark',
            accentColor: '#3b82f6',
            fontSize: 'medium',
            reducedMotion: false,
            compactMode: false
          },
          notifications: {
            email: { taskReminders: false, dailyDigest: false, weeklyReport: false, achievements: false, mentions: false },
            push: { taskReminders: false, mentions: false, updates: false, breakReminders: false },
            inApp: { sounds: true, badges: true, popups: true },
            quietHours: { enabled: false, start: '22:00', end: '08:00', days: [] }
          },
          productivity: {
            pomodoroLength: 25,
            shortBreakLength: 5,
            longBreakLength: 15,
            autoStartBreaks: false,
            autoStartPomodoros: false,
            dailyGoal: 8,
            workingHours: { enabled: false, start: '09:00', end: '17:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] }
          }
        },
        aiSettings: { enabled: false },
        timezone: 'UTC',
        locale: 'en-US',
      });
    }

    const dbUser = await UserService.getUserById(user.id);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      settings: dbUser.settings,
      aiSettings: dbUser.aiSettings,
      timezone: dbUser.timezone,
      locale: dbUser.locale,
    });
  } catch (error) {
    Logger.error('Settings fetch failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export const GET = handleGET;
export const PUT = handlePUT;