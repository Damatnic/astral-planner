'use client';

import { useEffect } from 'react';
import { performanceMonitor } from '@/lib/performance-monitor';

export function PerformanceMonitor() {
  useEffect(() => {
    // Initialize performance monitoring
    console.log('CATALYST Performance Monitor initialized');
    
    // Setup cleanup on page unload
    const handleUnload = () => {
      performanceMonitor.forceCleanup();
    };

    window.addEventListener('beforeunload', handleUnload);
    
    // Setup memory warning
    const checkMemory = () => {
      const metrics = performanceMonitor.getLatestMetrics();
      if (metrics && metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
        // TODO: Replace with proper logging - console.warn('High memory usage detected, triggering cleanup');
        performanceMonitor.forceCleanup();
      }
    };

    const memoryInterval = setInterval(checkMemory, 60000); // Check every minute

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      clearInterval(memoryInterval);
    };
  }, []);

  // This component renders nothing - it's just for monitoring
  return null;
}