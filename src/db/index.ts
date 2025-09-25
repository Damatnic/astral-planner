import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';

// Create database connection based on environment
function createDatabase() {
  // Validate required environment variables
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL is required in production. Please check your environment variables.');
    } else {
      console.warn('⚠️ DATABASE_URL not found. Using mock database for development.');
      // Return enhanced mock for development without proper env setup
      const mockData = {
        goals: [] as any[],
        habits: [] as any[],
        templates: [] as any[],
        users: [] as any[],
        workspaces: [] as any[]
      };
      
      return {
        query: {
          goals: {
            findMany: () => Promise.resolve(mockData.goals),
            findFirst: () => Promise.resolve(null)
          },
          habits: {
            findMany: () => Promise.resolve(mockData.habits),
            findFirst: () => Promise.resolve(null)
          },
          templates: {
            findMany: () => Promise.resolve(mockData.templates),
            findFirst: () => Promise.resolve(null)
          },
          users: {
            findMany: () => Promise.resolve(mockData.users),
            findFirst: () => Promise.resolve(null)
          },
          workspaces: {
            findMany: () => Promise.resolve(mockData.workspaces),
            findFirst: () => Promise.resolve(null)
          }
        },
        select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
        insert: (table: any) => ({ 
          values: (data: any) => ({ 
            returning: () => {
              const mockRecord = { id: `mock-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
              // Add to mock data store based on table
              if (table === schema.goals) mockData.goals.push(mockRecord);
              else if (table === schema.habits) mockData.habits.push(mockRecord);
              else if (table === schema.templates) mockData.templates.push(mockRecord);
              return Promise.resolve([mockRecord]);
            }
          })
        }),
        update: (table: any) => ({ 
          set: (data: any) => ({ 
            where: (condition: any) => ({ 
              returning: () => Promise.resolve([{ ...data, id: `mock-${Date.now()}`, updatedAt: new Date() }])
            })
          })
        }),
        delete: () => ({ where: () => Promise.resolve() })
      } as any;
    }
  }

  // Create connection pool
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
  });

  // Initialize Drizzle with schema
  return drizzle(pool, { 
    schema,
    logger: process.env.NODE_ENV === 'development'
  });
}

// Export the database instance
export const db = createDatabase();

// Health check function
export async function healthCheck() {
  try {
    if (!process.env.DATABASE_URL) {
      return { ok: false, error: 'DATABASE_URL not configured', mock: true };
    }
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query('SELECT NOW() as timestamp');
    await pool.end();
    
    return { ok: true, timestamp: result.rows[0].timestamp, mock: false };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error', mock: false };
  }
}

export * from './schema';
export type DB = typeof db;