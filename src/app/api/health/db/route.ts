// Force dynamic rendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logger';

export async function GET() {
  try {
    // Simplified health check without complex database imports
    const hasDbUrl = !!process.env.DATABASE_URL;
    
    const response = {
      ok: hasDbUrl,
      timestamp: new Date().toISOString(),
      tables: [
        'users', 'workspaces', 'blocks', 'goals', 'habits', 
        'calendar_events', 'analytics', 'integrations', 
        'notifications', 'templates', 'workspace_members'
      ],
      connection: hasDbUrl ? 'configured' : 'not_configured',
      mock: !hasDbUrl,
      database: hasDbUrl ? 'neon-postgresql' : 'demo-mode'
    };
    
    return NextResponse.json(response, {
      status: hasDbUrl ? 200 : 503
    });
  } catch (error) {
    apiLogger.error('Database health check failed', error as Error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Database connection failed',
        mock: true,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
