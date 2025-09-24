'use client'

// Preload critical components and assets
export class ComponentPreloader {
  private preloadedModules = new Set<string>()
  private preloadQueue: (() => Promise<void>)[] = []
  private isPreloading = false

  // Preload critical components immediately
  preloadCritical() {
    if (typeof window === 'undefined') return

    const criticalComponents = [
      () => import('@/components/shortcuts/CommandPalette'),
      () => import('@/features/tasks/TaskManager'),
      () => import('@/components/ui/dialog'),
      () => import('@/hooks/use-toast'),
    ]

    criticalComponents.forEach(component => {
      this.preloadQueue.push(async () => {
        try {
          await component()
        } catch (error) {
          console.warn('Failed to preload critical component:', error)
        }
      })
    })

    this.processPrloadQueue()
  }

  // Preload components on user interaction
  preloadOnInteraction() {
    if (typeof window === 'undefined') return

    const interactionComponents = [
      () => import('@/components/ai/AISuggestions'),
      () => import('@/components/analytics/AnalyticsDashboard'),
      () => import('@/components/calendar/Calendar'),
      () => import('@/components/export/ExportDialog'),
      () => import('@/components/backup/BackupDialog'),
    ]

    const preloadOnFirstInteraction = () => {
      interactionComponents.forEach(component => {
        this.preloadQueue.push(async () => {
          try {
            await component()
          } catch (error) {
            console.warn('Failed to preload interaction component:', error)
          }
        })
      })

      this.processPreloadQueue()
      
      // Remove listeners after first use
      document.removeEventListener('click', preloadOnFirstInteraction)
      document.removeEventListener('keydown', preloadOnFirstInteraction)
      document.removeEventListener('touchstart', preloadOnFirstInteraction)
    }

    document.addEventListener('click', preloadOnFirstInteraction, { once: true, passive: true })
    document.addEventListener('keydown', preloadOnFirstInteraction, { once: true, passive: true })
    document.addEventListener('touchstart', preloadOnFirstInteraction, { once: true, passive: true })
  }

  // Preload on idle time
  preloadOnIdle() {
    if (typeof window === 'undefined') return

    const idleComponents = [
      () => import('@/app/admin/page'),
      () => import('@/components/settings/SettingsPanel'),
      () => import('@/components/templates/TemplateLibrary'),
    ]

    const preloadWhenIdle = () => {
      idleComponents.forEach(component => {
        this.preloadQueue.push(async () => {
          try {
            await component()
          } catch (error) {
            console.warn('Failed to preload idle component:', error)
          }
        })
      })

      this.processPreloadQueue()
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadWhenIdle, { timeout: 5000 })
    } else {
      setTimeout(preloadWhenIdle, 2000)
    }
  }

  // Route-based preloading
  preloadForRoute(route: string) {
    const routeComponentMap: Record<string, () => Promise<any>> = {
      '/tasks': () => import('@/features/tasks/TaskManager'),
      '/goals': () => import('@/features/goals/GoalManager'),
      '/habits': () => import('@/features/habits/HabitTracker'),
      '/calendar': () => import('@/components/calendar/Calendar'),
      '/analytics': () => import('@/components/analytics/AnalyticsDashboard'),
      '/ai': () => import('@/components/ai/AISuggestions'),
      '/admin': () => import('@/app/admin/page'),
      '/settings': () => import('@/components/settings/SettingsPanel'),
    }

    const componentLoader = routeComponentMap[route]
    if (componentLoader && !this.preloadedModules.has(route)) {
      this.preloadQueue.push(async () => {
        try {
          await componentLoader()
          this.preloadedModules.add(route)
        } catch (error) {
          console.warn(`Failed to preload component for route ${route}:`, error)
        }
      })

      this.processPreloadQueue()
    }
  }

  private async processPreloadQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) return

    this.isPreloading = true

    while (this.preloadQueue.length > 0) {
      const preloadFn = this.preloadQueue.shift()
      if (preloadFn) {
        await preloadFn()
        // Small delay to prevent blocking the main thread
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }

    this.isPreloading = false
  }

  private async processPreloadQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) return

    this.isPreloading = true

    // Process queue in batches to avoid blocking
    const batchSize = 2
    while (this.preloadQueue.length > 0) {
      const batch = this.preloadQueue.splice(0, batchSize)
      await Promise.allSettled(batch.map(fn => fn()))
      
      // Yield to main thread
      await new Promise(resolve => setTimeout(resolve, 5))
    }

    this.isPreloading = false
  }

  // Initialize all preloading strategies
  initialize() {
    this.preloadCritical()
    this.preloadOnInteraction()
    this.preloadOnIdle()
  }
}

// Asset preloading
export class AssetPreloader {
  private preloadedAssets = new Set<string>()

  // Preload critical CSS and fonts
  preloadCriticalAssets() {
    if (typeof document === 'undefined') return

    const criticalAssets = [
      { href: '/fonts/inter.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
      { href: '/icons/icon-192x192.png', as: 'image' },
    ]

    criticalAssets.forEach(({ href, as, type, crossorigin }) => {
      if (!this.preloadedAssets.has(href)) {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.href = href
        link.as = as
        if (type) link.type = type
        if (crossorigin) link.crossOrigin = crossorigin
        
        document.head.appendChild(link)
        this.preloadedAssets.add(href)
      }
    })
  }

  // Preload images on viewport intersection
  preloadImagesOnIntersection() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return

    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            const src = img.dataset.src
            
            if (src && !this.preloadedAssets.has(src)) {
              const preloadLink = document.createElement('link')
              preloadLink.rel = 'preload'
              preloadLink.href = src
              preloadLink.as = 'image'
              
              document.head.appendChild(preloadLink)
              this.preloadedAssets.add(src)
            }
            
            imageObserver.unobserve(img)
          }
        })
      },
      { rootMargin: '50px' }
    )

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img)
    })
  }

  // Resource hints for external resources
  addResourceHints() {
    if (typeof document === 'undefined') return

    const resourceHints = [
      { href: 'https://fonts.googleapis.com', rel: 'preconnect' },
      { href: 'https://fonts.gstatic.com', rel: 'preconnect', crossorigin: 'anonymous' },
      { href: 'https://api.clerk.com', rel: 'preconnect' },
    ]

    resourceHints.forEach(({ href, rel, crossorigin }) => {
      const link = document.createElement('link')
      link.rel = rel
      link.href = href
      if (crossorigin) link.crossOrigin = crossorigin
      
      document.head.appendChild(link)
    })
  }

  initialize() {
    this.preloadCriticalAssets()
    this.preloadImagesOnIntersection()
    this.addResourceHints()
  }
}

// Performance monitoring for preloading
export class PreloadPerformanceMonitor {
  private metrics = new Map<string, number>()

  startTimer(key: string) {
    this.metrics.set(`${key}_start`, performance.now())
  }

  endTimer(key: string) {
    const startTime = this.metrics.get(`${key}_start`)
    if (startTime) {
      const duration = performance.now() - startTime
      this.metrics.set(`${key}_duration`, duration)
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Preload] ${key}: ${duration.toFixed(2)}ms`)
      }
    }
  }

  getMetrics() {
    return Object.fromEntries(this.metrics)
  }

  reportToAnalytics() {
    // Send metrics to your analytics service
    const metrics = this.getMetrics()
    
    if (typeof window !== 'undefined' && window.gtag) {
      Object.entries(metrics).forEach(([key, value]) => {
        window.gtag('event', 'preload_performance', {
          event_category: 'Performance',
          event_label: key,
          value: Math.round(value)
        })
      })
    }
  }
}

// Global instances
export const componentPreloader = new ComponentPreloader()
export const assetPreloader = new AssetPreloader()
export const preloadMonitor = new PreloadPerformanceMonitor()