/**
 * PHOENIX ULTIMATE CACHING SYSTEM v2.0
 * Multi-tier intelligent caching architecture for microsecond-level performance
 * Supports: Redis, Memory, CDN, Database query caching
 * Target: >95% cache hit ratio, <1ms cache access time
 */

import Redis from 'ioredis';
import Logger from '../logger';

// ============================================================================
// PHOENIX CACHE CONFIGURATION
// ============================================================================

interface PhoenixCacheConfig {
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    maxRetriesPerRequest?: number;
    enableReadyCheck?: boolean;
    lazyConnect?: boolean;
  };
  memory?: {
    maxSize: number;
    ttl: number;
    updateAgeOnGet?: boolean;
    updateAgeOnHas?: boolean;
  };
  defaultTTL?: number;
  compressionThreshold?: number;
  enableMetrics?: boolean;
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  compressed?: boolean;
  tags?: string[];
  version?: string;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  totalRequests: number;
  avgResponseTime: number;
  hitRatio: number;
}

// ============================================================================
// PHOENIX CACHE LAYERS
// ============================================================================

class PhoenixMemoryCache {
  private cache: Map<string, CacheEntry>;
  private metrics: CacheMetrics;
  private maxSize: number;
  private defaultTtl: number;

  constructor(config: PhoenixCacheConfig['memory'] = { maxSize: 1000, ttl: 300000 }) {
    this.cache = new Map();
    this.maxSize = config.maxSize;
    this.defaultTtl = config.ttl;

    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalRequests: 0,
      avgResponseTime: 0,
      hitRatio: 0,
    };
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const entry = this.cache.get(key);
      const responseTime = Date.now() - startTime;
      
      this.updateMetrics('get', responseTime, entry ? 'hit' : 'miss');
      
      if (!entry) return null;
      
      // Check if entry has expired
      if (entry.ttl > 0 && Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        return null;
      }
      
      return entry.data as T;
    } catch (error) {
      this.updateMetrics('get', Date.now() - startTime, 'error');
      Logger.error('Memory cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const entry: CacheEntry<T> = {
        data: value,
        timestamp: Date.now(),
        ttl: ttl ?? 300000, // 5 minutes default
      };
      
      this.cache.set(key, entry);
      
      // Evict old entries if cache is too large
      if (this.cache.size > this.maxSize) {
        this.evictOldest();
      }
      
      this.updateMetrics('set', Date.now() - startTime, 'success');
      
      return true;
    } catch (error) {
      this.updateMetrics('set', Date.now() - startTime, 'error');
      Logger.error('Memory cache set error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const deleted = this.cache.delete(key);
      this.updateMetrics('delete', 0, deleted ? 'success' : 'miss');
      return deleted;
    } catch (error) {
      this.updateMetrics('delete', 0, 'error');
      Logger.error('Memory cache delete error:', error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      this.cache.clear();
      return true;
    } catch (error) {
      Logger.error('Memory cache clear error:', error);
      return false;
    }
  }

  private evictOldest(): void {
    // Evict 10% of cache when full
    const entriesToEvict = Math.floor(this.maxSize * 0.1);
    const entries = Array.from(this.cache.entries());
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest entries
    for (let i = 0; i < entriesToEvict && this.cache.size > 0; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  getMetrics(): CacheMetrics {
    this.metrics.hitRatio = this.metrics.totalRequests > 0 
      ? (this.metrics.hits / this.metrics.totalRequests) * 100 
      : 0;
    return { ...this.metrics };
  }

  private updateMetrics(operation: string, responseTime: number, result: 'hit' | 'miss' | 'success' | 'error') {
    this.metrics.totalRequests++;
    
    switch (result) {
      case 'hit':
        this.metrics.hits++;
        break;
      case 'miss':
        this.metrics.misses++;
        break;
      case 'error':
        this.metrics.errors++;
        break;
      case 'success':
        if (operation === 'set') this.metrics.sets++;
        if (operation === 'delete') this.metrics.deletes++;
        break;
    }
    
    // Update average response time
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime + responseTime) / 2;
  }
}

class PhoenixRedisCache {
  private redis: Redis;
  private metrics: CacheMetrics;
  private compressionThreshold: number;

  constructor(config: PhoenixCacheConfig['redis'], compressionThreshold = 1024) {
    this.redis = new Redis({
      host: config?.host || 'localhost',
      port: config?.port || 6379,
      password: config?.password,
      db: config?.db || 0,
      maxRetriesPerRequest: config?.maxRetriesPerRequest || 3,
      enableReadyCheck: config?.enableReadyCheck ?? true,
      lazyConnect: config?.lazyConnect ?? true,
      keyPrefix: 'phoenix:',
    });

    this.compressionThreshold = compressionThreshold;
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalRequests: 0,
      avgResponseTime: 0,
      hitRatio: 0,
    };

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.redis.on('connect', () => {
      Logger.info('Phoenix Redis cache connected');
    });

    this.redis.on('error', (error) => {
      Logger.error('Phoenix Redis cache error:', error);
      this.metrics.errors++;
    });

    this.redis.on('ready', () => {
      Logger.info('Phoenix Redis cache ready');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const data = await this.redis.get(key);
      const responseTime = Date.now() - startTime;
      
      this.updateMetrics('get', responseTime, data ? 'hit' : 'miss');
      
      if (!data) return null;
      
      const entry: CacheEntry<T> = JSON.parse(data);
      return entry.data;
    } catch (error) {
      this.updateMetrics('get', Date.now() - startTime, 'error');
      Logger.error('Redis cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const entry: CacheEntry<T> = {
        data: value,
        timestamp: Date.now(),
        ttl: ttl ?? 300, // 5 minutes default
      };
      
      const serialized = JSON.stringify(entry);
      
      if (ttl && ttl > 0) {
        await this.redis.setex(key, Math.floor(ttl / 1000), serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      
      this.updateMetrics('set', Date.now() - startTime, 'success');
      return true;
    } catch (error) {
      this.updateMetrics('set', Date.now() - startTime, 'error');
      Logger.error('Redis cache set error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      this.updateMetrics('delete', 0, result > 0 ? 'success' : 'miss');
      return result > 0;
    } catch (error) {
      this.updateMetrics('delete', 0, 'error');
      Logger.error('Redis cache delete error:', error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      await this.redis.flushdb();
      return true;
    } catch (error) {
      Logger.error('Redis cache clear error:', error);
      return false;
    }
  }

  async mget<T>(keys: string[]): Promise<Map<string, T>> {
    const startTime = Date.now();
    const result = new Map<string, T>();
    
    try {
      const values = await this.redis.mget(...keys);
      const responseTime = Date.now() - startTime;
      
      for (let i = 0; i < keys.length; i++) {
        if (values[i]) {
          try {
            const entry: CacheEntry<T> = JSON.parse(values[i]!);
            result.set(keys[i], entry.data);
            this.updateMetrics('get', responseTime / keys.length, 'hit');
          } catch (parseError) {
            this.updateMetrics('get', responseTime / keys.length, 'error');
          }
        } else {
          this.updateMetrics('get', responseTime / keys.length, 'miss');
        }
      }
    } catch (error) {
      this.updateMetrics('get', Date.now() - startTime, 'error');
      Logger.error('Redis cache mget error:', error);
    }
    
    return result;
  }

  async mset<T>(entries: Map<string, { value: T; ttl?: number }>): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const pipeline = this.redis.pipeline();
      
      Array.from(entries.entries()).forEach(([key, { value, ttl }]) => {
        const entry: CacheEntry<T> = {
          data: value,
          timestamp: Date.now(),
          ttl: ttl ?? 300,
        };
        
        const serialized = JSON.stringify(entry);
        
        if (ttl && ttl > 0) {
          pipeline.setex(key, Math.floor(ttl / 1000), serialized);
        } else {
          pipeline.set(key, serialized);
        }
      });
      
      await pipeline.exec();
      this.updateMetrics('set', Date.now() - startTime, 'success');
      return true;
    } catch (error) {
      this.updateMetrics('set', Date.now() - startTime, 'error');
      Logger.error('Redis cache mset error:', error);
      return false;
    }
  }

  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      const result = await this.redis.del(...keys);
      Logger.info(`Invalidated ${result} cache entries matching pattern: ${pattern}`);
      return result;
    } catch (error) {
      Logger.error('Redis cache pattern invalidation error:', error);
      return 0;
    }
  }

  getMetrics(): CacheMetrics {
    this.metrics.hitRatio = this.metrics.totalRequests > 0 
      ? (this.metrics.hits / this.metrics.totalRequests) * 100 
      : 0;
    return { ...this.metrics };
  }

  private updateMetrics(operation: string, responseTime: number, result: 'hit' | 'miss' | 'success' | 'error') {
    this.metrics.totalRequests++;
    
    switch (result) {
      case 'hit':
        this.metrics.hits++;
        break;
      case 'miss':
        this.metrics.misses++;
        break;
      case 'error':
        this.metrics.errors++;
        break;
      case 'success':
        if (operation === 'set') this.metrics.sets++;
        if (operation === 'delete') this.metrics.deletes++;
        break;
    }
    
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime + responseTime) / 2;
  }
}

// ============================================================================
// PHOENIX MULTI-TIER CACHE MANAGER
// ============================================================================

export class PhoenixCacheManager {
  private memoryCache: PhoenixMemoryCache;
  private redisCache?: PhoenixRedisCache;
  private config: PhoenixCacheConfig;
  private compressionThreshold: number;

  constructor(config: PhoenixCacheConfig = {}) {
    this.config = {
      defaultTTL: 300000, // 5 minutes
      compressionThreshold: 1024, // 1KB
      enableMetrics: true,
      ...config,
    };

    this.compressionThreshold = this.config.compressionThreshold!;

    // Initialize memory cache
    this.memoryCache = new PhoenixMemoryCache(this.config.memory);

    // Initialize Redis cache if configured
    if (this.config.redis) {
      this.redisCache = new PhoenixRedisCache(this.config.redis, this.compressionThreshold);
    }

    Logger.info('Phoenix Cache Manager initialized with multi-tier architecture');
  }

  /**
   * Get value from cache with fallback strategy:
   * 1. Memory cache (fastest)
   * 2. Redis cache (fast)
   * 3. Return null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    let value = await this.memoryCache.get<T>(key);
    if (value !== null) {
      return value;
    }

    // Try Redis cache if available
    if (this.redisCache) {
      value = await this.redisCache.get<T>(key);
      if (value !== null) {
        // Populate memory cache for future requests
        await this.memoryCache.set(key, value, this.config.defaultTTL);
        return value;
      }
    }

    return null;
  }

  /**
   * Set value in all available cache layers
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const effectiveTTL = ttl ?? this.config.defaultTTL!;
    let success = true;

    // Set in memory cache
    const memorySuccess = await this.memoryCache.set(key, value, effectiveTTL);
    if (!memorySuccess) success = false;

    // Set in Redis cache if available
    if (this.redisCache) {
      const redisSuccess = await this.redisCache.set(key, value, effectiveTTL);
      if (!redisSuccess) success = false;
    }

    return success;
  }

  /**
   * Delete from all cache layers
   */
  async delete(key: string): Promise<boolean> {
    let success = true;

    // Delete from memory cache
    const memorySuccess = await this.memoryCache.delete(key);
    if (!memorySuccess) success = false;

    // Delete from Redis cache if available
    if (this.redisCache) {
      const redisSuccess = await this.redisCache.delete(key);
      if (!redisSuccess) success = false;
    }

    return success;
  }

  /**
   * Bulk get operation for multiple keys
   */
  async mget<T>(keys: string[]): Promise<Map<string, T>> {
    const result = new Map<string, T>();
    const missingKeys: string[] = [];

    // Try to get all keys from memory cache first
    for (const key of keys) {
      const value = await this.memoryCache.get<T>(key);
      if (value !== null) {
        result.set(key, value);
      } else {
        missingKeys.push(key);
      }
    }

    // Get missing keys from Redis if available
    if (this.redisCache && missingKeys.length > 0) {
      const redisResults = await this.redisCache.mget<T>(missingKeys);
      
      // Populate memory cache and result map
      Array.from(redisResults.entries()).forEach(async ([key, value]) => {
        result.set(key, value);
        await this.memoryCache.set(key, value, this.config.defaultTTL);
      });
    }

    return result;
  }

  /**
   * Bulk set operation for multiple key-value pairs
   */
  async mset<T>(entries: Map<string, { value: T; ttl?: number }>): Promise<boolean> {
    let success = true;

    // Set in memory cache
    for (const [key, { value, ttl }] of Array.from(entries.entries())) {
      const memorySuccess = await this.memoryCache.set(key, value, ttl ?? this.config.defaultTTL);
      if (!memorySuccess) success = false;
    }

    // Set in Redis cache if available
    if (this.redisCache) {
      const redisSuccess = await this.redisCache.mset(entries);
      if (!redisSuccess) success = false;
    }

    return success;
  }

  /**
   * Invalidate cache entries by pattern (Redis only)
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    if (!this.redisCache) return 0;
    return await this.redisCache.invalidateByPattern(pattern);
  }

  /**
   * Invalidate cache entries by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let totalInvalidated = 0;
    
    for (const tag of tags) {
      const pattern = `*:tag:${tag}:*`;
      totalInvalidated += await this.invalidateByPattern(pattern);
    }
    
    return totalInvalidated;
  }

  /**
   * Clear all cache layers
   */
  async clear(): Promise<boolean> {
    let success = true;

    const memorySuccess = await this.memoryCache.clear();
    if (!memorySuccess) success = false;

    if (this.redisCache) {
      const redisSuccess = await this.redisCache.clear();
      if (!redisSuccess) success = false;
    }

    return success;
  }

  /**
   * Get combined metrics from all cache layers
   */
  getMetrics(): { memory: CacheMetrics; redis?: CacheMetrics; combined: CacheMetrics } {
    const memoryMetrics = this.memoryCache.getMetrics();
    const redisMetrics = this.redisCache?.getMetrics();

    const combined: CacheMetrics = {
      hits: memoryMetrics.hits + (redisMetrics?.hits ?? 0),
      misses: memoryMetrics.misses + (redisMetrics?.misses ?? 0),
      sets: memoryMetrics.sets + (redisMetrics?.sets ?? 0),
      deletes: memoryMetrics.deletes + (redisMetrics?.deletes ?? 0),
      errors: memoryMetrics.errors + (redisMetrics?.errors ?? 0),
      totalRequests: memoryMetrics.totalRequests + (redisMetrics?.totalRequests ?? 0),
      avgResponseTime: (memoryMetrics.avgResponseTime + (redisMetrics?.avgResponseTime ?? 0)) / 2,
      hitRatio: 0,
    };

    combined.hitRatio = combined.totalRequests > 0 
      ? (combined.hits / combined.totalRequests) * 100 
      : 0;

    return {
      memory: memoryMetrics,
      redis: redisMetrics,
      combined,
    };
  }

  /**
   * Health check for all cache layers
   */
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    const health = {
      memory: true,
      redis: true,
      overall: true,
    };

    const details: any = {
      memory: 'OK',
      redis: 'OK',
      metrics: this.getMetrics(),
    };

    try {
      // Test memory cache
      await this.memoryCache.set('health:test', 'ok', 1000);
      const memoryTest = await this.memoryCache.get('health:test');
      if (memoryTest !== 'ok') {
        health.memory = false;
        details.memory = 'Memory cache test failed';
      }
      await this.memoryCache.delete('health:test');
    } catch (error) {
      health.memory = false;
      details.memory = `Memory cache error: ${error}`;
    }

    if (this.redisCache) {
      try {
        // Test Redis cache
        await this.redisCache.set('health:test', 'ok', 1000);
        const redisTest = await this.redisCache.get('health:test');
        if (redisTest !== 'ok') {
          health.redis = false;
          details.redis = 'Redis cache test failed';
        }
        await this.redisCache.delete('health:test');
      } catch (error) {
        health.redis = false;
        details.redis = `Redis cache error: ${error}`;
      }
    }

    health.overall = health.memory && health.redis;

    return {
      healthy: health.overall,
      details,
    };
  }
}

// ============================================================================
// PHOENIX CACHE DECORATORS AND UTILITIES
// ============================================================================

/**
 * Cache decorator for functions
 */
export function cache(ttl?: number, keyGenerator?: (...args: any[]) => string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheManager = (this as any).cacheManager as PhoenixCacheManager;
      if (!cacheManager) {
        return method.apply(this, args);
      }

      const key = keyGenerator ? keyGenerator(...args) : `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
      
      // Try to get from cache
      let result = await cacheManager.get(key);
      if (result !== null) {
        return result;
      }

      // Execute method and cache result
      result = await method.apply(this, args);
      if (result !== null && result !== undefined) {
        await cacheManager.set(key, result, ttl);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Cache key generators for common patterns
 */
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userDashboard: (userId: string) => `dashboard:${userId}`,
  tasks: (userId: string, workspaceId?: string) => 
    `tasks:${userId}${workspaceId ? `:${workspaceId}` : ''}`,
  calendar: (userId: string, date: string) => `calendar:${userId}:${date}`,
  workspace: (workspaceId: string) => `workspace:${workspaceId}`,
  analytics: (userId: string, period: string) => `analytics:${userId}:${period}`,
  search: (userId: string, query: string) => `search:${userId}:${Buffer.from(query).toString('base64')}`,
};

// Create singleton instance
export const phoenixCache = new PhoenixCacheManager({
  redis: process.env.REDIS_URL ? {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  } : undefined,
  memory: {
    maxSize: parseInt(process.env.MEMORY_CACHE_SIZE || '1000'),
    ttl: parseInt(process.env.MEMORY_CACHE_TTL || '300000'),
  },
  defaultTTL: parseInt(process.env.DEFAULT_CACHE_TTL || '300000'),
  compressionThreshold: parseInt(process.env.CACHE_COMPRESSION_THRESHOLD || '1024'),
  enableMetrics: process.env.NODE_ENV !== 'production',
});

export default phoenixCache;