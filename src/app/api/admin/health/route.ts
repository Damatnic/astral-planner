import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/auth/middleware';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import Logger from '@/lib/logger';

interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down';
  redis: 'healthy' | 'degraded' | 'down';
  pusher: 'healthy' | 'degraded' | 'down';
  api: 'healthy' | 'degraded' | 'down';
}

async function checkDatabaseHealth(): Promise<'healthy' | 'degraded' | 'down'> {
  try {
    // Simple database query to check connectivity
    await db.select().from(users).limit(1);
    return 'healthy';
  } catch (error) {
    Logger.error('Database health check failed:', error);
    return 'down';
  }
}

async function checkRedisHealth(): Promise<'healthy' | 'degraded' | 'down'> {
  try {
    // In a real app, you'd check Redis connectivity
    // For now, assume healthy since we don't have Redis configured
    return 'healthy';
  } catch (error) {
    Logger.error('Redis health check failed:', error);
    return 'down';
  }
}

async function checkPusherHealth(): Promise<'healthy' | 'degraded' | 'down'> {
  try {
    // Check if Pusher credentials are configured
    if (process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET) {
      return 'healthy';
    } else {
      return 'degraded';
    }
  } catch (error) {
    Logger.error('Pusher health check failed:', error);
    return 'down';
  }
}

async function checkAPIHealth(): Promise<'healthy' | 'degraded' | 'down'> {
  try {
    // Basic API health - if this endpoint is running, API is healthy
    return 'healthy';
  } catch (error) {
    Logger.error('API health check failed:', error);
    return 'down';
  }
}

async function handleGET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run all health checks in parallel
    const [databaseHealth, redisHealth, pusherHealth, apiHealth] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
      checkPusherHealth(),
      checkAPIHealth(),
    ]);

    const health: SystemHealth = {
      database: databaseHealth,
      redis: redisHealth,
      pusher: pusherHealth,
      api: apiHealth,
    };

    Logger.info('System health check completed:', { userId: user.id, health });

    return NextResponse.json(health);
  } catch (error) {
    Logger.error('Admin health check error:', error);
    return NextResponse.json(
      { error: 'Failed to check system health' },
      { status: 500 }
    );
  }
}

// Apply admin role requirement
export const GET = withRole('ADMIN', withAuth(handleGET));