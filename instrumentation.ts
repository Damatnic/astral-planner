export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Hook for capturing errors from nested React Server Components
// Note: Temporarily disabled due to TypeScript compatibility issues with @sentry/nextjs
// export async function onRequestError(err: unknown, request: Request, context: unknown) {
//   const { captureRequestError } = await import('@sentry/nextjs')
//   captureRequestError(err, request, context)
// }