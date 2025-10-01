import { Redis } from '@upstash/redis'
import { logger } from '@/lib/logger'

// Create Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
}

const DEFAULT_TTL = 300 // 5 minutes

export class Cache {
  private static instance: Cache
  private redis: Redis | null

  private constructor() {
    this.redis = redis
  }

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache()
    }
    return Cache.instance
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null

    try {
      const data = await this.redis.get(key)
      return data as T
    } catch (error) {
      logger.error('Cache get error', { key }, error as Error);
      return null
    }
  }

  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    if (!this.redis) return

    try {
      const ttl = options?.ttl ?? DEFAULT_TTL
      await this.redis.set(key, JSON.stringify(value), {
        ex: ttl,
      })

      // Store tags for invalidation
      if (options?.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          await this.redis.sadd(`tag:${tag}`, key)
          await this.redis.expire(`tag:${tag}`, ttl)
        }
      }
    } catch (error) {
      logger.error('Cache set error', { key }, error as Error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.redis) return

    try {
      await this.redis.del(key)
    } catch (error) {
      logger.error('Cache delete error', { key }, error as Error);
    }
  }

  async invalidateTag(tag: string): Promise<void> {
    if (!this.redis) return

    try {
      const keys = await this.redis.smembers(`tag:${tag}`)
      if (keys.length > 0) {
        await Promise.all([
          this.redis.del(...keys),
          this.redis.del(`tag:${tag}`),
        ])
      }
    } catch (error) {
      logger.error('Cache invalidate tag error', { tag }, error as Error);
    }
  }

  async flush(): Promise<void> {
    if (!this.redis) return

    try {
      await this.redis.flushdb()
    } catch (error) {
      logger.error('Cache flush error', {}, error as Error);
    }
  }

  // Generate cache key with namespace
  static key(namespace: string, ...parts: (string | number)[]): string {
    return `${namespace}:${parts.join(':')}`
  }
}

// Export singleton instance
export const cache = Cache.getInstance()

// Cache middleware for API routes
export function withCache<T extends (...args: any[]) => any>(
  handler: T,
  options?: {
    ttl?: number
    keyGenerator?: (...args: Parameters<T>) => string
    tags?: string[]
  }
): T {
  return (async (...args: Parameters<T>) => {
    if (!redis) {
      // If Redis is not configured, just run the handler
      return handler(...args)
    }

    const key = options?.keyGenerator
      ? options.keyGenerator(...args)
      : JSON.stringify(args)

    // Try to get from cache
    const cached = await cache.get(key);
    if (cached) {
      logger.debug('Cache hit', { key });
      return cached;
    }

    // Execute handler and cache result
    const result = await handler(...args)
    
    await cache.set(key, result, {
      ttl: options?.ttl,
      tags: options?.tags,
    })

    return result
  }) as T
}

// Cache invalidation helpers
export const CacheTags = {
  USER: (userId: string) => `user:${userId}`,
  WORKSPACE: (workspaceId: string) => `workspace:${workspaceId}`,
  TASK: (taskId: string) => `task:${taskId}`,
  GOAL: (goalId: string) => `goal:${goalId}`,
  HABIT: (habitId: string) => `habit:${habitId}`,
  TEMPLATE: (templateId: string) => `template:${templateId}`,
} as const