import { NextRequest, NextResponse } from 'next/server';
import { getUserForRequest } from '@/lib/auth';
import { UserService } from '@/lib/auth/user-service';
import Logger from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const stackAuthUser = await getUserForRequest(req);
    
    // If no authentication is configured, return demo user data
    if (!stackAuthUser) {
      console.warn('No authentication configured - returning demo user');
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
          lastActiveAt: new Date(),
          createdAt: new Date(),
        }
      });
    }
    
    // Sync user with database and get full user record
    const dbUser = await UserService.syncUser({
      id: stackAuthUser.id,
      email: stackAuthUser.email,
      firstName: stackAuthUser.firstName,
      lastName: stackAuthUser.lastName,
      imageUrl: stackAuthUser.imageUrl,
      username: stackAuthUser.username,
    });

    // Update last active timestamp
    await UserService.updateLastActive(dbUser.id);
    
    return NextResponse.json({
      user: {
        id: dbUser.id,
        clerkId: dbUser.clerkId,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        imageUrl: dbUser.imageUrl,
        username: dbUser.username,
        timezone: dbUser.timezone,
        locale: dbUser.locale,
        settings: dbUser.settings,
        subscription: dbUser.subscription,
        onboardingCompleted: dbUser.onboardingCompleted,
        onboardingStep: dbUser.onboardingStep,
        aiSettings: dbUser.aiSettings,
        lastActiveAt: dbUser.lastActiveAt,
        createdAt: dbUser.createdAt,
      }
    });
  } catch (error) {
    Logger.error('Auth check failed:', error);
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}