"use client"

import * as React from "react"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showDetails?: boolean
  showReportButton?: boolean
  onReport?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number | boolean | null | undefined>
}

export interface ErrorFallbackProps {
  error: Error | null
  errorInfo: React.ErrorInfo | null
  resetError: () => void
  showDetails?: boolean
  showReportButton?: boolean
  onReport?: (error: Error, errorInfo: React.ErrorInfo) => void
}

class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo)

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props
    const { hasError } = this.state

    if (hasError && resetOnPropsChange) {
      if (resetKeys) {
        // Reset if any of the resetKeys have changed
        const hasResetKeyChanged = resetKeys.some(
          (key, index) => key !== prevProps.resetKeys?.[index]
        )
        if (hasResetKeyChanged) {
          this.resetError()
        }
      }
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    const { hasError, error, errorInfo } = this.state
    const { 
      children, 
      fallback: FallbackComponent, 
      showDetails,
      showReportButton,
      onReport 
    } = this.props

    if (hasError) {
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            errorInfo={errorInfo}
            resetError={this.resetError}
            showDetails={showDetails}
            showReportButton={showReportButton}
            onReport={onReport}
          />
        )
      }

      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetError={this.resetError}
          showDetails={showDetails}
          showReportButton={showReportButton}
          onReport={onReport}
        />
      )
    }

    return children
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  showDetails = false,
  showReportButton = false,
  onReport,
}) => {
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  
  const handleReport = () => {
    if (onReport && error && errorInfo) {
      onReport(error, errorInfo)
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = "/"
  }

  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {showDetails && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailsOpen(!detailsOpen)}
                className="w-full"
              >
                {detailsOpen ? "Hide" : "Show"} Error Details
              </Button>
              
              {detailsOpen && (
                <div className="rounded-md bg-muted p-3 text-xs">
                  <div className="mb-2 font-medium">Error:</div>
                  <div className="mb-3 font-mono text-destructive">
                    {error?.message || "Unknown error"}
                  </div>
                  
                  {error?.stack && (
                    <>
                      <div className="mb-2 font-medium">Stack Trace:</div>
                      <pre className="overflow-auto whitespace-pre-wrap font-mono text-xs">
                        {error.stack}
                      </pre>
                    </>
                  )}
                  
                  {errorInfo?.componentStack && (
                    <>
                      <div className="mb-2 mt-3 font-medium">Component Stack:</div>
                      <pre className="overflow-auto whitespace-pre-wrap font-mono text-xs">
                        {errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={resetError} className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          
          <Button variant="outline" onClick={handleRefresh} className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Page
          </Button>
          
          <Button variant="outline" onClick={handleGoHome} className="w-full sm:w-auto">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
          
          {showReportButton && (
            <Button variant="outline" onClick={handleReport} className="w-full sm:w-auto">
              <Bug className="mr-2 h-4 w-4" />
              Report Issue
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

// Hook for error boundary functionality
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return {
    captureError,
    resetError,
  }
}

// Minimal error boundary for specific components
export const MinimalErrorBoundary: React.FC<{
  children: React.ReactNode
  fallback?: React.ReactNode
}> = ({ children, fallback }) => {
  return (
    <ErrorBoundaryClass
      fallback={() => (
        <div className="flex items-center justify-center p-4">
          {fallback || (
            <div className="text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Something went wrong
              </p>
            </div>
          )}
        </div>
      )}
    >
      {children}
    </ErrorBoundaryClass>
  )
}

// Async error boundary for handling async errors
export const AsyncErrorBoundary: React.FC<{
  children: React.ReactNode
  onError?: (error: Error) => void
}> = ({ children, onError }) => {
  const { captureError } = useErrorBoundary()

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(event.reason)
      captureError(error)
      onError?.(error)
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [captureError, onError])

  return <>{children}</>
}

export {
  ErrorBoundaryClass as ErrorBoundary,
  DefaultErrorFallback,
  type ErrorBoundaryProps,
  type ErrorFallbackProps,
}