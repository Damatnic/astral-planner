/**
 * Phoenix Enterprise Performance Monitoring System
 * Real-time performance tracking, alerting, and optimization
 */

import { Redis } from 'ioredis';
import Logger from '../logger';
import { getPoolMetrics } from '../../db';
import { phoenixRateLimiter } from '../security/rate-limiter';

// Performance thresholds for alerting
const PERFORMANCE_THRESHOLDS = {
  responseTime: {
    warning: 500, // 500ms
    critical: 2000, // 2 seconds
  },
  memoryUsage: {
    warning: 80, // 80% of available memory
    critical: 90, // 90% of available memory
  },
  cpuUsage: {
    warning: 70, // 70% CPU usage
    critical: 85, // 85% CPU usage
  },
  dbConnections: {
    warning: 80, // 80% of pool size
    critical: 95, // 95% of pool size
  },
  errorRate: {
    warning: 1, // 1% error rate
    critical: 5, // 5% error rate
  },
} as const;

interface PerformanceMetrics {
  timestamp: number;
  
  // Request metrics
  requestCount: number;
  responseTime: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
  };
  
  // Error metrics
  errorCount: number;
  errorRate: number;
  errors: Array<{
    message: string;
    stack?: string;
    count: number;
    lastOccurred: number;
  }>;
  
  // Database metrics
  database: {
    poolSize: number;
    activeConnections: number;
    idleConnections: number;
    waitingRequests: number;
    queryTime: {
      avg: number;
      slowQueries: number;
    };
  };
  
  // System metrics
  system: {
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
    processId: number;
  };
  
  // API endpoint metrics
  endpoints: Map<string, {
    requestCount: number;
    avgResponseTime: number;
    errorCount: number;
    lastAccessed: number;
  }>;
  
  // Security metrics
  security: {
    blockedRequests: number;
    suspiciousActivity: number;
    rateLimitHits: number;
    uniqueIPs: number;
  };
}

interface Alert {
  id: string;
  type: 'warning' | 'critical';
  category: 'performance' | 'security' | 'database' | 'system';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  resolved?: boolean;
  resolvedAt?: number;
}

export class PhoenixPerformanceMonitor {
  private redis: Redis | null = null;
  private metrics: PerformanceMetrics;
  private requestTimes: number[] = [];
  private alerts: Map<string, Alert> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  
  constructor() {
    this.metrics = this.initializeMetrics();
    this.initializeRedis();
    this.startMonitoring();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      timestamp: Date.now(),
      requestCount: 0,
      responseTime: {
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        min: 0,
        max: 0,
      },
      errorCount: 0,
      errorRate: 0,
      errors: [],
      database: {
        poolSize: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingRequests: 0,
        queryTime: {
          avg: 0,
          slowQueries: 0,
        },
      },
      system: {
        memoryUsage: 0,
        cpuUsage: 0,
        uptime: process.uptime(),
        processId: process.pid,
      },
      endpoints: new Map(),
      security: {
        blockedRequests: 0,
        suspiciousActivity: 0,
        rateLimitHits: 0,
        uniqueIPs: 0,
      },
    };
  }

  private initializeRedis(): void {
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL, {
          keyPrefix: 'phoenix:metrics:',
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });

        this.redis.on('error', (err) => {
          Logger.error('Performance monitor Redis error:', err);
        });
      } catch (error) {
        Logger.error('Failed to initialize Redis for performance monitoring:', error);
      }
    }
  }

  /**
   * Record API request metrics
   */
  recordRequest(
    endpoint: string,
    responseTime: number,
    statusCode: number,
    error?: Error
  ): void {
    this.metrics.requestCount++;
    this.requestTimes.push(responseTime);
    
    // Keep only last 1000 response times for percentile calculations
    if (this.requestTimes.length > 1000) {
      this.requestTimes = this.requestTimes.slice(-1000);
    }

    // Update endpoint metrics
    const endpointMetrics = this.metrics.endpoints.get(endpoint) || {
      requestCount: 0,
      avgResponseTime: 0,
      errorCount: 0,
      lastAccessed: 0,
    };

    endpointMetrics.requestCount++;
    endpointMetrics.avgResponseTime = 
      (endpointMetrics.avgResponseTime * (endpointMetrics.requestCount - 1) + responseTime) / 
      endpointMetrics.requestCount;
    endpointMetrics.lastAccessed = Date.now();

    if (error || statusCode >= 400) {
      this.metrics.errorCount++;
      endpointMetrics.errorCount++;
      
      if (error) {
        this.recordError(error);
      }
    }

    this.metrics.endpoints.set(endpoint, endpointMetrics);

    // Check for performance alerts
    this.checkPerformanceAlerts(responseTime, statusCode);
  }

  /**
   * Record error with deduplication
   */
  recordError(error: Error): void {
    const errorKey = error.message;
    const existingError = this.metrics.errors.find(e => e.message === errorKey);

    if (existingError) {
      existingError.count++;
      existingError.lastOccurred = Date.now();
    } else {
      this.metrics.errors.push({
        message: error.message,
        stack: error.stack,
        count: 1,
        lastOccurred: Date.now(),
      });
    }

    // Keep only the top 50 most frequent errors
    if (this.metrics.errors.length > 50) {
      this.metrics.errors.sort((a, b) => b.count - a.count);
      this.metrics.errors = this.metrics.errors.slice(0, 50);
    }
  }

  /**
   * Update system metrics
   */
  private updateSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    
    this.metrics.system = {
      memoryUsage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      cpuUsage: this.getCPUUsage(),
      uptime: process.uptime(),
      processId: process.pid,
    };

    // Update response time statistics
    if (this.requestTimes.length > 0) {
      const sorted = [...this.requestTimes].sort((a, b) => a - b);
      
      this.metrics.responseTime = {
        avg: this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length,
        p50: this.percentile(sorted, 50),
        p95: this.percentile(sorted, 95),
        p99: this.percentile(sorted, 99),
        min: Math.min(...this.requestTimes),
        max: Math.max(...this.requestTimes),
      };
    }

    // Update error rate
    this.metrics.errorRate = this.metrics.requestCount > 0 
      ? (this.metrics.errorCount / this.metrics.requestCount) * 100 
      : 0;
  }

  /**
   * Update database metrics
   */
  private updateDatabaseMetrics(): void {
    try {
      const dbMetrics = getPoolMetrics();
      
      this.metrics.database = {
        poolSize: dbMetrics.currentPoolSize || 0,
        activeConnections: dbMetrics.activeConnections,
        idleConnections: dbMetrics.availableConnections || 0,
        waitingRequests: dbMetrics.waitingRequests || 0,
        queryTime: {
          avg: dbMetrics.averageAcquireTime,
          slowQueries: 0, // This would need to be tracked separately
        },
      };
    } catch (error) {
      Logger.error('Failed to update database metrics:', error);
    }
  }

  /**
   * Update security metrics
   */
  private updateSecurityMetrics(): void {
    try {
      const securityMetrics = phoenixRateLimiter.getMetricsSummary();
      
      this.metrics.security = {
        blockedRequests: securityMetrics.blockedRequests,
        suspiciousActivity: securityMetrics.suspiciousRequests,
        rateLimitHits: 0, // This would be tracked in rate limiter
        uniqueIPs: securityMetrics.uniqueIPs,
      };
    } catch (error) {
      Logger.error('Failed to update security metrics:', error);
    }
  }

  /**
   * Check for performance threshold violations
   */
  private checkPerformanceAlerts(responseTime: number, statusCode: number): void {
    const now = Date.now();

    // Response time alerts
    if (responseTime > PERFORMANCE_THRESHOLDS.responseTime.critical) {
      this.createAlert('response-time-critical', 'critical', 'performance', 
        `Critical response time: ${responseTime}ms`, responseTime, 
        PERFORMANCE_THRESHOLDS.responseTime.critical);
    } else if (responseTime > PERFORMANCE_THRESHOLDS.responseTime.warning) {
      this.createAlert('response-time-warning', 'warning', 'performance',
        `Slow response time: ${responseTime}ms`, responseTime,
        PERFORMANCE_THRESHOLDS.responseTime.warning);
    }

    // Error rate alerts
    if (this.metrics.errorRate > PERFORMANCE_THRESHOLDS.errorRate.critical) {
      this.createAlert('error-rate-critical', 'critical', 'performance',
        `Critical error rate: ${this.metrics.errorRate.toFixed(2)}%`, 
        this.metrics.errorRate, PERFORMANCE_THRESHOLDS.errorRate.critical);
    } else if (this.metrics.errorRate > PERFORMANCE_THRESHOLDS.errorRate.warning) {
      this.createAlert('error-rate-warning', 'warning', 'performance',
        `High error rate: ${this.metrics.errorRate.toFixed(2)}%`,
        this.metrics.errorRate, PERFORMANCE_THRESHOLDS.errorRate.warning);
    }

    // System resource alerts
    if (this.metrics.system.memoryUsage > PERFORMANCE_THRESHOLDS.memoryUsage.critical) {
      this.createAlert('memory-critical', 'critical', 'system',
        `Critical memory usage: ${this.metrics.system.memoryUsage}%`,
        this.metrics.system.memoryUsage, PERFORMANCE_THRESHOLDS.memoryUsage.critical);
    }

    // Database connection alerts
    const dbUsagePercent = this.metrics.database.poolSize > 0 
      ? (this.metrics.database.activeConnections / this.metrics.database.poolSize) * 100 
      : 0;
    
    if (dbUsagePercent > PERFORMANCE_THRESHOLDS.dbConnections.critical) {
      this.createAlert('db-connections-critical', 'critical', 'database',
        `Critical database connection usage: ${dbUsagePercent.toFixed(1)}%`,
        dbUsagePercent, PERFORMANCE_THRESHOLDS.dbConnections.critical);
    }
  }

  /**
   * Create or update alert
   */
  private createAlert(
    id: string,
    type: 'warning' | 'critical',
    category: 'performance' | 'security' | 'database' | 'system',
    message: string,
    value: number,
    threshold: number
  ): void {
    const existingAlert = this.alerts.get(id);
    
    if (existingAlert && !existingAlert.resolved) {
      // Update existing alert
      existingAlert.value = value;
      existingAlert.timestamp = Date.now();
    } else {
      // Create new alert
      const alert: Alert = {
        id,
        type,
        category,
        message,
        value,
        threshold,
        timestamp: Date.now(),
      };
      
      this.alerts.set(id, alert);
      
      // Log alert
      Logger.warn(`Performance Alert [${type.toUpperCase()}]: ${message}`, {
        alertId: id,
        category,
        value,
        threshold,
      });
      
      // In production, send to alerting system
      if (process.env.NODE_ENV === 'production' && type === 'critical') {
        this.sendCriticalAlert(alert);
      }
    }
  }

  /**
   * Send critical alerts to external systems
   */
  private async sendCriticalAlert(alert: Alert): Promise<void> {
    try {
      // Example: Send to Slack, PagerDuty, email, etc.
      // This would be implemented based on your alerting infrastructure
      
      Logger.error(`CRITICAL ALERT: ${alert.message}`, {
        alert,
        metrics: this.getMetricsSummary(),
      });
      
      // Store alert in Redis for dashboard
      if (this.redis) {
        await this.redis.setex(
          `alert:${alert.id}`,
          3600, // 1 hour TTL
          JSON.stringify(alert)
        );
      }
    } catch (error) {
      Logger.error('Failed to send critical alert:', error);
    }
  }

  /**
   * Start monitoring loop
   */
  private startMonitoring(): void {
    // Update metrics every 30 seconds
    this.intervalId = setInterval(() => {
      this.updateSystemMetrics();
      this.updateDatabaseMetrics();
      this.updateSecurityMetrics();
      this.persistMetrics();
      this.resolveAlerts();
    }, 30000);

    Logger.info('Performance monitoring started');
  }

  /**
   * Persist metrics to Redis
   */
  private async persistMetrics(): Promise<void> {
    if (!this.redis) return;

    try {
      const metricsData = {
        ...this.metrics,
        endpoints: Array.from(this.metrics.endpoints.entries()),
      };

      await this.redis.setex(
        'current',
        300, // 5 minutes TTL
        JSON.stringify(metricsData)
      );

      // Store historical data (keep last 24 hours)
      const hourKey = `history:${Math.floor(Date.now() / (60 * 60 * 1000))}`;
      await this.redis.setex(hourKey, 86400, JSON.stringify(metricsData)); // 24 hours TTL
    } catch (error) {
      Logger.error('Failed to persist metrics:', error);
    }
  }

  /**
   * Resolve alerts that are no longer active
   */
  private resolveAlerts(): void {
    const now = Date.now();
    
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.resolved) continue;
      
      let shouldResolve = false;
      
      // Check if alert conditions are no longer met
      switch (id) {
        case 'response-time-critical':
        case 'response-time-warning':
          shouldResolve = this.metrics.responseTime.avg < alert.threshold;
          break;
        case 'error-rate-critical':
        case 'error-rate-warning':
          shouldResolve = this.metrics.errorRate < alert.threshold;
          break;
        case 'memory-critical':
          shouldResolve = this.metrics.system.memoryUsage < alert.threshold;
          break;
        // Add more alert resolution logic as needed
      }
      
      if (shouldResolve) {
        alert.resolved = true;
        alert.resolvedAt = now;
        
        Logger.info(`Alert resolved: ${alert.message}`, { alertId: id });
      }
    }
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedArray[lower];
    }
    
    return sortedArray[lower] + (sortedArray[upper] - sortedArray[lower]) * (index - lower);
  }

  /**
   * Get CPU usage (simplified)
   */
  private getCPUUsage(): number {
    // This is a simplified CPU usage calculation
    // In production, you might want to use a more sophisticated method
    const usage = process.cpuUsage();
    return Math.round(((usage.user + usage.system) / 1000000) / process.uptime() * 100);
  }

  /**
   * Get metrics summary for API
   */
  getMetricsSummary(): {
    timestamp: number;
    requestCount: number;
    avgResponseTime: number;
    errorRate: number;
    activeAlerts: number;
    system: PerformanceMetrics['system'];
    database: PerformanceMetrics['database'];
    security: PerformanceMetrics['security'];
    topEndpoints: Array<{ endpoint: string; requestCount: number; avgResponseTime: number }>;
    recentErrors: Array<{ message: string; count: number; lastOccurred: number }>;
  } {
    const topEndpoints = Array.from(this.metrics.endpoints.entries())
      .map(([endpoint, metrics]) => ({
        endpoint,
        requestCount: metrics.requestCount,
        avgResponseTime: Math.round(metrics.avgResponseTime * 100) / 100,
      }))
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 10);

    const recentErrors = this.metrics.errors
      .filter(error => Date.now() - error.lastOccurred < 3600000) // Last hour
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const activeAlerts = Array.from(this.alerts.values())
      .filter(alert => !alert.resolved).length;

    return {
      timestamp: this.metrics.timestamp,
      requestCount: this.metrics.requestCount,
      avgResponseTime: Math.round(this.metrics.responseTime.avg * 100) / 100,
      errorRate: Math.round(this.metrics.errorRate * 100) / 100,
      activeAlerts,
      system: this.metrics.system,
      database: this.metrics.database,
      security: this.metrics.security,
      topEndpoints,
      recentErrors,
    };
  }

  /**
   * Get detailed metrics
   */
  getDetailedMetrics(): PerformanceMetrics & {
    alerts: Alert[];
  } {
    return {
      ...this.metrics,
      alerts: Array.from(this.alerts.values()),
    };
  }

  /**
   * Reset metrics (for testing or scheduled resets)
   */
  reset(): void {
    this.metrics = this.initializeMetrics();
    this.requestTimes = [];
    this.alerts.clear();
    
    Logger.info('Performance metrics reset');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.redis) {
      this.redis.disconnect();
    }
    
    Logger.info('Performance monitoring stopped');
  }
}

// Singleton instance
export const phoenixMonitor = new PhoenixPerformanceMonitor();

// Performance monitoring middleware
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<Response>>(
  endpoint: string,
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = performance.now();
    let error: Error | undefined;
    let response: Response;
    
    try {
      response = await handler(...args);
    } catch (err) {
      error = err as Error;
      response = Response.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
    
    const responseTime = performance.now() - startTime;
    
    phoenixMonitor.recordRequest(
      endpoint,
      responseTime,
      response.status,
      error
    );
    
    // Add performance headers
    response.headers.set('X-Response-Time', responseTime.toFixed(2));
    response.headers.set('X-Request-ID', `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    return response;
  }) as T;
}

export default phoenixMonitor;