import { NextResponse, NextRequest } from 'next/server';
import { getAuthContext, isPublicRoute, shouldIgnoreRoute } from './lib/auth/auth-utils';

// Enhanced middleware with authentication support for PIN-based and JWT auth
export default async function middleware(req: NextRequest) {
  try {
    const pathname = req.nextUrl.pathname;
    
    console.log(`[MIDDLEWARE] ${req.method} ${pathname}`);
    
    // Skip middleware for static files and ignored routes
    if (shouldIgnoreRoute(pathname)) {
      return NextResponse.next();
    }
    
    const response = NextResponse.next();
    
    // Add security headers to all responses
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Skip auth for public routes
    if (isPublicRoute(pathname)) {
      return response;
    }
    
    // Check authentication for protected routes
    const authContext = await getAuthContext(req);
    
    if (!authContext.isAuthenticated) {
      // For API routes, return JSON error instead of HTML redirect
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      }
      
      // Redirect unauthenticated users to home page for non-API routes
      const loginUrl = new URL('/', req.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Add user context to response headers for client-side access
    if (authContext.user) {
      response.headers.set('X-User-ID', authContext.user.id);
      response.headers.set('X-User-Role', authContext.user.role);
      response.headers.set('X-Is-Demo', authContext.isDemo.toString());
    }
    
    return response;
    
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Allow request to proceed even on error
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'
  ]
};

/* 
ORIGINAL CLERK MIDDLEWARE - COMMENTED OUT FOR TESTING

import { authMiddleware } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export default authMiddleware({
  publicRoutes: [
    '/',
    '/api/health(.*)',
    '/api/public(.*)',
    '/api/webhooks(.*)',
    '/api/templates/public(.*)',
    '/api/auth/(.*)',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/templates(.*)',
  ],
  
  ignoredRoutes: [
    '/api/health',
    '/_next/(.*)',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml'
  ],

  afterAuth: async (auth, req) => {
    // Add rate limiting and other logic here
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    return response;
  }
});

*/