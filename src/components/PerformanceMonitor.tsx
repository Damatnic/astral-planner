'use client';

import { useEffect } from 'react';
import { performanceMonitor } from '@/lib/performance-monitor';
import { performanceLogger } from '@/lib/logger';

export function PerformanceMonitor() {
  useEffect(() => {
    // Initialize performance monitoring
    performanceLogger.info('Performance monitor initialized', { component: 'PerformanceMonitor' });
    
    // Setup cleanup on page unload
    const handleUnload = () => {
      performanceMonitor.forceCleanup();
    };

    window.addEventListener('beforeunload', handleUnload);
    
    // Setup memory warning with proper cleanup
    const checkMemory = () => {
      const metrics = performanceMonitor.getLatestMetrics();
      if (metrics && metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
        performanceLogger.warn('High memory usage detected, triggering cleanup', {
          component: 'PerformanceMonitor',
          metadata: { 
            memoryUsage: `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`
          }
        });
        performanceMonitor.forceCleanup();
      }
    };

    const memoryInterval = setInterval(checkMemory, 60000); // Check every minute

    // Proper cleanup to prevent memory leaks
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      clearInterval(memoryInterval);
      performanceLogger.debug('Performance monitor cleanup completed', { component: 'PerformanceMonitor' });
    };
  }, []);

  // This component renders nothing - it's just for monitoring
  return null;
}