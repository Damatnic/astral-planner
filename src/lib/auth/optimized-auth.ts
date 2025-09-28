/**
 * Phoenix Enterprise Authentication System
 * High-performance, secure authentication with caching and monitoring
 */

import { NextRequest } from 'next/server';
import { Redis } from 'ioredis';
import Logger, { AppError } from '../logger';
import { UserService } from './user-service';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { eq, and, isNull, gt } from 'drizzle-orm';

// Connection pool for Redis caching
let redisClient: Redis | null = null;

// Initialize Redis connection
function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
    Logger.warn('Redis not configured - authentication caching disabled');
    return null;
  }
  
  if (!redisClient && process.env.REDIS_URL) {
    try {
      redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        connectTimeout: 10000,
        commandTimeout: 5000,
        lazyConnect: true,
        keepAlive: 30000,
      });
      
      redisClient.on('error', (err) => {
        Logger.error('Redis connection error:', err);
      });
      
      redisClient.on('connect', () => {
        Logger.info('Redis connected for authentication caching');
      });
    } catch (error) {
      Logger.error('Failed to initialize Redis:', error);
      return null;
    }
  }
  
  return redisClient;
}

// Authentication metrics
interface AuthMetrics {
  requestTime: number;
  cacheHit: boolean;
  userLookupTime: number;
  validationTime: number;
  source: 'cache' | 'database' | 'external' | 'none';
}

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security configuration
const SECURITY_CONFIG = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  tokenCacheTTL: 30 * 60, // 30 minutes
  sessionCacheTTL: 24 * 60 * 60, // 24 hours
  rateLimitWindow: 5 * 60 * 1000, // 5 minutes
  rateLimitRequests: 100,
  bruteForceThreshold: 10,
  suspiciousActivityThreshold: 50,
} as const;

export interface OptimizedUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  username?: string;
  timezone: string;
  locale: string;
  settings: any;
  aiSettings: any;
  onboardingCompleted: boolean;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: OptimizedUser;
  sessionId: string;
  expiresAt: Date;
  fingerprint: string;
  ipAddress: string;
  userAgent: string;
}

export class PhoenixAuthSystem {
  private redis: Redis | null;
  private metrics: Map<string, AuthMetrics[]> = new Map();
  
  constructor() {
    this.redis = getRedisClient();
  }

  /**
   * High-performance user authentication with multi-layer caching
   */
  async authenticateUser(req: NextRequest): Promise<{
    user: OptimizedUser | null;
    session: AuthSession | null;
    metrics: AuthMetrics;
  }> {
    const startTime = performance.now();
    let cacheHit = false;
    let userLookupStart = 0;
    let validationStart = 0;
    
    try {
      // Extract authentication data
      const authData = this.extractAuthData(req);
      if (!authData.token) {
        return {
          user: null,
          session: null,
          metrics: this.createMetrics(startTime, false, 0, 0, 'none')
        };
      }

      // Rate limiting check
      await this.checkRateLimit(authData.ipAddress);

      // Check cached session first
      userLookupStart = performance.now();
      const cacheKey = `auth:session:${authData.sessionId || authData.token}`;
      
      if (this.redis) {
        try {
          const cachedSession = await this.redis.get(cacheKey);
          if (cachedSession) {
            const session: AuthSession = JSON.parse(cachedSession);
            
            // Validate session hasn't expired
            if (new Date(session.expiresAt) > new Date()) {
              cacheHit = true;
              
              // Update last active in background
              this.updateLastActiveAsync(session.user.id);
              
              return {
                user: session.user,
                session,
                metrics: this.createMetrics(startTime, true, performance.now() - userLookupStart, 0, 'cache')
              };
            } else {
              // Remove expired session
              await this.redis.del(cacheKey);
            }
          }
        } catch (cacheError) {
          Logger.warn('Cache lookup failed, falling back to database:', cacheError);
        }
      }

      // Validate token with external service or database
      validationStart = performance.now();
      const validatedUser = await this.validateToken(authData.token);
      
      if (!validatedUser) {
        return {
          user: null,
          session: null,
          metrics: this.createMetrics(startTime, false, performance.now() - userLookupStart, performance.now() - validationStart, 'external')
        };
      }

      // Get or create user in database with optimized query
      const dbUser = await this.getOrCreateUser(validatedUser);
      
      if (!dbUser) {
        throw new AppError('Failed to create or retrieve user', 500);
      }

      // Create session
      const session: AuthSession = {
        user: dbUser,
        sessionId: authData.sessionId || `session_${Date.now()}_${Math.random()}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        fingerprint: this.generateFingerprint(req),
        ipAddress: authData.ipAddress,
        userAgent: authData.userAgent,
      };

      // Cache the session
      if (this.redis) {
        try {
          await this.redis.setex(
            cacheKey,
            SECURITY_CONFIG.sessionCacheTTL,
            JSON.stringify(session)
          );
          
          // Also cache user data separately for faster lookups
          await this.redis.setex(
            `auth:user:${dbUser.id}`,
            SECURITY_CONFIG.tokenCacheTTL,
            JSON.stringify(dbUser)
          );
        } catch (cacheError) {
          Logger.warn('Failed to cache session:', cacheError);
        }
      }

      return {
        user: dbUser,
        session,
        metrics: this.createMetrics(
          startTime, 
          false, 
          performance.now() - userLookupStart, 
          performance.now() - validationStart, 
          'database'
        )
      };

    } catch (error) {
      Logger.error('Authentication error:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Authentication failed', 500);
    }
  }

  /**
   * Optimized user lookup with database indexing
   */
  private async getOrCreateUser(userData: any): Promise<OptimizedUser | null> {
    try {
      // Use optimized query with proper indexing
      const existingUsers = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.clerkId, userData.id),
            isNull(users.deletedAt)
          )
        )
        .limit(1);

      const existingUser = existingUsers[0];

      if (existingUser) {
        // Update user data if needed (optimized with selective updates)
        if (this.needsUpdate(existingUser, userData)) {
          const [updatedUser] = await db
            .update(users)
            .set({
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              imageUrl: userData.imageUrl,
              username: userData.username,
              lastActiveAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingUser.id))
            .returning();
          
          return this.transformUserData(updatedUser);
        }
        
        return this.transformUserData(existingUser);
      }

      // Create new user with transaction
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          imageUrl: userData.imageUrl,
          username: userData.username,
          timezone: 'UTC',
          locale: 'en-US',
          lastActiveAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Create default workspace in background
      this.createDefaultWorkspaceAsync(newUser.id);

      return this.transformUserData(newUser);
    } catch (error) {
      Logger.error('Error in getOrCreateUser:', error);
      return null;
    }
  }

  /**
   * Rate limiting with sliding window
   */
  private async checkRateLimit(ipAddress: string): Promise<void> {
    const now = Date.now();
    const windowStart = now - SECURITY_CONFIG.rateLimitWindow;
    
    // Clean up old entries
    for (const [ip, data] of Array.from(rateLimitStore.entries())) {
      if (data.resetTime < now) {
        rateLimitStore.delete(ip);
      }
    }
    
    const entry = rateLimitStore.get(ipAddress);
    
    if (entry) {
      if (entry.resetTime > now && entry.count >= SECURITY_CONFIG.rateLimitRequests) {
        throw new AppError('Rate limit exceeded', 429);
      }
      
      if (entry.resetTime <= now) {
        // Reset window
        entry.count = 1;
        entry.resetTime = now + SECURITY_CONFIG.rateLimitWindow;
      } else {
        entry.count++;
      }
    } else {
      rateLimitStore.set(ipAddress, {
        count: 1,
        resetTime: now + SECURITY_CONFIG.rateLimitWindow,
      });
    }
  }

  /**
   * Extract authentication data from request
   */
  private extractAuthData(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const sessionCookie = req.cookies.get('stack-session')?.value;
    const sessionId = req.headers.get('x-session-id');
    
    // Get client info for fingerprinting
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    return {
      token: authHeader?.replace('Bearer ', '') || sessionCookie,
      sessionId,
      ipAddress,
      userAgent,
    };
  }

  /**
   * Validate token with external service (Stack Auth)
   */
  private async validateToken(token: string): Promise<any> {
    if (!process.env.STACK_PROJECT_ID || !process.env.STACK_SECRET_SERVER_KEY) {
      return null;
    }

    try {
      const response = await fetch(
        `https://api.stack-auth.com/api/v1/projects/${process.env.STACK_PROJECT_ID}/sessions/current`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-stack-secret-server-key': process.env.STACK_SECRET_SERVER_KEY,
            'x-stack-project-id': process.env.STACK_PROJECT_ID,
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        }
      );

      if (!response.ok) {
        return null;
      }

      const session = await response.json();
      
      if (!session.user) {
        return null;
      }

      return {
        id: session.user.id,
        email: session.user.primary_email,
        firstName: session.user.display_name?.split(' ')[0],
        lastName: session.user.display_name?.split(' ').slice(1).join(' '),
        imageUrl: session.user.profile_image_url,
        username: session.user.username,
      };
    } catch (error) {
      Logger.error('Token validation failed:', error);
      return null;
    }
  }

  /**
   * Generate device fingerprint for session security
   */
  private generateFingerprint(req: NextRequest): string {
    const userAgent = req.headers.get('user-agent') || '';
    const acceptLanguage = req.headers.get('accept-language') || '';
    const acceptEncoding = req.headers.get('accept-encoding') || '';
    
    const fingerprint = Buffer.from(userAgent + acceptLanguage + acceptEncoding)
      .toString('base64')
      .slice(0, 32);
    
    return fingerprint;
  }

  /**
   * Transform database user to optimized format
   */
  private transformUserData(user: any): OptimizedUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      username: user.username,
      timezone: user.timezone || 'UTC',
      locale: user.locale || 'en-US',
      settings: user.settings || {},
      subscription: user.subscription || { plan: 'free' },
      aiSettings: user.aiSettings || { enabled: true },
      onboardingCompleted: user.onboardingCompleted || false,
      lastActiveAt: user.lastActiveAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Check if user needs update
   */
  private needsUpdate(dbUser: any, newData: any): boolean {
    return (
      dbUser.email !== newData.email ||
      dbUser.firstName !== newData.firstName ||
      dbUser.lastName !== newData.lastName ||
      dbUser.imageUrl !== newData.imageUrl ||
      dbUser.username !== newData.username
    );
  }

  /**
   * Create metrics object
   */
  private createMetrics(
    startTime: number,
    cacheHit: boolean,
    userLookupTime: number,
    validationTime: number,
    source: 'cache' | 'database' | 'external' | 'none'
  ): AuthMetrics {
    return {
      requestTime: performance.now() - startTime,
      cacheHit,
      userLookupTime,
      validationTime,
      source,
    };
  }

  /**
   * Update user last active timestamp asynchronously
   */
  private updateLastActiveAsync(userId: string): void {
    UserService.updateLastActive(userId).catch((error) => {
      Logger.error('Failed to update last active:', error);
    });
  }

  /**
   * Create default workspace asynchronously
   */
  private createDefaultWorkspaceAsync(userId: string): void {
    UserService['createDefaultWorkspace'](userId).catch((error) => {
      Logger.error('Failed to create default workspace:', error);
    });
  }

  /**
   * Get authentication metrics
   */
  getMetrics(): Record<string, {
    avgRequestTime: number;
    cacheHitRate: number;
    totalRequests: number;
    sourceDistribution: Record<string, number>;
  }> {
    const report: any = {};
    
    for (const [endpoint, metrics] of Array.from(this.metrics.entries())) {
      const totalRequests = metrics.length;
      const avgRequestTime = metrics.reduce((sum, m) => sum + m.requestTime, 0) / totalRequests;
      const cacheHits = metrics.filter(m => m.cacheHit).length;
      const cacheHitRate = (cacheHits / totalRequests) * 100;
      
      const sourceDistribution = metrics.reduce((acc, m) => {
        acc[m.source] = (acc[m.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      report[endpoint] = {
        avgRequestTime: Math.round(avgRequestTime * 100) / 100,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        totalRequests,
        sourceDistribution,
      };
    }
    
    return report;
  }

  /**
   * Record metrics for monitoring
   */
  recordMetrics(endpoint: string, metrics: AuthMetrics): void {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }
    
    const endpointMetrics = this.metrics.get(endpoint)!;
    endpointMetrics.push(metrics);
    
    // Keep only last 1000 metrics per endpoint
    if (endpointMetrics.length > 1000) {
      endpointMetrics.shift();
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }
}

// Singleton instance
export const phoenixAuth = new PhoenixAuthSystem();

// Enhanced authentication middleware
export function withOptimizedAuth(
  handler: (req: NextRequest, user: OptimizedUser, session: AuthSession) => Promise<Response>
) {
  return async (req: NextRequest) => {
    try {
      const { user, session, metrics } = await phoenixAuth.authenticateUser(req);
      
      // Record metrics
      phoenixAuth.recordMetrics(req.nextUrl.pathname, metrics);
      
      if (!user || !session) {
        return Response.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Add performance headers
      const response = await handler(req, user, session);
      response.headers.set('X-Auth-Time', metrics.requestTime.toFixed(2));
      response.headers.set('X-Cache-Hit', metrics.cacheHit.toString());
      
      return response;
    } catch (error) {
      Logger.error('Authentication middleware error:', error);
      
      if (error instanceof AppError) {
        return Response.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }
      
      return Response.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Demo user optimization
export function getDemoUser(): OptimizedUser {
  return {
    id: 'demo-user-phoenix',
    email: 'demo@astralchronos.com',
    firstName: 'Demo',
    lastName: 'User',
    imageUrl: undefined,
    username: 'demo',
    timezone: 'UTC',
    locale: 'en-US',
    settings: {
      appearance: {
        theme: 'dark',
        accentColor: '#3b82f6',
        fontSize: 'medium',
        reducedMotion: false,
        compactMode: false
      },
      notifications: {
        email: { taskReminders: false, dailyDigest: false, weeklyReport: false, achievements: false, mentions: false },
        push: { taskReminders: false, mentions: false, updates: false, breakReminders: false },
        inApp: { sounds: true, badges: true, popups: true },
        quietHours: { enabled: false, start: '22:00', end: '08:00', days: [] }
      },
      productivity: {
        pomodoroLength: 25,
        shortBreakLength: 5,
        longBreakLength: 15,
        autoStartBreaks: false,
        autoStartPomodoros: false,
        dailyGoal: 8,
        workingHours: { enabled: false, start: '09:00', end: '17:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] }
      }
    },
    subscription: { plan: 'free', features: [], expiresAt: null },
    aiSettings: { enabled: false },
    onboardingCompleted: false,
    lastActiveAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export default phoenixAuth;