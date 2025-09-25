import { NextRequest, NextResponse } from 'next/server';
import { getUserForRequest } from '@/lib/auth';
import { UserService } from '@/lib/auth/user-service';
import Logger from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const stackAuthUser = await getUserForRequest(req);
    
    if (!stackAuthUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
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