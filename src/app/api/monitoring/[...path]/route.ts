import { NextRequest } from 'next/server'

// Sentry tunnel endpoint to bypass ad blockers
export async function POST(request: NextRequest) {
  const SENTRY_HOST = 'o4505916981428736.ingest.sentry.io'
  const SENTRY_PROJECT_IDS = ['4505916981428736']
  
  try {
    const envelope = await request.text()
    const pieces = envelope.split('\n')
    const header = JSON.parse(pieces[0])
    
    const { host, project_id } = header.dsn
      ? new URL(header.dsn).host === SENTRY_HOST
        ? { host: SENTRY_HOST, project_id: header.dsn.split('/').pop() }
        : { host: null, project_id: null }
      : { host: null, project_id: null }
    
    if (!host || !SENTRY_PROJECT_IDS.includes(project_id)) {
      return new Response('Invalid request', { status: 400 })
    }
    
    const sentryUrl = `https://${host}/api/${project_id}/envelope/`
    
    const response = await fetch(sentryUrl, {
      method: 'POST',
      body: envelope,
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
    })
    
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    })
  } catch (error) {
    console.error('Sentry tunnel error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}