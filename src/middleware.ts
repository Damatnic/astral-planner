import { NextResponse, NextRequest } from 'next/server';
import { isPublicRoute } from './lib/auth/auth-utils';

/**
 * Catalyst Performance Middleware
 * Lightweight security and performance monitoring
 */
export default async function catalystMiddleware(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const pathname = req.nextUrl.pathname;
    const method = req.method;
    
    // Skip middleware for static assets and system routes
    if (shouldIgnoreRoute(pathname)) {
      return addSecurityHeaders(NextResponse.next());
    }
    
    // Public route check
    if (isPublicRoute(pathname)) {
      const response = NextResponse.next();
      addSecurityHeaders(response);
      return response;
    }
    
    // For now, allow all other routes (authentication can be added later)
    const response = NextResponse.next();
    addSecurityHeaders(response);
    
    // Performance monitoring
    const processingTime = Date.now() - startTime;
    response.headers.set('X-Processing-Time', processingTime.toString());
    
    return response;
    
  } catch (error) {
    console.error('[CATALYST] Middleware error:', error);
    
    // Fail gracefully
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }
}

/**
 * Check if route should be ignored by middleware
 */
function shouldIgnoreRoute(pathname: string): boolean {
  const ignoredPatterns = [
    /^\/_next\//,
    /^\/favicon\.ico$/,
    /^\/robots\.txt$/,
    /^\/sitemap\.xml$/,
    /^\/manifest\.json$/,
    /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|avif)$/i,
  ];
  
  return ignoredPatterns.some(pattern => pattern.test(pathname));
}

/**
 * Get comprehensive security headers
 */
function getSecurityHeaders(): Record<string, string> {
  return {
    // Frame protection
    'X-Frame-Options': 'DENY',
    
    // Content type protection
    'X-Content-Type-Options': 'nosniff',
    
    // XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // HSTS
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Permissions policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
    
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com https://r2cdn.perplexity.ai",
      "img-src 'self' data: https:",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
    
    // Server identification
    'X-Powered-By': 'Catalyst Performance Framework',
    
    // Cache control for sensitive responses
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders();
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
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