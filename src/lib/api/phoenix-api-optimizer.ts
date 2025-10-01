/**
 * PHOENIX ULTIMATE API OPTIMIZATION SYSTEM v2.0
 * High-performance API layer with intelligent caching, request optimization,
 * and real-time performance monitoring
 * Target: <10ms API response time, >15,000 RPS throughput
 */

import { NextRequest, NextResponse } from 'next/server';
import { phoenixCache } from '../cache/phoenix-cache-system';
import Logger from '../logger';
import { db } from '@/db';
import { eq, and, or, desc, asc, sql, inArray } from 'drizzle-orm';
import { blocks, users, workspaces, events } from '@/db/schema';

// ============================================================================
// PHOENIX API PERFORMANCE MONITORING
// ============================================================================

interface ApiMetrics {
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
  throughput: number; // requests per second
  cacheHitRatio: number;
  slowQueries: number;
  endpoints: Map<string, EndpointMetrics>;
}

interface EndpointMetrics {
  path: string;
  method: string;
  requestCount: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorCount: number;
  lastAccessed: Date;
  responseTimes: number[];
}

class PhoenixApiMonitor {
  private metrics: ApiMetrics;
  private endpointMetrics: Map<string, EndpointMetrics>;
  private requestTimings: Array<{ timestamp: number; responseTime: number }>;

  constructor() {
    this.metrics = {
      totalRequests: 0,
      avgResponseTime: 0,
      errorRate: 0,
      throughput: 0,
      cacheHitRatio: 0,
      slowQueries: 0,
      endpoints: new Map(),
    };
    this.endpointMetrics = new Map();
    this.requestTimings = [];
  }

  trackRequest(path: string, method: string, responseTime: number, success: boolean) {
    const endpointKey = `${method} ${path}`;
    
    // Update global metrics
    this.metrics.totalRequests++;
    this.requestTimings.push({ timestamp: Date.now(), responseTime });
    
    // Clean old timings (keep last 1000)
    if (this.requestTimings.length > 1000) {
      this.requestTimings = this.requestTimings.slice(-1000);
    }
    
    // Update endpoint metrics
    let endpointMetric = this.endpointMetrics.get(endpointKey);
    if (!endpointMetric) {
      endpointMetric = {
        path,
        method,
        requestCount: 0,
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorCount: 0,
        lastAccessed: new Date(),
        responseTimes: [],
      };
      this.endpointMetrics.set(endpointKey, endpointMetric);
    }
    
    endpointMetric.requestCount++;
    endpointMetric.lastAccessed = new Date();
    endpointMetric.responseTimes.push(responseTime);
    
    // Keep only last 100 response times for percentile calculation
    if (endpointMetric.responseTimes.length > 100) {
      endpointMetric.responseTimes = endpointMetric.responseTimes.slice(-100);
    }
    
    if (!success) {
      endpointMetric.errorCount++;
    }
    
    // Calculate percentiles
    const sortedTimes = [...endpointMetric.responseTimes].sort((a, b) => a - b);
    endpointMetric.p95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
    endpointMetric.p99ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
    endpointMetric.avgResponseTime = sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length;
    
    // Track slow queries
    if (responseTime > 100) {
      this.metrics.slowQueries++;
    }
    
    // Update global averages
    this.updateGlobalMetrics();
  }

  private updateGlobalMetrics() {
    const recentTimings = this.requestTimings.filter(t => Date.now() - t.timestamp < 60000); // Last minute
    
    if (recentTimings.length > 0) {
      this.metrics.avgResponseTime = recentTimings.reduce((sum, t) => sum + t.responseTime, 0) / recentTimings.length;
      this.metrics.throughput = recentTimings.length; // Requests per minute, can be converted to RPS
    }
    
    const totalErrors = Array.from(this.endpointMetrics.values()).reduce((sum, e) => sum + e.errorCount, 0);
    this.metrics.errorRate = this.metrics.totalRequests > 0 ? (totalErrors / this.metrics.totalRequests) * 100 : 0;
    
    this.metrics.endpoints = this.endpointMetrics;
  }

  getMetrics(): ApiMetrics {
    this.updateGlobalMetrics();
    return { ...this.metrics };
  }

  getSlowEndpoints(threshold = 50): EndpointMetrics[] {
    return Array.from(this.endpointMetrics.values())
      .filter(e => e.avgResponseTime > threshold)
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime);
  }
}

const apiMonitor = new PhoenixApiMonitor();

// ============================================================================
// PHOENIX REQUEST OPTIMIZATION MIDDLEWARE
// ============================================================================

interface RequestContext {
  startTime: number;
  path: string;
  method: string;
  userId?: string;
  cacheKey?: string;
  skipCache?: boolean;
}

export function withPhoenixOptimization(handler: (req: NextRequest, context: RequestContext) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const context: RequestContext = {
      startTime,
      path: new URL(req.url).pathname,
      method: req.method,
    };

    try {
      // Extract user ID from request if available
      context.userId = await extractUserIdFromRequest(req);
      
      // Generate cache key for GET requests
      if (req.method === 'GET') {
        context.cacheKey = generateCacheKey(req, context.userId);
        
        // Try to serve from cache
        const cachedResponse = await phoenixCache.get(context.cacheKey);
        if (cachedResponse && !req.headers.get('Cache-Control')?.includes('no-cache')) {
          const responseTime = Date.now() - startTime;
          apiMonitor.trackRequest(context.path, context.method, responseTime, true);
          
          return new NextResponse(JSON.stringify(cachedResponse), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Cache': 'HIT',
              'X-Response-Time': `${responseTime}ms`,
            },
          });
        }
      }

      // Execute the handler
      const response = await handler(req, context);
      const responseTime = Date.now() - startTime;
      
      // Cache successful GET responses
      if (req.method === 'GET' && response.status === 200 && context.cacheKey && !context.skipCache) {
        const responseData = await response.clone().json();
        const ttl = determineCacheTTL(context.path, responseData);
        await phoenixCache.set(context.cacheKey, responseData, ttl);
      }

      // Add performance headers
      response.headers.set('X-Response-Time', `${responseTime}ms`);
      response.headers.set('X-Cache', 'MISS');
      
      // Track metrics
      apiMonitor.trackRequest(context.path, context.method, responseTime, response.status < 400);
      
      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      apiMonitor.trackRequest(context.path, context.method, responseTime, false);
      
      Logger.error('Phoenix API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { 
          status: 500,
          headers: {
            'X-Response-Time': `${responseTime}ms`,
            'X-Cache': 'ERROR',
          },
        }
      );
    }
  };
}

// ============================================================================
// PHOENIX OPTIMIZED QUERY BUILDERS
// ============================================================================

export class PhoenixQueryBuilder {
  static async getUserDashboardData(userId: string, context: RequestContext) {
    const cacheKey = `dashboard:${userId}`;
    
    // Try cache first
    const cached = await phoenixCache.get(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();
    
    try {
      // Use materialized view if available, otherwise fallback to optimized queries
      const dashboardData = await db.execute(sql`
        SELECT * FROM phoenix_get_user_dashboard_data(${userId})
      `);
      
      const queryTime = Date.now() - startTime;
      Logger.info(`Dashboard query completed in ${queryTime}ms for user ${userId}`);
      
      if (dashboardData.rows.length > 0) {
        const result = dashboardData.rows[0];
        await phoenixCache.set(cacheKey, result, 300000); // 5 minutes cache
        return result;
      }
      
      return null;
    } catch (error) {
      Logger.error('Dashboard query error:', error);
      
      // Fallback to basic queries if materialized view fails
      return await this.getUserDashboardDataFallback(userId);
    }
  }

  static async getUserDashboardDataFallback(userId: string) {
    const [user, userWorkspaces] = await Promise.all([
      db.select().from(users).where(eq(users.id, userId)).limit(1),
      db.select().from(workspaces).where(eq(workspaces.ownerId, userId)),
    ]) as [any[], any[]];

    if (user.length === 0) return null;

    const workspaceIds = userWorkspaces.map((w: any) => w.id);
    if (workspaceIds.length === 0) return { user: user[0], tasks: [], events: [] };

    const [tasks, todayEvents] = await Promise.all([
      db.select({
        id: blocks.id,
        title: blocks.title,
        status: blocks.status,
        priority: blocks.priority,
        dueDate: blocks.dueDate,
        type: blocks.type,
      })
      .from(blocks)
      .where(
        and(
          inArray(blocks.workspaceId, workspaceIds),
          eq(blocks.isDeleted, false),
          eq(blocks.type, 'task')
        )
      )
      .orderBy(desc(blocks.updatedAt))
      .limit(50),
      
      db.select({
        id: events.id,
        title: events.title,
        startTime: events.startTime,
        endTime: events.endTime,
        type: events.type,
      })
      .from(events)
      .where(
        and(
          eq(events.userId, userId),
          sql`DATE(${events.startTime}) = CURRENT_DATE`,
          sql`${events.deletedAt} IS NULL`
        )
      )
      .orderBy(asc(events.startTime)),
    ]);

    return {
      user: user[0],
      tasks,
      events: todayEvents,
      summary: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t: any) => t.status === 'completed').length,
        todayEvents: todayEvents.length,
      },
    };
  }

  static async searchTasks(userId: string, query: string, options: {
    workspaceId?: string;
    limit?: number;
    type?: string;
  } = {}) {
    const cacheKey = `search:${userId}:${Buffer.from(query + JSON.stringify(options)).toString('base64')}`;
    
    // Try cache first
    const cached = await phoenixCache.get(cacheKey);
    if (cached) return cached;

    try {
      // Use optimized search function
      const results = await db.execute(sql`
        SELECT * FROM phoenix_search_tasks(
          ${userId}, 
          ${query}, 
          ${options.workspaceId || null}, 
          ${options.limit || 20}
        )
      `);
      
      const searchResults = results.rows;
      await phoenixCache.set(cacheKey, searchResults, 180000); // 3 minutes cache
      
      return searchResults;
    } catch (error) {
      Logger.error('Search error:', error);
      return [];
    }
  }

  static async getTasksByWorkspace(
    userId: string, 
    workspaceId: string, 
    options: {
      status?: string;
      type?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const cacheKey = `tasks:${userId}:${workspaceId}:${JSON.stringify(options)}`;
    
    // Try cache first
    const cached = await phoenixCache.get(cacheKey);
    if (cached) return cached;

    // Verify user has access to workspace
    const workspace = await db.select({ id: workspaces.id })
      .from(workspaces)
      .where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, userId)))
      .limit(1);

    if (workspace.length === 0) {
      throw new Error('Workspace not found or access denied');
    }

    // Build conditions
    const conditions = [
      eq(blocks.workspaceId, workspaceId),
      eq(blocks.isDeleted, false),
    ];

    if (options.status) {
      conditions.push(eq(blocks.status, options.status));
    }

    if (options.type) {
      conditions.push(eq(blocks.type, options.type));
    }

    const tasks = await db.select({
      id: blocks.id,
      title: blocks.title,
      description: blocks.description,
      status: blocks.status,
      priority: blocks.priority,
      dueDate: blocks.dueDate,
      type: blocks.type,
      tags: blocks.tags,
      progress: blocks.progress,
      createdAt: blocks.createdAt,
      updatedAt: blocks.updatedAt,
    })
    .from(blocks)
    .where(and(...conditions))
    .orderBy(desc(blocks.updatedAt))
    .limit(options.limit || 50)
    .offset(options.offset || 0);

    // Cache for 2 minutes
    await phoenixCache.set(cacheKey, tasks, 120000);
    
    return tasks;
  }

  static async getCalendarEvents(
    userId: string,
    startDate: Date,
    endDate: Date,
    calendarId?: string
  ) {
    const cacheKey = `calendar:${userId}:${startDate.toISOString()}:${endDate.toISOString()}:${calendarId || 'all'}`;
    
    // Try cache first
    const cached = await phoenixCache.get(cacheKey);
    if (cached) return cached;

    const conditions = [
      eq(events.userId, userId),
      sql`${events.startTime} BETWEEN ${startDate} AND ${endDate}`,
      sql`${events.deletedAt} IS NULL`,
    ];

    if (calendarId) {
      conditions.push(eq(events.calendarId, calendarId));
    }

    const calendarEvents = await db.select({
      id: events.id,
      title: events.title,
      description: events.description,
      startTime: events.startTime,
      endTime: events.endTime,
      isAllDay: events.isAllDay,
      type: events.type,
      status: events.status,
      calendarId: events.calendarId,
      color: events.color,
      attendees: events.attendees,
    })
    .from(events)
    .where(and(...conditions))
    .orderBy(asc(events.startTime));

    // Cache for 5 minutes
    await phoenixCache.set(cacheKey, calendarEvents, 300000);
    
    return calendarEvents;
  }
}

// ============================================================================
// PHOENIX UTILITY FUNCTIONS
// ============================================================================

async function extractUserIdFromRequest(req: NextRequest): Promise<string | undefined> {
  try {
    // This would integrate with your auth system
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return undefined;
    
    // Extract user ID from JWT or session
    // Implementation depends on your auth system
    return undefined;
  } catch (error) {
    return undefined;
  }
}

function generateCacheKey(req: NextRequest, userId?: string): string {
  const url = new URL(req.url);
  const path = url.pathname;
  const searchParams = url.searchParams.toString();
  
  const keyParts = [path];
  if (userId) keyParts.push(`user:${userId}`);
  if (searchParams) keyParts.push(`params:${searchParams}`);
  
  return keyParts.join(':');
}

function determineCacheTTL(path: string, data: any): number {
  // Dynamic TTL based on endpoint and data characteristics
  if (path.includes('/dashboard')) return 300000; // 5 minutes
  if (path.includes('/tasks')) return 120000; // 2 minutes
  if (path.includes('/calendar')) return 300000; // 5 minutes
  if (path.includes('/search')) return 180000; // 3 minutes
  if (path.includes('/analytics')) return 600000; // 10 minutes
  
  return 300000; // Default 5 minutes
}

// ============================================================================
// PHOENIX API MONITORING ENDPOINTS
// ============================================================================

export async function getApiMetrics(): Promise<ApiMetrics> {
  return apiMonitor.getMetrics();
}

export async function getSlowEndpoints(threshold = 50): Promise<EndpointMetrics[]> {
  return apiMonitor.getSlowEndpoints(threshold);
}

export async function getSystemHealth() {
  const [cacheHealth, dbHealth] = await Promise.all([
    phoenixCache.healthCheck(),
    checkDatabaseHealth(),
  ]);

  const apiMetrics = apiMonitor.getMetrics();
  
  return {
    status: cacheHealth.healthy && dbHealth.healthy ? 'healthy' : 'degraded',
    cache: cacheHealth,
    database: dbHealth,
    api: {
      avgResponseTime: apiMetrics.avgResponseTime,
      errorRate: apiMetrics.errorRate,
      throughput: apiMetrics.throughput,
      slowQueries: apiMetrics.slowQueries,
    },
    timestamp: new Date().toISOString(),
  };
}

async function checkDatabaseHealth() {
  try {
    const startTime = Date.now();
    await db.execute(sql`SELECT 1`);
    const responseTime = Date.now() - startTime;
    
    return {
      healthy: responseTime < 100,
      responseTime,
      details: responseTime < 100 ? 'OK' : 'Slow response',
    };
  } catch (error) {
    return {
      healthy: false,
      responseTime: 0,
      details: `Database error: ${error}`,
    };
  }
}

// ============================================================================
// PHOENIX EXPORTS
// ============================================================================

export {
  apiMonitor,
};

export default withPhoenixOptimization;