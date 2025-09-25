import { NextRequest, NextResponse } from 'next/server';
import { Redis } from 'ioredis';
import Logger, { AppError } from './logger';
import { sanitizeInput } from './validation';

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

// Redis client for rate limiting (fallback to in-memory for development)
let redis: Redis | null = null;
const memoryStore = new Map<string, { count: number; resetTime: number }>();

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
    Logger.info('Redis connected for rate limiting');
  } catch (error) {
    Logger.warn('Redis connection failed, using memory store:', error);
  }
}

// Rate limiting middleware
export async function rateLimit(req: NextRequest): Promise<{ success: boolean; error?: string; headers?: Record<string, string> }> {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || 'unknown';
  const key = `rate_limit:${ip}`;
  const now = Date.now();
  
  try {
    let current: { count: number; resetTime: number };
    
    if (redis) {
      // Use Redis for distributed rate limiting
      const result = await redis.multi()
        .incr(key)
        .expire(key, Math.ceil(rateLimitConfig.windowMs / 1000))
        .exec();
      
      const count = result?.[0]?.[1] as number || 0;
      const resetTime = now + rateLimitConfig.windowMs;
      current = { count, resetTime };
    } else {
      // Use memory store for single instance
      current = memoryStore.get(key) || { count: 0, resetTime: now + rateLimitConfig.windowMs };
      
      if (now > current.resetTime) {
        current = { count: 1, resetTime: now + rateLimitConfig.windowMs };
      } else {
        current.count++;
      }
      
      memoryStore.set(key, current);
    }
    
    const remainingRequests = Math.max(0, rateLimitConfig.maxRequests - current.count);
    const resetTimeSeconds = Math.ceil((current.resetTime - now) / 1000);
    
    const headers = {
      'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
      'X-RateLimit-Remaining': remainingRequests.toString(),
      'X-RateLimit-Reset': resetTimeSeconds.toString(),
    };
    
    if (current.count > rateLimitConfig.maxRequests) {
      Logger.warn(`Rate limit exceeded for IP: ${ip}`);
      return {
        success: false,
        error: 'Too many requests, please try again later',
        headers
      };
    }
    
    return { success: true, headers };
  } catch (error) {
    Logger.error('Rate limiting error:', error);
    // Allow request to continue if rate limiting fails
    return { success: true };
  }
}

// CORS configuration
const corsConfig = {
  allowedOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
};

// CORS middleware
export function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin');
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': corsConfig.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': corsConfig.allowedHeaders.join(', '),
  };
  
  if (origin && corsConfig.allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (process.env.NODE_ENV === 'development') {
    headers['Access-Control-Allow-Origin'] = '*';
  }
  
  if (corsConfig.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  return headers;
}

// Security headers
export function securityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': process.env.NODE_ENV === 'production' 
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
      : "default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' ws: wss: https:;",
  };
}

// Input sanitization middleware
export function sanitizeRequestData(data: any): any {
  return sanitizeInput(data);
}

// API Key validation
export function validateApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get('x-api-key');
  const validApiKey = process.env.API_KEY;
  
  if (!validApiKey) {
    Logger.warn('API_KEY not configured');
    return true; // Allow requests if no API key is configured
  }
  
  if (!apiKey || apiKey !== validApiKey) {
    Logger.warn('Invalid API key provided');
    return false;
  }
  
  return true;
}

// JWT token validation (placeholder for future auth implementation)
export function validateJWT(token: string): { valid: boolean; payload?: any; error?: string } {
  try {
    // This is a placeholder - implement actual JWT validation based on your auth provider
    if (!token) {
      return { valid: false, error: 'No token provided' };
    }
    
    // For now, accept any non-empty token in development
    if (process.env.NODE_ENV === 'development') {
      return { valid: true, payload: { userId: 'dev-user', email: 'dev@example.com' } };
    }
    
    // In production, implement proper JWT validation
    return { valid: false, error: 'JWT validation not implemented' };
  } catch (error) {
    Logger.error('JWT validation error:', error);
    return { valid: false, error: 'Invalid token format' };
  }
}

// Comprehensive security middleware function
export async function securityMiddleware(req: NextRequest) {
  // Check rate limiting
  const rateLimitResult = await rateLimit(req);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: rateLimitResult.error },
      { 
        status: 429,
        headers: {
          ...rateLimitResult.headers,
          ...securityHeaders(),
          ...corsHeaders(req),
        }
      }
    );
  }
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        ...securityHeaders(),
        ...corsHeaders(req),
        ...rateLimitResult.headers,
      }
    });
  }
  
  return null; // Continue to next middleware
}

// Session security utilities
export function generateSecureSessionId(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function validateSessionId(sessionId: string): boolean {
  return /^[a-f0-9]{64}$/.test(sessionId);
}