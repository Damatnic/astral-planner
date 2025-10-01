/**
 * GUARDIAN API SECURITY MIDDLEWARE
 * Enterprise-grade API endpoint protection and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  SQLInjectionProtection, 
  XSSProtection, 
  CSRFProtection,
  InputSanitizer,
  RateLimitProtection,
  SecurityLogger 
} from './security-hardening';
import { requireAuth } from '@/lib/auth/auth-service';
import { Logger } from '@/lib/logger/edge';

export interface SecurityValidationResult {
  valid: boolean;
  sanitizedData: any;
  errors: string[];
  threats: string[];
}

export interface APISecurityConfig {
  requireAuth: boolean;
  requireCSRF: boolean;
  rateLimitConfig?: {
    maxRequests: number;
    windowMs: number;
  };
  inputValidation: boolean;
  threatDetection: boolean;
  logLevel: 'low' | 'medium' | 'high';
}

/**
 * Comprehensive API Security Wrapper
 */
export function withAPISecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: APISecurityConfig = {
    requireAuth: true,
    requireCSRF: false,
    inputValidation: true,
    threatDetection: true,
    logLevel: 'medium'
  }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const requestId = generateRequestId();

    try {
      // 1. Rate Limiting Protection
      if (config.rateLimitConfig || true) {
        const maxRequests = config.rateLimitConfig?.maxRequests || 100;
        
        if (!RateLimitProtection.isAllowed(ip, maxRequests)) {
          SecurityLogger.logSecurityEvent({
            type: 'rate_limit',
            severity: 'medium',
            ip,
            userAgent,
            details: { 
              requestId,
              endpoint: request.nextUrl.pathname,
              exceeded: true 
            }
          });

          return NextResponse.json(
            { 
              error: 'Rate limit exceeded',
              retryAfter: 60,
              requestId 
            },
            { 
              status: 429,
              headers: {
                'Retry-After': '60',
                'X-Request-ID': requestId,
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString()
              }
            }
          );
        }
      }

      // 2. Authentication Check
      let user = null;
      if (config.requireAuth) {
        try {
          user = await requireAuth(request);
        } catch (authError) {
          SecurityLogger.logSecurityEvent({
            type: 'authentication',
            severity: 'medium',
            ip,
            userAgent,
            details: { 
              requestId,
              endpoint: request.nextUrl.pathname,
              authError: authError instanceof Error ? authError.message : 'Authentication failed'
            }
          });

          return NextResponse.json(
            { 
              error: 'Authentication required',
              requestId 
            },
            { 
              status: 401,
              headers: {
                'X-Request-ID': requestId,
                'WWW-Authenticate': 'Bearer'
              }
            }
          );
        }
      }

      // 3. CSRF Protection (for state-changing operations)
      if (config.requireCSRF && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        const csrfToken = request.headers.get('x-csrf-token');
        const sessionId = user?.sessionId || 'anonymous';

        if (!csrfToken || !CSRFProtection.validateToken(sessionId, csrfToken)) {
          SecurityLogger.logSecurityEvent({
            type: 'csrf',
            severity: 'high',
            ip,
            userAgent,
            userId: user?.id,
            details: { 
              requestId,
              endpoint: request.nextUrl.pathname,
              csrfValidation: 'failed'
            }
          });

          return NextResponse.json(
            { 
              error: 'CSRF token validation failed',
              requestId 
            },
            { 
              status: 403,
              headers: {
                'X-Request-ID': requestId
              }
            }
          );
        }
      }

      // 4. Input Validation and Sanitization
      let sanitizedRequest = request;
      if (config.inputValidation && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const body = await request.json();
          const validationResult = await validateAndSanitizeInput(body, request.nextUrl.pathname);

          if (!validationResult.valid) {
            SecurityLogger.logSecurityEvent({
              type: 'input_validation',
              severity: validationResult.threats.length > 0 ? 'high' : 'medium',
              ip,
              userAgent,
              userId: user?.id,
              details: { 
                requestId,
                endpoint: request.nextUrl.pathname,
                errors: validationResult.errors,
                threats: validationResult.threats
              }
            });

            return NextResponse.json(
              { 
                error: 'Input validation failed',
                details: validationResult.errors,
                requestId 
              },
              { 
                status: 400,
                headers: {
                  'X-Request-ID': requestId
                }
              }
            );
          }

          // Create new request with sanitized data
          sanitizedRequest = new NextRequest(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(validationResult.sanitizedData),
          });
        } catch (jsonError) {
          return NextResponse.json(
            { 
              error: 'Invalid JSON in request body',
              requestId 
            },
            { 
              status: 400,
              headers: {
                'X-Request-ID': requestId
              }
            }
          );
        }
      }

      // 5. Threat Detection
      if (config.threatDetection) {
        const threatAnalysis = await analyzeRequestForThreats(request);
        if (threatAnalysis.threatsDetected.length > 0) {
          SecurityLogger.logSecurityEvent({
            type: 'sql_injection',
            severity: 'critical',
            ip,
            userAgent,
            userId: user?.id,
            details: { 
              requestId,
              endpoint: request.nextUrl.pathname,
              threats: threatAnalysis.threatsDetected
            }
          });

          // Block the request if critical threats detected
          if (threatAnalysis.blockRequest) {
            return NextResponse.json(
              { 
                error: 'Request blocked due to security threat',
                requestId 
              },
              { 
                status: 403,
                headers: {
                  'X-Request-ID': requestId
                }
              }
            );
          }
        }
      }

      // 6. Execute the actual handler with security context
      const response = await handler(sanitizedRequest);

      // 7. Add security headers to response
      const securityHeaders = getResponseSecurityHeaders(requestId);
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      // 8. Log successful request
      const processingTime = Date.now() - startTime;
      if (config.logLevel !== 'low') {
        Logger.info('API request processed', {
          requestId,
          endpoint: request.nextUrl.pathname,
          method: request.method,
          userId: user?.id,
          processingTime,
          status: response.status
        });
      }

      return response;

    } catch (error) {
      // Security error handling
      const processingTime = Date.now() - startTime;
      
      SecurityLogger.logSecurityEvent({
        type: 'authentication',
        severity: 'high',
        ip,
        userAgent,
        details: { 
          requestId,
          endpoint: request.nextUrl.pathname,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime
        }
      });

      Logger.error('API security middleware error', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        endpoint: request.nextUrl.pathname
      });

      return NextResponse.json(
        { 
          error: 'Internal security error',
          requestId 
        },
        { 
          status: 500,
          headers: {
            'X-Request-ID': requestId,
            'Cache-Control': 'no-store'
          }
        }
      );
    }
  };
}

/**
 * Advanced Input Validation and Sanitization
 */
async function validateAndSanitizeInput(data: any, endpoint: string): Promise<SecurityValidationResult> {
  const errors: string[] = [];
  const threats: string[] = [];
  
  try {
    // Basic structure validation
    if (data === null || data === undefined) {
      return {
        valid: true,
        sanitizedData: data,
        errors: [],
        threats: []
      };
    }

    // SQL Injection Detection
    const sqlCheck = detectSQLInjectionInData(data);
    if (sqlCheck.detected) {
      threats.push('SQL injection patterns detected');
      errors.push('Invalid input detected');
    }

    // XSS Detection
    const xssCheck = detectXSSInData(data);
    if (xssCheck.detected) {
      threats.push('XSS patterns detected');
      errors.push('Potentially malicious content detected');
    }

    // Sanitize the data
    const sanitizedData = InputSanitizer.sanitizeObject(data);

    // Endpoint-specific validation
    const endpointValidation = validateEndpointSpecificRules(sanitizedData, endpoint);
    if (!endpointValidation.valid) {
      errors.push(...endpointValidation.errors);
    }

    return {
      valid: threats.length === 0 && errors.length === 0,
      sanitizedData,
      errors,
      threats
    };

  } catch (error) {
    return {
      valid: false,
      sanitizedData: null,
      errors: ['Input validation failed'],
      threats: ['Validation error']
    };
  }
}

/**
 * SQL Injection Detection in nested data
 */
function detectSQLInjectionInData(data: any): { detected: boolean; locations: string[] } {
  const locations: string[] = [];
  
  function checkValue(value: any, path: string = '') {
    if (typeof value === 'string') {
      if (SQLInjectionProtection.detectSQLInjection(value)) {
        locations.push(path);
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => checkValue(item, `${path}[${index}]`));
    } else if (value && typeof value === 'object') {
      Object.entries(value).forEach(([key, val]) => 
        checkValue(val, path ? `${path}.${key}` : key)
      );
    }
  }
  
  checkValue(data);
  
  return {
    detected: locations.length > 0,
    locations
  };
}

/**
 * XSS Detection in nested data
 */
function detectXSSInData(data: any): { detected: boolean; locations: string[] } {
  const locations: string[] = [];
  
  function checkValue(value: any, path: string = '') {
    if (typeof value === 'string') {
      if (XSSProtection.detectXSS(value)) {
        locations.push(path);
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => checkValue(item, `${path}[${index}]`));
    } else if (value && typeof value === 'object') {
      Object.entries(value).forEach(([key, val]) => 
        checkValue(val, path ? `${path}.${key}` : key)
      );
    }
  }
  
  checkValue(data);
  
  return {
    detected: locations.length > 0,
    locations
  };
}

/**
 * Endpoint-specific validation rules
 */
function validateEndpointSpecificRules(data: any, endpoint: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Task creation validation
  if (endpoint.includes('/api/tasks')) {
    if (data.title && typeof data.title === 'string') {
      if (data.title.length > 200) {
        errors.push('Title must be less than 200 characters');
      }
      if (data.title.trim().length === 0) {
        errors.push('Title cannot be empty');
      }
    }
    
    if (data.description && typeof data.description === 'string' && data.description.length > 2000) {
      errors.push('Description must be less than 2000 characters');
    }
    
    if (data.priority && !['low', 'medium', 'high', 'critical'].includes(data.priority)) {
      errors.push('Invalid priority value');
    }
  }
  
  // User settings validation
  if (endpoint.includes('/api/user/settings')) {
    if (data.email && typeof data.email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Invalid email format');
      }
    }
  }
  
  // Admin endpoints validation
  if (endpoint.includes('/api/admin/')) {
    if (data.userId && typeof data.userId === 'string') {
      if (!data.userId.match(/^[a-zA-Z0-9-_]+$/)) {
        errors.push('Invalid user ID format');
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Advanced Threat Analysis
 */
async function analyzeRequestForThreats(request: NextRequest): Promise<{
  threatsDetected: string[];
  riskScore: number;
  blockRequest: boolean;
}> {
  const threats: string[] = [];
  let riskScore = 0;

  // Analyze URL for suspicious patterns
  const url = request.nextUrl.pathname + request.nextUrl.search;
  if (url.includes('../') || url.includes('..\\')) {
    threats.push('Path traversal attempt');
    riskScore += 30;
  }

  // Check for suspicious headers
  const userAgent = request.headers.get('user-agent') || '';
  if (userAgent.includes('sqlmap') || userAgent.includes('nikto') || userAgent.includes('nmap')) {
    threats.push('Suspicious user agent');
    riskScore += 50;
  }

  // Check for script injection in headers
  const suspiciousHeaders = ['x-forwarded-for', 'referer', 'origin'];
  for (const header of suspiciousHeaders) {
    const value = request.headers.get(header);
    if (value && XSSProtection.detectXSS(value)) {
      threats.push(`XSS attempt in ${header} header`);
      riskScore += 40;
    }
  }

  // Analyze request frequency patterns (simple implementation)
  const ip = getClientIP(request);
  const recentRequests = RateLimitProtection.getStatus(ip);
  if (!recentRequests.allowed) {
    threats.push('Rate limit exceeded');
    riskScore += 20;
  }

  return {
    threatsDetected: threats,
    riskScore,
    blockRequest: riskScore >= 70 // Block if risk score is high
  };
}

/**
 * Security Response Headers
 */
function getResponseSecurityHeaders(requestId: string): Record<string, string> {
  return {
    'X-Request-ID': requestId,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
}

/**
 * Utility Functions
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIP || 'unknown';
  return ip.trim();
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Demo Account Security Isolation
 */
export function withDemoAccountIsolation(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const user = await requireAuth(request);
      
      // If demo account, add security restrictions
      if (user.isDemo) {
        // Block certain dangerous operations for demo accounts
        const dangerousEndpoints = [
          '/api/admin/',
          '/api/user/delete',
          '/api/export/production'
        ];
        
        const isDangerous = dangerousEndpoints.some(endpoint => 
          request.nextUrl.pathname.startsWith(endpoint)
        );
        
        if (isDangerous) {
          SecurityLogger.logSecurityEvent({
            type: 'authorization',
            severity: 'medium',
            userId: user.id,
            details: {
              action: 'blocked_demo_access',
              endpoint: request.nextUrl.pathname,
              reason: 'Demo account restrictions'
            }
          });
          
          return NextResponse.json(
            { error: 'Demo accounts cannot access this feature' },
            { status: 403 }
          );
        }
        
        // Add demo account headers
        const response = await handler(request);
        response.headers.set('X-Demo-Account', 'true');
        response.headers.set('X-Account-Restrictions', 'demo-limitations-active');
        return response;
      }
      
      return handler(request);
    } catch (error) {
      return handler(request);
    }
  };
}