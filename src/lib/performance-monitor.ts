/**
 * CATALYST CRITICAL PERFORMANCE MONITOR
 * Real-time performance tracking to prevent crashes
 */
import { Logger as performanceLogger } from '@/lib/logger/edge';

interface PerformanceMetrics {
  memoryUsage: number;
  jsHeapSize: number;
  bundleSize: number;
  apiResponseTime: number;
  renderTime: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100; // Limit memory usage
  private warningThresholds = {
    memoryUsage: 50 * 1024 * 1024, // 50MB
    jsHeapSize: 100 * 1024 * 1024, // 100MB
    apiResponseTime: 3000, // 3 seconds
    renderTime: 100, // 100ms
  };

  constructor() {
    this.startMonitoring();
  }

  private monitoringInterval?: number;

  private startMonitoring() {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Monitor every 60 seconds (reduced frequency)
    this.monitoringInterval = window.setInterval(() => {
      this.collectMetrics();
      this.checkThresholds();
    }, 60000);

    // Monitor page visibility to pause when hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseHeavyOperations();
      } else {
        this.resumeOperations();
      }
    });
  }

  private collectMetrics() {
    const metrics: PerformanceMetrics = {
      memoryUsage: this.getMemoryUsage(),
      jsHeapSize: this.getJSHeapSize(),
      bundleSize: this.getBundleSize(),
      apiResponseTime: this.getAverageApiResponseTime(),
      renderTime: this.getAverageRenderTime(),
      timestamp: Date.now(),
    };

    this.metrics.push(metrics);
    
    // Limit array size to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  private getJSHeapSize(): number {
    if ('memory' in performance) {
      return (performance as any).memory.totalJSHeapSize || 0;
    }
    return 0;
  }

  private getBundleSize(): number {
    // Estimate from loaded resources
    const entries = performance.getEntriesByType('resource');
    return entries.reduce((total, entry: any) => {
      if (entry.name.includes('/_next/static/chunks/')) {
        return total + (entry.transferSize || 0);
      }
      return total;
    }, 0);
  }

  private getAverageApiResponseTime(): number {
    const apiEntries = performance.getEntriesByType('resource')
      .filter((entry: any) => entry.name.includes('/api/'));
    
    if (apiEntries.length === 0) return 0;
    
    const totalTime = apiEntries.reduce((total, entry: any) => {
      return total + entry.duration;
    }, 0);
    
    return totalTime / apiEntries.length;
  }

  private getAverageRenderTime(): number {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as any;
    return navigationEntry ? navigationEntry.loadEventEnd - navigationEntry.loadEventStart : 0;
  }

  private checkThresholds() {
    const latest = this.metrics[this.metrics.length - 1];
    if (!latest) return;

    const warnings: string[] = [];

    if (latest.memoryUsage > this.warningThresholds.memoryUsage) {
      warnings.push(`High memory usage: ${(latest.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      this.triggerMemoryCleanup();
    }

    if (latest.jsHeapSize > this.warningThresholds.jsHeapSize) {
      warnings.push(`High JS heap: ${(latest.jsHeapSize / 1024 / 1024).toFixed(2)}MB`);
      this.triggerGarbageCollection();
    }

    if (latest.apiResponseTime > this.warningThresholds.apiResponseTime) {
      warnings.push(`Slow API responses: ${latest.apiResponseTime.toFixed(2)}ms`);
    }

    if (latest.renderTime > this.warningThresholds.renderTime) {
      warnings.push(`Slow render time: ${latest.renderTime.toFixed(2)}ms`);
    }

    if (warnings.length > 0) {
      performanceLogger.warn('CATALYST PERFORMANCE WARNING', { warnings: warnings.join(', ') });
      this.reportPerformanceIssue(warnings);
    }
  }

  private triggerMemoryCleanup() {
    // Clear React Query cache
    if (window.__REACT_QUERY_CLIENT__) {
      window.__REACT_QUERY_CLIENT__.clear();
    }

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }

    // Clear performance entries
    performance.clearResourceTimings();
    performance.clearMeasures();
    performance.clearMarks();
  }

  private triggerGarbageCollection() {
    // Minimize DOM nodes
    this.cleanupUnusedDOMNodes();
    
    // Clear event listeners
    this.cleanupEventListeners();
    
    // Cleanup intervals
    this.cleanupIntervals();
  }

  private cleanupUnusedDOMNodes() {
    if (typeof document === 'undefined') return;
    const unusedElements = document.querySelectorAll('[data-cleanup="true"]');
    unusedElements.forEach(el => el.remove());
  }

  private cleanupEventListeners() {
    // Implementation would depend on specific event listeners
    performanceLogger.debug('Cleaning up event listeners');
  }

  private cleanupIntervals() {
    // CRITICAL FIX: Only clear our own monitoring interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    // Don't clear other intervals that might be in use
  }

  private pauseHeavyOperations() {
    // Pause animations, polling, etc.
    if (typeof document !== 'undefined') {
      document.body.style.setProperty('--animation-play-state', 'paused');
    }
  }

  private resumeOperations() {
    if (typeof document !== 'undefined') {
      document.body.style.setProperty('--animation-play-state', 'running');
    }
  }

  private reportPerformanceIssue(warnings: string[]) {
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to Sentry, DataDog, etc.
      performanceLogger.error('Performance degradation detected', { warnings });
    }
  }

  // Public methods
  public getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  public getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public forceCleanup() {
    this.triggerMemoryCleanup();
    this.triggerGarbageCollection();
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

// Types for window extensions
declare global {
  interface Window {
    __REACT_QUERY_CLIENT__?: any;
    gc?: () => void;
  }
}