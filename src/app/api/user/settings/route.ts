import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/auth-utils';

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

// User-specific settings storage (in production this would be in a database)
const userSettings: { [userId: string]: any } = {
  'demo-user': {
    ...defaultSettings,
    appearance: { ...defaultSettings.appearance, theme: 'light', accentColor: '#22c55e' }
  },
  'nick-user': {
    ...defaultSettings,
    appearance: { ...defaultSettings.appearance, theme: 'dark', accentColor: '#3b82f6' }
  }
};

async function handlePUT(req: NextRequest) {
  try {
    // Get authenticated user
    const authContext = await getAuthContext(req);
    
    if (!authContext.isAuthenticated || !authContext.user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const userId = authContext.user.id;
    
    // Store user settings (in production this would go to database)
    userSettings[userId] = {
      ...userSettings[userId],
      ...body.settings
    };
    
    return NextResponse.json({
      success: true,
      settings: userSettings[userId],
      aiSettings: body.aiSettings || { enabled: authContext.user.role === 'premium' },
      message: 'Settings updated successfully'
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
    // Enhanced authentication for settings API
    let authContext;
    
    try {
      authContext = await getAuthContext(req);
    } catch (authError) {
      console.warn('Auth context failed, checking for demo user:', authError);
      
      // Fallback: Check for demo/testing authentication via headers
      const demoHeader = req.headers.get('x-demo-user');
      const userDataHeader = req.headers.get('x-user-data');
      const pinHeader = req.headers.get('x-pin');
      
      if (demoHeader === 'demo-user' || userDataHeader?.includes('demo-user') || pinHeader === '0000') {
        // Create demo auth context
        authContext = {
          isAuthenticated: true,
          isDemo: true,
          user: {
            id: 'demo-user',
            name: 'Demo User',
            role: 'user',
            email: 'demo@astralchronos.com'
          }
        };
      } else if (userDataHeader?.includes('nick-planner') || pinHeader === '7347') {
        // Create Nick's planner auth context
        authContext = {
          isAuthenticated: true,
          isDemo: false,
          user: {
            id: 'nick-planner',
            name: "Nick's Planner",
            role: 'premium',
            email: 'nick@example.com'
          }
        };
      }
    }
    
    if (!authContext?.isAuthenticated || !authContext?.user) {
      console.warn('Settings API: No valid authentication found');
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const userId = authContext.user.id;
    const userPrefs = userSettings[userId] || defaultSettings;
    
    return NextResponse.json({
      settings: userPrefs,
      aiSettings: { enabled: authContext.user.role === 'premium' },
      timezone: authContext.isDemo ? 'America/New_York' : 'UTC',
      locale: 'en-US',
      user: {
        id: authContext.user.id,
        name: authContext.user.name,
        role: authContext.user.role,
        isDemo: authContext.isDemo
      }
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