'use client';

// Catalyst Real-Time Performance Monitor
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Clock, 
  Zap, 
  Database, 
  Wifi, 
  HardDrive,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Monitor
} from 'lucide-react';
import { getCacheMetrics } from '@/lib/cache/catalyst-cache';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  
  // Runtime Performance
  memoryUsage: number;
  jsHeapSize: number;
  domNodes: number;
  
  // Network
  connectionType: string;
  downlink: number;
  rtt: number;
  
  // Cache Performance
  cacheHitRate: number;
  cacheSize: number;
  
  // Bundle Performance
  bundleSize: number;
  chunksLoaded: number;
  
  // Frame Performance
  fps: number;
  frameDrops: number;
}

interface PerformanceThresholds {
  lcp: { good: number; needs_improvement: number };
  fid: { good: number; needs_improvement: number };
  cls: { good: number; needs_improvement: number };
  fcp: { good: number; needs_improvement: number };
  ttfb: { good: number; needs_improvement: number };
}

const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  lcp: { good: 2500, needs_improvement: 4000 },
  fid: { good: 100, needs_improvement: 300 },
  cls: { good: 0.1, needs_improvement: 0.25 },
  fcp: { good: 1800, needs_improvement: 3000 },
  ttfb: { good: 800, needs_improvement: 1800 }
};

export const PerformanceMonitor: React.FC<{
  isVisible?: boolean;
  updateInterval?: number;
}> = ({ 
  isVisible = false, 
  updateInterval = 5000 
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [history, setHistory] = useState<PerformanceMetrics[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();
  const observerRef = useRef<PerformanceObserver>();
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());

  // Collect Core Web Vitals
  const collectWebVitals = useCallback((): Partial<PerformanceMetrics> => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    const ttfb = navigation?.responseStart - navigation?.requestStart || 0;
    
    return {
      fcp: Math.round(fcp),
      ttfb: Math.round(ttfb)
    };
  }, []);

  // Collect Memory Usage
  const collectMemoryMetrics = useCallback((): Partial<PerformanceMetrics> => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        memoryUsage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100),
        jsHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024) // MB
      };
    }
    return {};
  }, []);

  // Collect Network Information
  const collectNetworkMetrics = useCallback((): Partial<PerformanceMetrics> => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        connectionType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0
      };
    }
    return {
      connectionType: 'unknown',
      downlink: 0,
      rtt: 0
    };
  }, []);

  // Collect DOM Metrics
  const collectDOMMetrics = useCallback((): Partial<PerformanceMetrics> => {
    return {
      domNodes: document.querySelectorAll('*').length
    };
  }, []);

  // Collect Cache Metrics
  const collectCacheMetrics = useCallback((): Partial<PerformanceMetrics> => {
    const cacheMetrics = getCacheMetrics();
    return {
      cacheHitRate: cacheMetrics.hitRate,
      cacheSize: cacheMetrics.l1Size
    };
  }, []);

  // Frame rate monitoring
  const measureFrameRate = useCallback(() => {
    const now = performance.now();
    const delta = now - lastFrameTimeRef.current;
    
    if (delta >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / delta);
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
      return fps;
    }
    
    frameCountRef.current++;
    requestAnimationFrame(measureFrameRate);
    return 60; // Default assumption
  }, []);

  // Collect Bundle Metrics
  const collectBundleMetrics = useCallback((): Partial<PerformanceMetrics> => {
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;
    
    // Estimate bundle size from script tags
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && src.includes('/_next/static/')) {
        // Rough estimation based on typical chunk sizes
        totalSize += 250; // KB
      }
    });

    return {
      bundleSize: totalSize,
      chunksLoaded: scripts.length
    };
  }, []);

  // Main metrics collection
  const collectMetrics = useCallback(async (): Promise<PerformanceMetrics> => {
    const webVitals = collectWebVitals();
    const memory = collectMemoryMetrics();
    const network = collectNetworkMetrics();
    const dom = collectDOMMetrics();
    const cache = collectCacheMetrics();
    const bundle = collectBundleMetrics();
    
    // Get LCP, FID, CLS from Performance Observer if available
    let lcp = 0, fid = 0, cls = 0;
    
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      lcp = Math.round(lcpEntries[lcpEntries.length - 1].startTime);
    }

    const fidEntries = performance.getEntriesByType('first-input');
    if (fidEntries.length > 0) {
      fid = Math.round((fidEntries[0] as any).processingStart - fidEntries[0].startTime);
    }

    // CLS needs layout shift entries
    const clsEntries = performance.getEntriesByType('layout-shift');
    cls = clsEntries.reduce((sum, entry) => {
      if (!(entry as any).hadRecentInput) {
        return sum + (entry as any).value;
      }
      return sum;
    }, 0);

    return {
      lcp,
      fid,
      cls: Math.round(cls * 1000) / 1000,
      fps: measureFrameRate(),
      frameDrops: 0, // Would need more sophisticated tracking
      ...webVitals,
      ...memory,
      ...network,
      ...dom,
      ...cache,
      ...bundle
    } as PerformanceMetrics;
  }, [
    collectWebVitals,
    collectMemoryMetrics,
    collectNetworkMetrics,
    collectDOMMetrics,
    collectCacheMetrics,
    collectBundleMetrics,
    measureFrameRate
  ]);

  // Check for performance alerts
  const checkAlerts = useCallback((metrics: PerformanceMetrics) => {
    const newAlerts: string[] = [];
    
    if (metrics.lcp > PERFORMANCE_THRESHOLDS.lcp.needs_improvement) {
      newAlerts.push(`LCP is slow: ${metrics.lcp}ms (should be < ${PERFORMANCE_THRESHOLDS.lcp.good}ms)`);
    }
    
    if (metrics.fid > PERFORMANCE_THRESHOLDS.fid.needs_improvement) {
      newAlerts.push(`FID is high: ${metrics.fid}ms (should be < ${PERFORMANCE_THRESHOLDS.fid.good}ms)`);
    }
    
    if (metrics.cls > PERFORMANCE_THRESHOLDS.cls.needs_improvement) {
      newAlerts.push(`CLS is high: ${metrics.cls} (should be < ${PERFORMANCE_THRESHOLDS.cls.good})`);
    }
    
    if (metrics.memoryUsage > 80) {
      newAlerts.push(`High memory usage: ${metrics.memoryUsage}%`);
    }
    
    if (metrics.cacheHitRate < 50) {
      newAlerts.push(`Low cache hit rate: ${metrics.cacheHitRate}%`);
    }

    setAlerts(newAlerts);
  }, []);

  // Start monitoring
  const startMonitoring = useCallback(async () => {
    setIsCollecting(true);
    
    try {
      // Set up Performance Observer for real-time metrics
      if ('PerformanceObserver' in window) {
        observerRef.current = new PerformanceObserver((list) => {
          // Handle performance entries in real-time
        });
        
        observerRef.current.observe({ 
          entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'paint']
        });
      }

      // Initial collection
      const initialMetrics = await collectMetrics();
      setMetrics(initialMetrics);
      checkAlerts(initialMetrics);
      
      // Set up interval for continuous monitoring
      intervalRef.current = setInterval(async () => {
        try {
          const newMetrics = await collectMetrics();
          setMetrics(newMetrics);
          checkAlerts(newMetrics);
          
          // Add to history (keep last 20 entries)
          setHistory(prev => {
            const updated = [...prev, newMetrics];
            return updated.slice(-20);
          });
        } catch (error) {
          console.error('Error collecting metrics:', error);
        }
      }, updateInterval);
      
    } catch (error) {
      console.error('Error starting performance monitoring:', error);
      setIsCollecting(false);
    }
  }, [collectMetrics, checkAlerts, updateInterval]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsCollecting(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  }, []);

  // Effect for monitoring lifecycle
  useEffect(() => {
    if (isVisible) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
    
    return stopMonitoring;
  }, [isVisible, startMonitoring, stopMonitoring]);

  // Get status color based on metric value
  const getMetricStatus = (metric: keyof PerformanceThresholds, value: number) => {
    const threshold = PERFORMANCE_THRESHOLDS[metric];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needs_improvement) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'needs-improvement': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'poor': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Monitor className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!isVisible || !metrics) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 z-50">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              {isCollecting && (
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={startMonitoring}
                disabled={isCollecting}
              >
                <RefreshCw className={`h-4 w-4 ${isCollecting ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Core Web Vitals */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Core Web Vitals
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm">
                <div className="flex items-center justify-between">
                  <span>LCP</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(getMetricStatus('lcp', metrics.lcp))}
                    <span className={getStatusColor(getMetricStatus('lcp', metrics.lcp))}>
                      {metrics.lcp}ms
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm">
                <div className="flex items-center justify-between">
                  <span>FID</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(getMetricStatus('fid', metrics.fid))}
                    <span className={getStatusColor(getMetricStatus('fid', metrics.fid))}>
                      {metrics.fid}ms
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm">
                <div className="flex items-center justify-between">
                  <span>CLS</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(getMetricStatus('cls', metrics.cls))}
                    <span className={getStatusColor(getMetricStatus('cls', metrics.cls))}>
                      {metrics.cls}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm">
                <div className="flex items-center justify-between">
                  <span>FCP</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(getMetricStatus('fcp', metrics.fcp))}
                    <span className={getStatusColor(getMetricStatus('fcp', metrics.fcp))}>
                      {metrics.fcp}ms
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Resources */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Resources
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Memory</span>
                <span>{metrics.memoryUsage}%</span>
              </div>
              <Progress value={metrics.memoryUsage} className="h-1" />
              
              <div className="flex items-center justify-between text-sm">
                <span>Cache Hit Rate</span>
                <span>{metrics.cacheHitRate.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.cacheHitRate} className="h-1" />
            </div>
          </div>

          {/* Network & Performance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Network
              </h4>
              <div className="text-sm space-y-1">
                <div>{metrics.connectionType}</div>
                <div>{metrics.downlink} Mbps</div>
                <div>{metrics.rtt}ms RTT</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Runtime
              </h4>
              <div className="text-sm space-y-1">
                <div>{metrics.fps} FPS</div>
                <div>{metrics.domNodes} DOM nodes</div>
                <div>{metrics.jsHeapSize}MB heap</div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Alerts
              </h4>
              <div className="space-y-1">
                {alerts.map((alert, index) => (
                  <Badge key={index} variant="destructive" className="text-xs">
                    {alert}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};