/**
 * Comprehensive Error Scenario and Edge Case Tests for Authentication
 * Testing network failures, invalid credentials, session expiration, and error recovery flows
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, verifyToken, withAuth, withRole } from '@/lib/auth/auth-utils';
import { getUserFromRequest, requireAuth, getUserForRequest } from '@/lib/auth';

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
  },
  AppError: class MockAppError extends Error {
    constructor(message: string, public statusCode: number, public isOperational: boolean) {
      super(message);
      this.name = 'AppError';
    }
  }
}));

// Mock fetch for Stack Auth tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Error scenario test utilities
class ErrorScenarioUtils {
  static createMockRequest(options: {
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    method?: string;
    url?: string;
  } = {}): NextRequest {
    const { headers = {}, cookies = {}, method = 'GET', url = 'http://localhost:3000' } = options;
    
    return {
      method,
      url,
      headers: {
        get: jest.fn((key: string) => headers[key] || null)
      },
      cookies: {
        get: jest.fn((key: string) => cookies[key] ? { value: cookies[key] } : undefined)
      },
      nextUrl: {
        pathname: new URL(url).pathname
      }
    } as unknown as NextRequest;
  }

  static simulateNetworkError(errorType: 'timeout' | 'connection' | 'dns' | 'certificate' | 'rate-limit') {
    const errors = {
      timeout: new Error('Request timeout'),
      connection: new Error('ECONNREFUSED'),
      dns: new Error('ENOTFOUND'),
      certificate: new Error('UNABLE_TO_VERIFY_LEAF_SIGNATURE'),
      'rate-limit': new Error('Rate limit exceeded')
    };
    
    const error = errors[errorType];
    error.name = errorType.toUpperCase();
    return error;
  }

  static createCorruptedJWT() {
    return {
      malformed: 'not.a.jwt',
      missingSignature: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0',
      invalidBase64: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid@base64.signature',
      extraDots: 'header.payload.signature.extra',
      emptyParts: '...',
      nullBytes: 'eyJhbGciOiJIUzI1NiJ9\x00.eyJzdWIiOiIxMjMifQ\x00.sig\x00',
      oversized: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.' + 'A'.repeat(100000) + '.signature'
    };
  }

  static createInvalidPayloads() {
    return {
      circular: (() => {
        const obj: any = { id: 'user' };
        obj.self = obj;
        return obj;
      })(),
      withFunctions: {
        id: 'user',
        malicious: () => console.log('executed'),
        role: 'admin'
      },
      withSymbols: {
        id: 'user',
        [Symbol('hidden')]: 'secret',
        role: 'user'
      },
      deepNesting: {
        id: 'user',
        data: { level1: { level2: { level3: { level4: { level5: 'deep' } } } } }
      },
      invalidDates: {
        id: 'user',
        createdAt: 'not-a-date',
        updatedAt: new Date('invalid'),
        exp: 'never'
      }
    };
  }
}

describe('Authentication Error Scenarios and Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Network Failure Scenarios', () => {
    beforeEach(() => {
      // Set up Stack Auth environment
      process.env.STACK_PROJECT_ID = 'test-project';
      process.env.STACK_SECRET_SERVER_KEY = 'test-secret';
      process.env.STACK_PUBLISHABLE_CLIENT_KEY = 'test-key';
      process.env.NODE_ENV = 'production';
    });

    it('should handle connection timeout gracefully', async () => {
      mockFetch.mockRejectedValue(ErrorScenarioUtils.simulateNetworkError('timeout'));

      const request = ErrorScenarioUtils.createMockRequest({
        headers: { authorization: 'Bearer timeout-token' }
      });

      const user = await getUserFromRequest(request);

      expect(user).toBeNull();
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle connection refused errors', async () => {
      mockFetch.mockRejectedValue(ErrorScenarioUtils.simulateNetworkError('connection'));

      const request = ErrorScenarioUtils.createMockRequest({
        headers: { authorization: 'Bearer connection-token' }
      });

      const user = await getUserFromRequest(request);

      expect(user).toBeNull();
    });

    it('should handle DNS resolution failures', async () => {
      mockFetch.mockRejectedValue(ErrorScenarioUtils.simulateNetworkError('dns'));

      const request = ErrorScenarioUtils.createMockRequest({
        headers: { authorization: 'Bearer dns-token' }
      });

      const user = await getUserFromRequest(request);

      expect(user).toBeNull();
    });

    it('should handle SSL certificate errors', async () => {
      mockFetch.mockRejectedValue(ErrorScenarioUtils.simulateNetworkError('certificate'));

      const request = ErrorScenarioUtils.createMockRequest({
        headers: { authorization: 'Bearer cert-token' }
      });

      const user = await getUserFromRequest(request);

      expect(user).toBeNull();
    });

    it('should handle rate limiting gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      const request = ErrorScenarioUtils.createMockRequest({
        headers: { authorization: 'Bearer rate-limited-token' }
      });

      const user = await getUserFromRequest(request);

      expect(user).toBeNull();
    });

    it('should handle server errors (5xx)', async () => {
      const serverErrors = [500, 502, 503, 504];

      for (const status of serverErrors) {
        mockFetch.mockResolvedValue({
          ok: false,
          status,
          statusText: 'Server Error'
        });

        const request = ErrorScenarioUtils.createMockRequest({
          headers: { authorization: 'Bearer server-error-token' }
        });

        const user = await getUserFromRequest(request);

        expect(user).toBeNull();
        mockFetch.mockClear();
      }
    });

    it('should handle malformed responses', async () => {
      const malformedResponses = [
        { json: () => Promise.reject(new Error('Invalid JSON')) },
        { json: () => Promise.resolve('not an object') },
        { json: () => Promise.resolve(null) },
        { json: () => Promise.resolve(undefined) }
      ];

      for (const response of malformedResponses) {
        mockFetch.mockResolvedValue({
          ok: true,
          ...response
        });

        const request = ErrorScenarioUtils.createMockRequest({
          headers: { authorization: 'Bearer malformed-response-token' }
        });

        const user = await getUserFromRequest(request);

        expect(user).toBeNull();
        mockFetch.mockClear();
      }
    });

    it('should handle partial network failures', async () => {
      // Simulate intermittent network issues
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount % 3 === 0) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              user: {
                id: 'user-123',
                primary_email: 'test@example.com',
                created_at_millis: Date.now(),
                updated_at_millis: Date.now()
              }
            })
          });
        } else {
          return Promise.reject(new Error('Network error'));
        }
      });

      const requests = Array(9).fill(null).map((_, i) =>
        ErrorScenarioUtils.createMockRequest({
          headers: { authorization: `Bearer intermittent-token-${i}` }
        })
      );

      const results = await Promise.all(
        requests.map(req => getUserFromRequest(req))
      );

      // Every third request should succeed
      const successes = results.filter(r => r !== null);
      expect(successes).toHaveLength(3);
    });
  });

  describe('Invalid Credential Scenarios', () => {
    describe('JWT Token Issues', () => {
      it('should handle malformed JWT tokens', async () => {
        const { jwtVerify } = require('jose');
        const corruptedTokens = ErrorScenarioUtils.createCorruptedJWT();

        for (const [type, token] of Object.entries(corruptedTokens)) {
          jwtVerify.mockRejectedValue(new Error(`Invalid token: ${type}`));

          const result = await verifyToken(token);

          expect(result).toBeNull();
          console.log(`Handled malformed JWT: ${type}`);
        }
      });

      it('should handle JWT verification errors', async () => {
        const { jwtVerify } = require('jose');
        const verificationErrors = [
          new Error('Token expired'),
          new Error('Invalid signature'),
          new Error('Invalid audience'),
          new Error('Invalid issuer'),
          new Error('Token not active yet'),
          new Error('Algorithm mismatch')
        ];

        for (const error of verificationErrors) {
          jwtVerify.mockRejectedValue(error);

          const result = await verifyToken('some-token');

          expect(result).toBeNull();
        }
      });

      it('should handle invalid JWT payloads', async () => {
        const { jwtVerify } = require('jose');
        const invalidPayloads = ErrorScenarioUtils.createInvalidPayloads();

        for (const [type, payload] of Object.entries(invalidPayloads)) {
          jwtVerify.mockResolvedValue({ payload });

          const result = await verifyToken('token');

          // Should return the payload as-is (validation is application responsibility)
          expect(result).toBe(payload);
          console.log(`Handled invalid payload: ${type}`);
        }
      });

      it('should handle JWT algorithm confusion attacks', async () => {
        const { jwtVerify } = require('jose');
        
        // Simulate algorithm confusion
        jwtVerify.mockRejectedValue(new Error('Algorithm not allowed'));

        const noneAlgorithmToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.';
        
        const result = await verifyToken(noneAlgorithmToken);

        expect(result).toBeNull();
      });
    });

    describe('Demo Authentication Edge Cases', () => {
      it('should handle case-sensitive demo credentials', async () => {
        const caseSensitiveAttempts = [
          { 'x-demo-user': 'DEMO-USER' },
          { 'x-demo-user': 'Demo-User' },
          { 'x-demo-token': 'DEMO-TOKEN-2024' },
          { 'x-demo-token': 'Demo-Token-2024' }
        ];

        for (const headers of caseSensitiveAttempts) {
          const request = ErrorScenarioUtils.createMockRequest({ headers });
          const context = await getAuthContext(request);

          expect(context.isAuthenticated).toBe(false);
        }
      });

      it('should handle demo credential injection attempts', async () => {
        const injectionAttempts = [
          { 'x-demo-user': 'demo-user\r\nX-Admin: true' },
          { 'x-demo-user': 'demo-user\nSet-Cookie: admin=true' },
          { 'x-demo-token': 'demo-token-2024\x00admin' },
          { 'x-demo-user': 'demo-user; admin=true' }
        ];

        for (const headers of injectionAttempts) {
          const request = ErrorScenarioUtils.createMockRequest({ headers });
          const context = await getAuthContext(request);

          if (context.isAuthenticated) {
            expect(context.user?.role).toBe('user'); // Should not be admin
          }
        }
      });

      it('should handle simultaneous JWT and demo auth', async () => {
        const { jwtVerify } = require('jose');
        jwtVerify.mockResolvedValue({ 
          payload: { id: 'jwt-user', role: 'admin' }
        });

        const request = ErrorScenarioUtils.createMockRequest({
          headers: {
            'authorization': 'Bearer jwt-token',
            'x-demo-user': 'demo-user'
          }
        });

        const context = await getAuthContext(request);

        // JWT should take precedence over demo auth
        expect(context.isAuthenticated).toBe(true);
        expect(context.user?.id).toBe('jwt-user');
        expect(context.isDemo).toBe(false);
      });
    });
  });

  describe('Session Expiration Scenarios', () => {
    it('should handle expired tokens gracefully', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockRejectedValue(new Error('Token expired'));

      const request = ErrorScenarioUtils.createMockRequest({
        headers: { authorization: 'Bearer expired-token' }
      });

      const context = await getAuthContext(request);

      expect(context.isAuthenticated).toBe(false);
      expect(context.user).toBeNull();
    });

    it('should handle tokens that expire during processing', async () => {
      const { jwtVerify } = require('jose');
      
      // First call succeeds, second call fails (token expired during processing)
      jwtVerify
        .mockResolvedValueOnce({ payload: { id: 'user', role: 'user' } })
        .mockRejectedValueOnce(new Error('Token expired'));

      const request = ErrorScenarioUtils.createMockRequest({
        headers: { authorization: 'Bearer expiring-token' }
      });

      // First call should succeed
      const context1 = await getAuthContext(request);
      expect(context1.isAuthenticated).toBe(true);

      // Second call should fail
      const context2 = await getAuthContext(request);
      expect(context2.isAuthenticated).toBe(false);
    });

    it('should handle clock skew scenarios', async () => {
      const { jwtVerify } = require('jose');
      
      // Simulate clock skew errors
      const clockSkewErrors = [
        new Error('Token used before valid'),
        new Error('Token expired (clock skew)'),
        new Error('Invalid nbf claim'),
        new Error('Invalid iat claim')
      ];

      for (const error of clockSkewErrors) {
        jwtVerify.mockRejectedValue(error);

        const request = ErrorScenarioUtils.createMockRequest({
          headers: { authorization: 'Bearer skewed-token' }
        });

        const context = await getAuthContext(request);

        expect(context.isAuthenticated).toBe(false);
      }
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from transient authentication failures', async () => {
      const { jwtVerify } = require('jose');
      
      // Simulate transient failures followed by success
      jwtVerify
        .mockRejectedValueOnce(new Error('Transient error'))
        .mockRejectedValueOnce(new Error('Another transient error'))
        .mockResolvedValue({ payload: { id: 'user', role: 'user' } });

      const request = ErrorScenarioUtils.createMockRequest({
        headers: { authorization: 'Bearer recovering-token' }
      });

      // First two calls should fail
      const context1 = await getAuthContext(request);
      expect(context1.isAuthenticated).toBe(false);

      const context2 = await getAuthContext(request);
      expect(context2.isAuthenticated).toBe(false);

      // Third call should succeed
      const context3 = await getAuthContext(request);
      expect(context3.isAuthenticated).toBe(true);
    });

    it('should handle middleware error chains', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockRejectedValue(new Error('Auth failed'));

      const failingHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      const wrappedHandler = withAuth(failingHandler);

      const request = ErrorScenarioUtils.createMockRequest({
        headers: { authorization: 'Bearer failing-token' }
      });

      const response = await wrappedHandler(request, {});

      expect(response.status).toBe(401); // Auth error takes precedence
      expect(failingHandler).not.toHaveBeenCalled();
    });

    it('should handle cascading middleware failures', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValue({ payload: { id: 'user', role: 'user' } });

      const handler1 = jest.fn().mockImplementation(async (req, ctx) => {
        throw new Error('First handler failed');
      });

      const handler2 = jest.fn().mockImplementation(async (req, ctx) => {
        throw new Error('Second handler failed');
      });

      const wrappedHandler1 = withAuth(handler1);
      const wrappedHandler2 = withRole('admin', handler2);

      const request = ErrorScenarioUtils.createMockRequest({
        headers: { authorization: 'Bearer cascade-token' }
      });

      // First middleware should fail due to handler error
      const response1 = await wrappedHandler1(request, {});
      expect(response1.status).toBe(500);

      // Second middleware should fail due to insufficient role
      const response2 = await wrappedHandler2(request, {});
      expect(response2.status).toBe(403);
    });

    it('should maintain state consistency during errors', async () => {
      const { jwtVerify } = require('jose');
      
      // Simulate state corruption attempt
      const corruptedPayload = {
        id: 'user-123',
        role: 'user',
        // Add properties that might cause issues
        __proto__: { admin: true },
        constructor: { name: 'Admin' }
      };

      jwtVerify.mockResolvedValue({ payload: corruptedPayload });

      const request = ErrorScenarioUtils.createMockRequest({
        headers: { authorization: 'Bearer corrupted-token' }
      });

      const context = await getAuthContext(request);

      // Should authenticate but not be corrupted
      expect(context.isAuthenticated).toBe(true);
      expect(context.user?.role).toBe('user'); // Should remain 'user'
    });
  });

  describe('Edge Case Combinations', () => {
    it('should handle multiple simultaneous authentication methods', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValue({ payload: { id: 'jwt-user', role: 'admin' } });

      const request = ErrorScenarioUtils.createMockRequest({
        headers: {
          'authorization': 'Bearer jwt-token',
          'x-demo-user': 'demo-user',
          'x-demo-token': 'demo-token-2024'
        },
        cookies: {
          'auth_token': 'cookie-token',
          'session': 'session-token'
        }
      });

      const context = await getAuthContext(request);

      // JWT should take precedence
      expect(context.isAuthenticated).toBe(true);
      expect(context.user?.id).toBe('jwt-user');
      expect(context.isDemo).toBe(false);
    });

    it('should handle empty and null values gracefully', async () => {
      const emptyRequests = [
        {
          headers: { authorization: '' },
        },
        {
          headers: { authorization: 'Bearer ' },
        },
        {
          headers: { authorization: 'Bearer null' },
        },
        {
          headers: { 'x-demo-user': '' },
        },
        {
          cookies: { auth_token: '' },
        }
      ];

      for (const config of emptyRequests) {
        const request = ErrorScenarioUtils.createMockRequest(config);
        const context = await getAuthContext(request);

        expect(context.isAuthenticated).toBe(false);
        expect(context.user).toBeNull();
      }
    });

    it('should handle extremely large request data', async () => {
      const { jwtVerify } = require('jose');
      const largePayload = {
        id: 'user-123',
        role: 'user',
        largeData: 'x'.repeat(1000000) // 1MB of data
      };

      jwtVerify.mockResolvedValue({ payload: largePayload });

      const request = ErrorScenarioUtils.createMockRequest({
        headers: { authorization: 'Bearer large-token' }
      });

      const context = await getAuthContext(request);

      expect(context.isAuthenticated).toBe(true);
      expect(context.user?.id).toBe('user-123');
    });

    it('should handle concurrent error scenarios', async () => {
      const { jwtVerify } = require('jose');
      
      // Mix of success and failure
      jwtVerify.mockImplementation(() => 
        Math.random() > 0.5 
          ? Promise.resolve({ payload: { id: 'user', role: 'user' } })
          : Promise.reject(new Error('Random failure'))
      );

      const requests = Array(50).fill(null).map((_, i) =>
        ErrorScenarioUtils.createMockRequest({
          headers: { authorization: `Bearer concurrent-token-${i}` }
        })
      );

      const results = await Promise.allSettled(
        requests.map(req => getAuthContext(req))
      );

      // All should settle (no hanging promises)
      expect(results).toHaveLength(50);
      
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
        if (result.status === 'fulfilled') {
          expect(result.value).toHaveProperty('isAuthenticated');
        }
      });
    });

    it('should handle memory pressure scenarios', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValue({ 
        payload: { id: 'user', role: 'user' }
      });

      // Create many requests to simulate memory pressure
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        const request = ErrorScenarioUtils.createMockRequest({
          headers: { authorization: `Bearer memory-token-${i}` }
        });
        promises.push(getAuthContext(request));
      }

      const results = await Promise.all(promises);

      // All should succeed without memory issues
      results.forEach(result => {
        expect(result.isAuthenticated).toBe(true);
      });
    });
  });

  describe('Environment and Configuration Errors', () => {
    it('should handle missing environment variables', async () => {
      const originalEnv = process.env;
      
      try {
        // Remove all auth-related env vars
        delete process.env.STACK_PROJECT_ID;
        delete process.env.STACK_SECRET_SERVER_KEY;
        delete process.env.STACK_PUBLISHABLE_CLIENT_KEY;
        delete process.env.JWT_SECRET;

        // Should still work (fallback to demo mode or graceful degradation)
        const request = ErrorScenarioUtils.createMockRequest({
          headers: { 'x-demo-user': 'demo-user' }
        });

        const context = await getAuthContext(request);
        expect(context.isAuthenticated).toBe(true);
        expect(context.isDemo).toBe(true);
      } finally {
        process.env = originalEnv;
      }
    });

    it('should handle malformed environment variables', async () => {
      const originalEnv = process.env;
      
      try {
        process.env.STACK_PROJECT_ID = 'malformed\x00id';
        process.env.JWT_SECRET = '';
        process.env.NODE_ENV = 'invalid-env';

        const request = ErrorScenarioUtils.createMockRequest({
          headers: { authorization: 'Bearer env-test-token' }
        });

        // Should handle gracefully
        const context = await getAuthContext(request);
        expect(context).toHaveProperty('isAuthenticated');
      } finally {
        process.env = originalEnv;
      }
    });

    it('should handle development vs production mode switches', async () => {
      const originalEnv = process.env.NODE_ENV;
      
      const modes = ['development', 'production', 'test', 'staging'];
      
      for (const mode of modes) {
        process.env.NODE_ENV = mode;
        
        const request = ErrorScenarioUtils.createMockRequest({
          headers: { 'x-demo-user': 'demo-user' }
        });

        const context = await getAuthContext(request);
        
        // Demo auth should work in all modes for this demo app
        expect(context.isAuthenticated).toBe(true);
        expect(context.isDemo).toBe(true);
      }
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Resource Exhaustion Scenarios', () => {
    it('should handle request flooding', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValue({ payload: { id: 'user', role: 'user' } });

      // Simulate request flooding
      const floodSize = 1000;
      const requests = Array(floodSize).fill(null).map((_, i) =>
        ErrorScenarioUtils.createMockRequest({
          headers: { authorization: `Bearer flood-token-${i}` }
        })
      );

      const startTime = Date.now();
      const results = await Promise.all(
        requests.map(req => getAuthContext(req).catch(() => null))
      );
      const endTime = Date.now();

      // Should handle all requests within reasonable time
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds
      
      // Most should succeed
      const successes = results.filter(r => r?.isAuthenticated);
      expect(successes.length).toBeGreaterThan(floodSize * 0.8); // At least 80%
    });

    it('should handle slow authentication responses', async () => {
      const { jwtVerify } = require('jose');
      
      // Simulate slow authentication
      jwtVerify.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ payload: { id: 'user', role: 'user' } }), 100)
        )
      );

      const request = ErrorScenarioUtils.createMockRequest({
        headers: { authorization: 'Bearer slow-token' }
      });

      const startTime = Date.now();
      const context = await getAuthContext(request);
      const endTime = Date.now();

      expect(context.isAuthenticated).toBe(true);
      expect(endTime - startTime).toBeGreaterThan(90); // Should take at least 90ms
    });

    it('should handle authentication service degradation', async () => {
      const { jwtVerify } = require('jose');
      
      // Simulate degraded service (high failure rate)
      jwtVerify.mockImplementation(() => 
        Math.random() > 0.8 
          ? Promise.resolve({ payload: { id: 'user', role: 'user' } })
          : Promise.reject(new Error('Service degraded'))
      );

      const requests = Array(100).fill(null).map((_, i) =>
        ErrorScenarioUtils.createMockRequest({
          headers: { authorization: `Bearer degraded-token-${i}` }
        })
      );

      const results = await Promise.allSettled(
        requests.map(req => getAuthContext(req))
      );

      // Should handle degradation gracefully
      const successes = results.filter(r => 
        r.status === 'fulfilled' && r.value.isAuthenticated
      );
      
      expect(successes.length).toBeGreaterThan(10); // Some should succeed
      expect(successes.length).toBeLessThan(90); // But not all
    });
  });
});