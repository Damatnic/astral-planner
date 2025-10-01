// Catalyst Performance Dashboard - Elite Monitoring System
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import { performanceLogger } from '@/lib/logger';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number;
  fcp: number;
  cls: number;
  inp: number;
  ttfb: number;
  
  // Additional Performance Metrics
  domContentLoaded: number;
  firstPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  
  // Resource Metrics
  jsSize: number;
  cssSize: number;
  imageSize: number;
  totalSize: number;
  
  // Network Metrics
  connectionType: string;
  downlink: number;
  rtt: number;
  
  // Custom Metrics
  renderTime: number;
  hydrationTime: number;
  routeChangeTime: number;
}

interface PerformanceAlert {
  type: 'error' | 'warning' | 'info';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  suggestion: string;
}

class CatalystPerformanceDashboard {
  private metrics: Partial<PerformanceMetrics> = {};
  private alerts: PerformanceAlert[] = [];
  private observers: PerformanceObserver[] = [];
  private startTime = performance.now();
  
  // Performance thresholds for alerts
  private thresholds = {
    lcp: { good: 2500, poor: 4000 },
    fcp: { good: 1800, poor: 3000 },
    cls: { good: 0.1, poor: 0.25 },
    inp: { good: 200, poor: 500 },
    ttfb: { good: 800, poor: 1800 },
    jsSize: { good: 300 * 1024, poor: 1024 * 1024 }, // 300KB / 1MB
    renderTime: { good: 100, poor: 300 },
    hydrationTime: { good: 500, poor: 2000 }
  };

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.monitorWebVitals();
    
    // Monitor resource loading
    this.monitorResourceTiming();
    
    // Monitor long tasks
    this.monitorLongTasks();
    
    // Monitor navigation timing
    this.monitorNavigationTiming();
    
    // Monitor custom performance marks
    this.monitorCustomMarks();
    
    // Start continuous monitoring
    this.startContinuousMonitoring();
  }

  private monitorWebVitals() {
    const recordMetric = (metric: any) => {
      this.metrics[metric.name.toLowerCase() as keyof PerformanceMetrics] = metric.value;
      this.checkThreshold(metric.name.toLowerCase(), metric.value);
      this.logMetric(metric.name, metric.value, metric.rating);
    };

    onLCP(recordMetric);
    onFCP(recordMetric);
    onCLS(recordMetric);
    onINP(recordMetric);
    onTTFB(recordMetric);
  }

  private monitorResourceTiming() {
    const observer = new PerformanceObserver((list) => {
      let jsSize = 0;
      let cssSize = 0;
      let imageSize = 0;

      for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
        const size = entry.transferSize || 0;
        
        if (entry.name.includes('.js')) {
          jsSize += size;
        } else if (entry.name.includes('.css')) {
          cssSize += size;
        } else if (entry.initiatorType === 'img') {
          imageSize += size;
        }

        // Alert on slow resources
        const duration = entry.responseEnd - entry.startTime;
        if (duration > 2000) {
          this.addAlert('warning', 'resource-timing', duration, 2000, 
            `Slow resource: ${entry.name}`, 
            'Consider optimizing or lazy loading this resource');
        }
      }

      this.metrics.jsSize = jsSize;
      this.metrics.cssSize = cssSize;
      this.metrics.imageSize = imageSize;
      this.metrics.totalSize = jsSize + cssSize + imageSize;

      this.checkThreshold('jsSize', jsSize);
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.push(observer);
  }

  private monitorLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      let totalBlockingTime = 0;
      
      for (const entry of list.getEntries()) {
        const blockingTime = Math.max(0, entry.duration - 50);
        totalBlockingTime += blockingTime;

        if (entry.duration > 50) {
          this.addAlert('warning', 'long-task', entry.duration, 50,
            `Long task detected: ${entry.duration.toFixed(2)}ms`,
            'Break up long JavaScript tasks to improve responsiveness');
        }
      }

      this.metrics.totalBlockingTime = totalBlockingTime;
    });

    try {
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (e) {
      // longtask not supported in all browsers
    }
  }

  private monitorNavigationTiming() {
    if (!window.performance || !window.performance.timing) return;

    const timing = window.performance.timing;
    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigation) {
      this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      
      // Check for First Paint
      const paintEntries = window.performance.getEntriesByType('paint');
      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
      if (firstPaint) {
        this.metrics.firstPaint = firstPaint.startTime;
      }
    }
  }

  private monitorCustomMarks() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'mark') {
          // Track custom performance marks
          if (entry.name === 'catalyst:render-start') {
            performance.mark('catalyst:render-end');
            this.measureCustomMetric('renderTime', 'catalyst:render-start', 'catalyst:render-end');
          }
          
          if (entry.name === 'catalyst:hydration-start') {
            performance.mark('catalyst:hydration-end');
            this.measureCustomMetric('hydrationTime', 'catalyst:hydration-start', 'catalyst:hydration-end');
          }
        }
      }
    });

    observer.observe({ entryTypes: ['mark', 'measure'] });
    this.observers.push(observer);
  }

  private measureCustomMetric(metricName: keyof PerformanceMetrics, startMark: string, endMark: string) {
    try {
      performance.measure(`catalyst:${metricName}`, startMark, endMark);
      const measure = performance.getEntriesByName(`catalyst:${metricName}`)[0];
      
      if (measure) {
        // Type assertion: we know this is a numeric metric
        (this.metrics as any)[metricName] = measure.duration;
        this.checkThreshold(metricName, measure.duration);
      }
    } catch (e) {
      // Measurement failed
    }
  }

  private startContinuousMonitoring() {
    // Monitor network information
    const updateNetworkInfo = () => {
      const nav = navigator as any;
      const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
      
      if (connection) {
        this.metrics.connectionType = connection.effectiveType || 'unknown';
        this.metrics.downlink = connection.downlink || 0;
        this.metrics.rtt = connection.rtt || 0;
      }
    };

    updateNetworkInfo();
    setInterval(updateNetworkInfo, 10000); // Every 10 seconds

    // Monitor memory usage if available
    const updateMemoryInfo = () => {
      const memory = (performance as any).memory;
      if (memory) {
        const memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize;
        if (memoryUsage > 0.85) {
          this.addAlert('warning', 'memory-usage', memoryUsage * 100, 85,
            `High memory usage: ${(memoryUsage * 100).toFixed(1)}%`,
            'Consider optimizing memory usage to prevent performance degradation');
        }
      }
    };

    setInterval(updateMemoryInfo, 5000); // Every 5 seconds
  }

  private checkThreshold(metric: string, value: number) {
    const threshold = this.thresholds[metric as keyof typeof this.thresholds];
    if (!threshold) return;

    if (value > threshold.poor) {
      this.addAlert('error', metric, value, threshold.poor,
        `Poor ${metric}: ${this.formatValue(metric, value)}`,
        this.getSuggestion(metric));
    } else if (value > threshold.good) {
      this.addAlert('warning', metric, value, threshold.good,
        `Needs improvement ${metric}: ${this.formatValue(metric, value)}`,
        this.getSuggestion(metric));
    }
  }

  private addAlert(type: PerformanceAlert['type'], metric: string, value: number, threshold: number, message: string, suggestion: string) {
    this.alerts.push({
      type,
      metric,
      value,
      threshold,
      message,
      suggestion
    });

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
  }

  private formatValue(metric: string, value: number): string {
    if (metric.includes('Size')) {
      return `${(value / 1024).toFixed(1)}KB`;
    }
    if (metric === 'cls') {
      return value.toFixed(3);
    }
    return `${Math.round(value)}ms`;
  }

  private getSuggestion(metric: string): string {
    const suggestions: Record<string, string> = {
      lcp: 'Optimize largest contentful paint by reducing image sizes, preloading critical resources, and improving server response times',
      fcp: 'Improve first contentful paint by eliminating render-blocking resources and optimizing critical rendering path',
      cls: 'Reduce cumulative layout shift by setting dimensions for images and ads, avoiding injected content above existing content',
      inp: 'Improve interaction to next paint by optimizing event handlers and reducing JavaScript execution time',
      ttfb: 'Reduce time to first byte by optimizing server response times and using a CDN',
      jsSize: 'Reduce JavaScript bundle size through code splitting, tree shaking, and removing unused dependencies',
      renderTime: 'Optimize render time by reducing component complexity and using React optimization techniques',
      hydrationTime: 'Improve hydration time by optimizing initial state and reducing component complexity'
    };
    
    return suggestions[metric] || 'Consider general performance optimizations';
  }

  private logMetric(name: string, value: number, rating?: string) {
    if (process.env.NODE_ENV === 'development') {
      const color = rating === 'good' ? '🟢' : rating === 'needs-improvement' ? '🟡' : '🔴';
      performanceLogger.debug('Catalyst metric', { name, value: this.formatValue(name, value), rating, color });
    }
  }

  // Public API
  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  public getPerformanceScore(): number {
    const scores = {
      lcp: this.calculateScore(this.metrics.lcp, this.thresholds.lcp),
      fcp: this.calculateScore(this.metrics.fcp, this.thresholds.fcp),
      cls: this.calculateScore(this.metrics.cls, this.thresholds.cls, true),
      inp: this.calculateScore(this.metrics.inp, this.thresholds.inp),
      ttfb: this.calculateScore(this.metrics.ttfb, this.thresholds.ttfb)
    };

    const validScores = Object.values(scores).filter(score => score !== null) as number[];
    return validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
  }

  private calculateScore(value: number | undefined, threshold: any, lowerIsBetter = false): number | null {
    if (value === undefined || !threshold) return null;

    if (lowerIsBetter) {
      if (value <= threshold.good) return 100;
      if (value <= threshold.poor) return 75;
      return 50;
    } else {
      if (value <= threshold.good) return 100;
      if (value <= threshold.poor) return 75;
      return 50;
    }
  }

  public generateReport(): string {
    const metrics = this.getMetrics();
    const alerts = this.getAlerts();
    const score = this.getPerformanceScore();

    let report = `
╔═══════════════════════════════════════════════════════════════╗
║                    CATALYST PERFORMANCE REPORT               ║
╠═══════════════════════════════════════════════════════════════╣
║ Overall Performance Score: ${score}/100                          ║
╠═══════════════════════════════════════════════════════════════╣
║ CORE WEB VITALS                                               ║
║ • LCP (Largest Contentful Paint): ${metrics.lcp ? this.formatValue('lcp', metrics.lcp) : 'N/A'} ║
║ • FCP (First Contentful Paint): ${metrics.fcp ? this.formatValue('fcp', metrics.fcp) : 'N/A'}   ║
║ • CLS (Cumulative Layout Shift): ${metrics.cls ? this.formatValue('cls', metrics.cls) : 'N/A'}  ║
║ • INP (Interaction to Next Paint): ${metrics.inp ? this.formatValue('inp', metrics.inp) : 'N/A'} ║
║ • TTFB (Time to First Byte): ${metrics.ttfb ? this.formatValue('ttfb', metrics.ttfb) : 'N/A'}    ║
╠═══════════════════════════════════════════════════════════════╣
║ RESOURCE METRICS                                              ║
║ • JavaScript Size: ${metrics.jsSize ? this.formatValue('jsSize', metrics.jsSize) : 'N/A'}       ║
║ • CSS Size: ${metrics.cssSize ? this.formatValue('cssSize', metrics.cssSize) : 'N/A'}           ║
║ • Image Size: ${metrics.imageSize ? this.formatValue('imageSize', metrics.imageSize) : 'N/A'}   ║
║ • Total Size: ${metrics.totalSize ? this.formatValue('totalSize', metrics.totalSize) : 'N/A'}   ║
╠═══════════════════════════════════════════════════════════════╣
║ NETWORK INFO                                                  ║
║ • Connection: ${metrics.connectionType || 'N/A'}               ║
║ • Downlink: ${metrics.downlink ? metrics.downlink.toFixed(1) + ' Mbps' : 'N/A'}                 ║
║ • RTT: ${metrics.rtt ? metrics.rtt + 'ms' : 'N/A'}             ║
╚═══════════════════════════════════════════════════════════════╝
    `;

    if (alerts.length > 0) {
      report += '\n\n🚨 PERFORMANCE ALERTS:\n';
      alerts.slice(-10).forEach(alert => {
        const icon = alert.type === 'error' ? '🔴' : alert.type === 'warning' ? '🟡' : '🔵';
        report += `${icon} ${alert.message}\n   💡 ${alert.suggestion}\n\n`;
      });
    }

    return report;
  }

  public mark(name: string) {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`catalyst:${name}`);
    }
  }

  public measure(name: string, startMark: string, endMark?: string) {
    if (typeof window !== 'undefined' && window.performance) {
      const fullStartMark = `catalyst:${startMark}`;
      const fullEndMark = endMark ? `catalyst:${endMark}` : undefined;
      
      try {
        performance.measure(`catalyst:${name}`, fullStartMark, fullEndMark);
        const measure = performance.getEntriesByName(`catalyst:${name}`)[0];
        
        if (measure) {
          this.logMetric(name, measure.duration);
          return measure.duration;
        }
      } catch (e) {
        performanceLogger.warn('Failed to measure metric', { name }, e as Error);
      }
    }
    return 0;
  }

  public destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.alerts = [];
    this.metrics = {};
  }
}

// Singleton instance
export const catalystDashboard = new CatalystPerformanceDashboard();

// Convenience functions
export const markPerformance = (name: string) => catalystDashboard.mark(name);
export const measurePerformance = (name: string, startMark: string, endMark?: string) => 
  catalystDashboard.measure(name, startMark, endMark);
export const getPerformanceReport = () => catalystDashboard.generateReport();
export const getPerformanceScore = () => catalystDashboard.getPerformanceScore();
export const getPerformanceMetrics = () => catalystDashboard.getMetrics();
export const getPerformanceAlerts = () => catalystDashboard.getAlerts();

// Performance optimization utilities
export const optimizeImages = () => {
  // Lazy load images that are not in viewport
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      }
    });
  }, { rootMargin: '50px' });

  images.forEach(img => imageObserver.observe(img));
};

export const preloadCriticalResources = (resources: string[]) => {
  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    
    if (resource.endsWith('.js')) {
      link.as = 'script';
    } else if (resource.endsWith('.css')) {
      link.as = 'style';
    } else if (resource.match(/\.(woff2|woff|ttf|otf)$/)) {
      link.as = 'font';
      link.crossOrigin = 'anonymous';
    } else {
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
    }
    
    link.href = resource;
    document.head.appendChild(link);
  });
};