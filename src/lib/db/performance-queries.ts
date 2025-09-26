// Catalyst Database Performance Optimization
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { getCachedData, setCachedData, invalidateCacheByTags } from '../cache/catalyst-cache';

interface QueryOptions {
  cache?: boolean;
  cacheTTL?: number;
  tags?: string[];
  timeout?: number;
  retries?: number;
}

interface PerformanceMetrics {
  queryTime: number;
  cacheHit: boolean;
  rowCount?: number;
  queryComplexity: 'simple' | 'medium' | 'complex';
}

class DatabasePerformanceManager {
  private db: any;
  private queryMetrics: Map<string, PerformanceMetrics[]> = new Map();
  private connectionPool: any;

  constructor() {
    if (process.env.DATABASE_URL) {
      // Optimized connection configuration
      this.connectionPool = neon(process.env.DATABASE_URL);
      
      this.db = drizzle(this.connectionPool);
    }
  }

  // Enhanced query execution with caching and performance monitoring
  async executeQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    options: QueryOptions = {}
  ): Promise<{ data: T; metrics: PerformanceMetrics }> {
    const startTime = performance.now();
    const cacheKey = `query:${queryName}`;
    
    // Check cache first if enabled
    if (options.cache !== false) {
      const cachedResult = await getCachedData<{ data: T; metrics: PerformanceMetrics }>(
        cacheKey,
        { 
          ttl: options.cacheTTL || 300000, // 5 minutes default
          tags: options.tags || [queryName],
          namespace: 'db-queries'
        }
      );
      
      if (cachedResult) {
        return {
          ...cachedResult,
          metrics: {
            ...cachedResult.metrics,
            cacheHit: true
          }
        };
      }
    }

    // Execute query with retry logic
    let lastError: Error | null = null;
    const maxRetries = options.retries || 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Set query timeout
        const timeout = options.timeout || 30000; // 30 seconds default
        const queryPromise = queryFn();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout')), timeout);
        });

        const data = await Promise.race([queryPromise, timeoutPromise]);
        const queryTime = performance.now() - startTime;
        
        // Determine query complexity based on execution time
        let queryComplexity: 'simple' | 'medium' | 'complex' = 'simple';
        if (queryTime > 1000) queryComplexity = 'complex';
        else if (queryTime > 100) queryComplexity = 'medium';

        const metrics: PerformanceMetrics = {
          queryTime,
          cacheHit: false,
          rowCount: Array.isArray(data) ? data.length : undefined,
          queryComplexity
        };

        // Store metrics
        this.recordQueryMetrics(queryName, metrics);

        // Cache the result if enabled
        if (options.cache !== false && queryComplexity !== 'simple') {
          await setCachedData(
            cacheKey,
            { data, metrics },
            {
              ttl: this.getCacheTTLByComplexity(queryComplexity),
              tags: options.tags || [queryName],
              namespace: 'db-queries'
            }
          );
        }

        return { data, metrics };
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('Query failed after retries');
  }

  // Optimized user queries
  async getUserTasks(userId: string, options: QueryOptions = {}) {
    return this.executeQuery(
      `user-tasks-${userId}`,
      async () => {
        // This would be replaced with actual Drizzle query
        return this.db?.select({
          id: 'tasks.id',
          title: 'tasks.title',
          status: 'tasks.status',
          priority: 'tasks.priority',
          dueDate: 'tasks.due_date',
          categoryId: 'tasks.category_id',
          categoryName: 'categories.name',
          categoryColor: 'categories.color'
        })
        .from('tasks')
        .leftJoin('categories', 'tasks.category_id = categories.id')
        .where('tasks.user_id = $1 AND tasks.deleted_at IS NULL')
        .orderBy('tasks.priority DESC, tasks.due_date ASC')
        .limit(100);
      },
      {
        ...options,
        cache: true,
        cacheTTL: 600000, // 10 minutes
        tags: ['user-tasks', `user-${userId}`]
      }
    );
  }

  async getUserGoals(userId: string, options: QueryOptions = {}) {
    return this.executeQuery(
      `user-goals-${userId}`,
      async () => {
        return this.db?.select({
          id: 'goals.id',
          title: 'goals.title',
          description: 'goals.description',
          status: 'goals.status',
          progress: 'goals.progress',
          targetDate: 'goals.target_date',
          createdAt: 'goals.created_at',
          tasksCount: 'COUNT(tasks.id)',
          completedTasksCount: 'COUNT(CASE WHEN tasks.status = "completed" THEN 1 END)'
        })
        .from('goals')
        .leftJoin('tasks', 'goals.id = tasks.goal_id')
        .where('goals.user_id = $1 AND goals.deleted_at IS NULL')
        .groupBy('goals.id')
        .orderBy('goals.target_date ASC');
      },
      {
        ...options,
        cache: true,
        cacheTTL: 900000, // 15 minutes
        tags: ['user-goals', `user-${userId}`]
      }
    );
  }

  async getUserHabits(userId: string, options: QueryOptions = {}) {
    return this.executeQuery(
      `user-habits-${userId}`,
      async () => {
        return this.db?.select({
          id: 'habits.id',
          name: 'habits.name',
          description: 'habits.description',
          frequency: 'habits.frequency',
          targetCount: 'habits.target_count',
          currentStreak: 'habits.current_streak',
          longestStreak: 'habits.longest_streak',
          lastCompletedAt: 'habits.last_completed_at',
          todayCompleted: 'CASE WHEN DATE(habit_logs.completed_at) = CURRENT_DATE THEN true ELSE false END'
        })
        .from('habits')
        .leftJoin('habit_logs', 
          'habits.id = habit_logs.habit_id AND DATE(habit_logs.completed_at) = CURRENT_DATE'
        )
        .where('habits.user_id = $1 AND habits.archived_at IS NULL')
        .orderBy('habits.created_at DESC');
      },
      {
        ...options,
        cache: true,
        cacheTTL: 300000, // 5 minutes (more frequent updates)
        tags: ['user-habits', `user-${userId}`]
      }
    );
  }

  // Calendar optimization with date range queries
  async getCalendarEvents(userId: string, startDate: Date, endDate: Date, options: QueryOptions = {}) {
    const cacheKey = `calendar-${userId}-${startDate.toISOString()}-${endDate.toISOString()}`;
    
    return this.executeQuery(
      cacheKey,
      async () => {
        return this.db?.select({
          id: 'events.id',
          title: 'events.title',
          description: 'events.description',
          startTime: 'events.start_time',
          endTime: 'events.end_time',
          allDay: 'events.all_day',
          recurrence: 'events.recurrence',
          color: 'events.color',
          source: 'events.source',
          externalId: 'events.external_id'
        })
        .from('events')
        .where(`
          events.user_id = $1 
          AND events.start_time >= $2 
          AND events.start_time <= $3 
          AND events.deleted_at IS NULL
        `)
        .orderBy('events.start_time ASC');
      },
      {
        ...options,
        cache: true,
        cacheTTL: 1800000, // 30 minutes
        tags: ['calendar-events', `user-${userId}`, 'calendar']
      }
    );
  }

  // Analytics queries with aggregation optimization
  async getUserAnalytics(userId: string, period: 'week' | 'month' | 'year', options: QueryOptions = {}) {
    return this.executeQuery(
      `analytics-${userId}-${period}`,
      async () => {
        const periodInterval = {
          week: '7 days',
          month: '30 days', 
          year: '365 days'
        }[period];

        return this.db?.select({
          totalTasks: 'COUNT(DISTINCT tasks.id)',
          completedTasks: 'COUNT(DISTINCT CASE WHEN tasks.status = "completed" THEN tasks.id END)',
          totalGoals: 'COUNT(DISTINCT goals.id)',
          completedGoals: 'COUNT(DISTINCT CASE WHEN goals.status = "completed" THEN goals.id END)',
          habitCompletions: 'COUNT(DISTINCT habit_logs.id)',
          productivity: `
            ROUND(
              (COUNT(DISTINCT CASE WHEN tasks.status = "completed" THEN tasks.id END)::float / 
               NULLIF(COUNT(DISTINCT tasks.id), 0)) * 100, 2
            )
          `,
          dailyAverage: `
            ROUND(
              COUNT(DISTINCT CASE WHEN tasks.status = "completed" THEN tasks.id END)::float / 
              EXTRACT(days FROM INTERVAL '${periodInterval}'), 2
            )
          `
        })
        .from('tasks')
        .leftJoin('goals', 'tasks.goal_id = goals.id')
        .leftJoin('habit_logs', 'habit_logs.user_id = tasks.user_id')
        .where(`
          tasks.user_id = $1 
          AND tasks.created_at >= NOW() - INTERVAL '${periodInterval}'
          AND tasks.deleted_at IS NULL
        `)
        .groupBy('tasks.user_id');
      },
      {
        ...options,
        cache: true,
        cacheTTL: 3600000, // 1 hour
        tags: ['user-analytics', `user-${userId}`, 'analytics']
      }
    );
  }

  // Cache invalidation helpers
  async invalidateUserCache(userId: string) {
    await invalidateCacheByTags([`user-${userId}`], 'db-queries');
  }

  async invalidateGlobalCache(tags: string[]) {
    await invalidateCacheByTags(tags, 'db-queries');
  }

  // Performance monitoring
  private recordQueryMetrics(queryName: string, metrics: PerformanceMetrics) {
    if (!this.queryMetrics.has(queryName)) {
      this.queryMetrics.set(queryName, []);
    }
    
    const queryHistory = this.queryMetrics.get(queryName)!;
    queryHistory.push(metrics);
    
    // Keep only last 100 metrics per query
    if (queryHistory.length > 100) {
      queryHistory.shift();
    }
  }

  private getCacheTTLByComplexity(complexity: 'simple' | 'medium' | 'complex'): number {
    switch (complexity) {
      case 'simple': return 300000;   // 5 minutes
      case 'medium': return 900000;   // 15 minutes
      case 'complex': return 1800000; // 30 minutes
      default: return 300000;
    }
  }

  getPerformanceReport(): Record<string, {
    avgTime: number;
    totalQueries: number;
    cacheHitRate: number;
    complexityDistribution: Record<string, number>;
  }> {
    const report: any = {};
    
    Array.from(this.queryMetrics.entries()).forEach(([queryName, metrics]) => {
      const totalQueries = metrics.length;
      const avgTime = metrics.reduce((sum, m) => sum + m.queryTime, 0) / totalQueries;
      const cacheHits = metrics.filter(m => m.cacheHit).length;
      const cacheHitRate = (cacheHits / totalQueries) * 100;
      
      const complexityCount = metrics.reduce((acc, m) => {
        acc[m.queryComplexity] = (acc[m.queryComplexity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      report[queryName] = {
        avgTime: Math.round(avgTime * 100) / 100,
        totalQueries,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        complexityDistribution: complexityCount
      };
    });
    
    return report;
  }
}

// Singleton instance
export const dbPerformance = new DatabasePerformanceManager();

// Performance monitoring decorator
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  queryName: string,
  fn: T,
  options: QueryOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    return dbPerformance.executeQuery(queryName, () => fn(...args), options);
  }) as T;
}