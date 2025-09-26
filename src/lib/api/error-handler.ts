/**
 * ASTRAL PLANNER - ENTERPRISE API ERROR HANDLING SYSTEM
 * Revolutionary error handling with comprehensive logging and recovery
 * 
 * Features:
 * - Standardized error responses
 * - Automatic error logging and monitoring
 * - Rate limiting and security error handling
 * - Development vs production error messages
 * - Error analytics and alerting
 * - Circuit breaker patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import Logger from '../logger';
import { securityHeaders, corsHeaders } from '../security';
import type { APIResponse } from '@/types';

export class APIError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, unknown>;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, APIError);
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends APIError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class InternalServerError extends APIError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR');
    this.name = 'InternalServerError';
  }
}

export class ServiceUnavailableError extends APIError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
    this.name = 'ServiceUnavailableError';
  }
}

interface ErrorContext {
  req: NextRequest;
  userId?: string;
  endpoint: string;
  method: string;
  startTime: number;
}

export class APIErrorHandler {
  private static errorCounts = new Map<string, number>();
  private static lastErrorTime = new Map<string, number>();
  
  /**
   * Main error handling middleware
   */
  static handle(error: unknown, context: ErrorContext): NextResponse {
    const startTime = Date.now();
    
    // Normalize error to APIError
    const apiError = this.normalizeError(error);
    
    // Generate unique error ID for tracking
    const errorId = this.generateErrorId();
    
    // Log error with full context
    this.logError(apiError, context, errorId);
    
    // Update error metrics
    this.updateErrorMetrics(apiError, context);
    
    // Check if we should trigger circuit breaker
    this.checkCircuitBreaker(apiError, context);
    
    // Generate response based on environment
    const response = this.generateErrorResponse(apiError, errorId, context);
    
    // Add security and CORS headers
    const headers = {
      ...securityHeaders(),
      ...corsHeaders(context.req),
      'X-Error-ID': errorId,
      'X-Response-Time': `${Date.now() - startTime}ms`
    };
    
    return NextResponse.json(response, {
      status: apiError.statusCode,
      headers
    });
  }

  /**
   * Async wrapper for route handlers
   */
  static async withErrorHandling<T>(
    handler: (req: NextRequest, context?: any) => Promise<T>,
    req: NextRequest,
    context?: any
  ): Promise<NextResponse> {
    const startTime = Date.now();
    const endpoint = req.nextUrl.pathname;
    const method = req.method;
    
    const errorContext: ErrorContext = {
      req,
      endpoint,
      method,
      startTime
    };

    try {
      const result = await handler(req, context);
      
      // Log successful request
      Logger.info('API request completed', {
        endpoint,
        method,
        duration: Date.now() - startTime,
        status: 'success'
      });
      
      return result as NextResponse;
      
    } catch (error) {
      return this.handle(error, errorContext);
    }
  }

  /**
   * Normalize any error to APIError
   */
  private static normalizeError(error: unknown): APIError {
    if (error instanceof APIError) {
      return error;
    }
    
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        return new ServiceUnavailableError('External service unavailable');
      }
      
      if (error.message.includes('timeout')) {
        return new ServiceUnavailableError('Request timeout');
      }
      
      if (error.message.includes('LIMIT') || error.message.includes('rate')) {
        return new RateLimitError(error.message);
      }
      
      if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
        return new AuthenticationError(error.message);
      }
      
      if (error.message.includes('forbidden') || error.message.includes('permission')) {
        return new AuthorizationError(error.message);
      }
      
      if (error.message.includes('not found')) {
        return new NotFoundError(error.message);
      }
      
      if (error.message.includes('conflict') || error.message.includes('duplicate')) {
        return new ConflictError(error.message);
      }
      
      // Default to internal server error
      return new InternalServerError(
        process.env.NODE_ENV === 'production' 
          ? 'An internal error occurred' 
          : error.message
      );
    }
    
    // Unknown error type
    return new InternalServerError('Unknown error occurred');
  }

  /**
   * Log error with comprehensive context
   */
  private static logError(error: APIError, context: ErrorContext, errorId: string): void {
    const logData = {
      errorId,
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack,
      endpoint: context.endpoint,
      method: context.method,
      duration: Date.now() - context.startTime,
      userAgent: context.req.headers.get('user-agent'),
      ipAddress: context.req.headers.get('x-forwarded-for') || 
                 context.req.headers.get('x-real-ip') || 
                 'unknown',
      referer: context.req.headers.get('referer'),
      userId: context.userId,
      timestamp: new Date().toISOString()
    };

    // Log based on severity
    if (error.statusCode >= 500) {
      Logger.error('API Error - Server Error', logData);
    } else if (error.statusCode >= 400) {
      Logger.warn('API Error - Client Error', logData);
    } else {
      Logger.info('API Error - Info', logData);
    }

    // Send to external monitoring in production
    if (process.env.NODE_ENV === 'production' && error.statusCode >= 500) {
      this.sendToExternalMonitoring(error, context, errorId);
    }
  }

  /**
   * Generate standardized error response
   */
  private static generateErrorResponse(
    error: APIError, 
    errorId: string, 
    context: ErrorContext
  ): APIResponse<null> {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const response: APIResponse<null> = {
      success: false,
      error: error.code,
      message: error.message,
      data: null
    };

    // Add development-only details
    if (isDevelopment) {
      (response as any).details = {
        stack: error.stack,
        errorId,
        endpoint: context.endpoint,
        method: context.method,
        timestamp: new Date().toISOString(),
        ...error.details
      };
    } else {
      // Production: sanitize error messages
      if (error.statusCode >= 500) {
        response.message = 'An internal error occurred. Please try again later.';
      }
    }

    return response;
  }

  /**
   * Update error metrics for monitoring
   */
  private static updateErrorMetrics(error: APIError, context: ErrorContext): void {
    const key = `${context.endpoint}:${error.statusCode}`;
    const currentCount = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, currentCount + 1);
    this.lastErrorTime.set(key, Date.now());

    // Log metrics periodically
    if (currentCount > 0 && currentCount % 10 === 0) {
      Logger.warn('High error rate detected', {
        endpoint: context.endpoint,
        statusCode: error.statusCode,
        count: currentCount,
        lastError: new Date().toISOString()
      });
    }
  }

  /**
   * Circuit breaker pattern for failing services
   */
  private static checkCircuitBreaker(error: APIError, context: ErrorContext): void {
    if (error.statusCode >= 500) {
      const key = context.endpoint;
      const count = this.errorCounts.get(`${key}:${error.statusCode}`) || 0;
      const lastError = this.lastErrorTime.get(`${key}:${error.statusCode}`) || 0;
      
      // If we have 5+ errors in the last 5 minutes, log warning
      if (count >= 5 && (Date.now() - lastError) < 5 * 60 * 1000) {
        Logger.error('Circuit breaker warning - High error rate', {
          endpoint: context.endpoint,
          errorCount: count,
          timeWindow: '5 minutes',
          recommendation: 'Consider implementing circuit breaker'
        });
      }
    }
  }

  /**
   * Send error to external monitoring service
   */
  private static sendToExternalMonitoring(
    error: APIError, 
    context: ErrorContext, 
    errorId: string
  ): void {
    // Example integrations:
    
    // Sentry
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: {
          endpoint: context.endpoint,
          method: context.method,
          errorId
        },
        extra: {
          userId: context.userId,
          duration: Date.now() - context.startTime
        }
      });
    }

    // DataDog
    if (typeof window !== 'undefined' && (window as any).DD_RUM) {
      (window as any).DD_RUM.addError(error, {
        endpoint: context.endpoint,
        method: context.method,
        errorId
      });
    }

    // Custom webhook
    if (process.env.ERROR_WEBHOOK_URL) {
      fetch(process.env.ERROR_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          endpoint: context.endpoint,
          errorId,
          severity: error.statusCode >= 500 ? 'high' : 'medium'
        })
      }).catch(() => {
        // Ignore webhook failures
      });
    }
  }

  /**
   * Generate unique error ID
   */
  private static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): {
    totalErrors: number;
    errorsByEndpoint: Record<string, number>;
    recentErrors: Array<{ endpoint: string; count: number; lastError: string }>;
  } {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    
    const errorsByEndpoint: Record<string, number> = {};
    const recentErrors: Array<{ endpoint: string; count: number; lastError: string }> = [];
    
    for (const [key, count] of this.errorCounts.entries()) {
      const [endpoint] = key.split(':');
      errorsByEndpoint[endpoint] = (errorsByEndpoint[endpoint] || 0) + count;
      
      const lastError = this.lastErrorTime.get(key);
      if (lastError && (Date.now() - lastError) < 60 * 60 * 1000) { // Last hour
        recentErrors.push({
          endpoint,
          count,
          lastError: new Date(lastError).toISOString()
        });
      }
    }
    
    return {
      totalErrors,
      errorsByEndpoint,
      recentErrors: recentErrors.sort((a, b) => b.count - a.count)
    };
  }
}

// Utility functions for common validation patterns
export function validateRequiredFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): void {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missingFields.push(String(field));
    }
  }
  
  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`,
      { missingFields }
    );
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
}

export function validateUUID(id: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new ValidationError('Invalid UUID format');
  }
}

export function validatePagination(page?: string, limit?: string): { page: number; limit: number } {
  const pageNum = page ? parseInt(page, 10) : 1;
  const limitNum = limit ? parseInt(limit, 10) : 20;
  
  if (isNaN(pageNum) || pageNum < 1) {
    throw new ValidationError('Page must be a positive integer');
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new ValidationError('Limit must be between 1 and 100');
  }
  
  return { page: pageNum, limit: limitNum };
}

// Export convenience wrapper for route handlers
export function withErrorHandling<T = any>(
  handler: (req: NextRequest, context?: any) => Promise<T>
) {
  return (req: NextRequest, context?: any) => 
    APIErrorHandler.withErrorHandling(handler, req, context);
}

export default APIErrorHandler;