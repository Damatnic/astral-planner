import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/auth-utils';
import { withAuth, withRole } from '@/lib/auth/auth-utils';

import { db } from '@/db';
import { users } from '@/db/schema/users';
import { blocks } from '@/db/schema/blocks';
import { goals } from '@/db/schema/goals';
import { habits } from '@/db/schema/habits';
import { workspaces } from '@/db/schema/workspaces';
import { blockActivity } from '@/db/schema/blocks';
import { count, desc } from 'drizzle-orm';

async function handleGET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'summary'; // 'summary' | 'full'

    if (type === 'full') {
      // Full data export - be careful with large datasets
      return await handleFullExport(user.id);
    } else {
      // Summary export
      return await handleSummaryExport(user.id);
    }
  } catch (error) {
    console.error('Admin export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

async function handleSummaryExport(adminUserId: string) {
  // Get summary statistics
  const [
    totalUsers,
    totalWorkspaces,
    totalTasks,
    totalGoals,
    totalHabits,
    recentActivities,
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(workspaces),
    db.select({ count: count() }).from(blocks),
    db.select({ count: count() }).from(goals),
    db.select({ count: count() }).from(habits),
    db.select().from(blockActivity).orderBy(desc(blockActivity.createdAt)).limit(100),
  ]);

  const exportData = {
    metadata: {
      exportType: 'summary',
      exportedAt: new Date().toISOString(),
      exportedBy: adminUserId,
    },
    statistics: {
      totalUsers: totalUsers[0]?.count || 0,
      totalWorkspaces: totalWorkspaces[0]?.count || 0,
      totalTasks: totalTasks[0]?.count || 0,
      totalGoals: totalGoals[0]?.count || 0,
      totalHabits: totalHabits[0]?.count || 0,
    },
    recentActivities: recentActivities.map(activity => ({
      id: activity.id,
      action: activity.action,
      userId: activity.userId,
      blockId: activity.blockId,
      createdAt: activity.createdAt,
      changes: activity.changes,
      metadata: activity.metadata,
    })),
  };

  console.log('Admin summary export completed:', { adminUserId, dataSize: JSON.stringify(exportData).length });

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="admin-summary-export-${new Date().toISOString().split('T')[0]}.json"`,
    },
  });
}

async function handleFullExport(adminUserId: string) {
  // Warning: This could be a large dataset
  const [usersData, workspacesData, blocksData, goalsData, habitsData] = await Promise.all([
    db.select().from(users).limit(1000), // Limit to prevent massive exports
    db.select().from(workspaces).limit(1000),
    db.select().from(blocks).limit(5000),
    db.select().from(goals).limit(1000),
    db.select().from(habits).limit(1000),
  ]);

  // Sanitize sensitive data
  const sanitizedUsers = usersData.map(user => ({
    id: user.id,
    email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt,
    lastActiveAt: user.lastActiveAt,
    subscription: user.subscription,
    totalTasksCreated: user.totalTasksCreated,
    totalTasksCompleted: user.totalTasksCompleted,
    onboardingCompleted: user.onboardingCompleted,
  }));

  const exportData = {
    metadata: {
      exportType: 'full',
      exportedAt: new Date().toISOString(),
      exportedBy: adminUserId,
      warning: 'This export contains sanitized user data for privacy protection',
    },
    data: {
      users: sanitizedUsers,
      workspaces: workspacesData,
      blocks: blocksData,
      goals: goalsData,
      habits: habitsData,
    },
    statistics: {
      usersCount: sanitizedUsers.length,
      workspacesCount: workspacesData.length,
      blocksCount: blocksData.length,
      goalsCount: goalsData.length,
      habitsCount: habitsData.length,
    },
  };

  console.log('Admin full export completed:', { 
    adminUserId, 
    userCount: sanitizedUsers.length,
    dataSize: JSON.stringify(exportData).length 
  });

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="admin-full-export-${new Date().toISOString().split('T')[0]}.json"`,
    },
  });
}

// Apply admin role requirement
export async function GET(req: NextRequest) {
  return await handleGET(req);
}