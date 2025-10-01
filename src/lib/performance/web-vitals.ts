'use client'

import { Logger as performanceLogger } from '@/lib/logger/edge';

// Web Vitals monitoring and reporting
export interface WebVitalsMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  navigationType: string
  id: string
}

// Thresholds based on Google's recommendations
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
} as const

class WebVitalsReporter {
  private metrics = new Map<string, WebVitalsMetric>()
  private reportingEndpoint = '/api/analytics/web-vitals'
  private batchSize = 5
  private batchTimeout = 5000

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeReporting()
    }
  }

  private initializeReporting() {
    // Report on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush()
      }
    })

    // Report before page unload
    window.addEventListener('beforeunload', () => {
      this.flush()
    })

    // Batch reporting timer
    setInterval(() => {
      if (this.metrics.size > 0) {
        this.flush()
      }
    }, this.batchTimeout)
  }

  reportMetric(metric: WebVitalsMetric) {
    // Add rating based on thresholds
    const threshold = THRESHOLDS[metric.name as keyof typeof THRESHOLDS]
    if (threshold) {
      if (metric.value <= threshold.good) {
        metric.rating = 'good'
      } else if (metric.value <= threshold.poor) {
        metric.rating = 'needs-improvement'
      } else {
        metric.rating = 'poor'
      }
    }

    this.metrics.set(metric.name, metric)

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      performanceLogger.debug('Web Vitals metric', { metric: metric.name, value: metric.value, rating: metric.rating });
    }

    // Immediate flush for critical metrics
    if (metric.rating === 'poor' || this.metrics.size >= this.batchSize) {
      this.flush()
    }
  }

  private async flush() {
    if (this.metrics.size === 0) return

    const metricsToReport = Array.from(this.metrics.values())
    this.metrics.clear()

    try {
      // Send to analytics endpoint
      await this.sendToAnalytics(metricsToReport)
      
      // Send to external services
      this.sendToGoogleAnalytics(metricsToReport)
      this.sendToVercelAnalytics(metricsToReport)
    } catch (error) {
      performanceLogger.warn('Failed to report web vitals', error as Error);
    }
  }

  private async sendToAnalytics(metrics: WebVitalsMetric[]) {
    if (typeof fetch === 'undefined') return

    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      })
    } catch (error) {
      // Fail silently - we don't want to impact user experience
      if (process.env.NODE_ENV === 'development') {
        performanceLogger.warn('Failed to send metrics to analytics', error as Error);
      }
    }
  }

  private sendToGoogleAnalytics(metrics: WebVitalsMetric[]) {
    if (typeof window === 'undefined' || !window.gtag) return

    metrics.forEach(metric => {
      window.gtag!('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.value),
        custom_map: {
          metric_rating: metric.rating,
          metric_delta: metric.delta,
          navigation_type: metric.navigationType,
        },
      })
    })
  }

  private sendToVercelAnalytics(metrics: WebVitalsMetric[]) {
    if (typeof window === 'undefined' || !window.va) return

    metrics.forEach(metric => {
      window.va?.('track', `web-vitals-${metric.name}`, {
        value: metric.value,
        rating: metric.rating,
      })
    })
  }

  // Get current metrics summary
  getSummary() {
    const summary = {
      good: 0,
      needsImprovement: 0,
      poor: 0,
      total: this.metrics.size,
    }

    this.metrics.forEach(metric => {
      switch (metric.rating) {
        case 'good':
          summary.good++
          break
        case 'needs-improvement':
          summary.needsImprovement++
          break
        case 'poor':
          summary.poor++
          break
      }
    })

    return summary
  }
}

// Global instance
export const webVitalsReporter = new WebVitalsReporter()

// Helper function to start monitoring
export function startWebVitalsMonitoring() {
  if (typeof window === 'undefined') return

  // Dynamic import to avoid increasing initial bundle size
  import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
    onCLS((metric) => webVitalsReporter.reportMetric({
      ...metric,
      rating: 'good' as const, // Will be overridden by reporter
    }))

    onFCP((metric) => webVitalsReporter.reportMetric({
      ...metric,
      rating: 'good' as const,
    }))

    onLCP((metric) => webVitalsReporter.reportMetric({
      ...metric,
      rating: 'good' as const,
    }))

    onTTFB((metric) => webVitalsReporter.reportMetric({
      ...metric,
      rating: 'good' as const,
    }))

    onINP((metric) => webVitalsReporter.reportMetric({
      ...metric,
      rating: 'good' as const,
    }))
  }).catch(error => {
    performanceLogger.warn('Failed to load web-vitals library', error as Error);
  })
}

// Performance observer for additional metrics
export class CustomPerformanceObserver {
  private observer?: PerformanceObserver
  private metrics = new Map<string, number>()

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObserver()
    }
  }

  private initializeObserver() {
    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processEntry(entry)
        }
      })

      // Observe different types of performance entries
      this.observer.observe({ entryTypes: ['navigation', 'resource', 'measure', 'mark'] })
    } catch (error) {
      performanceLogger.warn('Failed to initialize PerformanceObserver', error as Error);
    }
  }

  private processEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'navigation':
        this.processNavigationEntry(entry as PerformanceNavigationTiming)
        break
      case 'resource':
        this.processResourceEntry(entry as PerformanceResourceTiming)
        break
      case 'measure':
      case 'mark':
        this.metrics.set(entry.name, entry.startTime)
        break
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming) {
    const metrics = {
      'dns-lookup': entry.domainLookupEnd - entry.domainLookupStart,
      'tcp-connect': entry.connectEnd - entry.connectStart,
      'tls-negotiation': entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
      'request-response': entry.responseEnd - entry.requestStart,
      'dom-processing': entry.domContentLoadedEventStart - entry.responseEnd,
      'resource-loading': entry.loadEventStart - entry.domContentLoadedEventEnd,
    }

    Object.entries(metrics).forEach(([name, value]) => {
      this.metrics.set(name, value)
    })

    // Report critical metrics
    if (metrics['request-response'] > 2000) {
      webVitalsReporter.reportMetric({
        name: 'SLOW_REQUEST',
        value: metrics['request-response'],
        rating: 'poor',
        delta: 0,
        navigationType: 'navigate',
        id: 'slow-request-' + Date.now(),
      })
    }
  }

  private processResourceEntry(entry: PerformanceResourceTiming) {
    // Track slow resources
    if (entry.duration > 3000 && entry.name.includes('.js')) {
      webVitalsReporter.reportMetric({
        name: 'SLOW_RESOURCE',
        value: entry.duration,
        rating: 'poor',
        delta: 0,
        navigationType: 'resource',
        id: 'slow-resource-' + Date.now(),
      })
    }
  }

  getMetrics() {
    return Object.fromEntries(this.metrics)
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }
}

// Global performance observer instance
export const customPerformanceObserver = new CustomPerformanceObserver()

// Utility functions for performance monitoring
export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now()
  fn()
  const duration = performance.now() - start
  
  performance.mark(`${name}-start`)
  performance.mark(`${name}-end`)
  performance.measure(name, `${name}-start`, `${name}-end`)

  if (duration > 100) { // Report slow operations
    webVitalsReporter.reportMetric({
      name: 'SLOW_OPERATION',
      value: duration,
      rating: duration > 500 ? 'poor' : 'needs-improvement',
      delta: 0,
      navigationType: 'measure',
      id: `slow-op-${name}-${Date.now()}`,
    })
  }

  return duration
}

export async function measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  
  try {
    const result = await fn()
    const duration = performance.now() - start
    
    performance.mark(`${name}-start`)
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)

    if (duration > 200) { // Report slow async operations
      webVitalsReporter.reportMetric({
        name: 'SLOW_ASYNC_OPERATION',
        value: duration,
        rating: duration > 1000 ? 'poor' : 'needs-improvement',
        delta: 0,
        navigationType: 'measure',
        id: `slow-async-${name}-${Date.now()}`,
      })
    }

    return result
  } catch (error) {
    const duration = performance.now() - start
    
    // Report failed operations
    webVitalsReporter.reportMetric({
      name: 'FAILED_OPERATION',
      value: duration,
      rating: 'poor',
      delta: 0,
      navigationType: 'error',
      id: `failed-${name}-${Date.now()}`,
    })

    throw error
  }
}

// Initialize monitoring when module is imported
if (typeof window !== 'undefined') {
  startWebVitalsMonitoring()
}

// Export for Next.js reportWebVitals
export function reportWebVitals(metric: any) {
  webVitalsReporter.reportMetric(metric)
}