import { NextRequest, NextResponse } from 'next/server';

const defaultSettings = {
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
};

async function handlePUT(req: NextRequest) {
  try {
    console.log('Settings update - authentication disabled, returning success');
    const body = await req.json();
    
    return NextResponse.json({
      success: true,
      settings: body.settings || defaultSettings,
      aiSettings: body.aiSettings || { enabled: false },
      message: 'Settings saved locally (authentication disabled)'
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

async function handleGET(req: NextRequest) {
  try {
    console.log('Settings fetch - authentication disabled, returning defaults');
    
    return NextResponse.json({
      settings: defaultSettings,
      aiSettings: { enabled: false },
      timezone: 'UTC',
      locale: 'en-US',
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export const GET = handleGET;
export const PUT = handlePUT;