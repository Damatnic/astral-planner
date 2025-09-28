import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

const vitalsUrl = 'https://vitals.vercel-analytics.com/v1/vitals'

function getConnectionSpeed() {
  const nav = navigator as any
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection
  
  return conn ? conn.effectiveType : 'unknown'
}

interface Metric {
  id: string
  name: string
  value: number
  rating?: 'good' | 'needs-improvement' | 'poor'
  delta?: number
  navigationType?: string
}

function sendToAnalytics(metric: Metric) {
  const analyticsId = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID
  
  if (!analyticsId) {
    return
  }

  const body = {
    dsn: analyticsId,
    id: metric.id,
    page: window.location.pathname,
    href: window.location.href,
    event_name: metric.name,
    value: metric.value.toString(),
    speed: getConnectionSpeed(),
  }

  const blob = new Blob([new URLSearchParams(body).toString()], {
    type: 'application/x-www-form-urlencoded',
  })
  
  if (navigator.sendBeacon) {
    navigator.sendBeacon(vitalsUrl, blob)
  } else {
    fetch(vitalsUrl, {
      body: blob,
      method: 'POST',
      credentials: 'omit',
      keepalive: true,
    })
  }

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric.name, metric.value, metric.rating)
  }
}

export function reportWebVitals() {
  try {
    onTTFB(sendToAnalytics)
    onLCP(sendToAnalytics)
    onCLS(sendToAnalytics)
    onFCP(sendToAnalytics)
    onINP(sendToAnalytics)
  } catch (err) {
    // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('[Web Vitals] Failed to report:', err)
  }
}

// Custom performance marks
export function markPerformance(name: string) {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(name)
  }
}

export function measurePerformance(name: string, startMark: string, endMark: string) {
  if (typeof window !== 'undefined' && window.performance) {
    try {
      performance.measure(name, startMark, endMark)
      const measure = performance.getEntriesByName(name)[0]
      
      if (measure) {
        sendToAnalytics({
          id: `${name}-${Date.now()}`,
          name,
          value: measure.duration,
        })
      }
    } catch (err) {
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('[Performance] Measurement failed:', err)
    }
  }
}

// Resource timing analysis
export function analyzeResourceTiming() {
  if (typeof window === 'undefined' || !window.performance) {
    return
  }

  const resources = performance.getEntriesByType('resource')
  
  const summary = {
    totalResources: resources.length,
    totalSize: 0,
    totalDuration: 0,
    slowResources: [] as any[],
    largeResources: [] as any[],
  }

  resources.forEach((resource: any) => {
    const duration = resource.responseEnd - resource.startTime
    const size = resource.transferSize || 0
    
    summary.totalDuration += duration
    summary.totalSize += size
    
    if (duration > 1000) {
      summary.slowResources.push({
        name: resource.name,
        duration: Math.round(duration),
        size: Math.round(size / 1024),
      })
    }
    
    if (size > 500 * 1024) {
      summary.largeResources.push({
        name: resource.name,
        size: Math.round(size / 1024),
        duration: Math.round(duration),
      })
    }
  })

  return summary
}

// Monitor long tasks
export function monitorLongTasks() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          sendToAnalytics({
            id: `long-task-${Date.now()}`,
            name: 'long-task',
            value: entry.duration,
          })
        }
      }
    })

    observer.observe({ entryTypes: ['longtask'] })
    
    return () => observer.disconnect()
  } catch (err) {
    // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('[Performance] Long task monitoring failed:', err)
  }
}