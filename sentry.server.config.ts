import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Error filtering
  ignoreErrors: [
    // Ignore specific API errors
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',
  ],
  
  // Integration configuration
  integrations: [
    // Automatically instrument Node.js libraries and frameworks
    Sentry.nativeNodeFetchIntegration(),
  ],
  
  // Data scrubbing
  beforeSend(event, hint) {
    // Remove sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies
    }
    if (event.request?.headers) {
      const headers = { ...event.request.headers }
      delete headers.cookie
      delete headers.authorization
      event.request.headers = headers
    }
    
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Event:', event, hint)
      return null
    }
    
    return event
  },
})