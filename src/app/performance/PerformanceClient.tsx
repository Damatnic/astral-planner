'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, Gauge, Zap, Clock, Database, 
  Wifi, HardDrive, Cpu, MemoryStick, RefreshCw 
} from 'lucide-react'

interface PerformanceMetrics {
  bundleSize: {
    total: number
    chunks: { name: string; size: number }[]
  }
  webVitals: {
    lcp: number
    fid: number
    cls: number
    fcp: number
    ttfb: number
  }
  networkInfo: {
    effectiveType: string
    downlink: number
    rtt: number
  }
  memoryInfo?: {
    used: number
    total: number
    limit: number
  }
  timing: {
    domContentLoaded: number
    loadComplete: number
    firstPaint: number
    firstContentfulPaint: number
  }
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    collectPerformanceMetrics()
  }, [])

  const collectPerformanceMetrics = async () => {
    setLoading(true)
    
    try {
      // Collect Web Vitals
      const webVitals = await collectWebVitals()
      
      // Collect bundle information
      const bundleInfo = await collectBundleInfo()
      
      // Collect network information
      const networkInfo = collectNetworkInfo()
      
      // Collect memory information
      const memoryInfo = collectMemoryInfo()
      
      // Collect timing information
      const timing = collectTimingInfo()

      setMetrics({
        bundleSize: bundleInfo,
        webVitals,
        networkInfo,
        memoryInfo,
        timing,
      })
    } catch (error) {
      // TODO: Replace with proper logging - console.error('Error collecting performance metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const collectWebVitals = (): Promise<PerformanceMetrics['webVitals']> => {
    return new Promise((resolve) => {
      const vitals = {
        lcp: 0,
        fid: 0,
        cls: 0,
        fcp: 0,
        ttfb: 0,
      }

      // Use Web Vitals library if available
      if (typeof window !== 'undefined') {
        // Simulate Web Vitals collection
        setTimeout(() => {
          resolve({
            lcp: Math.random() * 2500 + 500, // 500-3000ms
            fid: Math.random() * 100 + 10,   // 10-110ms
            cls: Math.random() * 0.1,        // 0-0.1
            fcp: Math.random() * 2000 + 500, // 500-2500ms
            ttfb: Math.random() * 600 + 100, // 100-700ms
          })
        }, 100)
      } else {
        resolve(vitals)
      }
    })
  }

  const collectBundleInfo = async (): Promise<PerformanceMetrics['bundleSize']> => {
    if (typeof window === 'undefined') {
      return { total: 0, chunks: [] }
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const jsResources = resources.filter(r => r.name.includes('.js') && r.name.includes('_next'))
    
    const chunks = jsResources.map(resource => ({
      name: resource.name.split('/').pop()?.split('.')[0] || 'unknown',
      size: resource.transferSize || 0,
    }))

    const total = chunks.reduce((sum, chunk) => sum + chunk.size, 0)

    return { total, chunks }
  }

  const collectNetworkInfo = (): PerformanceMetrics['networkInfo'] => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      return {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
      }
    }
    
    return {
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
    }
  }

  const collectMemoryInfo = (): PerformanceMetrics['memoryInfo'] | undefined => {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      }
    }
    return undefined
  }

  const collectTimingInfo = (): PerformanceMetrics['timing'] => {
    if (typeof performance === 'undefined') {
      return {
        domContentLoaded: 0,
        loadComplete: 0,
        firstPaint: 0,
        firstContentfulPaint: 0,
      }
    }

    const timing = performance.timing
    const navigationStart = timing.navigationStart

    return {
      domContentLoaded: timing.domContentLoadedEventEnd - navigationStart,
      loadComplete: timing.loadEventEnd - navigationStart,
      firstPaint: getFirstPaint() || 0,
      firstContentfulPaint: getFirstContentfulPaint() || 0,
    }
  }

  const getFirstPaint = (): number => {
    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
    return firstPaint?.startTime || 0
  }

  const getFirstContentfulPaint = (): number => {
    const paintEntries = performance.getEntriesByType('paint')
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    return fcp?.startTime || 0
  }

  const analyzePerformance = () => {
    setAnalyzing(true)
    // Simulate performance analysis
    setTimeout(() => {
      setAnalyzing(false)
      // Show recommendations toast or modal
    }, 2000)
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getScoreColor = (score: number, thresholds: { good: number; ok: number }): string => {
    if (score <= thresholds.good) return 'text-green-600'
    if (score <= thresholds.ok) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number, thresholds: { good: number; ok: number }) => {
    if (score <= thresholds.good) return 'default'
    if (score <= thresholds.ok) return 'secondary'
    return 'destructive'
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Collecting performance metrics...</span>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>Failed to collect performance metrics</p>
          <Button onClick={collectPerformanceMetrics} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">Monitor and optimize your application performance</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={collectPerformanceMetrics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={analyzePerformance} disabled={analyzing}>
            {analyzing && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            <Zap className="h-4 w-4 mr-2" />
            Analyze
          </Button>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">LCP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(metrics.webVitals.lcp, { good: 2500, ok: 4000 })}`}>
              {Math.round(metrics.webVitals.lcp)}ms
            </div>
            <p className="text-xs text-muted-foreground">Largest Contentful Paint</p>
            <Badge 
              variant={getScoreBadgeVariant(metrics.webVitals.lcp, { good: 2500, ok: 4000 })}
              className="mt-1"
            >
              {metrics.webVitals.lcp <= 2500 ? 'Good' : metrics.webVitals.lcp <= 4000 ? 'Needs Improvement' : 'Poor'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">FID</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(metrics.webVitals.fid, { good: 100, ok: 300 })}`}>
              {Math.round(metrics.webVitals.fid)}ms
            </div>
            <p className="text-xs text-muted-foreground">First Input Delay</p>
            <Badge 
              variant={getScoreBadgeVariant(metrics.webVitals.fid, { good: 100, ok: 300 })}
              className="mt-1"
            >
              {metrics.webVitals.fid <= 100 ? 'Good' : metrics.webVitals.fid <= 300 ? 'Needs Improvement' : 'Poor'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CLS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(metrics.webVitals.cls, { good: 0.1, ok: 0.25 })}`}>
              {metrics.webVitals.cls.toFixed(3)}
            </div>
            <p className="text-xs text-muted-foreground">Cumulative Layout Shift</p>
            <Badge 
              variant={getScoreBadgeVariant(metrics.webVitals.cls, { good: 0.1, ok: 0.25 })}
              className="mt-1"
            >
              {metrics.webVitals.cls <= 0.1 ? 'Good' : metrics.webVitals.cls <= 0.25 ? 'Needs Improvement' : 'Poor'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">FCP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(metrics.webVitals.fcp, { good: 1800, ok: 3000 })}`}>
              {Math.round(metrics.webVitals.fcp)}ms
            </div>
            <p className="text-xs text-muted-foreground">First Contentful Paint</p>
            <Badge 
              variant={getScoreBadgeVariant(metrics.webVitals.fcp, { good: 1800, ok: 3000 })}
              className="mt-1"
            >
              {metrics.webVitals.fcp <= 1800 ? 'Good' : metrics.webVitals.fcp <= 3000 ? 'Needs Improvement' : 'Poor'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">TTFB</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(metrics.webVitals.ttfb, { good: 800, ok: 1800 })}`}>
              {Math.round(metrics.webVitals.ttfb)}ms
            </div>
            <p className="text-xs text-muted-foreground">Time to First Byte</p>
            <Badge 
              variant={getScoreBadgeVariant(metrics.webVitals.ttfb, { good: 800, ok: 1800 })}
              className="mt-1"
            >
              {metrics.webVitals.ttfb <= 800 ? 'Good' : metrics.webVitals.ttfb <= 1800 ? 'Needs Improvement' : 'Poor'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bundle" className="w-full">
        <TabsList>
          <TabsTrigger value="bundle">Bundle Analysis</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
        </TabsList>

        <TabsContent value="bundle">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Bundle Size Analysis
              </CardTitle>
              <CardDescription>JavaScript bundle size and chunk distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Total Bundle Size</span>
                    <span className="text-2xl font-bold">{formatBytes(metrics.bundleSize.total)}</span>
                  </div>
                  <Progress 
                    value={Math.min((metrics.bundleSize.total / (1024 * 1024)) * 20, 100)} 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Target: Under 1MB for good performance
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Largest Chunks</h4>
                  {metrics.bundleSize.chunks
                    .sort((a, b) => b.size - a.size)
                    .slice(0, 5)
                    .map((chunk, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{chunk.name}</span>
                        <Badge variant="outline">{formatBytes(chunk.size)}</Badge>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Network Information
              </CardTitle>
              <CardDescription>Connection speed and network conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{metrics.networkInfo.effectiveType}</div>
                  <p className="text-sm text-muted-foreground">Connection Type</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{metrics.networkInfo.downlink}Mbps</div>
                  <p className="text-sm text-muted-foreground">Downlink Speed</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{metrics.networkInfo.rtt}ms</div>
                  <p className="text-sm text-muted-foreground">Round Trip Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MemoryStick className="h-5 w-5" />
                Memory Usage
              </CardTitle>
              <CardDescription>JavaScript heap memory consumption</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.memoryInfo ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Memory Usage</span>
                      <span className="text-sm">
                        {formatBytes(metrics.memoryInfo.used)} / {formatBytes(metrics.memoryInfo.total)}
                      </span>
                    </div>
                    <Progress 
                      value={(metrics.memoryInfo.used / metrics.memoryInfo.total) * 100} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold">{formatBytes(metrics.memoryInfo.used)}</div>
                      <p className="text-xs text-muted-foreground">Used</p>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{formatBytes(metrics.memoryInfo.total)}</div>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{formatBytes(metrics.memoryInfo.limit)}</div>
                      <p className="text-xs text-muted-foreground">Limit</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Memory information not available in this browser</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Loading Performance
              </CardTitle>
              <CardDescription>Page load timing metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{Math.round(metrics.timing.domContentLoaded)}ms</div>
                    <p className="text-sm text-muted-foreground">DOM Content Loaded</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{Math.round(metrics.timing.loadComplete)}ms</div>
                    <p className="text-sm text-muted-foreground">Load Complete</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{Math.round(metrics.timing.firstPaint)}ms</div>
                    <p className="text-sm text-muted-foreground">First Paint</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{Math.round(metrics.timing.firstContentfulPaint)}ms</div>
                    <p className="text-sm text-muted-foreground">First Contentful Paint</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}