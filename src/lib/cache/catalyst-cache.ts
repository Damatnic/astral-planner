// Catalyst Multi-Layer Caching System
import { Redis } from 'ioredis';

interface CacheOptions {
  ttl?: number;
  tags?: string[];
  namespace?: string;
  compress?: boolean;
  serialize?: boolean;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

class CatalystCache {
  private l1Cache: Map<string, { value: any; expires: number; tags: string[] }>;
  private l2Cache: Redis | null = null;
  private metrics: CacheMetrics;
  private maxL1Size: number;
  private compressionThreshold: number;

  constructor() {
    this.l1Cache = new Map();
    this.maxL1Size = 1000; // Maximum entries in L1 cache
    this.compressionThreshold = 1024; // Compress values larger than 1KB
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };

    // Initialize Redis connection if available
    this.initializeRedis();
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanupL1Cache(), 5 * 60 * 1000);
  }

  private async initializeRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.l2Cache = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keepAlive: 30000,
          commandTimeout: 1000
        });
        
        this.l2Cache.on('error', (error) => {
          // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.warn('Redis cache error:', error);
          this.metrics.errors++;
        });
      }
    } catch (error) {
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.warn('Failed to initialize Redis cache:', error);
    }
  }

  private generateKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : `catalyst:${key}`;
  }

  private isExpired(expires: number): boolean {
    return Date.now() > expires;
  }

  private cleanupL1Cache() {
    const now = Date.now();
    this.l1Cache.forEach((entry, key) => {
      if (this.isExpired(entry.expires)) {
        this.l1Cache.delete(key);
      }
    });

    // Evict oldest entries if cache is too large
    if (this.l1Cache.size > this.maxL1Size) {
      const entries = Array.from(this.l1Cache.entries());
      const toDelete = entries.slice(0, entries.length - this.maxL1Size);
      toDelete.forEach(([key]) => this.l1Cache.delete(key));
    }
  }

  private async compress(value: string): Promise<string> {
    if (typeof window !== 'undefined' && 'CompressionStream' in window) {
      try {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new TextEncoder().encode(value));
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        while (!done) {
          const { value: chunk, done: readerDone } = await reader.read();
          done = readerDone;
          if (chunk) chunks.push(chunk);
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        return btoa(String.fromCharCode.apply(null, Array.from(compressed)));
      } catch (error) {
        // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.warn('Compression failed:', error);
      }
    }
    return value;
  }

  private async decompress(compressedValue: string): Promise<string> {
    if (typeof window !== 'undefined' && 'DecompressionStream' in window) {
      try {
        const compressed = Uint8Array.from(atob(compressedValue), c => c.charCodeAt(0));
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(compressed);
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        while (!done) {
          const { value: chunk, done: readerDone } = await reader.read();
          done = readerDone;
          if (chunk) chunks.push(chunk);
        }
        
        const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          decompressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        return new TextDecoder().decode(decompressed);
      } catch (error) {
        // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.warn('Decompression failed:', error);
      }
    }
    return compressedValue;
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const fullKey = this.generateKey(key, options.namespace);
    const startTime = performance.now();

    try {
      // L1 Cache check
      const l1Entry = this.l1Cache.get(fullKey);
      if (l1Entry && !this.isExpired(l1Entry.expires)) {
        this.metrics.hits++;
        this.recordCacheHit('l1', performance.now() - startTime);
        return l1Entry.value;
      }

      // L2 Cache check (Redis)
      if (this.l2Cache) {
        try {
          const l2Value = await this.l2Cache.get(fullKey);
          if (l2Value) {
            let parsed: T;
            if (options.serialize !== false) {
              const decompressed = await this.decompress(l2Value);
              parsed = JSON.parse(decompressed);
            } else {
              parsed = l2Value as T;
            }

            // Populate L1 cache
            const ttl = options.ttl || 300000; // 5 minutes default
            this.l1Cache.set(fullKey, {
              value: parsed,
              expires: Date.now() + ttl,
              tags: options.tags || []
            });

            this.metrics.hits++;
            this.recordCacheHit('l2', performance.now() - startTime);
            return parsed;
          }
        } catch (error) {
          // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.warn('L2 cache read error:', error);
          this.metrics.errors++;
        }
      }

      this.metrics.misses++;
      this.recordCacheMiss(performance.now() - startTime);
      return null;
    } catch (error) {
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Cache get error:', error);
      this.metrics.errors++;
      return null;
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const fullKey = this.generateKey(key, options.namespace);
    const ttl = options.ttl || 300000; // 5 minutes default
    const expires = Date.now() + ttl;

    try {
      // Set in L1 cache
      this.l1Cache.set(fullKey, {
        value,
        expires,
        tags: options.tags || []
      });

      // Set in L2 cache (Redis)
      if (this.l2Cache) {
        try {
          let serialized: string;
          if (options.serialize !== false) {
            serialized = JSON.stringify(value);
            if (serialized.length > this.compressionThreshold && options.compress !== false) {
              serialized = await this.compress(serialized);
            }
          } else {
            serialized = value as string;
          }

          await this.l2Cache.setex(fullKey, Math.floor(ttl / 1000), serialized);
        } catch (error) {
          // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.warn('L2 cache write error:', error);
          this.metrics.errors++;
        }
      }

      this.metrics.sets++;
    } catch (error) {
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Cache set error:', error);
      this.metrics.errors++;
    }
  }

  async delete(key: string, options: CacheOptions = {}): Promise<void> {
    const fullKey = this.generateKey(key, options.namespace);

    try {
      // Delete from L1 cache
      this.l1Cache.delete(fullKey);

      // Delete from L2 cache
      if (this.l2Cache) {
        try {
          await this.l2Cache.del(fullKey);
        } catch (error) {
          // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.warn('L2 cache delete error:', error);
          this.metrics.errors++;
        }
      }

      this.metrics.deletes++;
    } catch (error) {
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Cache delete error:', error);
      this.metrics.errors++;
    }
  }

  async invalidateByTags(tags: string[], namespace?: string): Promise<void> {
    try {
      // Invalidate L1 cache
      this.l1Cache.forEach((entry, key) => {
        if (entry.tags.some(tag => tags.includes(tag))) {
          this.l1Cache.delete(key);
        }
      });

      // Invalidate L2 cache
      if (this.l2Cache) {
        try {
          const pattern = this.generateKey('*', namespace);
          const keys = await this.l2Cache.keys(pattern);
          
          if (keys.length > 0) {
            await this.l2Cache.del(...keys);
          }
        } catch (error) {
          // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.warn('L2 cache tag invalidation error:', error);
          this.metrics.errors++;
        }
      }
    } catch (error) {
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Cache tag invalidation error:', error);
      this.metrics.errors++;
    }
  }

  async clear(namespace?: string): Promise<void> {
    try {
      if (namespace) {
        const prefix = this.generateKey('', namespace);
        Array.from(this.l1Cache.keys()).forEach(key => {
          if (key.startsWith(prefix)) {
            this.l1Cache.delete(key);
          }
        });

        if (this.l2Cache) {
          const pattern = this.generateKey('*', namespace);
          const keys = await this.l2Cache.keys(pattern);
          if (keys.length > 0) {
            await this.l2Cache.del(...keys);
          }
        }
      } else {
        this.l1Cache.clear();
        if (this.l2Cache) {
          await this.l2Cache.flushall();
        }
      }
    } catch (error) {
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Cache clear error:', error);
      this.metrics.errors++;
    }
  }

  getMetrics(): CacheMetrics & { hitRate: number; l1Size: number } {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      hitRate: totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0,
      l1Size: this.l1Cache.size
    };
  }

  private recordCacheHit(layer: 'l1' | 'l2', duration: number) {
    if (typeof window !== 'undefined' && window.performance?.mark) {
      window.performance.mark(`cache-hit-${layer}-${duration.toFixed(2)}ms`);
    }
  }

  private recordCacheMiss(duration: number) {
    if (typeof window !== 'undefined' && window.performance?.mark) {
      window.performance.mark(`cache-miss-${duration.toFixed(2)}ms`);
    }
  }
}

// Singleton instance
export const catalystCache = new CatalystCache();

// Convenience functions
export const getCachedData = <T>(key: string, options?: CacheOptions) => 
  catalystCache.get<T>(key, options);

export const setCachedData = <T>(key: string, value: T, options?: CacheOptions) => 
  catalystCache.set(key, value, options);

export const deleteCachedData = (key: string, options?: CacheOptions) => 
  catalystCache.delete(key, options);

export const invalidateCacheByTags = (tags: string[], namespace?: string) => 
  catalystCache.invalidateByTags(tags, namespace);

export const clearCache = (namespace?: string) => 
  catalystCache.clear(namespace);

export const getCacheMetrics = () => 
  catalystCache.getMetrics();