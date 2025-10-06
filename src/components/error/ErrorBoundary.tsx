/**
 * ASTRAL PLANNER - ENTERPRISE ERROR BOUNDARY SYSTEM
 * Revolutionary error handling with automatic recovery and detailed reporting
 * 
 * Features:
 * - Graceful error recovery with fallback UI
 * - Automatic error reporting and logging
 * - User-friendly error messages
 * - Development vs production error handling
 * - Error analytics and monitoring
 * - Retry mechanisms and auto-recovery
 */

'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logger } from '@/lib/logger/edge';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  errorId: string;
  isRecovering: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorId: '',
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    
    // Log error details
    this.logError(error, errorInfo);
    
    // Update state with error info
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
      props: this.props,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
      retryCount: this.state.retryCount
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Error:', error);
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Error Info:', errorInfo);
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Full Details:', errorDetails);
      console.groupEnd();
    }

    // Log to monitoring service
    Logger.error('React Error Boundary caught error', errorDetails);

    // Send to external error monitoring (Sentry, etc.)
    this.reportToExternalService(errorDetails);
  };

  private reportToExternalService = (errorDetails: any) => {
    // In production, integrate with error monitoring services
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: errorDetails.message,
        fatal: true
      });
    }

    // Example: Sentry integration
    // if (window.Sentry) {
    //   window.Sentry.captureException(errorDetails.error, {
    //     tags: { errorBoundary: true },
    //     extra: errorDetails
    //   });
    // }
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      Logger.warn('Max retry attempts reached', { 
        errorId: this.state.errorId,
        retryCount: this.state.retryCount 
      });
      return;
    }

    this.setState({ 
      isRecovering: true,
      retryCount: this.state.retryCount + 1 
    });

    // Add delay before retry to prevent rapid retries
    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false
      });
    }, 1000);

    Logger.info('Attempting error recovery', { 
      errorId: this.state.errorId,
      retryCount: this.state.retryCount + 1 
    });
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  private getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' | 'critical' => {
    const message = error.message.toLowerCase();
    
    if (message.includes('chunk') || message.includes('loading')) {
      return 'low'; // Chunk loading errors
    } else if (message.includes('network') || message.includes('fetch')) {
      return 'medium'; // Network errors
    } else if (message.includes('cannot read') || message.includes('undefined')) {
      return 'high'; // Runtime errors
    } else {
      return 'critical'; // Unknown errors
    }
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    const { children, fallback, showDetails = false, enableRetry = true } = this.props;
    const { hasError, error, errorInfo, retryCount, errorId, isRecovering } = this.state;

    if (hasError && error) {
      // Return custom fallback if provided
      if (fallback) {
        return fallback;
      }

      const severity = this.getErrorSeverity(error);
      const maxRetries = this.props.maxRetries || 3;
      const canRetry = enableRetry && retryCount < maxRetries;

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {severity === 'critical' ? (
                  <Shield className="h-16 w-16 text-red-500" />
                ) : (
                  <AlertTriangle className="h-16 w-16 text-orange-500" />
                )}
              </div>
              
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Oops! Something went wrong
              </CardTitle>
              
              <CardDescription className="text-lg">
                {severity === 'critical' 
                  ? "We've encountered a critical error that requires attention."
                  : "Don't worry, we're working on getting this fixed."
                }
              </CardDescription>

              <div className="flex justify-center gap-2 mt-4">
                <Badge variant={severity === 'critical' ? 'destructive' : 'secondary'}>
                  {severity.toUpperCase()} ERROR
                </Badge>
                <Badge variant="outline">
                  ID: {errorId}
                </Badge>
                {retryCount > 0 && (
                  <Badge variant="outline">
                    Retry {retryCount}/{maxRetries}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Message */}
              <div className="text-center">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  {this.getErrorMessage(error)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This error has been automatically reported to our team.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    disabled={isRecovering}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRecovering ? 'animate-spin' : ''}`} />
                    {isRecovering ? 'Recovering...' : 'Try Again'}
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={this.handleReload}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
              </div>

              {/* Error Details (Development only or if explicitly shown) */}
              {(showDetails || process.env.NODE_ENV === 'development') && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Technical Details
                  </summary>
                  <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="space-y-3 text-sm">
                      <div>
                        <strong className="text-gray-900 dark:text-gray-100">Error:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-red-600 dark:text-red-400">
                          {error.message}
                        </pre>
                      </div>
                      
                      {error.stack && (
                        <div>
                          <strong className="text-gray-900 dark:text-gray-100">Stack Trace:</strong>
                          <pre className="mt-1 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-x-auto">
                            {error.stack}
                          </pre>
                        </div>
                      )}
                      
                      {errorInfo?.componentStack && (
                        <div>
                          <strong className="text-gray-900 dark:text-gray-100">Component Stack:</strong>
                          <pre className="mt-1 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-x-auto">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              )}

              {/* Recovery Suggestions */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                <p>If this problem persists, try:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Refreshing the page</li>
                  <li>• Clearing your browser cache</li>
                  <li>• Checking your internet connection</li>
                  <li>• Contacting support if the issue continues</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }

  private getErrorMessage = (error: Error): string => {
    const message = error.message.toLowerCase();
    
    if (message.includes('chunk')) {
      return "Failed to load application resources. This usually resolves with a page refresh.";
    } else if (message.includes('network')) {
      return "Network connection error. Please check your internet connection.";
    } else if (message.includes('fetch')) {
      return "Unable to connect to our servers. Please try again in a moment.";
    } else if (message.includes('cannot read')) {
      return "We encountered an unexpected data error. Our team has been notified.";
    } else {
      return "An unexpected error occurred. Our team has been automatically notified and is working on a fix.";
    }
  };
}

// Higher-order component for easy integration
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for error reporting from function components
export function useErrorHandler() {
  const reportError = (error: Error, context?: string) => {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      context: context || 'useErrorHandler',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      timestamp: new Date().toISOString()
    };

    Logger.error('Manual error report', errorDetails);
    // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Reported error:', error, errorDetails);
  };

  return { reportError };
}

// Async error boundary for handling promise rejections
export class AsyncErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  componentDidMount() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handlePromiseRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection);
  }

  private handlePromiseRejection = (event: PromiseRejectionEvent) => {
    const error = new Error(event.reason?.message || 'Unhandled Promise Rejection');
    error.stack = event.reason?.stack;
    
    this.setState({
      hasError: true,
      error,
      errorId: `async_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    Logger.error('Unhandled promise rejection caught by AsyncErrorBoundary', {
      reason: event.reason,
      promise: event.promise
    });
  };

  render() {
    return <ErrorBoundary {...this.props} />;
  }
}

export default ErrorBoundary;