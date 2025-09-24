'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { captureException } from '@/lib/monitoring/sentry'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to Sentry
    captureException(error, {
      tags: {
        location: 'app-error-boundary',
      },
      extra: {
        digest: error.digest,
      },
    })
  }, [error])

  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">Oops! Something went wrong</h2>
          <p className="text-muted-foreground">
            We encountered an error while processing your request. Don't worry, we've been notified and are working on it.
          </p>
          
          {process.env.NODE_ENV === 'development' && error.message && (
            <details className="mt-4 rounded-lg bg-muted p-4 text-left">
              <summary className="cursor-pointer text-sm font-medium">
                Error details (development only)
              </summary>
              <pre className="mt-2 text-xs overflow-auto">
                {error.message}
                {error.stack && '\n\n' + error.stack}
              </pre>
            </details>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>

        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Error reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}