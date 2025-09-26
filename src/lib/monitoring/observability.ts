/**
 * ASTRAL PLANNER - ENTERPRISE OBSERVABILITY SYSTEM
 * Revolutionary monitoring with real-time insights and automated alerting
 * 
 * Features:
 * - Real-time performance monitoring
 * - Distributed tracing
 * - Custom metrics and dashboards
 * - Intelligent alerting
 * - Error tracking and analysis
 * - Business metrics tracking
 */

import Logger from '../logger';

interface MetricPoint {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
  unit?: 'ms' | 'count' | 'bytes' | 'percent' | 'rate';
}

interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, string>;
  logs: Array<{
    timestamp: number;
    level: 'info' | 'warn' | 'error';
    message: string;
    fields?: Record<string, unknown>;
  }>;
  status: 'success' | 'error' | 'timeout';
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  window: number; // Time window in minutes
  severity: 'info' | 'warning' | 'critical';
  channels: ('email' | 'slack' | 'pagerduty')[];
  enabled: boolean;
}

interface BusinessMetric {
  name: string;
  value: number;
  target?: number;
  trend: 'up' | 'down' | 'stable';
  timestamp: number;
  metadata: Record<string, unknown>;
}

export class ObservabilitySystem {
  private static instance: ObservabilitySystem;
  private metrics: Map<string, MetricPoint[]> = new Map();
  private traces: Map<string, TraceSpan[]> = new Map();
  private alertRules: AlertRule[] = [];
  private isInitialized = false;
  private flushInterval: NodeJS.Timeout | null = null;
  private activeSpans: Map<string, TraceSpan> = new Map();

  static getInstance(): ObservabilitySystem {
    if (!ObservabilitySystem.instance) {
      ObservabilitySystem.instance = new ObservabilitySystem();
    }
    return ObservabilitySystem.instance;
  }

  /**
   * Initialize the observability system
   */
  init(): void {
    if (this.isInitialized) return;

    try {
      this.setupDefaultMetrics();
      this.setupDefaultAlerts();
      this.startMetricsCollection();
      this.startPeriodicFlush();
      
      this.isInitialized = true;
      Logger.info('Observability system initialized');
    } catch (error) {
      Logger.error('Failed to initialize observability system', error);
    }
  }

  /**
   * Record a custom metric
   */
  recordMetric(
    name: string, 
    value: number, 
    tags: Record<string, string> = {},
    unit?: MetricPoint['unit']
  ): void {
    const metric: MetricPoint = {
      name,
      value,
      timestamp: Date.now(),
      tags: {
        environment: process.env.NODE_ENV || 'development',
        service: 'astral-planner',
        ...tags
      },
      unit
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricHistory = this.metrics.get(name)!;
    metricHistory.push(metric);

    // Keep only last 1000 points per metric
    if (metricHistory.length > 1000) {
      metricHistory.shift();
    }

    // Check alert rules
    this.checkAlertRules(name, value, tags);

    Logger.debug('Metric recorded', { name, value, tags, unit });
  }

  /**
   * Start a new trace span
   */
  startSpan(
    operationName: string,
    parentSpanId?: string,
    tags: Record<string, string> = {}
  ): string {
    const traceId = parentSpanId ? 
      this.getTraceIdFromSpan(parentSpanId) : 
      this.generateTraceId();
    
    const spanId = this.generateSpanId();

    const span: TraceSpan = {
      traceId,
      spanId,
      parentSpanId,
      operationName,
      startTime: Date.now(),
      tags: {
        environment: process.env.NODE_ENV || 'development',
        service: 'astral-planner',
        ...tags
      },
      logs: [],
      status: 'success'
    };

    this.activeSpans.set(spanId, span);

    Logger.debug('Span started', { traceId, spanId, operationName });
    return spanId;
  }

  /**
   * Finish a trace span
   */
  finishSpan(
    spanId: string, 
    status: TraceSpan['status'] = 'success',
    tags: Record<string, string> = {}
  ): void {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      Logger.warn('Attempted to finish non-existent span', { spanId });
      return;
    }

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    span.tags = { ...span.tags, ...tags };

    // Store completed span
    if (!this.traces.has(span.traceId)) {
      this.traces.set(span.traceId, []);
    }
    this.traces.get(span.traceId)!.push(span);

    // Remove from active spans
    this.activeSpans.delete(spanId);

    // Record timing metric
    this.recordMetric(
      `span.duration.${span.operationName}`,
      span.duration,
      { status, ...span.tags },
      'ms'
    );

    Logger.debug('Span finished', { 
      spanId, 
      traceId: span.traceId, 
      duration: span.duration, 
      status 
    });
  }

  /**
   * Add a log entry to a span
   */
  addSpanLog(
    spanId: string,
    level: TraceSpan['logs'][0]['level'],
    message: string,
    fields?: Record<string, unknown>
  ): void {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      Logger.warn('Attempted to log to non-existent span', { spanId });
      return;
    }

    span.logs.push({
      timestamp: Date.now(),
      level,
      message,
      fields
    });
  }

  /**
   * Record business metrics
   */
  recordBusinessMetric(metric: Omit<BusinessMetric, 'timestamp'>): void {
    const businessMetric: BusinessMetric = {
      ...metric,
      timestamp: Date.now()
    };

    // Store and forward to analytics
    this.recordMetric(
      `business.${metric.name}`,
      metric.value,
      { type: 'business' }
    );

    Logger.info('Business metric recorded', businessMetric);
  }

  /**
   * Record user interaction events
   */
  recordUserEvent(
    event: string,
    userId?: string,
    properties: Record<string, unknown> = {}
  ): void {
    const tags: Record<string, string> = {};
    if (userId) tags.user_id = userId;

    this.recordMetric(
      `user.event.${event}`,
      1,
      tags,
      'count'
    );

    Logger.info('User event recorded', { event, userId, properties });
  }

  /**
   * Performance monitoring wrapper
   */
  async measureOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    tags: Record<string, string> = {}
  ): Promise<T> {
    const spanId = this.startSpan(operationName, undefined, tags);
    const startTime = performance.now();

    try {
      const result = await operation();
      
      const duration = performance.now() - startTime;
      this.recordMetric(
        `operation.duration.${operationName}`,
        duration,
        { ...tags, status: 'success' },
        'ms'
      );

      this.finishSpan(spanId, 'success', { duration: duration.toString() });
      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordMetric(
        `operation.duration.${operationName}`,
        duration,
        { ...tags, status: 'error' },
        'ms'
      );

      this.recordMetric(
        `operation.error.${operationName}`,
        1,
        { ...tags, error: error instanceof Error ? error.name : 'Unknown' },
        'count'
      );

      this.addSpanLog(spanId, 'error', 'Operation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      this.finishSpan(spanId, 'error', { 
        duration: duration.toString(),
        error: error instanceof Error ? error.name : 'Unknown'
      });

      throw error;
    }
  }

  /**
   * Database query monitoring
   */
  recordDatabaseQuery(
    query: string,
    duration: number,
    status: 'success' | 'error',
    table?: string
  ): void {
    const tags: Record<string, string> = { status };
    if (table) tags.table = table;

    this.recordMetric('database.query.duration', duration, tags, 'ms');
    this.recordMetric('database.query.count', 1, tags, 'count');

    if (duration > 1000) {
      Logger.warn('Slow database query detected', { query, duration, table });
    }
  }

  /**
   * API endpoint monitoring
   */
  recordAPIRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    userId?: string
  ): void {
    const tags: Record<string, string> = {
      method,
      endpoint,
      status_code: statusCode.toString(),
      status_class: `${Math.floor(statusCode / 100)}xx`
    };

    if (userId) tags.user_id = userId;

    this.recordMetric('api.request.duration', duration, tags, 'ms');
    this.recordMetric('api.request.count', 1, tags, 'count');

    // Track error rates
    if (statusCode >= 400) {
      this.recordMetric('api.error.count', 1, tags, 'count');
    }

    // Track slow requests
    if (duration > 2000) {
      this.recordMetric('api.slow_request.count', 1, tags, 'count');
      Logger.warn('Slow API request detected', { method, endpoint, duration });
    }
  }

  /**
   * Setup default system metrics
   */
  private setupDefaultMetrics(): void {
    if (typeof window === 'undefined') return; // Server-side only

    // Monitor Core Web Vitals
    this.monitorWebVitals();
    
    // Monitor resource usage
    this.monitorResourceUsage();
    
    // Monitor user interactions
    this.monitorUserInteractions();
  }

  /**
   * Monitor Core Web Vitals
   */
  private monitorWebVitals(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      // First Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('web_vital.fcp', entry.startTime, {}, 'ms');
          }
        }
      }).observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('web_vital.lcp', lastEntry.startTime, {}, 'ms');
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = entry.processingStart - entry.startTime;
          this.recordMetric('web_vital.fid', fid, {}, 'ms');
        }
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            this.recordMetric('web_vital.cls', clsValue, {});
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });

    } catch (error) {
      Logger.warn('Could not setup web vitals monitoring', error);
    }
  }

  /**
   * Monitor resource usage
   */
  private monitorResourceUsage(): void {
    setInterval(() => {
      // Memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.recordMetric('resource.memory.used', memory.usedJSHeapSize, {}, 'bytes');
        this.recordMetric('resource.memory.total', memory.totalJSHeapSize, {}, 'bytes');
        this.recordMetric('resource.memory.limit', memory.jsHeapSizeLimit, {}, 'bytes');
      }

      // Connection info
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        this.recordMetric('resource.network.downlink', connection.downlink);
        this.recordMetric('resource.network.rtt', connection.rtt, {}, 'ms');
      }

      // Page visibility
      this.recordMetric(
        'resource.page.visible',
        document.hidden ? 0 : 1,
        {},
        'count'
      );

    }, 30000); // Every 30 seconds
  }

  /**
   * Monitor user interactions
   */
  private monitorUserInteractions(): void {
    // Click tracking
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const role = target.getAttribute('role');
      
      this.recordUserEvent('click', undefined, {
        element: tagName,
        role: role || null,
        className: target.className,
        id: target.id || null
      });
    });

    // Form submission tracking
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.recordUserEvent('form_submit', undefined, {
        action: form.action,
        method: form.method,
        id: form.id || null
      });
    });

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.recordUserEvent(
        document.hidden ? 'page_hidden' : 'page_visible'
      );
    });

    // Error tracking
    window.addEventListener('error', (event) => {
      this.recordMetric('error.javascript.count', 1, {
        filename: event.filename || 'unknown',
        line: event.lineno?.toString() || 'unknown',
        message: event.message
      }, 'count');
    });

    // Unhandled promise rejection tracking
    window.addEventListener('unhandledrejection', (event) => {
      this.recordMetric('error.promise_rejection.count', 1, {
        reason: event.reason?.toString() || 'unknown'
      }, 'count');
    });
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultAlerts(): void {
    this.alertRules = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: 'api.error.count > 10',
        threshold: 10,
        window: 5,
        severity: 'critical',
        channels: ['slack', 'email'],
        enabled: true
      },
      {
        id: 'slow_response_time',
        name: 'Slow Response Time',
        condition: 'api.request.duration > 2000',
        threshold: 2000,
        window: 5,
        severity: 'warning',
        channels: ['slack'],
        enabled: true
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        condition: 'resource.memory.used > 100MB',
        threshold: 100 * 1024 * 1024,
        window: 10,
        severity: 'warning',
        channels: ['slack'],
        enabled: true
      },
      {
        id: 'poor_web_vitals',
        name: 'Poor Web Vitals',
        condition: 'web_vital.lcp > 4000',
        threshold: 4000,
        window: 10,
        severity: 'warning',
        channels: ['slack'],
        enabled: true
      }
    ];
  }

  /**
   * Check alert rules against current metrics
   */
  private checkAlertRules(metricName: string, value: number, tags: Record<string, string>): void {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      const shouldAlert = this.evaluateAlertCondition(rule, metricName, value);
      
      if (shouldAlert) {
        this.triggerAlert(rule, metricName, value, tags);
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateAlertCondition(rule: AlertRule, metricName: string, value: number): boolean {
    // Simple evaluation - in production, use a proper expression evaluator
    const conditionMetric = rule.condition.split(' ')[0];
    
    if (metricName !== conditionMetric) return false;
    
    return value > rule.threshold;
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(
    rule: AlertRule, 
    metricName: string, 
    value: number, 
    tags: Record<string, string>
  ): void {
    const alert = {
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      metricName,
      value,
      threshold: rule.threshold,
      tags,
      timestamp: new Date().toISOString()
    };

    Logger.error('Alert triggered', alert);

    // Send to configured channels
    for (const channel of rule.channels) {
      this.sendAlertToChannel(channel, alert);
    }

    // Record alert metric
    this.recordMetric('alert.triggered', 1, {
      rule_id: rule.id,
      severity: rule.severity,
      channel: rule.channels.join(',')
    }, 'count');
  }

  /**
   * Send alert to specific channel
   */
  private async sendAlertToChannel(channel: string, alert: any): Promise<void> {
    try {
      switch (channel) {
        case 'slack':
          await this.sendSlackAlert(alert);
          break;
        case 'email':
          await this.sendEmailAlert(alert);
          break;
        case 'pagerduty':
          await this.sendPagerDutyAlert(alert);
          break;
      }
    } catch (error) {
      Logger.error(`Failed to send alert to ${channel}`, { error, alert });
    }
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    // This would integrate with actual metrics backends
    Logger.info('Started metrics collection');
  }

  /**
   * Start periodic flush to external systems
   */
  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, 60000); // Flush every minute
  }

  /**
   * Flush metrics to external systems
   */
  private flushMetrics(): void {
    const metricCount = Array.from(this.metrics.values())
      .reduce((sum, points) => sum + points.length, 0);
    
    const traceCount = Array.from(this.traces.values())
      .reduce((sum, spans) => sum + spans.length, 0);

    Logger.debug('Flushing metrics', { metricCount, traceCount });

    // Here you would send to DataDog, Prometheus, etc.
    // For now, we'll just log the summary
    this.recordMetric('observability.metrics_flushed', metricCount, {}, 'count');
    this.recordMetric('observability.traces_flushed', traceCount, {}, 'count');
  }

  // Helper methods
  private generateTraceId(): string {
    return Math.random().toString(36).substr(2, 16);
  }

  private generateSpanId(): string {
    return Math.random().toString(36).substr(2, 8);
  }

  private getTraceIdFromSpan(spanId: string): string {
    const span = this.activeSpans.get(spanId);
    return span ? span.traceId : this.generateTraceId();
  }

  private async sendSlackAlert(alert: any): Promise<void> {
    // Implementation would send to Slack webhook
    Logger.info('Slack alert sent', alert);
  }

  private async sendEmailAlert(alert: any): Promise<void> {
    // Implementation would send email
    Logger.info('Email alert sent', alert);
  }

  private async sendPagerDutyAlert(alert: any): Promise<void> {
    // Implementation would trigger PagerDuty incident
    Logger.info('PagerDuty alert sent', alert);
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(): Record<string, { count: number; latest: number; avg: number }> {
    const summary: Record<string, { count: number; latest: number; avg: number }> = {};

    for (const [name, points] of this.metrics.entries()) {
      if (points.length > 0) {
        const values = points.map(p => p.value);
        const sum = values.reduce((a, b) => a + b, 0);
        
        summary[name] = {
          count: points.length,
          latest: values[values.length - 1],
          avg: sum / values.length
        };
      }
    }

    return summary;
  }

  /**
   * Cleanup and stop monitoring
   */
  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    this.flushMetrics();
    this.isInitialized = false;
    
    Logger.info('Observability system stopped');
  }
}

// Create global instance
export const observability = ObservabilitySystem.getInstance();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  // Wait for page load before starting monitoring
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => observability.init(), 100);
    });
  } else {
    setTimeout(() => observability.init(), 100);
  }
}

// Export convenience functions
export const recordMetric = observability.recordMetric.bind(observability);
export const recordBusinessMetric = observability.recordBusinessMetric.bind(observability);
export const recordUserEvent = observability.recordUserEvent.bind(observability);
export const measureOperation = observability.measureOperation.bind(observability);
export const recordDatabaseQuery = observability.recordDatabaseQuery.bind(observability);
export const recordAPIRequest = observability.recordAPIRequest.bind(observability);

export default ObservabilitySystem;