import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/auth-utils';
import { withAuth, withRole } from '@/lib/auth/auth-utils';

import { db } from '@/db';
import { blockActivity } from '@/db/schema/blocks';
import { users } from '@/db/schema/users';
import { desc, eq } from 'drizzle-orm';

async function handleGET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get recent activities with user information
    const activities = await db
      .select({
        id: blockActivity.id,
        action: blockActivity.action,
        changes: blockActivity.changes,
        metadata: blockActivity.metadata,
        createdAt: blockActivity.createdAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(blockActivity)
      .leftJoin(users, eq(blockActivity.userId, users.id))
      .orderBy(desc(blockActivity.createdAt))
      .limit(limit)
      .offset(offset);

    // Format activities for admin view
    const formattedActivities = activities.map(activity => {
      const metadata = activity.metadata as any || {};
      const changes = activity.changes as any || {};
      
      return {
        id: activity.id,
        user: activity.userFirstName && activity.userLastName 
          ? `${activity.userFirstName} ${activity.userLastName}`
          : activity.userEmail || 'Unknown User',
        action: formatAction(activity.action),
        target: metadata.blockType || metadata.type || 'item',
        createdAt: activity.createdAt,
        metadata: {
          type: metadata.blockType || metadata.type,
          changeCount: changes ? Object.keys(changes).length : 0,
        },
      };
    });

    console.log('Admin activities fetched:', { 
      adminUserId: user.id, 
      count: formattedActivities.length 
    });

    return NextResponse.json({
      activities: formattedActivities,
    });
  } catch (error) {
    console.error('Admin activities fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

function formatAction(action: string): string {
  switch (action) {
    case 'created':
      return 'created';
    case 'updated':
      return 'updated';
    case 'completed':
      return 'completed';
    case 'archived':
      return 'archived';
    case 'deleted':
      return 'deleted';
    default:
      return action;
  }
}

// Apply admin role requirement
export async function GET(req: NextRequest) {
  return await handleGET(req);
}