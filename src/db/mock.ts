// Mock database implementation for deployment compatibility
export const db = {
  select: () => ({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve([])
      })
    })
  }),
  insert: () => ({
    values: () => ({
      returning: () => Promise.resolve([{
        id: 'mock-id',
        title: 'Mock Item',
        createdAt: new Date(),
        updatedAt: new Date()
      }])
    })
  }),
  update: () => ({
    set: () => ({
      where: () => ({
        returning: () => Promise.resolve([{
          id: 'mock-id',
          title: 'Mock Updated Item',
          updatedAt: new Date()
        }])
      })
    })
  }),
  execute: () => Promise.resolve({ rows: [] })
};

export const healthCheck = () => Promise.resolve({
  ok: false,
  error: 'Database not configured',
  mock: true,
  timestamp: new Date().toISOString()
});

export const getPoolMetrics = () => ({
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
  peakConnections: 0
});

export const closeDatabase = () => Promise.resolve();
export const warmPool = () => Promise.resolve();
export const executeWithRetry = (operation: () => Promise<any>) => operation();

// Re-export all schema tables as empty objects
export const users = {};
export const workspaces = {};
export const blocks = {};
export const goals = {};
export const habits = {};
export const habitEntries = {};
export const goalProgress = {};
export const templates = {};
export const templateFavorites = {};
export const templateUsage = {};
export const workspaceMembers = {};
export const blockActivity = {};
export const integrations = {};
export const events = {};
export const userAnalytics = {};