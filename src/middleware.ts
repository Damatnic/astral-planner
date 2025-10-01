import { NextResponse, NextRequest } from 'next/server';
import { isPublicRoute } from './lib/auth/auth-utils';
import { 
  getSecurityHeaders, 
  generateCSPNonce, 
  RateLimitProtection,
  SecurityLogger 
} from './lib/security/security-hardening';

/**
 * Guardian Security Middleware
 * Enterprise-grade security and performance monitoring
 */
export default async function guardianMiddleware(req: NextRequest) {
  const startTime = Date.now();
  const nonce = generateCSPNonce();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-csp-nonce', nonce);
  
  try {
    const pathname = req.nextUrl.pathname;
    const method = req.method;
    const ip = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Rate limiting protection
    if (!RateLimitProtection.isAllowed(ip)) {
      SecurityLogger.logSecurityEvent({
        type: 'rate_limit',
        severity: 'medium',
        ip,
        userAgent,
        details: { pathname, method, rateLimitExceeded: true }
      });
      
      const rateLimitHeaders = getSecurityHeaders(nonce, true);
      return new NextResponse('Rate limit exceeded', { 
        status: 429,
        headers: {
          'Retry-After': '60',
          ...rateLimitHeaders,
          'X-CSP-Nonce': nonce
        }
      });
    }
    
    // Skip middleware for static assets and system routes
    if (shouldIgnoreRoute(pathname)) {
      return addEnhancedSecurityHeaders(
        NextResponse.next({
          request: {
            headers: new Headers(requestHeaders)
          }
        }),
        nonce
      );
    }
    
    // Security logging for API routes
    const isApiRoute = pathname.startsWith('/api/');
    if (isApiRoute) {
      SecurityLogger.logSecurityEvent({
        type: 'authentication',
        severity: 'low',
        ip,
        userAgent,
        details: { pathname, method, timestamp: new Date().toISOString() }
      });
    }
    
    // Public route check
    if (isPublicRoute(pathname)) {
      const response = NextResponse.next({
        request: {
          headers: new Headers(requestHeaders)
        }
      });
      addEnhancedSecurityHeaders(response, nonce, isApiRoute);
      return response;
    }
    
    // For now, allow all other routes (authentication can be added later)
    const response = NextResponse.next({
      request: {
        headers: new Headers(requestHeaders)
      }
    });
    addEnhancedSecurityHeaders(response, nonce, isApiRoute);
    
    // Performance monitoring
    const processingTime = Date.now() - startTime;
    response.headers.set('X-Processing-Time', processingTime.toString());
    response.headers.set('X-Request-ID', generateRequestId());
    
    return response;
    
  } catch (error) {
    SecurityLogger.logSecurityEvent({
      type: 'authentication',
      severity: 'high',
      ip: getClientIP(req),
      details: { error: error instanceof Error ? error.message : 'Unknown error', pathname: req.nextUrl.pathname }
    });
    
    // Fail gracefully
    const response = NextResponse.next({
      request: {
        headers: new Headers(requestHeaders)
      }
    });
    addEnhancedSecurityHeaders(response, nonce, false);
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
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIP || 'unknown';
  return ip.trim();
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add enhanced security headers to response
 */
function addEnhancedSecurityHeaders(response: NextResponse, nonce: string, isApiRoute: boolean = false): NextResponse {
  const headers = getSecurityHeaders(nonce, isApiRoute);
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add nonce for CSP
  response.headers.set('X-CSP-Nonce', nonce);
  
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