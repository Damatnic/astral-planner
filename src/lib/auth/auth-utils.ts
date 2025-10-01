import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Logger as authLogger } from '@/lib/logger/edge';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'premium';
  pin?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  name?: string;
  isDemo?: boolean;
}

export interface AuthContext {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isDemo: boolean;
}

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key-for-development-only'
);

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { jwtVerify } = await import('jose');
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as AuthUser;
  } catch (error) {
    authLogger.error('Token verification failed', error as Error);
    return null;
  }
}

export async function getAuthContext(request: NextRequest): Promise<AuthContext> {
  // ENHANCED AUTHENTICATION WITH MULTIPLE FALLBACKS
  
  // Check for demo user authentication first (most common case)
  const demoHeader = request.headers.get('x-demo-user');
  const demoToken = request.headers.get('x-demo-token');
  const userDataHeader = request.headers.get('x-user-data');
  const pinHeader = request.headers.get('x-pin');
  
  // Demo user authentication
  if (demoHeader === 'demo-user' || 
      demoToken === 'demo-token-2024' ||
      userDataHeader?.includes('demo-user') ||
      pinHeader === '0000') {
    authLogger.debug('Demo user authenticated via headers', { action: 'demoAuth' });
    return {
      user: {
        id: 'demo-user',
        email: 'demo@astralchronos.com',
        role: 'user',
        firstName: 'Demo',
        lastName: 'User',
        name: 'Demo User',
        imageUrl: '/avatars/demo-user.png',
        isDemo: true
      },
      isAuthenticated: true,
      isDemo: true
    };
  }

  // Nick's planner authentication
  if (userDataHeader?.includes('nick-planner') || pinHeader === '7347') {
    authLogger.debug('Premium user authenticated via headers', { action: 'premiumAuth', userId: 'nick-planner' });
    return {
      user: {
        id: 'nick-planner',
        email: 'nick@example.com',
        role: 'premium',
        firstName: 'Nick',
        lastName: 'Planner',
        name: "Nick's Planner",
        imageUrl: '/avatars/nick-planner.png',
        isDemo: false
      },
      isAuthenticated: true,
      isDemo: false
    };
  }

  // JWT TOKEN AUTHENTICATION
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;
  
  if (token) {
    try {
      const user = await verifyToken(token);
      if (user) {
        return {
          user,
          isAuthenticated: true,
          isDemo: false
        };
      }
    } catch (error) {
      authLogger.warn('Token verification failed', { action: 'tokenAuth' });
    }
  }

  // No authentication found
  return {
    user: null,
    isAuthenticated: false,
    isDemo: false
  };
}

export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/',
    '/api/health',
    '/api/public',
    '/api/webhooks',
    '/api/templates/public',
    '/api/auth',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.json'
  ];
  
  return publicRoutes.some(route => {
    if (route.endsWith('(.*)')|| route.includes('(.*)')) {
      const baseRoute = route.replace('(.*)', '');
      return pathname.startsWith(baseRoute);
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

export function shouldIgnoreRoute(pathname: string): boolean {
  const ignoredPatterns = [
    /^\/_next\//,
    /^\/favicon\.ico$/,
    /^\/robots\.txt$/,
    /^\/sitemap\.xml$/,
    /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i
  ];
  
  return ignoredPatterns.some(pattern => pattern.test(pathname));
}

// Legacy functions for backward compatibility
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const authContext = await getAuthContext(request);
  if (!authContext.isAuthenticated || !authContext.user) {
    throw new Error('Authentication required');
  }
  return authContext.user;
}

export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  const authContext = await getAuthContext(request);
  return authContext.user;
}

export async function requirePermission(request: NextRequest, permission: string): Promise<void> {
  const user = await requireAuth(request);
  // Simple permission check - in production this would check against a permissions database
  authLogger.debug('Permission check', { userId: user.id, action: 'permissionCheck', metadata: { permission } });
}

export async function requireFeature(request: NextRequest, feature: string): Promise<void> {
  const user = await requireAuth(request);
  // Simple feature check - in production this would check against feature flags
  authLogger.debug('Feature check', { userId: user.id, action: 'featureCheck', metadata: { feature } });
}

export async function hasPermission(request: NextRequest, permission: string): Promise<boolean> {
  try {
    await requirePermission(request, permission);
    return true;
  } catch {
    return false;
  }
}

interface UsageResult {
  allowed: boolean;
  current: number;
  limit: number;
}

export async function checkUsageLimits(request: NextRequest, resource: string): Promise<UsageResult> {
  const user = await requireAuth(request);
  // Simple usage check - in production this would check against usage database
  authLogger.debug('Usage check', { userId: user.id, action: 'usageCheck', metadata: { resource } });
  return {
    allowed: true,
    current: 0,
    limit: 100
  };
}

/**
 * Authentication middleware - requires user to be authenticated
 */
export function withAuth(
  handler: (req: NextRequest, context: Record<string, unknown>) => Promise<Response>
) {
  return async (req: NextRequest, context: Record<string, unknown>) => {
    try {
      await requireAuth(req);
      return await handler(req, context);
    } catch (error: unknown) {
      authLogger.warn('Authentication required', { 
        action: 'withAuth',
        metadata: { path: req.nextUrl.pathname }
      });
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }
  };
}

/**
 * Role-based middleware - requires specific user role
 */
export function withRole(
  requiredRole: 'admin' | 'user' | 'premium',
  handler: (req: NextRequest, context: Record<string, unknown>) => Promise<Response>
) {
  return async (req: NextRequest, context: Record<string, unknown>) => {
    try {
      const user = await requireAuth(req);
      
      // Check if user has required role or higher
      const roleHierarchy: { [key: string]: number } = { user: 0, premium: 1, admin: 2 };
      
      const userRoleLevel = roleHierarchy[user.role] ?? 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] ?? 0;
      
      if (userRoleLevel < requiredRoleLevel) {
        throw new Error('Insufficient role');
      }
      
      return await handler(req, context);
    } catch (error: unknown) {
      const user = await getUserFromRequest(req);
      authLogger.warn('Role requirement not met', { 
        userId: user?.id,
        action: 'withRole',
        metadata: { 
          requiredRole,
          path: req.nextUrl.pathname
        }
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
 * Feature flag middleware - requires feature to be enabled
 */
export function withFeature(
  feature: string,
  handler: (req: NextRequest, context: Record<string, unknown>) => Promise<Response>
) {
  return async (req: NextRequest, context: Record<string, unknown>) => {
    try {
      await requireFeature(req, feature);
      return await handler(req, context);
    } catch (error: unknown) {
      const user = await getUserFromRequest(req);
      authLogger.warn('Feature not available', { 
        userId: user?.id,
        action: 'withFeature',
        metadata: {
          feature,
          path: req.nextUrl.pathname
        }
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
 * Usage limits middleware - checks if user can perform action
 */
export function withUsageLimit(
  resource: string,
  handler: (req: NextRequest, context: Record<string, unknown>) => Promise<Response>
) {
  return async (req: NextRequest, context: Record<string, unknown>) => {
    try {
      const usage = await checkUsageLimits(req, resource);
      
      if (!usage.allowed) {
        const user = await getUserFromRequest(req);
        authLogger.warn('Usage limit exceeded', { 
          userId: user?.id,
          action: 'withUsageLimit',
          metadata: {
            resource,
            current: usage.current,
            limit: usage.limit,
            path: req.nextUrl.pathname
          }
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
    } catch (error: unknown) {
      authLogger.error('Usage limit check failed', error as Error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Admin-only middleware
 */
export function withAdmin(
  handler: (req: NextRequest, context: Record<string, unknown>) => Promise<Response>
) {
  return withRole('admin', handler);
}