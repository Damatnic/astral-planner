/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error monitoring service (e.g., Sentry)
    this.reportError(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error state when children change
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, you would send this to an error reporting service
    if (typeof window !== 'undefined' && window.console) {
      console.group('🚨 Error Boundary Report');
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Error:', error);
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Component Stack:', errorInfo.componentStack);
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Error Stack:', error.stack);
      console.groupEnd();
    }

    // Example: Send to Sentry or another monitoring service
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  };

  private handleRetry = () => {
    // Clear the error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Optional: Add a small delay to prevent immediate re-error
    this.retryTimeoutId = window.setTimeout(() => {
      // Force a re-render
      this.forceUpdate();
    }, 100);
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error!} 
            retry={this.handleRetry}
          />
        );
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
              
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h1>
              
              <p className="text-gray-600 mb-6">
                We're sorry, but something unexpected happened. 
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <span className="block mt-2 text-sm font-mono text-red-600">
                    {this.state.error.message}
                  </span>
                )}
              </p>

              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Reload Page
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error?.message}
                    </div>
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.error?.stack}</pre>
                    </div>
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Custom hook for error handling
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    
    // Report error
    // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('useErrorHandler caught an error:', error);
    
    // In a real app, report to monitoring service
    // Sentry.captureException(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw error to be caught by error boundary
  if (error) {
    throw error;
  }

  return { handleError, clearError };
}