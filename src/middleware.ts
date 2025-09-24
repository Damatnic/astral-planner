import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/workspaces(.*)',
  '/settings(.*)',
  '/goals(.*)',
  '/habits(.*)',
  '/calendar(.*)',
  '/analytics(.*)',
  '/templates/create(.*)',
  '/api/(?!auth|health|public)(.*)'
]);

// Define public API routes
const isPublicApiRoute = createRouteMatcher([
  '/api/auth(.*)',
  '/api/health(.*)',
  '/api/public(.*)',
  '/api/webhooks(.*)',
  '/api/templates/public(.*)'
]);

// Define admin routes
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)'
]);

export default clerkMiddleware((auth, req: NextRequest) => {
  const { userId, sessionClaims } = auth();
  const url = req.nextUrl.clone();

  // Add security headers
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Rate limiting headers (would be implemented with Redis in production)
  response.headers.set('X-RateLimit-Limit', '1000');
  response.headers.set('X-RateLimit-Remaining', '999');
  response.headers.set('X-RateLimit-Reset', String(Date.now() + 3600000));

  // Handle admin routes
  if (isAdminRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
    
    const userRole = sessionClaims?.metadata?.role as string;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Handle protected routes
  if (isProtectedRoute(req)) {
    auth().protect();
    
    // Check if user has completed onboarding
    const onboardingCompleted = sessionClaims?.metadata?.onboardingCompleted as boolean;
    if (!onboardingCompleted && !req.nextUrl.pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }
  }

  // Handle public API routes
  if (isPublicApiRoute(req)) {
    // Add CORS headers for public API routes
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Handle API rate limiting
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // In production, implement Redis-based rate limiting here
    const rateLimitKey = userId || req.ip || 'anonymous';
    // Rate limiting logic would go here
  }

  // Add user context to headers for API routes
  if (userId && req.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('X-User-ID', userId);
    response.headers.set('X-Session-ID', sessionClaims?.sid as string || '');
  }

  // Handle maintenance mode
  if (process.env.MAINTENANCE_MODE === 'true' && !isAdminRoute(req)) {
    return NextResponse.redirect(new URL('/maintenance', req.url));
  }

  return response;
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'
  ]
};