import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/auth/middleware';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { sql, desc, or, ilike, eq, and, lt } from 'drizzle-orm';
import Logger from '@/lib/logger';

async function handleGET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'active' | 'inactive'

    // Build where condition
    let whereCondition;
    
    if (search && status) {
      const searchCondition = or(
        ilike(users.firstName, `%${search}%`),
        ilike(users.lastName, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(users.username, `%${search}%`)
      );
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const statusCondition = status === 'active'
        ? sql`${users.lastActiveAt} > ${thirtyDaysAgo}`
        : sql`${users.lastActiveAt} <= ${thirtyDaysAgo} OR ${users.lastActiveAt} IS NULL`;
      
      whereCondition = and(searchCondition, statusCondition);
    } else if (search) {
      whereCondition = or(
        ilike(users.firstName, `%${search}%`),
        ilike(users.lastName, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(users.username, `%${search}%`)
      );
    } else if (status) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      whereCondition = status === 'active'
        ? sql`${users.lastActiveAt} > ${thirtyDaysAgo}`
        : sql`${users.lastActiveAt} <= ${thirtyDaysAgo} OR ${users.lastActiveAt} IS NULL`;
    }

    // Build and execute the query
    const baseQuery = db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      username: users.username,
      imageUrl: users.imageUrl,
      subscription: users.subscription,
      createdAt: users.createdAt,
      lastActiveAt: users.lastActiveAt,
      totalTasksCreated: users.totalTasksCreated,
      totalTasksCompleted: users.totalTasksCompleted,
      onboardingCompleted: users.onboardingCompleted,
    }).from(users);

    const usersData = whereCondition
      ? await baseQuery.where(whereCondition).orderBy(desc(users.createdAt)).limit(limit).offset(offset)
      : await baseQuery.orderBy(desc(users.createdAt)).limit(limit).offset(offset);

    // Get total count for pagination
    const totalCountResult = await db.select({ count: sql`COUNT(*)` }).from(users);
    const totalCount = parseInt(totalCountResult[0]?.count as string) || 0;

    // Format user data for admin view
    const formattedUsers = usersData.map(user => {
      const subscription = user.subscription as any || {};
      const isActive = user.lastActiveAt && 
        (Date.now() - user.lastActiveAt.getTime()) < 30 * 24 * 60 * 60 * 1000;

      return {
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        username: user.username,
        imageUrl: user.imageUrl,
        role: subscription.plan === 'admin' ? 'admin' : subscription.plan || 'free',
        isActive,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
        totalTasksCreated: user.totalTasksCreated || 0,
        totalTasksCompleted: user.totalTasksCompleted || 0,
        onboardingCompleted: user.onboardingCompleted,
        subscription: subscription.plan || 'free',
      };
    });

    Logger.info('Admin users list fetched:', { 
      adminUserId: user.id, 
      count: formattedUsers.length,
      total: totalCount 
    });

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    Logger.error('Admin users fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

async function handlePATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Only allow updating certain fields
    const allowedUpdates: any = {};
    if (updates.subscription) {
      allowedUpdates.subscription = updates.subscription;
    }
    
    allowedUpdates.updatedAt = new Date();

    await db.update(users)
      .set(allowedUpdates)
      .where(eq(users.id, userId));

    Logger.info('Admin user update:', { 
      adminUserId: user.id, 
      targetUserId: userId,
      updates: Object.keys(allowedUpdates)
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    Logger.error('Admin user update error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// Apply admin role requirement
export const GET = withRole('ADMIN', withAuth(handleGET));
export const PATCH = withRole('ADMIN', withAuth(handlePATCH));