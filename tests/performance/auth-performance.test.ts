/**
 * Performance Tests for Authentication System
 * Testing authentication speed, concurrent scenarios, and scalability
 */

import { NextRequest } from 'next/server';
import { performance } from 'perf_hooks';
import { getAuthContext, verifyToken, withAuth, withRole } from '@/lib/auth/auth-utils';
import { getUserFromRequest } from '@/lib/auth';

// Mock dependencies
jest.mock('jose', () => ({
  jwtVerify: jest.fn()
}));

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }
}));

// Performance test utilities
class PerformanceTestUtils {
  static createBenchmarkRequest(token: string = 'valid-token'): NextRequest {
    return {
      headers: {
        get: jest.fn((key: string) => key === 'authorization' ? `Bearer ${token}` : null)
      },
      cookies: {
        get: jest.fn().mockReturnValue(undefined)
      },
      nextUrl: { pathname: '/test' }
    } as unknown as NextRequest;
  }

  static async measureExecutionTime<T>(
    fn: () => Promise<T>,
    iterations: number = 1
  ): Promise<{ result: T; avgTime: number; minTime: number; maxTime: number; totalTime: number }> {
    const times: number[] = [];
    let result: T;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      result = await fn();
      const end = performance.now();
      times.push(end - start);
    }

    return {
      result: result!,
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      totalTime: times.reduce((a, b) => a + b, 0)
    };
  }

  static async measureConcurrentExecution<T>(
    fn: () => Promise<T>,
    concurrency: number
  ): Promise<{ 
    results: T[]; 
    totalTime: number; 
    avgTime: number;
    successRate: number;
    errors: Error[];
  }> {
    const start = performance.now();
    const promises = Array(concurrency).fill(null).map(() => 
      fn().catch(error => ({ error }))
    );

    const results = await Promise.all(promises);
    const end = performance.now();

    const successes = results.filter(r => !('error' in r)) as T[];
    const errors = results.filter(r => 'error' in r).map(r => (r as any).error);

    return {
      results: successes,
      totalTime: end - start,
      avgTime: (end - start) / concurrency,
      successRate: successes.length / results.length,
      errors
    };
  }

  static generateStressTestData(count: number) {
    return Array(count).fill(null).map((_, i) => ({
      id: `user-${i}`,
      email: `user${i}@example.com`,
      role: i % 3 === 0 ? 'admin' : i % 3 === 1 ? 'premium' : 'user'
    }));
  }

  static createMemorySnapshot() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    return { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 };
  }
}

describe('Authentication Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Verification Performance', () => {
    it('should verify tokens quickly', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValue({ 
        payload: { id: 'user-123', role: 'user' }
      });

      const { avgTime, minTime, maxTime } = await PerformanceTestUtils.measureExecutionTime(
        () => verifyToken('valid-token'),
        100
      );

      // Token verification should be fast
      expect(avgTime).toBeLessThan(10); // 10ms average
      expect(maxTime).toBeLessThan(50); // 50ms maximum
      console.log(`Token verification: avg=${avgTime.toFixed(2)}ms, min=${minTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms`);
    });

    it('should handle token verification errors quickly', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockRejectedValue(new Error('Invalid token'));

      const { avgTime } = await PerformanceTestUtils.measureExecutionTime(
        () => verifyToken('invalid-token'),
        100
      );

      // Error handling should be fast
      expect(avgTime).toBeLessThan(5); // 5ms average for errors
      console.log(`Token verification error handling: avg=${avgTime.toFixed(2)}ms`);
    });

    it('should handle large tokens efficiently', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValue({ 
        payload: { 
          id: 'user-123', 
          role: 'user',
          largeData: 'x'.repeat(10000) // 10KB of data
        }
      });

      const largeToken = 'large-token-' + 'x'.repeat(1000);

      const { avgTime } = await PerformanceTestUtils.measureExecutionTime(
        () => verifyToken(largeToken),
        50
      );

      // Should handle large tokens without significant performance degradation
      expect(avgTime).toBeLessThan(20); // 20ms average
      console.log(`Large token verification: avg=${avgTime.toFixed(2)}ms`);
    });
  });

  describe('Authentication Context Performance', () => {
    it('should create auth context quickly', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValue({ 
        payload: { id: 'user-123', role: 'user' }
      });

      const request = PerformanceTestUtils.createBenchmarkRequest();

      const { avgTime } = await PerformanceTestUtils.measureExecutionTime(
        () => getAuthContext(request),
        100
      );

      // Auth context creation should be fast
      expect(avgTime).toBeLessThan(15); // 15ms average
      console.log(`Auth context creation: avg=${avgTime.toFixed(2)}ms`);
    });

    it('should handle demo authentication quickly', async () => {
      const request = {
        headers: {
          get: jest.fn((key: string) => key === 'x-demo-user' ? 'demo-user' : null)
        },
        cookies: {
          get: jest.fn().mockReturnValue(undefined)
        },
        nextUrl: { pathname: '/test' }
      } as unknown as NextRequest;

      const { avgTime } = await PerformanceTestUtils.measureExecutionTime(
        () => getAuthContext(request),
        100
      );

      // Demo auth should be very fast (no external calls)
      expect(avgTime).toBeLessThan(5); // 5ms average
      console.log(`Demo authentication: avg=${avgTime.toFixed(2)}ms`);
    });

    it('should handle unauthenticated requests quickly', async () => {
      const request = {
        headers: {
          get: jest.fn().mockReturnValue(null)
        },
        cookies: {
          get: jest.fn().mockReturnValue(undefined)
        },
        nextUrl: { pathname: '/test' }
      } as unknown as NextRequest;

      const { avgTime } = await PerformanceTestUtils.measureExecutionTime(
        () => getAuthContext(request),
        100
      );

      // Unauthenticated requests should be very fast
      expect(avgTime).toBeLessThan(3); // 3ms average
      console.log(`Unauthenticated request handling: avg=${avgTime.toFixed(2)}ms`);
    });
  });

  describe('Middleware Performance', () => {
    it('should execute auth middleware efficiently', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValue({ 
        payload: { id: 'user-123', role: 'user' }
      });

      const mockHandler = jest.fn().mockResolvedValue(new Response('Success'));
      const wrappedHandler = withAuth(mockHandler);
      const request = PerformanceTestUtils.createBenchmarkRequest();

      const { avgTime } = await PerformanceTestUtils.measureExecutionTime(
        () => wrappedHandler(request, {}),
        100
      );

      // Middleware execution should be fast
      expect(avgTime).toBeLessThan(20); // 20ms average
      console.log(`Auth middleware execution: avg=${avgTime.toFixed(2)}ms`);
    });

    it('should execute role middleware efficiently', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValue({ 
        payload: { id: 'user-123', role: 'admin' }
      });

      const mockHandler = jest.fn().mockResolvedValue(new Response('Success'));
      const wrappedHandler = withRole('user', mockHandler);
      const request = PerformanceTestUtils.createBenchmarkRequest();

      const { avgTime } = await PerformanceTestUtils.measureExecutionTime(
        () => wrappedHandler(request, {}),
        100
      );

      // Role middleware should be fast
      expect(avgTime).toBeLessThan(25); // 25ms average
      console.log(`Role middleware execution: avg=${avgTime.toFixed(2)}ms`);
    });

    it('should handle middleware errors efficiently', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockRejectedValue(new Error('Authentication failed'));

      const mockHandler = jest.fn().mockResolvedValue(new Response('Success'));
      const wrappedHandler = withAuth(mockHandler);
      const request = PerformanceTestUtils.createBenchmarkRequest();

      const { avgTime } = await PerformanceTestUtils.measureExecutionTime(
        () => wrappedHandler(request, {}),
        100
      );

      // Error handling should be fast
      expect(avgTime).toBeLessThan(10); // 10ms average
      console.log(`Middleware error handling: avg=${avgTime.toFixed(2)}ms`);
    });
  });

  describe('Concurrent Authentication Tests', () => {
    it('should handle concurrent token verifications', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValue({ 
        payload: { id: 'user-123', role: 'user' }
      });

      const { successRate, avgTime, totalTime } = await PerformanceTestUtils.measureConcurrentExecution(
        () => verifyToken('valid-token'),
        100 // 100 concurrent operations
      );

      expect(successRate).toBe(1.0); // 100% success rate
      expect(totalTime).toBeLessThan(1000); // Complete within 1 second
      console.log(`Concurrent token verification (100): successRate=${successRate}, total=${totalTime.toFixed(2)}ms, avg=${avgTime.toFixed(2)}ms`);
    });

    it('should handle concurrent auth context creation', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValue({ 
        payload: { id: 'user-123', role: 'user' }
      });

      const { successRate, totalTime } = await PerformanceTestUtils.measureConcurrentExecution(
        () => {
          const request = PerformanceTestUtils.createBenchmarkRequest();
          return getAuthContext(request);
        },
        50 // 50 concurrent operations
      );

      expect(successRate).toBe(1.0); // 100% success rate
      expect(totalTime).toBeLessThan(2000); // Complete within 2 seconds
      console.log(`Concurrent auth context creation (50): successRate=${successRate}, total=${totalTime.toFixed(2)}ms`);
    });

    it('should handle concurrent middleware execution', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValue({ 
        payload: { id: 'user-123', role: 'admin' }
      });

      const mockHandler = jest.fn().mockResolvedValue(new Response('Success'));
      const wrappedHandler = withAuth(mockHandler);

      const { successRate, totalTime, errors } = await PerformanceTestUtils.measureConcurrentExecution(
        () => {
          const request = PerformanceTestUtils.createBenchmarkRequest();
          return wrappedHandler(request, {});
        },
        25 // 25 concurrent operations
      );

      expect(successRate).toBe(1.0); // 100% success rate
      expect(errors).toHaveLength(0); // No errors
      expect(totalTime).toBeLessThan(3000); // Complete within 3 seconds
      console.log(`Concurrent middleware execution (25): successRate=${successRate}, total=${totalTime.toFixed(2)}ms`);
    });

    it('should handle mixed success/failure scenarios', async () => {
      const { jwtVerify } = require('jose');
      
      // Mock to succeed 70% of the time
      jwtVerify.mockImplementation(() => 
        Math.random() < 0.7 
          ? Promise.resolve({ payload: { id: 'user-123', role: 'user' } })
          : Promise.reject(new Error('Random failure'))
      );

      const { successRate, totalTime, errors } = await PerformanceTestUtils.measureConcurrentExecution(
        () => verifyToken('random-token'),
        100
      );

      expect(successRate).toBeGreaterThan(0.6); // At least 60% success
      expect(successRate).toBeLessThan(0.8); // At most 80% success
      expect(errors.length).toBeGreaterThan(0); // Some errors expected
      expect(totalTime).toBeLessThan(2000); // Should still complete quickly
      console.log(`Mixed success/failure (100): successRate=${successRate}, errors=${errors.length}, total=${totalTime.toFixed(2)}ms`);
    });
  });

  describe('Stress Testing', () => {
    it('should handle high-volume token verification', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValue({ 
        payload: { id: 'user-123', role: 'user' }
      });

      const iterations = 1000;
      const { avgTime, totalTime } = await PerformanceTestUtils.measureExecutionTime(
        async () => {
          const promises = Array(10).fill(null).map(() => verifyToken('valid-token'));
          return Promise.all(promises);
        },
        iterations
      );

      expect(totalTime).toBeLessThan(30000); // Complete within 30 seconds
      expect(avgTime).toBeLessThan(30); // 30ms average per batch
      console.log(`High-volume token verification (${iterations * 10}): total=${totalTime.toFixed(2)}ms, avg=${avgTime.toFixed(2)}ms per batch`);
    });

    it('should handle sustained authentication load', async () => {
      const { jwtVerify } = require('jose');
      const testUsers = PerformanceTestUtils.generateStressTestData(1000);
      
      let userIndex = 0;
      jwtVerify.mockImplementation(() => {
        const user = testUsers[userIndex % testUsers.length];
        userIndex++;
        return Promise.resolve({ payload: user });
      });

      const batches = 50;
      const batchSize = 20;
      let totalOperations = 0;
      const startTime = performance.now();

      for (let batch = 0; batch < batches; batch++) {
        const batchPromises = Array(batchSize).fill(null).map(() => {
          const request = PerformanceTestUtils.createBenchmarkRequest(`token-${totalOperations++}`);
          return getAuthContext(request);
        });

        const results = await Promise.all(batchPromises);
        
        // Verify all succeeded
        results.forEach(result => {
          expect(result.isAuthenticated).toBe(true);
        });

        // Brief pause between batches to simulate real-world timing
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerOperation = totalTime / totalOperations;

      expect(avgTimePerOperation).toBeLessThan(50); // 50ms per operation
      console.log(`Sustained load test (${totalOperations} ops): total=${totalTime.toFixed(2)}ms, avg=${avgTimePerOperation.toFixed(2)}ms per op`);
    });

    it('should not cause memory leaks under load', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValue({ 
        payload: { id: 'user-123', role: 'user' }
      });

      const initialMemory = PerformanceTestUtils.createMemorySnapshot();
      
      // Perform many authentication operations
      for (let i = 0; i < 1000; i++) {
        const request = PerformanceTestUtils.createBenchmarkRequest(`token-${i}`);
        await getAuthContext(request);
        
        // Force garbage collection periodically if available
        if (global.gc && i % 100 === 0) {
          global.gc();
        }
      }

      const finalMemory = PerformanceTestUtils.createMemorySnapshot();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.heapUsed) * 100;

      // Memory should not increase dramatically
      expect(memoryIncreasePercent).toBeLessThan(50); // Less than 50% increase
      console.log(`Memory usage: initial=${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB, final=${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB, increase=${memoryIncreasePercent.toFixed(2)}%`);
    });
  });

  describe('Scalability Tests', () => {
    it('should scale linearly with request count', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValue({ 
        payload: { id: 'user-123', role: 'user' }
      });

      const requestCounts = [10, 50, 100, 200];
      const results = [];

      for (const count of requestCounts) {
        const { totalTime } = await PerformanceTestUtils.measureConcurrentExecution(
          () => {
            const request = PerformanceTestUtils.createBenchmarkRequest();
            return getAuthContext(request);
          },
          count
        );

        results.push({ count, time: totalTime });
        console.log(`Scalability test (${count} requests): ${totalTime.toFixed(2)}ms`);
      }

      // Check for roughly linear scaling
      const timesPer100 = results.map(r => (r.time / r.count) * 100);
      const maxVariation = Math.max(...timesPer100) / Math.min(...timesPer100);
      
      // Should not scale worse than 3x
      expect(maxVariation).toBeLessThan(3);
    });

    it('should handle varying payload sizes efficiently', async () => {
      const { jwtVerify } = require('jose');
      
      const payloadSizes = [
        { size: 'small', data: { id: 'user', role: 'user' } },
        { size: 'medium', data: { id: 'user', role: 'user', profile: 'x'.repeat(1000) } },
        { size: 'large', data: { id: 'user', role: 'user', profile: 'x'.repeat(10000) } }
      ];

      for (const { size, data } of payloadSizes) {
        jwtVerify.mockResolvedValue({ payload: data });

        const { avgTime } = await PerformanceTestUtils.measureExecutionTime(
          () => verifyToken('token'),
          50
        );

        // Performance should not degrade significantly with payload size
        expect(avgTime).toBeLessThan(25); // 25ms regardless of size
        console.log(`Payload size ${size}: avg=${avgTime.toFixed(2)}ms`);
      }
    });

    it('should handle different authentication patterns efficiently', async () => {
      const { jwtVerify } = require('jose');
      
      const patterns = [
        {
          name: 'all-authenticated',
          setup: () => jwtVerify.mockResolvedValue({ payload: { id: 'user', role: 'user' } })
        },
        {
          name: 'all-unauthenticated',
          setup: () => jwtVerify.mockRejectedValue(new Error('No token'))
        },
        {
          name: 'mixed-roles',
          setup: () => {
            let counter = 0;
            jwtVerify.mockImplementation(() => {
              const roles = ['user', 'premium', 'admin'];
              const role = roles[counter % roles.length];
              counter++;
              return Promise.resolve({ payload: { id: `user-${counter}`, role } });
            });
          }
        },
        {
          name: 'demo-users',
          setup: () => {
            // No JWT setup needed for demo users
          }
        }
      ];

      for (const pattern of patterns) {
        pattern.setup();

        const { avgTime, successRate } = await PerformanceTestUtils.measureConcurrentExecution(
          () => {
            const request = pattern.name === 'demo-users' 
              ? {
                  headers: { get: (k: string) => k === 'x-demo-user' ? 'demo-user' : null },
                  cookies: { get: () => undefined },
                  nextUrl: { pathname: '/test' }
                } as unknown as NextRequest
              : PerformanceTestUtils.createBenchmarkRequest();
            
            return getAuthContext(request);
          },
          100
        );

        console.log(`Pattern ${pattern.name}: avg=${avgTime.toFixed(2)}ms, success=${successRate}`);
        
        // All patterns should complete quickly
        expect(avgTime).toBeLessThan(50); // 50ms average
      }
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle malformed requests efficiently', async () => {
      const malformedRequests = [
        {
          headers: { get: () => 'malformed\x00header' },
          cookies: { get: () => undefined },
          nextUrl: { pathname: '/test' }
        },
        {
          headers: { get: () => 'Bearer ' + 'x'.repeat(100000) }, // Very long token
          cookies: { get: () => undefined },
          nextUrl: { pathname: '/test' }
        },
        {
          headers: { get: () => null },
          cookies: { get: () => ({ value: 'malformed\r\ncookie' }) },
          nextUrl: { pathname: '/test' }
        }
      ];

      for (const request of malformedRequests) {
        const { avgTime } = await PerformanceTestUtils.measureExecutionTime(
          () => getAuthContext(request as NextRequest),
          10
        );

        // Should handle malformed requests quickly
        expect(avgTime).toBeLessThan(100); // 100ms for error cases
      }
    });

    it('should handle rapid repeated operations', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValue({ 
        payload: { id: 'user-123', role: 'user' }
      });

      const request = PerformanceTestUtils.createBenchmarkRequest();
      
      // Rapid repeated operations on same request
      const promises = Array(1000).fill(null).map(() => getAuthContext(request));
      
      const start = performance.now();
      const results = await Promise.all(promises);
      const end = performance.now();

      const totalTime = end - start;
      const avgTime = totalTime / 1000;

      // Should handle rapid operations efficiently
      expect(avgTime).toBeLessThan(10); // 10ms average
      expect(totalTime).toBeLessThan(5000); // 5 seconds total
      
      // All should succeed
      results.forEach(result => {
        expect(result.isAuthenticated).toBe(true);
      });

      console.log(`Rapid repeated operations (1000): total=${totalTime.toFixed(2)}ms, avg=${avgTime.toFixed(2)}ms`);
    });
  });

  describe('Resource Usage Optimization', () => {
    it('should minimize CPU usage during authentication', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValue({ 
        payload: { id: 'user-123', role: 'user' }
      });

      // Measure CPU-intensive operations
      const iterations = 100;
      const request = PerformanceTestUtils.createBenchmarkRequest();

      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        await getAuthContext(request);
      }
      
      const end = performance.now();
      const totalTime = end - start;
      const avgTime = totalTime / iterations;

      // Should be efficient
      expect(avgTime).toBeLessThan(15); // 15ms average
      console.log(`CPU efficiency test (${iterations} iterations): avg=${avgTime.toFixed(2)}ms`);
    });

    it('should optimize for common authentication patterns', async () => {
      const { jwtVerify } = require('jose');
      
      // Test caching behavior (if implemented)
      const sameTokenRequests = Array(100).fill(null).map(() => 
        PerformanceTestUtils.createBenchmarkRequest('same-token')
      );

      jwtVerify.mockResolvedValue({ 
        payload: { id: 'user-123', role: 'user' }
      });

      const { avgTime } = await PerformanceTestUtils.measureExecutionTime(
        async () => {
          const promises = sameTokenRequests.map(req => getAuthContext(req));
          return Promise.all(promises);
        },
        10
      );

      // Should be efficient even without caching
      expect(avgTime).toBeLessThan(100); // 100ms for 100 operations
      console.log(`Common pattern optimization: avg=${avgTime.toFixed(2)}ms for 100 same-token requests`);
    });
  });
});