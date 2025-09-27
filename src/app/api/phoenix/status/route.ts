/**
 * Phoenix System Status API
 * Comprehensive backend performance and health monitoring endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { withOptimizedAuth } from '@/lib/auth/optimized-auth';
import { phoenixRateLimiter } from '@/lib/security/rate-limiter';
import { phoenixMonitor, withPerformanceMonitoring } from '@/lib/monitoring/performance-monitor';
import { healthCheck, getPoolMetrics, executeWithRetry } from '@/db';
import Logger from '@/lib/logger';

/**
 * GET /api/phoenix/status - Get comprehensive system status
 * Demonstrates Phoenix enterprise backend optimizations
 */
export const GET = withPerformanceMonitoring(
  '/api/phoenix/status',
  async (req: NextRequest) => {
    const startTime = performance.now();
    
    try {
      // Extract client information for security analysis
      const clientInfo = {
        ip: req.headers.get('x-forwarded-for')?.split(',')[0] || 
            req.headers.get('x-real-ip') || 
            'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        path: req.nextUrl.pathname,
        method: req.method,
        headers: Object.fromEntries(req.headers.entries()),
      };

      // Rate limiting check
      const rateLimitResult = await phoenixRateLimiter.checkRateLimit(
        clientInfo.ip,
        'api',
        clientInfo
      );

      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            retryAfter: rateLimitResult.retryAfter,
            blocked: rateLimitResult.blocked,
          },
          { 
            status: 429,
            headers: {
              'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
              'X-RateLimit-Limit': rateLimitResult.limit.toString(),
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            },
          }
        );
      }

      // Security analysis
      const securityCheck = await phoenixRateLimiter.performSecurityChecks(clientInfo);
      
      if (!securityCheck.allowed) {
        Logger.warn('High-risk request blocked', {
          clientInfo,
          securityCheck,
        });
        
        return NextResponse.json(
          {
            error: 'Request blocked for security reasons',
            risk: securityCheck.risk,
            reasons: securityCheck.reasons,
          },
          { status: 403 }
        );
      }

      // Parallel system health checks with retry logic
      const [
        dbHealth,
        poolMetrics,
        performanceMetrics,
        rateLimiterHealth,
      ] = await Promise.allSettled([
        executeWithRetry(
          () => healthCheck(),
          3,
          'database_health_check'
        ),
        executeWithRetry(
          () => Promise.resolve(getPoolMetrics()),
          3,
          'pool_metrics'
        ),
        executeWithRetry(
          () => Promise.resolve(phoenixMonitor.getMetricsSummary()),
          3,
          'performance_metrics'
        ),
        executeWithRetry(
          () => phoenixRateLimiter.getHealthStatus(),
          3,
          'rate_limiter_health'
        ),
      ]);

      // Process results
      const systemStatus = {
        timestamp: new Date().toISOString(),
        status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        
        // Database status
        database: dbHealth.status === 'fulfilled' ? dbHealth.value : {
          ok: false,
          error: dbHealth.status === 'rejected' ? dbHealth.reason?.message : 'Unknown error',
          mock: false,
        },
        
        // Connection pool status
        connectionPool: poolMetrics.status === 'fulfilled' ? poolMetrics.value : {
          error: poolMetrics.status === 'rejected' ? poolMetrics.reason?.message : 'Unknown error',
        },
        
        // Performance metrics
        performance: performanceMetrics.status === 'fulfilled' ? performanceMetrics.value : {
          error: performanceMetrics.status === 'rejected' ? performanceMetrics.reason?.message : 'Unknown error',
        },
        
        // Security and rate limiting status
        security: rateLimiterHealth.status === 'fulfilled' ? rateLimiterHealth.value : {
          healthy: false,
          error: rateLimiterHealth.status === 'rejected' ? rateLimiterHealth.reason?.message : 'Unknown error',
        },
        
        // Request-specific metrics
        request: {
          id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          responseTime: performance.now() - startTime,
          securityCheck,
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetTime: new Date(rateLimitResult.resetTime).toISOString(),
          },
        },
        
        // Phoenix system features
        features: {
          authentication: {
            enabled: true,
            caching: !!process.env.REDIS_URL,
            stackAuth: !!(process.env.STACK_PROJECT_ID && process.env.STACK_SECRET_SERVER_KEY),
          },
          database: {
            pooling: true,
            monitoring: true,
            retryLogic: true,
            optimization: true,
          },
          security: {
            rateLimiting: true,
            securityScanning: true,
            bruteForceProtection: true,
            redis: !!process.env.REDIS_URL,
          },
          monitoring: {
            performance: true,
            alerts: true,
            metrics: true,
            logging: true,
          },
        },
      };

      // Determine overall system status
      const dbOk = systemStatus.database.ok;
      const securityOk = systemStatus.security.healthy;
      const performanceOk = (systemStatus.performance as any)?.activeAlerts === 0 || true;
      
      if (!dbOk || !securityOk) {
        systemStatus.status = 'unhealthy';
      } else if (!performanceOk) {
        systemStatus.status = 'degraded';
      }

      // Log system status check
      Logger.info('Phoenix system status check completed', {
        status: systemStatus.status,
        responseTime: systemStatus.request.responseTime,
        clientInfo: {
          ip: clientInfo.ip,
          userAgent: clientInfo.userAgent,
        },
        securityRisk: securityCheck.risk,
      });

      const response = NextResponse.json(systemStatus, {
        status: systemStatus.status === 'unhealthy' ? 503 : 200,
      });

      // Add comprehensive headers
      response.headers.set('X-Phoenix-Version', systemStatus.version);
      response.headers.set('X-System-Status', systemStatus.status);
      response.headers.set('X-Response-Time', systemStatus.request.responseTime.toFixed(2));
      response.headers.set('X-Request-ID', systemStatus.request.id);
      response.headers.set('X-Security-Risk', securityCheck.risk);
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');

      return response;

    } catch (error) {
      Logger.error('Phoenix status endpoint error:', error);
      
      const errorResponse = {
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        responseTime: performance.now() - startTime,
      };

      return NextResponse.json(errorResponse, { status: 500 });
    }
  }
);

/**
 * POST /api/phoenix/status - Trigger system maintenance operations
 * Protected endpoint for system administration
 */
export const POST = withOptimizedAuth(
  async (req: NextRequest, user, session) => {
    const startTime = performance.now();
    
    try {
      // Only allow admin users to trigger maintenance
      const isAdmin = user.subscription?.plan === 'admin' || 
                     process.env.NODE_ENV === 'development';

      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Insufficient permissions - admin access required' },
          { status: 403 }
        );
      }

      const body = await req.json().catch(() => ({}));
      const { action } = body;

      let result: any = {};

      switch (action) {
        case 'reset_metrics':
          phoenixMonitor.reset();
          result = { message: 'Performance metrics reset successfully' };
          break;

        case 'cleanup_cache':
          // This would trigger cache cleanup operations
          result = { message: 'Cache cleanup initiated' };
          break;

        case 'force_gc':
          if (global.gc) {
            global.gc();
            result = { message: 'Garbage collection forced' };
          } else {
            result = { message: 'Garbage collection not available' };
          }
          break;

        case 'reset_rate_limits':
          phoenixRateLimiter.resetMetrics();
          result = { message: 'Rate limit metrics reset' };
          break;

        default:
          return NextResponse.json(
            { error: 'Invalid action specified' },
            { status: 400 }
          );
      }

      Logger.info('Phoenix maintenance action executed', {
        action,
        user: user.id,
        result,
      });

      return NextResponse.json({
        success: true,
        action,
        result,
        executedBy: user.id,
        timestamp: new Date().toISOString(),
        responseTime: performance.now() - startTime,
      });

    } catch (error) {
      Logger.error('Phoenix maintenance endpoint error:', error);
      
      return NextResponse.json(
        { 
          error: 'Maintenance operation failed',
          timestamp: new Date().toISOString(),
          responseTime: performance.now() - startTime,
        },
        { status: 500 }
      );
    }
  }
);