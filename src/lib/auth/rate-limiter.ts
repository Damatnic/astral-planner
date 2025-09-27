/**
 * Advanced Rate Limiter
 * Production-ready rate limiting with sliding window algorithm
 */

import Logger from '@/lib/logger';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  message?: string;
}

export class RateLimiter {
  private requests = new Map<string, number[]>();
  private maxRequests: number;
  private windowMs: number;
  private skipSuccessfulRequests: boolean;
  private skipFailedRequests: boolean;
  private message: string;

  constructor(
    maxRequests: number, 
    windowMs: number, 
    options: Partial<RateLimitConfig> = {}
  ) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.skipFailedRequests = options.skipFailedRequests || false;
    this.message = options.message || 'Too many requests';

    // Clean up old entries periodically
    setInterval(() => this.cleanup(), this.windowMs);
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this key
    let requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (requests.length >= this.maxRequests) {
      Logger.warn('Rate limit exceeded', { 
        key, 
        requests: requests.length, 
        maxRequests: this.maxRequests 
      });
      return false;
    }

    // Add current request
    requests.push(now);
    this.requests.set(key, requests);

    return true;
  }

  /**
   * Get detailed rate limit status
   */
  getStatus(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this key
    let requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart);

    const remaining = Math.max(0, this.maxRequests - requests.length);
    const resetTime = requests.length > 0 ? requests[0] + this.windowMs : now + this.windowMs;

    return {
      allowed: requests.length < this.maxRequests,
      remaining,
      resetTime,
      message: requests.length >= this.maxRequests ? this.message : undefined
    };
  }

  /**
   * Record a request (for manual tracking)
   */
  recordRequest(key: string, success: boolean = true): RateLimitResult {
    // Skip recording based on configuration
    if ((success && this.skipSuccessfulRequests) || 
        (!success && this.skipFailedRequests)) {
      return this.getStatus(key);
    }

    const status = this.getStatus(key);
    
    if (status.allowed) {
      const now = Date.now();
      const requests = this.requests.get(key) || [];
      requests.push(now);
      this.requests.set(key, requests);
    }

    return status;
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
    Logger.info('Rate limit reset', { key });
  }

  /**
   * Clean up old entries
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    let cleaned = 0;

    for (const [key, requests] of Array.from(this.requests.entries())) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      
      if (validRequests.length === 0) {
        this.requests.delete(key);
        cleaned++;
      } else if (validRequests.length !== requests.length) {
        this.requests.set(key, validRequests);
      }
    }

    if (cleaned > 0) {
      Logger.debug(`Rate limiter cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Get current statistics
   */
  getStats(): { activeKeys: number; totalRequests: number } {
    let totalRequests = 0;
    
    for (const requests of Array.from(this.requests.values())) {
      totalRequests += requests.length;
    }

    return {
      activeKeys: this.requests.size,
      totalRequests
    };
  }
}

/**
 * Advanced Sliding Window Rate Limiter
 */
export class SlidingWindowRateLimiter {
  private windows = new Map<string, Map<number, number>>();
  private maxRequests: number;
  private windowSizeMs: number;
  private subWindowCount: number;
  private subWindowSizeMs: number;

  constructor(maxRequests: number, windowSizeMs: number, subWindowCount: number = 10) {
    this.maxRequests = maxRequests;
    this.windowSizeMs = windowSizeMs;
    this.subWindowCount = subWindowCount;
    this.subWindowSizeMs = windowSizeMs / subWindowCount;

    // Clean up old windows periodically
    setInterval(() => this.cleanup(), this.windowSizeMs);
  }

  /**
   * Check if request is allowed with sliding window
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const currentWindow = Math.floor(now / this.subWindowSizeMs);
    
    // Get or create window map for this key
    if (!this.windows.has(key)) {
      this.windows.set(key, new Map());
    }
    
    const keyWindows = this.windows.get(key)!;
    
    // Calculate total requests in the sliding window
    let totalRequests = 0;
    const windowStart = currentWindow - this.subWindowCount + 1;
    
    for (let i = windowStart; i <= currentWindow; i++) {
      totalRequests += keyWindows.get(i) || 0;
    }

    // Check if adding this request would exceed the limit
    if (totalRequests >= this.maxRequests) {
      Logger.warn('Sliding window rate limit exceeded', { 
        key, 
        currentRequests: totalRequests, 
        maxRequests: this.maxRequests 
      });
      return false;
    }

    // Record the request
    keyWindows.set(currentWindow, (keyWindows.get(currentWindow) || 0) + 1);
    
    return true;
  }

  /**
   * Get detailed status for sliding window
   */
  getStatus(key: string): RateLimitResult {
    const now = Date.now();
    const currentWindow = Math.floor(now / this.subWindowSizeMs);
    
    const keyWindows = this.windows.get(key) || new Map();
    
    // Calculate total requests in the sliding window
    let totalRequests = 0;
    const windowStart = currentWindow - this.subWindowCount + 1;
    
    for (let i = windowStart; i <= currentWindow; i++) {
      totalRequests += keyWindows.get(i) || 0;
    }

    const remaining = Math.max(0, this.maxRequests - totalRequests);
    const resetTime = (currentWindow + 1) * this.subWindowSizeMs;

    return {
      allowed: totalRequests < this.maxRequests,
      remaining,
      resetTime,
      message: totalRequests >= this.maxRequests ? 'Rate limit exceeded' : undefined
    };
  }

  /**
   * Clean up old windows
   */
  private cleanup(): void {
    const now = Date.now();
    const currentWindow = Math.floor(now / this.subWindowSizeMs);
    const cutoff = currentWindow - this.subWindowCount;
    let cleaned = 0;

    for (const [key, keyWindows] of Array.from(this.windows.entries())) {
      for (const window of Array.from(keyWindows.keys())) {
        if (window <= cutoff) {
          keyWindows.delete(window);
          cleaned++;
        }
      }
      
      // Remove empty key entries
      if (keyWindows.size === 0) {
        this.windows.delete(key);
      }
    }

    if (cleaned > 0) {
      Logger.debug(`Sliding window rate limiter cleaned up ${cleaned} old windows`);
    }
  }
}

/**
 * Distributed Rate Limiter (for multi-instance deployments)
 */
export class DistributedRateLimiter {
  private localStorage = new Map<string, { count: number; resetTime: number }>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed (would integrate with Redis in production)
   */
  async isAllowed(key: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // In production, this would be a Redis operation
    let entry = this.localStorage.get(key);
    
    // Reset if window expired
    if (!entry || entry.resetTime <= now) {
      entry = { count: 0, resetTime: now + this.windowMs };
    }

    // Check limit
    if (entry.count >= this.maxRequests) {
      Logger.warn('Distributed rate limit exceeded', { 
        key, 
        count: entry.count, 
        maxRequests: this.maxRequests 
      });
      return false;
    }

    // Increment counter
    entry.count++;
    this.localStorage.set(key, entry);

    return true;
  }

  /**
   * Get rate limit status
   */
  async getStatus(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.localStorage.get(key);

    if (!entry || entry.resetTime <= now) {
      return {
        allowed: true,
        remaining: this.maxRequests,
        resetTime: now + this.windowMs
      };
    }

    return {
      allowed: entry.count < this.maxRequests,
      remaining: Math.max(0, this.maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }
}

/**
 * Create standard rate limiters for different use cases
 */
export const createAuthRateLimiters = () => ({
  // Login attempts: 5 attempts per 5 minutes
  login: new RateLimiter(5, 5 * 60 * 1000, {
    message: 'Too many login attempts. Please wait 5 minutes.'
  }),

  // Registration: 3 attempts per hour
  registration: new RateLimiter(3, 60 * 60 * 1000, {
    message: 'Too many registration attempts. Please wait 1 hour.'
  }),

  // Password reset: 3 attempts per hour
  passwordReset: new RateLimiter(3, 60 * 60 * 1000, {
    message: 'Too many password reset attempts. Please wait 1 hour.'
  }),

  // API calls: 100 requests per minute
  api: new SlidingWindowRateLimiter(100, 60 * 1000),

  // Global: 1000 requests per hour per IP
  global: new SlidingWindowRateLimiter(1000, 60 * 60 * 1000)
});