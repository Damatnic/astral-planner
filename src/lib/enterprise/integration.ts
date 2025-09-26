/**
 * ASTRAL PLANNER - ENTERPRISE INTEGRATION SYSTEM
 * Revolutionary unified system integration and orchestration
 * 
 * Features:
 * - Unified system initialization
 * - Cross-system communication
 * - Health monitoring and status
 * - Graceful degradation
 * - System coordination
 * - Enterprise-grade reliability
 */

import Logger from '../logger';
import { performanceMonitor } from '../performance/monitoring';
import { observability } from '../monitoring/observability';
import { aiScheduler } from '../ai/scheduling';
import { APIErrorHandler } from '../api/error-handler';
import { securityMiddleware, validateJWT, authenticationMiddleware } from '../security';
import { ErrorBoundary } from '../../components/error/ErrorBoundary';

interface SystemStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  lastCheck: Date;
  message?: string;
  metrics?: Record<string, number>;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  systems: SystemStatus[];
  timestamp: Date;
  uptime: number;
  version: string;
}

export class EnterpriseIntegration {
  private static instance: EnterpriseIntegration;
  private systems: Map<string, SystemStatus> = new Map();
  private isInitialized = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private startTime = Date.now();

  static getInstance(): EnterpriseIntegration {
    if (!EnterpriseIntegration.instance) {
      EnterpriseIntegration.instance = new EnterpriseIntegration();
    }
    return EnterpriseIntegration.instance;
  }

  /**
   * Initialize all enterprise systems
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      Logger.warn('Enterprise integration already initialized');
      return;
    }

    try {
      Logger.info('🚀 Initializing Astral Planner Enterprise Systems...');

      // Initialize core monitoring first
      await this.initializeMonitoring();
      
      // Initialize performance monitoring
      await this.initializePerformanceMonitoring();
      
      // Initialize AI systems
      await this.initializeAIServices();
      
      // Initialize security systems
      await this.initializeSecurity();
      
      // Initialize error handling
      await this.initializeErrorHandling();
      
      // Initialize health monitoring
      await this.initializeHealthMonitoring();
      
      // Run initial health check
      await this.performHealthCheck();
      
      this.isInitialized = true;
      
      Logger.info('✅ All enterprise systems initialized successfully');
      observability.recordBusinessMetric({
        name: 'system_initialization',
        value: 1,
        trend: 'up',
        metadata: { 
          duration: Date.now() - this.startTime,
          systems_count: this.systems.size
        }
      });

    } catch (error) {
      Logger.error('❌ Failed to initialize enterprise systems', error);
      observability.recordMetric('system.initialization.error', 1, {
        error: error instanceof Error ? error.name : 'Unknown'
      });
      throw error;
    }
  }

  /**
   * Initialize monitoring and observability
   */
  private async initializeMonitoring(): Promise<void> {
    try {
      observability.init();
      
      this.systems.set('observability', {
        name: 'Observability System',
        status: 'healthy',
        lastCheck: new Date(),
        message: 'Real-time monitoring active'
      });
      
      Logger.info('📊 Observability system initialized');
    } catch (error) {
      this.systems.set('observability', {
        name: 'Observability System',
        status: 'critical',
        lastCheck: new Date(),
        message: `Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error;
    }
  }

  /**
   * Initialize performance monitoring
   */
  private async initializePerformanceMonitoring(): Promise<void> {
    try {
      performanceMonitor.init();
      
      this.systems.set('performance', {
        name: 'Performance Monitor',
        status: 'healthy',
        lastCheck: new Date(),
        message: 'Core Web Vitals tracking active'
      });
      
      Logger.info('⚡ Performance monitoring initialized');
    } catch (error) {
      this.systems.set('performance', {
        name: 'Performance Monitor',
        status: 'degraded',
        lastCheck: new Date(),
        message: `Performance monitoring limited: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      // Non-critical - continue initialization
      Logger.warn('Performance monitoring initialization failed', error);
    }
  }

  /**
   * Initialize AI services
   */
  private async initializeAIServices(): Promise<void> {
    try {
      // AI Scheduler is already initialized when imported
      // Test basic functionality
      const testSuggestions = await aiScheduler.parseNaturalLanguageInput('test system check');
      
      this.systems.set('ai', {
        name: 'AI Scheduling Engine',
        status: 'healthy',
        lastCheck: new Date(),
        message: 'AI services operational',
        metrics: {
          confidence: testSuggestions.confidence
        }
      });
      
      Logger.info('🤖 AI services initialized');
    } catch (error) {
      this.systems.set('ai', {
        name: 'AI Scheduling Engine',
        status: 'degraded',
        lastCheck: new Date(),
        message: `AI services limited: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      // Non-critical - continue initialization
      Logger.warn('AI services initialization failed', error);
    }
  }

  /**
   * Initialize security systems
   */
  private async initializeSecurity(): Promise<void> {
    try {
      // Test security middleware
      const mockRequest = new Request('http://localhost:3000/test');
      const securityResult = await securityMiddleware(mockRequest as any);
      
      this.systems.set('security', {
        name: 'Security Middleware',
        status: 'healthy',
        lastCheck: new Date(),
        message: 'Security systems active'
      });
      
      Logger.info('🔒 Security systems initialized');
    } catch (error) {
      this.systems.set('security', {
        name: 'Security Middleware',
        status: 'critical',
        lastCheck: new Date(),
        message: `Security system error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error; // Security is critical
    }
  }

  /**
   * Initialize error handling
   */
  private async initializeErrorHandling(): Promise<void> {
    try {
      // Test error handler
      const errorStats = APIErrorHandler.getErrorStats();
      
      this.systems.set('error_handling', {
        name: 'Error Handler',
        status: 'healthy',
        lastCheck: new Date(),
        message: 'Error handling active',
        metrics: {
          total_errors: errorStats.totalErrors
        }
      });
      
      Logger.info('🛡️ Error handling initialized');
    } catch (error) {
      this.systems.set('error_handling', {
        name: 'Error Handler',
        status: 'critical',
        lastCheck: new Date(),
        message: `Error handling failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      throw error; // Error handling is critical
    }
  }

  /**
   * Initialize health monitoring
   */
  private async initializeHealthMonitoring(): Promise<void> {
    try {
      // Start periodic health checks
      this.healthCheckInterval = setInterval(() => {
        this.performHealthCheck().catch(error => {
          Logger.error('Health check failed', error);
        });
      }, 60000); // Every minute

      this.systems.set('health_monitor', {
        name: 'Health Monitor',
        status: 'healthy',
        lastCheck: new Date(),
        message: 'Health monitoring active'
      });
      
      Logger.info('❤️ Health monitoring initialized');
    } catch (error) {
      this.systems.set('health_monitor', {
        name: 'Health Monitor',
        status: 'degraded',
        lastCheck: new Date(),
        message: `Health monitoring limited: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      // Non-critical - continue
      Logger.warn('Health monitoring initialization failed', error);
    }
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<SystemHealth> {
    const healthCheck = observability.measureOperation(
      'system_health_check',
      async () => {
        // Update system statuses
        await this.checkObservabilityHealth();
        await this.checkPerformanceHealth();
        await this.checkAIHealth();
        await this.checkSecurityHealth();
        await this.checkErrorHandlingHealth();

        // Determine overall health
        const systems = Array.from(this.systems.values());
        const criticalCount = systems.filter(s => s.status === 'critical').length;
        const degradedCount = systems.filter(s => s.status === 'degraded').length;

        let overall: SystemHealth['overall'];
        if (criticalCount > 0) {
          overall = 'critical';
        } else if (degradedCount > 0) {
          overall = 'degraded';
        } else {
          overall = 'healthy';
        }

        const health: SystemHealth = {
          overall,
          systems,
          timestamp: new Date(),
          uptime: Date.now() - this.startTime,
          version: process.env.npm_package_version || '1.0.0'
        };

        // Record health metrics
        observability.recordMetric('system.health.overall', overall === 'healthy' ? 1 : 0);
        observability.recordMetric('system.health.critical_count', criticalCount);
        observability.recordMetric('system.health.degraded_count', degradedCount);

        return health;
      }
    );

    return healthCheck;
  }

  /**
   * Check individual system health
   */
  private async checkObservabilityHealth(): Promise<void> {
    try {
      const metrics = observability.getMetricsSummary();
      const metricsCount = Object.keys(metrics).length;

      this.systems.set('observability', {
        name: 'Observability System',
        status: metricsCount > 0 ? 'healthy' : 'degraded',
        lastCheck: new Date(),
        message: `Tracking ${metricsCount} metrics`,
        metrics: { metrics_count: metricsCount }
      });
    } catch (error) {
      this.systems.set('observability', {
        name: 'Observability System',
        status: 'critical',
        lastCheck: new Date(),
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown'}`
      });
    }
  }

  private async checkPerformanceHealth(): Promise<void> {
    try {
      const snapshot = performanceMonitor.getPerformanceSnapshot();
      const score = performanceMonitor.getPerformanceScore();

      this.systems.set('performance', {
        name: 'Performance Monitor',
        status: score > 75 ? 'healthy' : score > 50 ? 'degraded' : 'critical',
        lastCheck: new Date(),
        message: `Performance score: ${score}/100`,
        metrics: { 
          score,
          fcp: snapshot.timing.firstContentfulPaint,
          lcp: snapshot.timing.largestContentfulPaint
        }
      });
    } catch (error) {
      this.systems.set('performance', {
        name: 'Performance Monitor',
        status: 'degraded',
        lastCheck: new Date(),
        message: `Performance check failed: ${error instanceof Error ? error.message : 'Unknown'}`
      });
    }
  }

  private async checkAIHealth(): Promise<void> {
    try {
      // Simple AI health check
      const testResult = await aiScheduler.parseNaturalLanguageInput('health check');
      
      this.systems.set('ai', {
        name: 'AI Scheduling Engine',
        status: testResult.confidence > 0.5 ? 'healthy' : 'degraded',
        lastCheck: new Date(),
        message: `AI confidence: ${Math.round(testResult.confidence * 100)}%`,
        metrics: { confidence: testResult.confidence }
      });
    } catch (error) {
      this.systems.set('ai', {
        name: 'AI Scheduling Engine',
        status: 'degraded',
        lastCheck: new Date(),
        message: `AI check failed: ${error instanceof Error ? error.message : 'Unknown'}`
      });
    }
  }

  private async checkSecurityHealth(): Promise<void> {
    try {
      // Basic security system check
      const mockToken = 'test-token';
      const jwtResult = validateJWT(mockToken);
      
      this.systems.set('security', {
        name: 'Security Middleware',
        status: 'healthy',
        lastCheck: new Date(),
        message: 'Security systems operational'
      });
    } catch (error) {
      this.systems.set('security', {
        name: 'Security Middleware',
        status: 'critical',
        lastCheck: new Date(),
        message: `Security check failed: ${error instanceof Error ? error.message : 'Unknown'}`
      });
    }
  }

  private async checkErrorHandlingHealth(): Promise<void> {
    try {
      const errorStats = APIErrorHandler.getErrorStats();
      
      this.systems.set('error_handling', {
        name: 'Error Handler',
        status: 'healthy',
        lastCheck: new Date(),
        message: 'Error handling operational',
        metrics: errorStats
      });
    } catch (error) {
      this.systems.set('error_handling', {
        name: 'Error Handler',
        status: 'critical',
        lastCheck: new Date(),
        message: `Error handler check failed: ${error instanceof Error ? error.message : 'Unknown'}`
      });
    }
  }

  /**
   * Get system health status
   */
  getSystemHealth(): SystemHealth {
    const systems = Array.from(this.systems.values());
    const criticalCount = systems.filter(s => s.status === 'critical').length;
    const degradedCount = systems.filter(s => s.status === 'degraded').length;

    let overall: SystemHealth['overall'];
    if (criticalCount > 0) {
      overall = 'critical';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    return {
      overall,
      systems,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0'
    };
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): Record<string, unknown> {
    return {
      uptime: Date.now() - this.startTime,
      systemsCount: this.systems.size,
      healthySystemsCount: Array.from(this.systems.values()).filter(s => s.status === 'healthy').length,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      performanceScore: performanceMonitor.getPerformanceScore(),
      metricsCount: Object.keys(observability.getMetricsSummary()).length
    };
  }

  /**
   * Graceful shutdown of all systems
   */
  async shutdown(): Promise<void> {
    Logger.info('🔄 Shutting down enterprise systems...');

    try {
      // Stop health monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      // Stop observability
      observability.stop();

      // Stop performance monitoring
      performanceMonitor.stop();

      this.isInitialized = false;
      this.systems.clear();

      Logger.info('✅ Enterprise systems shutdown complete');
    } catch (error) {
      Logger.error('❌ Error during system shutdown', error);
      throw error;
    }
  }

  /**
   * Check if system is ready
   */
  isReady(): boolean {
    if (!this.isInitialized) return false;

    const criticalSystems = ['observability', 'security', 'error_handling'];
    return criticalSystems.every(systemName => {
      const system = this.systems.get(systemName);
      return system && system.status !== 'critical' && system.status !== 'offline';
    });
  }

  /**
   * Get initialization status
   */
  getInitializationStatus(): {
    initialized: boolean;
    ready: boolean;
    systems: { name: string; status: string }[];
  } {
    return {
      initialized: this.isInitialized,
      ready: this.isReady(),
      systems: Array.from(this.systems.entries()).map(([key, system]) => ({
        name: system.name,
        status: system.status
      }))
    };
  }
}

// Create global instance
export const enterpriseIntegration = EnterpriseIntegration.getInstance();

// Health check API endpoint helper
export function createHealthEndpoint() {
  return async (req: Request): Promise<Response> => {
    try {
      const health = await enterpriseIntegration.performHealthCheck();
      const statusCode = health.overall === 'healthy' ? 200 : 
                        health.overall === 'degraded' ? 200 : 503;
      
      return new Response(JSON.stringify(health), {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        overall: 'critical',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  };
}

// Readiness check API endpoint helper
export function createReadinessEndpoint() {
  return async (req: Request): Promise<Response> => {
    const ready = enterpriseIntegration.isReady();
    const status = enterpriseIntegration.getInitializationStatus();
    
    return new Response(JSON.stringify({
      ready,
      ...status,
      timestamp: new Date()
    }), {
      status: ready ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  };
}

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        enterpriseIntegration.init().catch(error => {
          Logger.error('Failed to auto-initialize enterprise systems', error);
        });
      }, 100);
    });
  } else {
    setTimeout(() => {
      enterpriseIntegration.init().catch(error => {
        Logger.error('Failed to auto-initialize enterprise systems', error);
      });
    }, 100);
  }
}

export default EnterpriseIntegration;