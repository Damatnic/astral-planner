import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/auth/middleware';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { blocks } from '@/db/schema/blocks';
import { goals } from '@/db/schema/goals';
import { habits } from '@/db/schema/habits';
import { workspaces } from '@/db/schema/workspaces';
import { sql, count, eq, gt } from 'drizzle-orm';
import Logger from '@/lib/logger';

async function handleGET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate date for "active today"
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get basic stats
    const [
      totalUsersResult,
      activeUsersResult,
      totalTasksResult,
      completedTasksResult,
      totalGoalsResult,
      activeHabitsResult,
      totalWorkspacesResult,
    ] = await Promise.all([
      // Total users
      db.select({ count: count() }).from(users),
      
      // Active users today
      db.select({ count: count() }).from(users).where(gt(users.lastActiveAt, today)),
      
      // Total tasks (blocks of type 'task')
      db.select({ count: count() }).from(blocks).where(eq(blocks.type, 'task')),
      
      // Completed tasks
      db.select({ count: count() }).from(blocks).where(
        sql`${blocks.type} = 'task' AND ${blocks.status} = 'completed'`
      ),
      
      // Total goals
      db.select({ count: count() }).from(goals),
      
      // Active habits
      db.select({ count: count() }).from(habits).where(eq(habits.status, 'active')),
      
      // Total workspaces
      db.select({ count: count() }).from(workspaces),
    ]);

    // Calculate storage usage (this is a simplified approach)
    // In a real app, you'd query actual database size
    const storageUsed = '127 MB'; // Placeholder

    const stats = {
      totalUsers: totalUsersResult[0]?.count || 0,
      activeUsers: activeUsersResult[0]?.count || 0,
      totalTasks: totalTasksResult[0]?.count || 0,
      completedTasks: completedTasksResult[0]?.count || 0,
      totalGoals: totalGoalsResult[0]?.count || 0,
      activeHabits: activeHabitsResult[0]?.count || 0,
      totalWorkspaces: totalWorkspacesResult[0]?.count || 0,
      storageUsed,
    };

    Logger.info('Admin stats fetched:', { userId: user.id, stats });

    return NextResponse.json(stats);
  } catch (error) {
    Logger.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

// Apply admin role requirement
export const GET = withRole('ADMIN', withAuth(handleGET));