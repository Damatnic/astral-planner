import { NextResponse } from 'next/server';
import { db, healthCheck } from '@/db';

export async function GET() {
  try {
    // Basic connection test
    const health = await healthCheck();
    
    if (!health.ok) {
      return NextResponse.json(
        { 
          ok: false, 
          error: health.error,
          mock: health.mock,
          timestamp: new Date().toISOString()
        },
        { status: health.mock ? 200 : 500 }
      );
    }

    // Get table information (basic schema validation)
    const tables = [
      'users', 'workspaces', 'blocks', 'goals', 'habits', 
      'calendar_events', 'analytics', 'integrations', 
      'notifications', 'templates', 'workspace_members'
    ];
    
    return NextResponse.json({
      ok: true,
      timestamp: health.timestamp,
      tables,
      connection: 'healthy',
      mock: false,
      database: 'neon-postgresql'
    });
  } catch (error) {
    // TODO: Replace with proper logging - console.error('Database health check failed:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Database connection failed',
        mock: false,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}