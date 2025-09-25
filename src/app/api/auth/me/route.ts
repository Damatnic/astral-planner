import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // For demo purposes, always return a demo user when authentication is disabled
    console.log('Returning demo user data');
    
    return NextResponse.json({
      user: {
        id: 'demo-user',
        clerkId: 'demo-clerk-id',
        email: 'demo@astralchronos.com',
        firstName: 'Demo',
        lastName: 'User',
        imageUrl: null,
        username: 'demo',
        timezone: 'UTC',
        locale: 'en-US',
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
        subscription: { plan: 'free', features: [], expiresAt: null },
        onboardingCompleted: false,
        onboardingStep: 1,
        aiSettings: { enabled: false },
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Auth endpoint error:', error);
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}