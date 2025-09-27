/**
 * Phoenix Enterprise Rate Limiting & Security System
 * Advanced rate limiting with Redis backend and security monitoring
 */

import { Redis } from 'ioredis';
import Logger from '../logger';

// Rate limiting configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per window
    blockDuration: 30 * 60 * 1000, // 30 minute lockout
    skipSuccessfulRequests: true,
  },
  
  // API endpoints - standard limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    blockDuration: 5 * 60 * 1000, // 5 minute cooldown
    skipSuccessfulRequests: false,
  },
  
  // File uploads - special limits
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
    blockDuration: 10 * 60 * 1000, // 10 minute cooldown
    skipSuccessfulRequests: false,
  },
  
  // Search and heavy operations
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
    blockDuration: 2 * 60 * 1000, // 2 minute cooldown
    skipSuccessfulRequests: false,
  },
  
  // AI/ML endpoints - resource intensive
  ai: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 AI requests per minute
    blockDuration: 5 * 60 * 1000, // 5 minute cooldown
    skipSuccessfulRequests: false,
  },
} as const;

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  blocked?: boolean;
  reason?: string;
}

interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  suspiciousRequests: number;
  uniqueIPs: Set<string>;
  topOffenders: Map<string, number>;
  rateLimitHits: number;
  securityEvents: number;
}

export class PhoenixRateLimiter {
  private redis: Redis | null = null;
  private fallbackStore = new Map<string, { count: number; resetTime: number; blocked?: number }>();
  private metrics: SecurityMetrics = {
    totalRequests: 0,
    blockedRequests: 0,
    suspiciousRequests: 0,
    uniqueIPs: new Set(),
    topOffenders: new Map(),
    rateLimitHits: 0,
    securityEvents: 0,
  };

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          connectTimeout: 5000,
          commandTimeout: 3000,
          lazyConnect: true,
          keyPrefix: 'phoenix:ratelimit:',
        });

        this.redis.on('error', (err) => {
          Logger.error('Rate limiter Redis error:', err);
          this.redis = null; // Fallback to memory store
        });

        this.redis.on('connect', () => {
          Logger.info('Rate limiter Redis connected');
        });
      } catch (error) {
        Logger.error('Failed to initialize Redis for rate limiting:', error);
        this.redis = null;
      }
    } else {
      Logger.warn('Redis not configured - using memory-based rate limiting');
    }
  }

  /**
   * Check if request is within rate limits
   */
  async checkRateLimit(
    identifier: string,
    configType: keyof typeof RATE_LIMIT_CONFIGS,
    request?: {
      ip?: string;
      userAgent?: string;
      path?: string;
      method?: string;
    }
  ): Promise<RateLimitResult> {
    const config = RATE_LIMIT_CONFIGS[configType];
    const now = Date.now();
    
    // Update metrics
    this.metrics.totalRequests++;
    if (request?.ip) {
      this.metrics.uniqueIPs.add(request.ip);
    }

    try {
      // Check if currently blocked
      const blockKey = `block:${identifier}`;
      const isBlocked = await this.getBlockStatus(blockKey);
      
      if (isBlocked) {
        this.metrics.blockedRequests++;
        this.recordOffender(identifier);
        
        return {
          allowed: false,
          limit: config.maxRequests,
          remaining: 0,
          resetTime: isBlocked.resetTime,
          retryAfter: Math.ceil((isBlocked.resetTime - now) / 1000),
          blocked: true,
          reason: 'IP temporarily blocked due to rate limit violations',
        };
      }

      // Check current rate limit
      const rateLimitKey = `limit:${identifier}:${configType}`;
      const current = await this.getCurrentCount(rateLimitKey, config.windowMs);
      
      if (current.count >= config.maxRequests) {
        this.metrics.rateLimitHits++;
        
        // Block if exceeded limit
        await this.blockIdentifier(blockKey, config.blockDuration);
        
        // Log security event
        this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
          identifier,
          configType,
          count: current.count,
          limit: config.maxRequests,
          request,
        });
        
        return {
          allowed: false,
          limit: config.maxRequests,
          remaining: 0,
          resetTime: current.resetTime,
          retryAfter: Math.ceil(config.blockDuration / 1000),
          reason: `Rate limit exceeded: ${current.count}/${config.maxRequests} requests`,
        };
      }

      // Increment counter
      await this.incrementCounter(rateLimitKey, config.windowMs);
      
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - current.count - 1,
        resetTime: current.resetTime,
      };

    } catch (error) {
      Logger.error('Rate limit check failed:', error);
      
      // Fail open for availability, but log the error
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
        reason: 'Rate limiter unavailable - allowing request',
      };
    }
  }

  /**
   * Advanced security checks
   */
  async performSecurityChecks(request: {
    ip: string;
    userAgent: string;
    path: string;
    method: string;
    headers: Record<string, string>;
  }): Promise<{
    allowed: boolean;
    risk: 'low' | 'medium' | 'high';
    reasons: string[];
    score: number;
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /bot|crawler|spider|scraper/i,
      /curl|wget|python|ruby|perl/i,
      /nikto|sqlmap|nmap|burp/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(request.userAgent)) {
        riskScore += 30;
        reasons.push('Suspicious user agent detected');
        break;
      }
    }

    // Check for SQL injection patterns in path
    const sqlPatterns = [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(request.path)) {
        riskScore += 50;
        reasons.push('Potential SQL injection attempt');
        this.logSecurityEvent('SQL_INJECTION_ATTEMPT', { request });
        break;
      }
    }

    // Check for XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(decodeURIComponent(request.path))) {
        riskScore += 40;
        reasons.push('Potential XSS attempt');
        this.logSecurityEvent('XSS_ATTEMPT', { request });
        break;
      }
    }

    // Check request frequency from IP
    const recentRequests = await this.getRecentRequestCount(request.ip, 60000); // 1 minute
    if (recentRequests > 200) {
      riskScore += 35;
      reasons.push('Excessive request frequency');
    }

    // Check for missing security headers
    if (!request.headers['x-forwarded-for'] && !request.headers['cf-connecting-ip']) {
      riskScore += 10;
      reasons.push('Direct IP access (potential proxy bypass)');
    }

    // Determine risk level
    let risk: 'low' | 'medium' | 'high' = 'low';
    if (riskScore >= 70) {
      risk = 'high';
      this.metrics.securityEvents++;
    } else if (riskScore >= 40) {
      risk = 'medium';
      this.metrics.suspiciousRequests++;
    }

    const allowed = riskScore < 70; // Block high-risk requests

    if (!allowed) {
      this.logSecurityEvent('HIGH_RISK_REQUEST_BLOCKED', {
        request,
        riskScore,
        reasons,
      });
    }

    return {
      allowed,
      risk,
      reasons,
      score: riskScore,
    };
  }

  /**
   * Check if identifier is currently blocked
   */
  private async getBlockStatus(blockKey: string): Promise<{ resetTime: number } | null> {
    if (this.redis) {
      try {
        const ttl = await this.redis.ttl(blockKey);
        if (ttl > 0) {
          return { resetTime: Date.now() + (ttl * 1000) };
        }
      } catch (error) {
        Logger.error('Redis block check failed:', error);
      }
    }

    // Fallback to memory store
    const entry = this.fallbackStore.get(blockKey);
    if (entry?.blocked && entry.blocked > Date.now()) {
      return { resetTime: entry.blocked };
    }

    return null;
  }

  /**
   * Get current request count for identifier
   */
  private async getCurrentCount(
    key: string,
    windowMs: number
  ): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const resetTime = now + windowMs;

    if (this.redis) {
      try {
        const count = await this.redis.get(key);
        const ttl = await this.redis.ttl(key);
        
        return {
          count: count ? parseInt(count, 10) : 0,
          resetTime: ttl > 0 ? now + (ttl * 1000) : resetTime,
        };
      } catch (error) {
        Logger.error('Redis count check failed:', error);
      }
    }

    // Fallback to memory store
    const entry = this.fallbackStore.get(key);
    if (entry && entry.resetTime > now) {
      return { count: entry.count, resetTime: entry.resetTime };
    }

    return { count: 0, resetTime };
  }

  /**
   * Increment request counter
   */
  private async incrementCounter(key: string, windowMs: number): Promise<void> {
    if (this.redis) {
      try {
        const multi = this.redis.multi();
        multi.incr(key);
        multi.expire(key, Math.ceil(windowMs / 1000));
        await multi.exec();
        return;
      } catch (error) {
        Logger.error('Redis increment failed:', error);
      }
    }

    // Fallback to memory store
    const now = Date.now();
    const entry = this.fallbackStore.get(key);
    
    if (entry && entry.resetTime > now) {
      entry.count++;
    } else {
      this.fallbackStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
    }
  }

  /**
   * Block identifier for specified duration
   */
  private async blockIdentifier(blockKey: string, duration: number): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.setex(blockKey, Math.ceil(duration / 1000), '1');
        return;
      } catch (error) {
        Logger.error('Redis block failed:', error);
      }
    }

    // Fallback to memory store
    const entry = this.fallbackStore.get(blockKey) || { count: 0, resetTime: 0 };
    entry.blocked = Date.now() + duration;
    this.fallbackStore.set(blockKey, entry);
  }

  /**
   * Get recent request count for an IP
   */
  private async getRecentRequestCount(ip: string, windowMs: number): Promise<number> {
    const key = `recent:${ip}`;
    const result = await this.getCurrentCount(key, windowMs);
    
    // Increment for this request
    await this.incrementCounter(key, windowMs);
    
    return result.count;
  }

  /**
   * Record security events
   */
  private logSecurityEvent(
    eventType: string,
    details: any
  ): void {
    Logger.warn(`Security event: ${eventType}`, {
      eventType,
      timestamp: new Date().toISOString(),
      details,
      metrics: this.getMetricsSummary(),
    });

    // In production, this could send to SIEM or security monitoring system
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to external security service
      // await this.sendToSecurityService(eventType, details);
    }
  }

  /**
   * Record repeat offenders
   */
  private recordOffender(identifier: string): void {
    const currentCount = this.metrics.topOffenders.get(identifier) || 0;
    this.metrics.topOffenders.set(identifier, currentCount + 1);
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): {
    totalRequests: number;
    blockedRequests: number;
    suspiciousRequests: number;
    uniqueIPs: number;
    blockRate: number;
    suspicionRate: number;
    topOffenders: Array<{ identifier: string; count: number }>;
  } {
    const blockRate = this.metrics.totalRequests > 0 
      ? (this.metrics.blockedRequests / this.metrics.totalRequests) * 100 
      : 0;
    
    const suspicionRate = this.metrics.totalRequests > 0 
      ? (this.metrics.suspiciousRequests / this.metrics.totalRequests) * 100 
      : 0;

    const topOffenders = Array.from(this.metrics.topOffenders.entries())
      .map(([identifier, count]) => ({ identifier, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests: this.metrics.totalRequests,
      blockedRequests: this.metrics.blockedRequests,
      suspiciousRequests: this.metrics.suspiciousRequests,
      uniqueIPs: this.metrics.uniqueIPs.size,
      blockRate: Math.round(blockRate * 100) / 100,
      suspicionRate: Math.round(suspicionRate * 100) / 100,
      topOffenders,
    };
  }

  /**
   * Reset metrics (for monitoring systems)
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      suspiciousRequests: 0,
      uniqueIPs: new Set(),
      topOffenders: new Map(),
      rateLimitHits: 0,
      securityEvents: 0,
    };
  }

  /**
   * Cleanup expired entries in fallback store
   */
  cleanupFallbackStore(): void {
    const now = Date.now();
    for (const [key, entry] of this.fallbackStore.entries()) {
      if (entry.resetTime < now && (!entry.blocked || entry.blocked < now)) {
        this.fallbackStore.delete(key);
      }
    }
  }

  /**
   * Get rate limiter health status
   */
  async getHealthStatus(): Promise<{
    healthy: boolean;
    redisConnected: boolean;
    fallbackStoreSize: number;
    metrics: any;
  }> {
    let redisConnected = false;
    
    if (this.redis) {
      try {
        await this.redis.ping();
        redisConnected = true;
      } catch (error) {
        Logger.error('Redis health check failed:', error);
      }
    }

    return {
      healthy: true, // Always healthy (fail open)
      redisConnected,
      fallbackStoreSize: this.fallbackStore.size,
      metrics: this.getMetricsSummary(),
    };
  }
}

// Singleton instance
export const phoenixRateLimiter = new PhoenixRateLimiter();

// Cleanup interval for fallback store
setInterval(() => {
  phoenixRateLimiter.cleanupFallbackStore();
}, 5 * 60 * 1000); // Clean up every 5 minutes

export default phoenixRateLimiter;