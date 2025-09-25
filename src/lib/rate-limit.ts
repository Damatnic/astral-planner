// @ts-ignore - lru-cache types not available
import LRUCache from 'lru-cache'
import { NextRequest } from 'next/server'

type Options = {
  uniqueTokenPerInterval?: number
  interval?: number
}

type RateLimitConfig = {
  windowMs: number
  maxRequests: number
  message?: string
}

// Default configurations for different API endpoints
export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  default: { windowMs: 60000, maxRequests: 60 }, // 60 requests per minute
  auth: { windowMs: 900000, maxRequests: 5 }, // 5 requests per 15 minutes
  ai: { windowMs: 60000, maxRequests: 10 }, // 10 AI requests per minute
  export: { windowMs: 300000, maxRequests: 5 }, // 5 exports per 5 minutes
  webhook: { windowMs: 1000, maxRequests: 10 }, // 10 webhook requests per second
}

export function rateLimit(options?: Options) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  })

  return {
    check: async (request: NextRequest, limit: number, token: string) => {
      const tokenCount = (tokenCache.get(token) as number[]) || [0]
      
      if (tokenCount[0] === 0) {
        tokenCache.set(token, [1])
        return
      }

      if (tokenCount[0] + 1 > limit) {
        throw new Error('Rate limit exceeded')
      }

      tokenCount[0] += 1
      tokenCache.set(token, tokenCount)
    },
  }
}

// Helper to get client identifier
export function getClientIdentifier(request: NextRequest): string {
  // Try to get authenticated user ID from headers
  const userId = request.headers.get('x-user-id')
  if (userId) return `user:${userId}`

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip')
  
  if (ip) return `ip:${ip}`

  // Last resort - use a generic identifier (not recommended for production)
  return 'anonymous'
}

// Middleware helper for rate limiting
export async function checkRateLimit(
  request: NextRequest,
  configKey: string = 'default'
): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: Date }> {
  const config = rateLimitConfigs[configKey] || rateLimitConfigs.default
  const identifier = getClientIdentifier(request)
  const limiter = rateLimit({
    interval: config.windowMs,
    uniqueTokenPerInterval: 500,
  })

  try {
    await limiter.check(request, config.maxRequests, identifier)
    
    // Return estimated remaining count since we can't get exact count from the limiter
    const estimatedUsed = 1;
    return {
      success: true,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - estimatedUsed),
      reset: new Date(Date.now() + config.windowMs),
    }
  } catch (error) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: new Date(Date.now() + config.windowMs),
    }
  }
}

// Rate limit response helper
export function rateLimitResponse(
  message: string = 'Too many requests, please try again later.',
  resetTime?: Date
) {
  return new Response(
    JSON.stringify({
      error: message,
      resetTime: resetTime?.toISOString(),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 1000).toString() : '60',
      },
    }
  )
}