import * as Sentry from '@sentry/nextjs'

export function captureException(error: Error | unknown, context?: Record<string, any>) {
  // TODO: Replace with proper logging - console.error('Error captured:', error)
  
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context,
    })
  }
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(message, level)
  }
}

export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user)
}

export function clearUser() {
  Sentry.setUser(null)
}

export function addBreadcrumb(breadcrumb: {
  message: string
  category?: string
  level?: Sentry.SeverityLevel
  data?: Record<string, any>
}) {
  Sentry.addBreadcrumb(breadcrumb)
}

export function measurePerformance<T>(
  operation: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  return Sentry.withActiveSpan(null, () => {
    return Sentry.startSpan({ name: operation, op: 'function' }, () => {
      try {
        const result = fn()
        
        if (result instanceof Promise) {
          return result.catch((error) => {
            Sentry.captureException(error)
            throw error
          })
        }
        
        return result
      } catch (error) {
        Sentry.captureException(error)
        throw error
      }
    })
  })
}