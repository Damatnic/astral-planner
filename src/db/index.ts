// Edge Runtime compatible database implementation
import { getAccountData } from '@/lib/account-data';

// Mock database implementation that works in Edge Runtime
const createMockDB = () => ({
  select: () => ({
    from: (table: any) => ({
      where: (condition: any) => ({
        limit: (count: number) => Promise.resolve([]),
        then: (fn: Function) => fn([])
      }),
      limit: (count: number) => Promise.resolve([]),
      orderBy: (field: any) => Promise.resolve([])
    })
  }),
  insert: (table: any) => ({
    values: (data: any) => ({
      returning: () => Promise.resolve([{
        id: `mock-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }])
    })
  }),
  update: (table: any) => ({
    set: (data: any) => ({
      where: (condition: any) => ({
        returning: () => Promise.resolve([{
          id: `mock-${Date.now()}`,
          ...data,
          updatedAt: new Date()
        }])
      })
    })
  })
});

// Initialize database
export const db = createMockDB();

// Health check function
export async function healthCheck(): Promise<{
  ok: boolean;
  timestamp?: string;
  responseTime?: number;
  poolSize?: number;
  error?: string;
  mock: boolean;
  diagnostics?: any;
}> {
  const startTime = Date.now();
  
  return {
    ok: true,
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - startTime,
    poolSize: 0,
    mock: true,
    diagnostics: {
      poolMetrics: {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0
      },
      connectionTest: true,
      queryTest: true,
      version: 'Mock Database v1.0'
    }
  };
}

// Pool metrics
export function getPoolMetrics() {
  return {
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
    currentPoolSize: 0,
    availableConnections: 0,
    waitingRequests: 0
  };
}

// Utility functions
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  context: string = 'unknown'
): Promise<T> {
  return await operation();
}

export async function warmPool(): Promise<void> {
  return Promise.resolve();
}

export async function closeDatabase(): Promise<void> {
  return Promise.resolve();
}

// Export error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
  }
}

// Export all schema tables as empty objects for compatibility
export * from './schema';

// Type definitions
export type DB = typeof db;