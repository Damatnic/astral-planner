import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';
import Logger, { AppError } from '../lib/logger';

// Connection pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production',
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  min: parseInt(process.env.DB_POOL_MIN || '5', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
};

let pool: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

// Create database connection with proper pooling
function createDatabase() {
  // Validate required environment variables
  if (!process.env.DATABASE_URL) {
    const errorMsg = 'DATABASE_URL is required. Please configure your database connection.';
    Logger.error(errorMsg);
    throw new AppError(errorMsg, 500);
  }

  try {
    // Create singleton pool
    if (!pool) {
      pool = new Pool(poolConfig);
      
      // Handle pool errors
      pool.on('error', (err) => {
        Logger.error('Database pool error:', err);
      });

      // Handle pool connection events
      pool.on('connect', () => {
        Logger.info('New database client connected');
      });

      pool.on('remove', () => {
        Logger.info('Database client removed from pool');
      });
    }

    // Initialize Drizzle with schema
    if (!dbInstance) {
      dbInstance = drizzle(pool, { 
        schema,
        logger: process.env.NODE_ENV === 'development'
      });
    }

    return dbInstance;
  } catch (error) {
    Logger.error('Failed to create database connection:', error);
    throw new AppError('Database connection failed', 500);
  }
}

// Removed mock database - production requires real database connection

// Export the database instance - moved below to override with schema access

// Database health check with comprehensive metrics
export async function healthCheck(): Promise<{
  ok: boolean;
  timestamp?: string;
  responseTime?: number;
  poolSize?: number;
  error?: string;
  mock: boolean;
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
    if (pool) {
      const result = await pool.query('SELECT NOW() as timestamp, version() as version');
      return { 
        ok: true, 
        timestamp: result.rows[0].timestamp,
        responseTime: Date.now() - startTime,
        poolSize: pool.totalCount || 0,
        mock: false 
      };
    } else {
      const tempPool = new Pool({ connectionString: process.env.DATABASE_URL });
      const result = await tempPool.query('SELECT NOW() as timestamp, version() as version');
      await tempPool.end();
      
      return { 
        ok: true, 
        timestamp: result.rows[0].timestamp,
        responseTime: Date.now() - startTime,
        mock: false 
      };
    }
  } catch (error) {
    Logger.error('Database health check failed:', error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
      mock: false 
    };
  }
}

// Graceful shutdown function
export async function closeDatabase(): Promise<void> {
  try {
    if (pool) {
      Logger.info('Closing database pool...');
      await pool.end();
      pool = null;
      dbInstance = null;
      Logger.info('Database pool closed successfully');
    }
  } catch (error) {
    Logger.error('Error closing database pool:', error);
    throw error;
  }
}

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

// Override the main database export with schema access
export const db = createDatabaseWithSchema();