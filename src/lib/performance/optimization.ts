import { lazy } from 'react'
import dynamic from 'next/dynamic'

// Lazy load heavy components
export const LazyAIAssistant = lazy(() => import('@/components/ai/AISuggestions'))
export const LazyCalendar = lazy(() => import('@/components/calendar/Calendar'))
export const LazyTaskManager = lazy(() => import('@/features/tasks/TaskManager'))
export const LazyAnalytics = lazy(() => import('@/components/analytics/AnalyticsDashboard'))

// Dynamic imports with loading states
export const DynamicCommandPalette = dynamic(
  () => import('@/components/shortcuts/CommandPalette'),
  {
    loading: () => <div className="animate-pulse">Loading command palette...</div>,
    ssr: false,
  }
)

export const DynamicShortcutsDialog = dynamic(
  () => import('@/components/shortcuts/ShortcutsDialog'),
  {
    loading: () => <div className="animate-pulse">Loading shortcuts...</div>,
    ssr: false,
  }
)

export const DynamicExportDialog = dynamic(
  () => import('@/components/export/ExportDialog'),
  {
    loading: () => <div className="animate-pulse">Loading export options...</div>,
    ssr: false,
  }
)

export const DynamicBackupDialog = dynamic(
  () => import('@/components/backup/BackupDialog'),
  {
    loading: () => <div className="animate-pulse">Loading backup options...</div>,
    ssr: false,
  }
)

// Preload critical components
export function preloadCriticalComponents() {
  if (typeof window !== 'undefined') {
    // Preload command palette after user interaction
    const preloadCommandPalette = () => {
      import('@/components/shortcuts/CommandPalette')
      document.removeEventListener('keydown', preloadCommandPalette)
    }
    document.addEventListener('keydown', preloadCommandPalette, { once: true })

    // Preload heavy components on idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        import('@/components/ai/AISuggestions')
        import('@/features/tasks/TaskManager')
        import('@/components/analytics/AnalyticsDashboard')
      })
    } else {
      setTimeout(() => {
        import('@/components/ai/AISuggestions')
        import('@/features/tasks/TaskManager')
        import('@/components/analytics/AnalyticsDashboard')
      }, 2000)
    }
  }
}

// Bundle size monitoring
export function logBundleInfo() {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    console.group('Bundle Performance')
    
    // Log initial bundle size
    if ('performance' in window && 'getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource')
      const jsResources = resources.filter((r: any) => r.name.includes('.js'))
      const totalJSSize = jsResources.reduce((total: number, resource: any) => {
        return total + (resource.transferSize || 0)
      }, 0)
      
      console.log(`Total JS bundle size: ${(totalJSSize / 1024).toFixed(2)} KB`)
    }

    // Log large chunks
    const chunks = [
      'vendor',
      'framework',
      'main',
      'commons',
      'shared',
    ]
    
    chunks.forEach(chunk => {
      const link = document.querySelector(`link[href*="${chunk}"]`)
      if (link) {
        console.log(`${chunk} chunk found`)
      }
    })
    
    console.groupEnd()
  }
}

// Image optimization helper
export function optimizeImages() {
  if (typeof window !== 'undefined') {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]')
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            img.src = img.dataset.src!
            img.classList.remove('lazy')
            imageObserver.unobserve(img)
          }
        })
      })

      images.forEach(img => imageObserver.observe(img))
    } else {
      // Fallback for older browsers
      images.forEach(img => {
        const imgElement = img as HTMLImageElement
        imgElement.src = imgElement.dataset.src!
      })
    }
  }
}

// Code splitting utilities
export const createChunkName = (name: string) => `chunk-${name}`

export const importWithChunkName = (importFn: () => Promise<any>, chunkName: string) => {
  return importFn()
}

// Performance monitoring
export class BundlePerformanceMonitor {
  private metrics = new Map<string, number>()

  markChunkLoad(chunkName: string) {
    this.metrics.set(`${chunkName}-start`, performance.now())
  }

  markChunkLoaded(chunkName: string) {
    const startTime = this.metrics.get(`${chunkName}-start`)
    if (startTime) {
      const loadTime = performance.now() - startTime
      this.metrics.set(`${chunkName}-load-time`, loadTime)
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Chunk ${chunkName} loaded in ${loadTime.toFixed(2)}ms`)
      }
    }
  }

  getMetrics() {
    return Object.fromEntries(this.metrics)
  }
}

export const bundleMonitor = new BundlePerformanceMonitor()

// Tree shaking helpers
export const importOnlyNeeded = {
  lucide: {
    // Common icons used throughout the app
    Home: () => import('lucide-react').then(mod => ({ default: mod.Home })),
    User: () => import('lucide-react').then(mod => ({ default: mod.User })),
    Settings: () => import('lucide-react').then(mod => ({ default: mod.Settings })),
    Plus: () => import('lucide-react').then(mod => ({ default: mod.Plus })),
    Search: () => import('lucide-react').then(mod => ({ default: mod.Search })),
  }
}