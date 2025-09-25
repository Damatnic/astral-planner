import { NextRequest, NextResponse } from 'next/server';
import { healthCheck as dbHealthCheck } from '@/db';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Simple health checks
    const dbResult = await dbHealthCheck();
    const responseTime = Date.now() - startTime;
    
    const response = {
      status: dbResult.ok ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime,
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: {
          status: dbResult.ok ? 'healthy' : 'unhealthy',
          responseTime: dbResult.responseTime || responseTime,
          mock: dbResult.mock || false
        },
        api: {
          status: 'healthy',
          responseTime: 1
        }
      },
      hasStackAuth: !!process.env.STACK_PROJECT_ID,
      hasDatabase: !!process.env.DATABASE_URL
    };
    
    const statusCode = dbResult.ok ? 200 : 503;
    
    return NextResponse.json(response, {
      status: statusCode,
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
      environment: process.env.NODE_ENV || 'unknown',
      hasStackAuth: !!process.env.STACK_PROJECT_ID,
      hasDatabase: !!process.env.DATABASE_URL
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
  try {
    const dbResult = await dbHealthCheck();
    const statusCode = dbResult.ok ? 200 : 503;
    
    return new NextResponse(null, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}