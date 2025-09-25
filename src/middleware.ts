import { NextResponse, NextRequest } from 'next/server';
import { getUserForRequest } from '@/lib/auth';
import Logger from '@/lib/logger';

// Production-ready middleware with proper authentication
export default async function middleware(req: NextRequest) {
  const startTime = Date.now();
  Logger.info(`Middleware: ${req.method} ${req.nextUrl.pathname}`, {
    userAgent: req.headers.get('user-agent')?.substring(0, 100),
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  });

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/api/health',
    '/api/health/simple',
    '/api/health/db',
    '/api/cron/cleanup',
    '/api/monitoring',
    '/sign-in',
    '/sign-up'
  ];

  const isPublicRoute = publicRoutes.some(route => 
    req.nextUrl.pathname === route || 
    req.nextUrl.pathname.startsWith(`${route}/`)
  );

  // Skip auth for public routes, static files, and Next.js internals
  if (
    isPublicRoute ||
    req.nextUrl.pathname.startsWith('/_next/') ||
    req.nextUrl.pathname.startsWith('/static/') ||
    req.nextUrl.pathname.includes('.') // Static files (css, js, images, etc.)
  ) {
    const response = NextResponse.next();
    
    // Add security headers to all responses
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    return response;
  }

  try {
    // Check authentication for protected routes
    const user = await getUserForRequest(req);
    
    // Check if Stack Auth is configured
    const isStackAuthConfigured = process.env.STACK_PROJECT_ID && process.env.STACK_SECRET_SERVER_KEY;
    
    if (!user && isStackAuthConfigured) {
      Logger.warn(`Unauthorized access attempt to ${req.nextUrl.pathname}`, {
        ip: req.headers.get('x-forwarded-for') || 'unknown'
      });
      
      // For API routes, return JSON error
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { 
            status: 401,
            headers: {
              'X-Frame-Options': 'DENY',
              'X-Content-Type-Options': 'nosniff',
              'Referrer-Policy': 'strict-origin-when-cross-origin'
            }
          }
        );
      }
      
      // For pages, redirect to home
      const loginUrl = new URL('/', req.url);
      loginUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // If Stack Auth is not configured, allow all routes temporarily
    if (!isStackAuthConfigured) {
      console.warn(`Stack Auth not configured - allowing unauthenticated access to ${req.nextUrl.pathname}`);
      const response = NextResponse.next();
      
      // Add security headers even without authentication
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('X-DNS-Prefetch-Control', 'on');
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      
      return response;
    }

    // User is authenticated - add user info to headers for API routes
    const response = NextResponse.next();
    
    // Add security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Add user context for API routes
    if (req.nextUrl.pathname.startsWith('/api/') && user) {
      response.headers.set('x-user-id', user.id);
      response.headers.set('x-user-email', user.email);
    }
    
    const responseTime = Date.now() - startTime;
    Logger.info(`Middleware completed`, { 
      path: req.nextUrl.pathname,
      userId: user?.id || 'unauthenticated',
      responseTime: `${responseTime}ms`
    });
    
    return response;
    
  } catch (error) {
    Logger.error('Middleware error:', error);
    
    // Return error response for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { 
          status: 500,
          headers: {
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff'
          }
        }
      );
    }
    
    // Redirect to error page for regular routes
    return NextResponse.redirect(new URL('/error', req.url));
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