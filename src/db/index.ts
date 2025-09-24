// Temporarily disabled for deployment debugging
// import { drizzle } from 'drizzle-orm/neon-serverless';
// import { Pool } from '@neondatabase/serverless';
// import * as schema from './schema';

// Mock database for debugging
export const db = {
  query: {},
  select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
  insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
  update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
  delete: () => ({ where: () => Promise.resolve() })
} as any;

export * from './schema';
export type DB = typeof db;