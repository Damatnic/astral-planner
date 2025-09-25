import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { UserService } from '@/lib/auth/user-service';
import { getUserFromRequest } from '@/lib/auth';
import Logger from '@/lib/logger';

async function handlePUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

export const GET = withAuth(handleGET);
export const PUT = withAuth(handlePUT);