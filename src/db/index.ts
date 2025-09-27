import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';
import Logger, { AppError } from '../lib/logger';

// Phoenix Enterprise Database Configuration
const PHOENIX_DB_CONFIG = {
  // Connection pool optimization based on CPU cores and expected load
  maxConnections: parseInt(process.env.DB_POOL_MAX || '50', 10),
  minConnections: parseInt(process.env.DB_POOL_MIN || '10', 10),
  
  // Timeout configurations for high-performance scenarios
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  maxLifetimeMillis: parseInt(process.env.DB_MAX_LIFETIME || '1800000', 10), // 30 minutes
  
  // Query performance settings
  statementTimeoutMillis: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000', 10),
  queryTimeoutMillis: parseInt(process.env.DB_QUERY_TIMEOUT || '15000', 10),
  
  // Retry and reliability settings
  maxRetries: parseInt(process.env.DB_MAX_RETRIES || '3', 10),
  retryDelayMs: parseInt(process.env.DB_RETRY_DELAY || '1000', 10),
  
  // SSL and security
  ssl: process.env.NODE_ENV === 'production',
  sslMode: process.env.DB_SSL_MODE || 'require',
} as const;

// Connection pool metrics
interface PoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingConnections: number;
  acquiredConnections: number;
  createdConnections: number;
  destroyedConnections: number;
  timeouts: number;
  errors: number;
  averageAcquireTime: number;
  peakConnections: number;
}

let pool: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;
let poolMetrics: PoolMetrics = {
  totalConnections: 0,
  activeConnections: 0,
  idleConnections: 0,
  waitingConnections: 0,
  acquiredConnections: 0,
  createdConnections: 0,
  destroyedConnections: 0,
  timeouts: 0,
  errors: 0,
  averageAcquireTime: 0,
  peakConnections: 0,
};

// Phoenix Enterprise Database Connection Factory
function createDatabase() {
  // Validate required environment variables
  if (!process.env.DATABASE_URL) {
    const errorMsg = 'DATABASE_URL is required. Please configure your database connection.';
    Logger.error(errorMsg);
    throw new AppError(errorMsg, 500);
  }

  try {
    // Create singleton pool with Phoenix optimization
    if (!pool) {
      const poolConfig = {
        connectionString: process.env.DATABASE_URL,
        max: PHOENIX_DB_CONFIG.maxConnections,
        min: PHOENIX_DB_CONFIG.minConnections,
        idleTimeoutMillis: PHOENIX_DB_CONFIG.idleTimeoutMillis,
        connectionTimeoutMillis: PHOENIX_DB_CONFIG.connectionTimeoutMillis,
        ssl: PHOENIX_DB_CONFIG.ssl,
        
        // Advanced connection pool settings
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 10000,
        destroyTimeoutMillis: 5000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
        
        // Statement cache for better performance
        application_name: 'astral_planner_phoenix',
        
        // Connection validation
        validate: (client: any) => {
          return !client.destroyed && client.readyState === 'ready';
        },
      };

      pool = new Pool(poolConfig);
      
      // Enhanced pool event monitoring
      pool.on('error', (err) => {
        poolMetrics.errors++;
        Logger.error('Database pool error:', {
          error: err.message,
          stack: err.stack,
          totalErrors: poolMetrics.errors,
          activeConnections: poolMetrics.activeConnections,
        });
      });

      pool.on('connect', (client) => {
        poolMetrics.createdConnections++;
        poolMetrics.totalConnections++;
        poolMetrics.activeConnections++;
        
        if (poolMetrics.activeConnections > poolMetrics.peakConnections) {
          poolMetrics.peakConnections = poolMetrics.activeConnections;
        }
        
        Logger.debug('Database client connected', {
          totalConnections: poolMetrics.totalConnections,
          activeConnections: poolMetrics.activeConnections,
          peakConnections: poolMetrics.peakConnections,
        });
      });

      pool.on('acquire', () => {
        poolMetrics.acquiredConnections++;
      });

      pool.on('remove', () => {
        poolMetrics.destroyedConnections++;
        poolMetrics.activeConnections = Math.max(0, poolMetrics.activeConnections - 1);
        
        Logger.debug('Database client removed from pool', {
          activeConnections: poolMetrics.activeConnections,
          destroyedConnections: poolMetrics.destroyedConnections,
        });
      });

      // Pool statistics logging
      setInterval(() => {
        if (pool) {
          Logger.debug('Database pool statistics', {
            size: pool.totalCount || 0,
            available: pool.idleCount || 0,
            borrowed: (pool.totalCount || 0) - (pool.idleCount || 0),
            pending: pool.waitingCount || 0,
            metrics: poolMetrics,
          });
        }
      }, 300000); // Log every 5 minutes
    }

    // Initialize Drizzle with enhanced configuration
    if (!dbInstance) {
      dbInstance = drizzle(pool, { 
        schema,
        logger: process.env.NODE_ENV === 'development' || process.env.DB_LOGGING === 'true',
      });
      
      // Add query performance monitoring wrapper
      const originalQuery = (dbInstance as any).query;
      (dbInstance as any).query = function(...args: any[]) {
        const startTime = performance.now();
        const queryPromise = originalQuery.apply(this, args);
        
        queryPromise
          .then(() => {
            const duration = performance.now() - startTime;
            if (duration > 100) { // Log slow queries
              Logger.warn('Slow query detected', {
                duration: duration.toFixed(2),
                query: args[0]?.toString?.().slice(0, 200),
              });
            }
          })
          .catch((error: Error) => {
            const duration = performance.now() - startTime;
            Logger.error('Query error', {
              duration: duration.toFixed(2),
              error: error.message,
              query: args[0]?.toString?.().slice(0, 200),
            });
          });
        
        return queryPromise;
      };
    }

    return dbInstance;
  } catch (error) {
    Logger.error('Failed to create database connection:', error);
    throw new AppError('Database connection failed', 500);
  }
}

// Removed mock database - production requires real database connection

// Export the database instance - moved below to override with schema access

// Database health check removed (duplicate function - keeping enhanced version below)

// Graceful shutdown function removed (duplicate - keeping enhanced version below)

export * from './schema';
export type DB = typeof dbInstance;

// Import and re-export all schema tables for query access
import * as schemaModule from './schema';

// Create database instance with proper schema access
const createDatabaseWithSchema = () => {
  const dbInstance = createDatabase();
  
  // Add query property with all schema tables
  (dbInstance as any).query = {
    users: {
      findFirst: (options: any) => dbInstance.select().from(schemaModule.users).where(options.where).limit(1).then(r => r[0] || null),
      findMany: (options: any) => dbInstance.select().from(schemaModule.users).where(options?.where || undefined),
    },
    goals: {
      findFirst: (options: any) => dbInstance.select().from(schemaModule.goals).where(options.where).limit(1).then(r => r[0] || null),
      findMany: (options: any) => dbInstance.select().from(schemaModule.goals).where(options?.where || undefined),
    },
    habits: {
      findFirst: (options: any) => dbInstance.select().from(schemaModule.habits).where(options.where).limit(1).then(r => r[0] || null),
      findMany: (options: any) => dbInstance.select().from(schemaModule.habits).where(options?.where || undefined),
    },
    habitEntries: {
      findFirst: (options: any) => dbInstance.select().from(schemaModule.habitEntries).where(options.where).limit(1).then(r => r[0] || null),
      findMany: (options: any) => dbInstance.select().from(schemaModule.habitEntries).where(options?.where || undefined),
    },
    blocks: {
      findFirst: (options: any) => dbInstance.select().from(schemaModule.blocks).where(options.where).limit(1).then(r => r[0] || null),
      findMany: (options: any) => dbInstance.select().from(schemaModule.blocks).where(options?.where || undefined),
    },
    templates: {
      findFirst: (options: any) => dbInstance.select().from(schemaModule.templates).where(options.where).limit(1).then(r => r[0] || null),
      findMany: (options: any) => dbInstance.select().from(schemaModule.templates).where(options?.where || undefined),
    },
    templateFavorites: {
      findFirst: (options: any) => dbInstance.select().from(schemaModule.templateFavorites).where(options.where).limit(1).then(r => r[0] || null),
      findMany: (options: any) => dbInstance.select().from(schemaModule.templateFavorites).where(options?.where || undefined),
    },
    templateUsage: {
      findFirst: (options: any) => dbInstance.select().from(schemaModule.templateUsage).where(options.where).limit(1).then(r => r[0] || null),
      findMany: (options: any) => dbInstance.select().from(schemaModule.templateUsage).where(options?.where || undefined),
    },
    workspaces: {
      findFirst: (options: any) => dbInstance.select().from(schemaModule.workspaces).where(options.where).limit(1).then(r => r[0] || null),
      findMany: (options: any) => dbInstance.select().from(schemaModule.workspaces).where(options?.where || undefined),
    },
    workspaceMembers: {
      findFirst: (options: any) => dbInstance.select().from(schemaModule.workspaceMembers).where(options.where).limit(1).then(r => r[0] || null),
      findMany: (options: any) => dbInstance.select().from(schemaModule.workspaceMembers).where(options?.where || undefined),
    },
    blockActivity: {
      findFirst: (options: any) => dbInstance.select().from(schemaModule.blockActivity).where(options.where).limit(1).then(r => r[0] || null),
      findMany: (options: any) => dbInstance.select().from(schemaModule.blockActivity).where(options?.where || undefined),
    },
    integrations: {
      findFirst: (options: any) => dbInstance.select().from(schemaModule.integrations).where(options.where).limit(1).then(r => r[0] || null),
      findMany: (options: any) => dbInstance.select().from(schemaModule.integrations).where(options?.where || undefined),
    },
    events: {
      findFirst: (options: any) => dbInstance.select().from(schemaModule.events).where(options.where).limit(1).then(r => r[0] || null),
      findMany: (options: any) => dbInstance.select().from(schemaModule.events).where(options?.where || undefined),
    },
    userAnalytics: {
      findFirst: (options: any) => dbInstance.select().from(schemaModule.userAnalytics).where(options.where).limit(1).then(r => r[0] || null),
      findMany: (options: any) => dbInstance.select().from(schemaModule.userAnalytics).where(options?.where || undefined),
    },
  };
  
  return dbInstance;
};

// Export pool metrics for monitoring
export function getPoolMetrics(): PoolMetrics & { 
  currentPoolSize?: number;
  availableConnections?: number;
  waitingRequests?: number;
} {
  return {
    ...poolMetrics,
    currentPoolSize: pool?.totalCount || 0,
    availableConnections: pool?.idleCount || 0,
    waitingRequests: pool?.waitingCount || 0,
  };
}

// Advanced query execution with retry logic and monitoring
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = PHOENIX_DB_CONFIG.maxRetries,
  context: string = 'unknown'
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const startTime = performance.now();
      const result = await operation();
      const duration = performance.now() - startTime;
      
      // Log successful operations that took longer than expected
      if (duration > 1000) {
        Logger.warn('Slow database operation completed', {
          context,
          duration: duration.toFixed(2),
          attempt,
          success: true,
        });
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      Logger.warn('Database operation failed, retrying', {
        context,
        attempt,
        maxRetries,
        error: lastError.message,
        willRetry: attempt < maxRetries,
      });
      
      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const delay = PHOENIX_DB_CONFIG.retryDelayMs * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.1 * delay;
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
  }
  
  throw new AppError(
    `Database operation failed after ${maxRetries} attempts: ${lastError?.message}`,
    500
  );
}

// Connection pool warming for better performance
export async function warmPool(): Promise<void> {
  if (!pool) {
    Logger.warn('Cannot warm pool - pool not initialized');
    return;
  }
  
  try {
    Logger.info('Warming database connection pool...');
    
    // Create minimum connections by performing simple queries
    const warmupPromises = [];
    for (let i = 0; i < PHOENIX_DB_CONFIG.minConnections; i++) {
      warmupPromises.push(
        pool.query('SELECT 1 as warmup').catch(err => 
          Logger.warn('Pool warmup query failed:', err)
        )
      );
    }
    
    await Promise.allSettled(warmupPromises);
    Logger.info('Database pool warmed successfully', {
      targetConnections: PHOENIX_DB_CONFIG.minConnections,
      currentConnections: pool.totalCount || 0,
    });
  } catch (error) {
    Logger.error('Failed to warm database pool:', error);
  }
}

// Health check with comprehensive diagnostics
export async function healthCheck(): Promise<{
  ok: boolean;
  timestamp?: string;
  responseTime?: number;
  poolSize?: number;
  error?: string;
  mock: boolean;
  diagnostics?: {
    poolMetrics: PoolMetrics;
    connectionTest: boolean;
    queryTest: boolean;
    version?: string;
  };
}> {
  const startTime = Date.now();
  
  try {
    if (!process.env.DATABASE_URL) {
      return { 
        ok: false, 
        error: 'DATABASE_URL not configured', 
        mock: false,
        responseTime: Date.now() - startTime
      };
    }
    
    // Use existing pool if available, otherwise create temporary connection
    let testPool = pool;
    let shouldCleanup = false;
    
    if (!testPool) {
      testPool = new Pool({ 
        connectionString: process.env.DATABASE_URL,
        max: 1,
        ssl: PHOENIX_DB_CONFIG.ssl,
      });
      shouldCleanup = true;
    }
    
    // Test basic connectivity
    const connectionTest = await testPool.query('SELECT 1 as test')
      .then(() => true)
      .catch(() => false);
    
    // Test query execution
    const queryResult = await testPool.query('SELECT NOW() as timestamp, version() as version');
    const queryTest = queryResult.rows.length > 0;
    
    if (shouldCleanup) {
      await testPool.end();
    }
    
    return { 
      ok: connectionTest && queryTest,
      timestamp: queryResult.rows[0]?.timestamp,
      responseTime: Date.now() - startTime,
      poolSize: pool?.totalCount || 0,
      mock: false,
      diagnostics: {
        poolMetrics: getPoolMetrics(),
        connectionTest,
        queryTest,
        version: queryResult.rows[0]?.version,
      }
    };
  } catch (error) {
    Logger.error('Database health check failed:', error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
      mock: false,
      diagnostics: {
        poolMetrics: getPoolMetrics(),
        connectionTest: false,
        queryTest: false,
      }
    };
  }
}

// Enhanced graceful shutdown
export async function closeDatabase(): Promise<void> {
  try {
    if (pool) {
      Logger.info('Closing database pool...', {
        finalMetrics: getPoolMetrics(),
      });
      
      // Give active connections time to finish
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      await pool.end();
      pool = null;
      dbInstance = null;
      
      // Reset metrics
      Object.assign(poolMetrics, {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingConnections: 0,
        acquiredConnections: 0,
        createdConnections: 0,
        destroyedConnections: 0,
        timeouts: 0,
        errors: 0,
        averageAcquireTime: 0,
        peakConnections: 0,
      });
      
      Logger.info('Database pool closed successfully');
    }
  } catch (error) {
    Logger.error('Error closing database pool:', error);
    throw error;
  }
}

// Override the main database export with schema access
export const db = createDatabaseWithSchema();