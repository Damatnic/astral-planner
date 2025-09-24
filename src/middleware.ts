import { authMiddleware } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export default authMiddleware({
  // Routes that can be accessed while signed out
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
  
  // Routes that can always be accessed, and have 
  // no authentication information
  ignoredRoutes: [
    '/api/health',
    '/_next/(.*)',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml'
  ],

  afterAuth: async (auth, req) => {
    // Apply rate limiting to API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      let rateLimitConfig = 'default';
      
      // Determine rate limit config based on route
      if (req.nextUrl.pathname.startsWith('/api/ai/')) {
        rateLimitConfig = 'ai';
      } else if (req.nextUrl.pathname.startsWith('/api/export/')) {
        rateLimitConfig = 'export';
      } else if (req.nextUrl.pathname.startsWith('/api/auth/')) {
        rateLimitConfig = 'auth';
      } else if (req.nextUrl.pathname.includes('/webhook')) {
        rateLimitConfig = 'webhook';
      }

      const rateLimitResult = await checkRateLimit(req, rateLimitConfig);
      
      if (!rateLimitResult.success) {
        return rateLimitResponse(
          'Too many requests. Please try again later.',
          rateLimitResult.reset
        );
      }
    }
    
    // Add security headers to response
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Handle maintenance mode
    if (process.env.MAINTENANCE_MODE === 'true' && !req.nextUrl.pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/maintenance', req.url));
    }

    // If user is signed in and trying to access sign-in or sign-up, redirect to dashboard
    if (auth.userId && (req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up'))) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // If user is not signed in and trying to access protected routes, redirect to sign-in
    if (!auth.userId && !auth.isPublicRoute) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    // Handle admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (!auth.userId) {
        return NextResponse.redirect(new URL('/sign-in', req.url));
      }
      
      const userRole = auth.sessionClaims?.metadata?.role as string;
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Check onboarding completion
    if (auth.userId && !req.nextUrl.pathname.startsWith('/onboarding')) {
      const onboardingCompleted = auth.sessionClaims?.metadata?.onboardingCompleted as boolean;
      if (!onboardingCompleted) {
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }
    }

    return response;
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'
  ]
};