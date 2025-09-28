/**
 * GUARDIAN SECURE ERROR HANDLER
 * Production-ready error handling that prevents information disclosure
 */

import { NextResponse } from 'next/server';
import Logger from '@/lib/logger';
import { SecurityLogger } from './security-hardening';

export interface SecureErrorConfig {
  showDetailedErrors: boolean;
  logLevel: 'minimal' | 'standard' | 'detailed';
  sanitizeStackTraces: boolean;
  includeRequestId: boolean;
  notifySecurityTeam: boolean;
}

export interface ErrorContext {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  userAgent?: string;
  ip?: string;
  timestamp?: string;
}

/**
 * Security Error Classifications
 */
export enum SecurityErrorType {
  AUTHENTICATION_FAILURE = 'auth_failure',
  AUTHORIZATION_DENIED = 'auth_denied',
  INPUT_VALIDATION = 'input_validation',
  RATE_LIMIT_EXCEEDED = 'rate_limit',
  SQL_INJECTION_ATTEMPT = 'sql_injection',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_VIOLATION = 'csrf_violation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_BREACH_ATTEMPT = 'data_breach',
  SYSTEM_ERROR = 'system_error'
}

/**
 * Secure Error Response Builder
 */
export class SecureErrorHandler {
  private static readonly DEFAULT_CONFIG: SecureErrorConfig = {
    showDetailedErrors: process.env.NODE_ENV !== 'production',
    logLevel: 'standard',
    sanitizeStackTraces: true,
    includeRequestId: true,
    notifySecurityTeam: false
  };

  /**
   * Handle Authentication Errors
   */
  static handleAuthError(
    error: Error,
    context: ErrorContext = {},
    config: Partial<SecureErrorConfig> = {}
  ): NextResponse {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const errorId = this.generateErrorId();

    // Log security event
    SecurityLogger.logSecurityEvent({
      type: 'authentication',
      severity: 'medium',
      ip: context.ip,
      userAgent: context.userAgent,
      userId: context.userId,
      details: {
        errorId,
        endpoint: context.endpoint,
        message: this.sanitizeErrorMessage(error.message),
        timestamp: new Date().toISOString()
      }
    });

    // Log full error details internally
    Logger.warn('Authentication error', {
      errorId,
      error: finalConfig.showDetailedErrors ? error.message : 'Authentication failed',
      stack: finalConfig.sanitizeStackTraces ? this.sanitizeStackTrace(error.stack) : error.stack,
      context
    });

    const response = {
      error: 'Authentication required',
      message: 'Please log in to access this resource',
      ...(finalConfig.includeRequestId && { requestId: context.requestId || errorId })
    };

    return NextResponse.json(response, {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Bearer realm="API"',
        'X-Error-Type': SecurityErrorType.AUTHENTICATION_FAILURE,
        'Cache-Control': 'no-store'
      }
    });
  }

  /**
   * Handle Authorization Errors
   */
  static handleAuthorizationError(
    error: Error,
    context: ErrorContext = {},
    config: Partial<SecureErrorConfig> = {}
  ): NextResponse {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const errorId = this.generateErrorId();

    SecurityLogger.logSecurityEvent({
      type: 'authorization',
      severity: 'high',
      ip: context.ip,
      userAgent: context.userAgent,
      userId: context.userId,
      details: {
        errorId,
        endpoint: context.endpoint,
        attemptedResource: context.endpoint,
        timestamp: new Date().toISOString()
      }
    });

    Logger.warn('Authorization denied', {
      errorId,
      userId: context.userId,
      endpoint: context.endpoint,
      error: this.sanitizeErrorMessage(error.message)
    });

    const response = {
      error: 'Access denied',
      message: 'Insufficient permissions to access this resource',
      ...(finalConfig.includeRequestId && { requestId: context.requestId || errorId })
    };

    return NextResponse.json(response, {
      status: 403,
      headers: {
        'X-Error-Type': SecurityErrorType.AUTHORIZATION_DENIED,
        'Cache-Control': 'no-store'
      }
    });
  }

  /**
   * Handle Input Validation Errors
   */
  static handleValidationError(
    errors: string[],
    threats: string[] = [],
    context: ErrorContext = {},
    config: Partial<SecureErrorConfig> = {}
  ): NextResponse {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const errorId = this.generateErrorId();

    // Determine severity based on threats
    const severity = threats.length > 0 ? 'critical' : 'medium';
    
    SecurityLogger.logSecurityEvent({
      type: 'input_validation',
      severity,
      ip: context.ip,
      userAgent: context.userAgent,
      userId: context.userId,
      details: {
        errorId,
        endpoint: context.endpoint,
        validationErrors: errors,
        securityThreats: threats,
        timestamp: new Date().toISOString()
      }
    });

    Logger.warn('Input validation failed', {
      errorId,
      errors,
      threats,
      context
    });

    // Don't reveal specific validation errors in production unless safe
    const safeErrors = finalConfig.showDetailedErrors 
      ? errors 
      : ['Invalid input provided'];

    const response = {
      error: 'Validation failed',
      message: 'The provided input contains errors',
      details: safeErrors,
      ...(finalConfig.includeRequestId && { requestId: context.requestId || errorId })
    };

    return NextResponse.json(response, {
      status: 400,
      headers: {
        'X-Error-Type': SecurityErrorType.INPUT_VALIDATION,
        'Cache-Control': 'no-store'
      }
    });
  }

  /**
   * Handle Rate Limiting Errors
   */
  static handleRateLimitError(
    context: ErrorContext = {},
    retryAfter: number = 60,
    config: Partial<SecureErrorConfig> = {}
  ): NextResponse {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const errorId = this.generateErrorId();

    SecurityLogger.logSecurityEvent({
      type: 'rate_limit',
      severity: 'medium',
      ip: context.ip,
      userAgent: context.userAgent,
      userId: context.userId,
      details: {
        errorId,
        endpoint: context.endpoint,
        retryAfter,
        timestamp: new Date().toISOString()
      }
    });

    const response = {
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      retryAfter,
      ...(finalConfig.includeRequestId && { requestId: context.requestId || errorId })
    };

    return NextResponse.json(response, {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-Error-Type': SecurityErrorType.RATE_LIMIT_EXCEEDED,
        'X-RateLimit-Reset': new Date(Date.now() + retryAfter * 1000).toISOString(),
        'Cache-Control': 'no-store'
      }
    });
  }

  /**
   * Handle Security Threats
   */
  static handleSecurityThreat(
    threatType: SecurityErrorType,
    details: string,
    context: ErrorContext = {},
    config: Partial<SecureErrorConfig> = {}
  ): NextResponse {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const errorId = this.generateErrorId();

    SecurityLogger.logSecurityEvent({
      type: this.mapThreatTypeToEventType(threatType) as "rate_limit" | "authorization" | "authentication" | "input_validation" | "xss" | "sql_injection" | "csrf",
      severity: 'critical',
      ip: context.ip,
      userAgent: context.userAgent,
      userId: context.userId,
      details: {
        errorId,
        endpoint: context.endpoint,
        threatType,
        details,
        timestamp: new Date().toISOString(),
        blockAction: true
      }
    });

    Logger.error('Security threat detected', {
      errorId,
      threatType,
      details: this.sanitizeErrorMessage(details),
      context,
      severity: 'CRITICAL'
    });

    // Notify security team for critical threats
    if (finalConfig.notifySecurityTeam) {
      this.notifySecurityTeam(threatType, details, context, errorId);
    }

    const response = {
      error: 'Request blocked',
      message: 'This request has been blocked for security reasons',
      ...(finalConfig.includeRequestId && { requestId: context.requestId || errorId })
    };

    return NextResponse.json(response, {
      status: 403,
      headers: {
        'X-Error-Type': threatType,
        'X-Threat-Detected': 'true',
        'Cache-Control': 'no-store'
      }
    });
  }

  /**
   * Handle Internal Server Errors
   */
  static handleInternalError(
    error: Error,
    context: ErrorContext = {},
    config: Partial<SecureErrorConfig> = {}
  ): NextResponse {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const errorId = this.generateErrorId();

    // Log full error details internally
    Logger.error('Internal server error', {
      errorId,
      error: error.message,
      stack: finalConfig.sanitizeStackTraces ? this.sanitizeStackTrace(error.stack) : error.stack,
      context
    });

    // Don't log as security event unless it looks suspicious
    if (this.isSuspiciousError(error)) {
      SecurityLogger.logSecurityEvent({
        type: 'authentication',
        severity: 'medium',
        ip: context.ip,
        userAgent: context.userAgent,
        userId: context.userId,
        details: {
          errorId,
          endpoint: context.endpoint,
          suspiciousError: true,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Generic error message for production
    const message = finalConfig.showDetailedErrors 
      ? `Internal server error: ${this.sanitizeErrorMessage(error.message)}`
      : 'An internal error occurred. Please try again later.';

    const response = {
      error: 'Internal server error',
      message,
      ...(finalConfig.includeRequestId && { requestId: context.requestId || errorId })
    };

    return NextResponse.json(response, {
      status: 500,
      headers: {
        'X-Error-Type': SecurityErrorType.SYSTEM_ERROR,
        'Cache-Control': 'no-store'
      }
    });
  }

  /**
   * Handle Demo Account Restrictions
   */
  static handleDemoRestriction(
    action: string,
    context: ErrorContext = {},
    config: Partial<SecureErrorConfig> = {}
  ): NextResponse {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const errorId = this.generateErrorId();

    SecurityLogger.logSecurityEvent({
      type: 'authorization',
      severity: 'low',
      userId: context.userId,
      details: {
        errorId,
        action: 'demo_restriction',
        blockedAction: action,
        endpoint: context.endpoint,
        timestamp: new Date().toISOString()
      }
    });

    const response = {
      error: 'Demo account restriction',
      message: `Demo accounts cannot perform this action: ${action}`,
      suggestion: 'Create a full account to access all features',
      ...(finalConfig.includeRequestId && { requestId: context.requestId || errorId })
    };

    return NextResponse.json(response, {
      status: 403,
      headers: {
        'X-Error-Type': 'DEMO_RESTRICTION',
        'X-Demo-Account': 'true',
        'Cache-Control': 'no-store'
      }
    });
  }

  /**
   * Utility Methods
   */
  private static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private static sanitizeErrorMessage(message: string): string {
    if (!message) return 'Unknown error';
    
    // Remove sensitive information patterns
    return message
      .replace(/password[=:]\s*\S+/gi, 'password=[REDACTED]')
      .replace(/token[=:]\s*\S+/gi, 'token=[REDACTED]')
      .replace(/key[=:]\s*\S+/gi, 'key=[REDACTED]')
      .replace(/secret[=:]\s*\S+/gi, 'secret=[REDACTED]')
      .replace(/api[-_]?key[=:]\s*\S+/gi, 'api_key=[REDACTED]')
      .replace(/authorization:\s*bearer\s+\S+/gi, 'authorization: Bearer [REDACTED]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi, '[EMAIL_REDACTED]')
      .replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[CARD_REDACTED]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');
  }

  private static sanitizeStackTrace(stack?: string): string {
    if (!stack) return 'No stack trace available';
    
    return stack
      .replace(/\/Users\/[^\/]+/g, '/Users/[USER]')
      .replace(/\/home\/[^\/]+/g, '/home/[USER]')
      .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\[USER]')
      .replace(/password[=:]\s*\S+/gi, 'password=[REDACTED]')
      .replace(/token[=:]\s*\S+/gi, 'token=[REDACTED]')
      .split('\n')
      .slice(0, 10) // Limit stack trace length
      .join('\n');
  }

  private static isSuspiciousError(error: Error): boolean {
    const suspiciousPatterns = [
      /sql.*injection/i,
      /xss/i,
      /script.*tag/i,
      /union.*select/i,
      /drop.*table/i,
      /eval\(/i,
      /document\.cookie/i
    ];
    
    return suspiciousPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.stack || '')
    );
  }

  private static mapThreatTypeToEventType(threatType: SecurityErrorType): string {
    switch (threatType) {
      case SecurityErrorType.SQL_INJECTION_ATTEMPT:
        return 'sql_injection';
      case SecurityErrorType.XSS_ATTEMPT:
        return 'xss';
      case SecurityErrorType.CSRF_VIOLATION:
        return 'csrf';
      default:
        return 'authentication';
    }
  }

  private static async notifySecurityTeam(
    threatType: SecurityErrorType,
    details: string,
    context: ErrorContext,
    errorId: string
  ): Promise<void> {
    try {
      // In production, this would integrate with:
      // - PagerDuty for critical alerts
      // - Slack/Teams for notifications
      // - SIEM systems for correlation
      // - Email alerts for security team
      
      Logger.error('SECURITY ALERT - Immediate attention required', {
        alertType: 'CRITICAL_SECURITY_THREAT',
        threatType,
        details,
        context,
        errorId,
        timestamp: new Date().toISOString(),
        requiresImmediateAction: true
      });
      
      // Mock integration points
      if (process.env.SECURITY_WEBHOOK_URL) {
        // Send to security webhook
      }
      
      if (process.env.PAGERDUTY_KEY) {
        // Trigger PagerDuty incident
      }
      
    } catch (notificationError) {
      Logger.error('Failed to notify security team', {
        originalThreat: threatType,
        notificationError: notificationError instanceof Error ? notificationError.message : 'Unknown error'
      });
    }
  }
}

/**
 * Wrapper for API routes with secure error handling
 */
export function withSecureErrorHandling(
  handler: (req: any) => Promise<NextResponse>,
  config: Partial<SecureErrorConfig> = {}
) {
  return async (request: any): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      const context: ErrorContext = {
        requestId: request.headers?.get?.('x-request-id'),
        endpoint: request.nextUrl?.pathname || request.url,
        userAgent: request.headers?.get?.('user-agent'),
        ip: request.headers?.get?.('x-forwarded-for') || request.headers?.get?.('x-real-ip'),
        timestamp: new Date().toISOString()
      };

      if (error instanceof Error) {
        // Classify error type
        if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
          return SecureErrorHandler.handleAuthError(error, context, config);
        }
        
        if (error.message.includes('Forbidden') || error.message.includes('Access denied')) {
          return SecureErrorHandler.handleAuthorizationError(error, context, config);
        }
        
        if (error.message.includes('validation') || error.message.includes('Invalid input')) {
          return SecureErrorHandler.handleValidationError([error.message], [], context, config);
        }
        
        // Default to internal server error
        return SecureErrorHandler.handleInternalError(error, context, config);
      }
      
      // Handle non-Error objects
      return SecureErrorHandler.handleInternalError(
        new Error('Unknown error occurred'),
        context,
        config
      );
    }
  };
}