// Force dynamic rendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Simple health check - just verify environment
    const responseTime = Date.now() - startTime;
    
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime,
      environment: process.env.NODE_ENV || 'unknown',
      version: '1.0.0',
      services: {
        database: {
          status: process.env.DATABASE_URL ? 'configured' : 'not_configured',
          hasUrl: !!process.env.DATABASE_URL
        },
        api: {
          status: 'healthy',
          responseTime: 1
        },
        auth: {
          status: process.env.STACK_PROJECT_ID ? 'configured' : 'not_configured',
          hasStackAuth: !!process.env.STACK_PROJECT_ID
        }
      }
    };
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime,
      error: error instanceof Error ? error.message : 'Health check failed',
      environment: process.env.NODE_ENV || 'unknown'
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

// Lightweight health check for load balancers
export async function HEAD(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}
