import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, requireFeature, hasPermission } from './permissions';
import { requireAuth, getUserFromRequest } from '../auth';
import Logger from '../logger';

/**
 * Authentication middleware - requires user to be authenticated
 */
export function withAuth(
  handler: (req: NextRequest, context: any) => Promise<Response>
) {
  return async (req: NextRequest, context: any) => {
    try {
      await requireAuth(req);
      return await handler(req, context);
    } catch (error: any) {
      Logger.warn('Authentication required:', { path: req.nextUrl.pathname });
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }
  };
}

/**
 * Permission-based middleware - requires specific permission
 */
export function withPermission(
  permission: string,
  handler: (req: NextRequest, context: any) => Promise<Response>
) {
  return async (req: NextRequest, context: any) => {
    try {
      await requirePermission(req, permission);
      return await handler(req, context);
    } catch (error: any) {
      const user = await getUserFromRequest(req);
      Logger.warn('Permission denied:', { 
        userId: user?.id, 
        permission,
        path: req.nextUrl.pathname 
      });
      
      return NextResponse.json(
        { 
          error: 'Insufficient permissions', 
          code: 'PERMISSION_DENIED',
          required: permission
        },
        { status: 403 }
      );
    }
  };
}

/**
 * Feature flag middleware - requires feature to be enabled
 */
export function withFeature(
  feature: string,
  handler: (req: NextRequest, context: any) => Promise<Response>
) {
  return async (req: NextRequest, context: any) => {
    try {
      await requireFeature(req, feature as any);
      return await handler(req, context);
    } catch (error: any) {
      const user = await getUserFromRequest(req);
      Logger.warn('Feature not available:', { 
        userId: user?.id, 
        feature,
        path: req.nextUrl.pathname 
      });
      
      return NextResponse.json(
        { 
          error: 'Feature not available', 
          code: 'FEATURE_UNAVAILABLE',
          feature,
          upgradeRequired: true
        },
        { status: 402 } // Payment required
      );
    }
  };
}

/**
 * Role-based middleware - requires specific user role
 */
export function withRole(
  requiredRole: 'FREE' | 'PRO' | 'TEAM' | 'ADMIN',
  handler: (req: NextRequest, context: any) => Promise<Response>
) {
  return async (req: NextRequest, context: any) => {
    try {
      const user = await requireAuth(req);
      
      // Check if user has required role or higher
      const roleHierarchy: { [key: string]: number } = { FREE: 0, PRO: 1, TEAM: 2, ADMIN: 3 };
      const userRole = await getUserRoleFromDB(user.id);
      
      const userRoleLevel = roleHierarchy[userRole] ?? 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] ?? 0;
      
      if (userRoleLevel < requiredRoleLevel) {
        throw new Error('Insufficient role');
      }
      
      return await handler(req, context);
    } catch (error: any) {
      const user = await getUserFromRequest(req);
      Logger.warn('Role requirement not met:', { 
        userId: user?.id, 
        requiredRole,
        path: req.nextUrl.pathname 
      });
      
      return NextResponse.json(
        { 
          error: 'Insufficient role', 
          code: 'ROLE_REQUIRED',
          required: requiredRole
        },
        { status: 403 }
      );
    }
  };
}

/**
 * Admin-only middleware
 */
export function withAdmin(
  handler: (req: NextRequest, context: any) => Promise<Response>
) {
  return withRole('ADMIN', handler);
}

/**
 * Usage limits middleware - checks if user can perform action
 */
export function withUsageLimit(
  resource: string,
  handler: (req: NextRequest, context: any) => Promise<Response>
) {
  return async (req: NextRequest, context: any) => {
    try {
      const { checkUsageLimits } = await import('./permissions');
      const usage = await checkUsageLimits(req, resource);
      
      if (!usage.allowed) {
        const user = await getUserFromRequest(req);
        Logger.warn('Usage limit exceeded:', { 
          userId: user?.id, 
          resource,
          current: usage.current,
          limit: usage.limit,
          path: req.nextUrl.pathname 
        });
        
        return NextResponse.json(
          { 
            error: 'Usage limit exceeded', 
            code: 'USAGE_LIMIT_EXCEEDED',
            resource,
            current: usage.current,
            limit: usage.limit,
            upgradeRequired: true
          },
          { status: 402 } // Payment required
        );
      }
      
      return await handler(req, context);
    } catch (error: any) {
      Logger.error('Usage limit check failed:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Multiple middleware composer
 */
export function withMiddleware(
  middlewares: Array<(handler: any) => any>,
  handler: (req: NextRequest, context: any) => Promise<Response>
) {
  return middlewares.reduce(
    (acc, middleware) => middleware(acc),
    handler
  );
}

// Helper function to get user role (internal use)
async function getUserRoleFromDB(userId: string) {
  try {
    const { db } = await import('@/db');
    const { eq } = await import('drizzle-orm');
    const { users } = await import('@/db/schema/users');
    
    const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userRecord[0];
    
    if (!user || !user.subscription) {
      return 'FREE';
    }
    
    const subscription = user.subscription as { plan?: string };
    return subscription.plan?.toUpperCase() || 'FREE';
  } catch (error) {
    Logger.error('Error fetching user role:', error);
    return 'FREE';
  }
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100,
  handler: (req: NextRequest, context: any) => Promise<Response>
) {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return async (req: NextRequest, context: any) => {
    try {
      const user = await getUserFromRequest(req);
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'anonymous';
      const key = user?.id || ip;
      const now = Date.now();
      
      const userRequests = requests.get(key);
      
      if (userRequests && now < userRequests.resetTime) {
        if (userRequests.count >= maxRequests) {
          Logger.warn('Rate limit exceeded:', { key, count: userRequests.count });
          return NextResponse.json(
            { 
              error: 'Rate limit exceeded', 
              code: 'RATE_LIMIT_EXCEEDED',
              retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
            },
            { 
              status: 429,
              headers: {
                'Retry-After': Math.ceil((userRequests.resetTime - now) / 1000).toString(),
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': Math.max(0, maxRequests - userRequests.count - 1).toString(),
                'X-RateLimit-Reset': new Date(userRequests.resetTime).toISOString()
              }
            }
          );
        }
        userRequests.count++;
      } else {
        requests.set(key, { count: 1, resetTime: now + windowMs });
      }
      
      return await handler(req, context);
    } catch (error: any) {
      Logger.error('Rate limit middleware error:', error);
      return await handler(req, context); // Continue on middleware error
    }
  };
}