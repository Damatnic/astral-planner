import { NextRequest, NextResponse } from 'next/server';
import { healthChecker } from '@/lib/monitoring';
import { corsHeaders, securityHeaders } from '@/lib/security';
import Logger from '@/lib/logger';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get comprehensive system health
    const healthResult = await healthChecker.checkSystemHealth();
    const metrics = healthChecker.getSystemMetrics();
    const alertCheck = healthChecker.checkAlertThresholds(metrics);
    
    const responseTime = Date.now() - startTime;
    
    // Record this request
    healthChecker.recordRequest(responseTime);
    
    const response = {
      status: healthResult.status,
      timestamp: new Date().toISOString(),
      responseTime,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor(metrics.uptime / 1000), // Convert to seconds
      system: {
        memory: {
          used: Math.round(metrics.memoryUsage.used / 1024 / 1024), // MB
          total: Math.round(metrics.memoryUsage.total / 1024 / 1024), // MB
          percentage: Math.round(metrics.memoryUsage.percentage * 100) / 100
        },
        requests: {
          perMinute: metrics.requestsPerMinute,
          errorRate: Math.round(metrics.errorRate * 100) / 100
        }
      },
      services: healthResult.checks.reduce((acc, check) => {
        acc[check.service] = {
          status: check.status,
          responseTime: check.responseTime,
          details: check.details
        };
        return acc;
      }, {} as Record<string, any>),
      summary: healthResult.summary,
      alerts: alertCheck.alerts
    };
    
    // Determine HTTP status code based on health
    let statusCode = 200;
    if (healthResult.status === 'degraded') {
      statusCode = 207; // Multi-Status
    } else if (healthResult.status === 'unhealthy') {
      statusCode = 503; // Service Unavailable
    }
    
    Logger.info('Health check completed', {
      status: healthResult.status,
      responseTime,
      alertCount: alertCheck.alerts.length
    });
    
    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        ...corsHeaders(req),
        ...securityHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Record error
    healthChecker.recordError();
    healthChecker.recordRequest(responseTime);
    
    Logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    });
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime,
      error: 'Health check failed',
      environment: process.env.NODE_ENV
    }, {
      status: 503,
      headers: {
        ...corsHeaders(req),
        ...securityHeaders(),
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
    // Quick database ping
    const { healthCheck } = await import('@/db');
    const dbResult = await healthCheck();
    
    const statusCode = dbResult.ok ? 200 : 503;
    
    return new NextResponse(null, {
      status: statusCode,
      headers: {
        ...corsHeaders(req),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch {
    return new NextResponse(null, {
      status: 503,
      headers: {
        ...corsHeaders(req),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}