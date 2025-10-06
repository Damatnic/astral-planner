export async function register() {
  // Temporarily disabled for deployment debugging
  // if (process.env.NEXT_RUNTIME === 'nodejs') {
  //   await import('../sentry.server.config')
  // }

  // if (process.env.NEXT_RUNTIME === 'edge') {
  //   await import('../sentry.edge.config')
  // }
}

// Add required onRequestError hook for Next.js 15 Sentry compatibility
export async function onRequestError(err: any, request: any, context: any) {
  // Temporarily disabled but hook is present to prevent Sentry warnings
  if (process.env.NODE_ENV === 'development') {
    // TODO: Replace with proper logging - console.warn('Request error captured:', err.message);
  }
}