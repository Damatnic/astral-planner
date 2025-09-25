import Logger from './logger';
import { healthCheck as dbHealthCheck } from '@/db';
import { Redis } from 'ioredis';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface SystemMetrics {
  timestamp: Date;
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage?: number;
  activeConnections: number;
  requestsPerMinute: number;
  errorRate: number;
}

// Health check implementations
export class HealthChecker {
  private redis?: Redis;
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;
  private requestTimes: number[] = [];

  constructor() {
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL);
      } catch (error) {
        Logger.warn('Redis connection failed for monitoring', error);
      }
    }
  }

  // Database health check
  async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const result = await dbHealthCheck();
      const responseTime = Date.now() - startTime;
      
      return {
        service: 'database',
        status: result.ok ? 'healthy' : 'unhealthy',
        responseTime,
        details: {
          mock: result.mock,
          poolSize: result.poolSize,
          timestamp: result.timestamp,
          error: result.error
        },
        timestamp: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      Logger.error('Database health check failed', error);
      
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date()
      };
    }
  }

  // Redis health check
  async checkRedis(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    if (!this.redis) {
      return {
        service: 'redis',
        status: 'degraded',
        responseTime: 0,
        details: {
          error: 'Redis not configured',
          fallback: 'Using memory store'
        },
        timestamp: new Date()
      };
    }

    try {
      const testKey = `health_check_${Date.now()}`;
      const testValue = 'ok';
      
      await this.redis.set(testKey, testValue, 'EX', 10);
      const result = await this.redis.get(testKey);
      await this.redis.del(testKey);
      
      const responseTime = Date.now() - startTime;
      const isHealthy = result === testValue;
      
      return {
        service: 'redis',
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        details: {
          connected: this.redis.status === 'ready',
          testResult: result === testValue
        },
        timestamp: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      Logger.error('Redis health check failed', error);
      
      return {
        service: 'redis',
        status: 'unhealthy',
        responseTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date()
      };
    }
  }

  // External API health check (example for future integrations)
  async checkExternalAPI(url: string, name: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      const responseTime = Date.now() - startTime;
      
      return {
        service: name,
        status: response.ok ? 'healthy' : 'degraded',
        responseTime,
        details: {
          statusCode: response.status,
          statusText: response.statusText
        },
        timestamp: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        service: name,
        status: 'unhealthy',
        responseTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date()
      };
    }
  }

  // Comprehensive system health check
  async checkSystemHealth(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    checks: HealthCheckResult[];
    summary: {
      total: number;
      healthy: number;
      degraded: number;
      unhealthy: number;
    };
    timestamp: Date;
  }> {
    const checks: HealthCheckResult[] = [];
    
    // Run all health checks in parallel
    const [dbCheck, redisCheck] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis()
    ]);
    
    checks.push(dbCheck, redisCheck);
    
    // Add more checks as needed
    if (process.env.NODE_ENV === 'production') {
      // Example external service checks
      // const externalChecks = await Promise.all([
      //   this.checkExternalAPI('https://api.openai.com', 'openai'),
      //   this.checkExternalAPI('https://api.clerk.dev', 'clerk')
      // ]);
      // checks.push(...externalChecks);
    }
    
    // Calculate summary
    const summary = {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      degraded: checks.filter(c => c.status === 'degraded').length,
      unhealthy: checks.filter(c => c.status === 'unhealthy').length
    };
    
    // Determine overall status
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    if (summary.unhealthy > 0) {
      overallStatus = 'unhealthy';
    } else if (summary.degraded > 0) {
      overallStatus = 'degraded';
    }
    
    Logger.info('System health check completed', {
      status: overallStatus,
      summary,
      checkCount: checks.length
    });
    
    return {
      status: overallStatus,
      checks,
      summary,
      timestamp: new Date()
    };
  }

  // System metrics collection
  getSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    const uptime = Date.now() - this.startTime;
    
    // Calculate requests per minute
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.requestTimes.filter(time => time > oneMinuteAgo);
    const requestsPerMinute = recentRequests.length;
    
    // Calculate error rate
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
    
    return {
      timestamp: new Date(),
      uptime,
      memoryUsage: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      activeConnections: 0, // Would need to implement connection tracking
      requestsPerMinute,
      errorRate
    };
  }

  // Request tracking methods
  recordRequest(responseTime?: number) {
    this.requestCount++;
    this.requestTimes.push(Date.now());
    
    // Keep only last hour of request times
    const oneHourAgo = Date.now() - 3600000;
    this.requestTimes = this.requestTimes.filter(time => time > oneHourAgo);
  }

  recordError() {
    this.errorCount++;
  }

  // Performance monitoring
  async measurePerformance<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<{ result: T; metrics: { duration: number; memory: number } }> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      const memory = process.memoryUsage().heapUsed - startMemory;
      
      Logger.info(`Performance: ${operationName}`, {
        duration,
        memoryDelta: memory,
        success: true
      });
      
      return {
        result,
        metrics: { duration, memory }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const memory = process.memoryUsage().heapUsed - startMemory;
      
      Logger.error(`Performance: ${operationName} failed`, {
        duration,
        memoryDelta: memory,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
      
      throw error;
    }
  }

  // Alert thresholds
  checkAlertThresholds(metrics: SystemMetrics): {
    alerts: Array<{
      type: 'warning' | 'critical';
      message: string;
      value: number;
      threshold: number;
    }>;
  } {
    const alerts: Array<{
      type: 'warning' | 'critical';
      message: string;
      value: number;
      threshold: number;
    }> = [];

    // Memory usage alerts
    if (metrics.memoryUsage.percentage > 90) {
      alerts.push({
        type: 'critical',
        message: 'Memory usage critically high',
        value: metrics.memoryUsage.percentage,
        threshold: 90
      });
    } else if (metrics.memoryUsage.percentage > 75) {
      alerts.push({
        type: 'warning',
        message: 'Memory usage high',
        value: metrics.memoryUsage.percentage,
        threshold: 75
      });
    }

    // Error rate alerts
    if (metrics.errorRate > 10) {
      alerts.push({
        type: 'critical',
        message: 'Error rate critically high',
        value: metrics.errorRate,
        threshold: 10
      });
    } else if (metrics.errorRate > 5) {
      alerts.push({
        type: 'warning',
        message: 'Error rate elevated',
        value: metrics.errorRate,
        threshold: 5
      });
    }

    // Log alerts
    if (alerts.length > 0) {
      alerts.forEach(alert => {
        if (alert.type === 'critical') {
          Logger.error(`CRITICAL ALERT: ${alert.message}`, alert);
        } else {
          Logger.warn(`WARNING: ${alert.message}`, alert);
        }
      });
    }

    return { alerts };
  }

  // Cleanup resources
  async destroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Global health checker instance
export const healthChecker = new HealthChecker();

// Graceful shutdown handler
export function setupGracefulShutdown() {
  const shutdown = async (signal: string) => {
    Logger.info(`Received ${signal}, starting graceful shutdown`);
    
    try {
      // Close database connections
      const { closeDatabase } = await import('@/db');
      await closeDatabase();
      
      // Close health checker resources
      await healthChecker.destroy();
      
      Logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      Logger.error('Error during graceful shutdown', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon
}