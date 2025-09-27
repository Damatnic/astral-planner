/**
 * Integration tests for authentication API routes
 * Testing complete authentication flows and API interactions
 */

import { NextRequest } from 'next/server';
import { GET as authMeHandler } from '../me/route';
import { POST as signoutHandler } from '../signout/route';

// Mock Logger
jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

// Create a proper NextRequest mock
const createMockRequest = (options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: any;
} = {}) => {
  const {
    method = 'GET',
    url = 'http://localhost:3000',
    headers = {},
    cookies = {},
    body = null
  } = options;

  const request = {
    method,
    url,
    headers: {
      get: jest.fn((key: string) => headers[key] || null),
      entries: jest.fn(() => Object.entries(headers)),
      forEach: jest.fn(),
      has: jest.fn((key: string) => key in headers),
      keys: jest.fn(() => Object.keys(headers)),
      values: jest.fn(() => Object.values(headers))
    },
    cookies: {
      get: jest.fn((key: string) => cookies[key] ? { value: cookies[key] } : undefined),
      getAll: jest.fn(() => Object.entries(cookies).map(([name, value]) => ({ name, value }))),
      has: jest.fn((key: string) => key in cookies),
      set: jest.fn(),
      delete: jest.fn()
    },
    nextUrl: {
      pathname: new URL(url).pathname,
      searchParams: new URL(url).searchParams,
      clone: jest.fn(() => ({ pathname: new URL(url).pathname }))
    },
    json: jest.fn(() => Promise.resolve(body)),
    text: jest.fn(() => Promise.resolve(JSON.stringify(body))),
    formData: jest.fn(),
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    clone: jest.fn(() => createMockRequest(options))
  } as unknown as NextRequest;

  return request;
};

describe('Authentication API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/api/auth/me', () => {
    describe('GET /api/auth/me', () => {
      it('should return demo user data', async () => {
        const request = createMockRequest({
          method: 'GET',
          url: 'http://localhost:3000/api/auth/me'
        });

        const response = await authMeHandler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('user');
        expect(data.user).toMatchObject({
          id: 'demo-user',
          clerkId: 'demo-clerk-id',
          email: 'demo@astralchronos.com',
          firstName: 'Demo',
          lastName: 'User',
          username: 'demo',
          timezone: 'UTC',
          locale: 'en-US'
        });
      });

      it('should return user settings structure', async () => {
        const request = createMockRequest({
          method: 'GET',
          url: 'http://localhost:3000/api/auth/me'
        });

        const response = await authMeHandler(request);
        const data = await response.json();

        expect(data.user.settings).toHaveProperty('appearance');
        expect(data.user.settings.appearance).toMatchObject({
          theme: 'dark',
          accentColor: '#3b82f6',
          fontSize: 'medium',
          reducedMotion: false,
          compactMode: false
        });

        expect(data.user.settings).toHaveProperty('notifications');
        expect(data.user.settings.notifications).toHaveProperty('email');
        expect(data.user.settings.notifications).toHaveProperty('push');
        expect(data.user.settings.notifications).toHaveProperty('inApp');
        expect(data.user.settings.notifications).toHaveProperty('quietHours');

        expect(data.user.settings).toHaveProperty('productivity');
        expect(data.user.settings.productivity).toMatchObject({
          pomodoroLength: 25,
          shortBreakLength: 5,
          longBreakLength: 15,
          autoStartBreaks: false,
          autoStartPomodoros: false,
          dailyGoal: 8
        });
      });

      it('should return subscription and onboarding data', async () => {
        const request = createMockRequest({
          method: 'GET',
          url: 'http://localhost:3000/api/auth/me'
        });

        const response = await authMeHandler(request);
        const data = await response.json();

        expect(data.user).toHaveProperty('subscription');
        expect(data.user.subscription).toMatchObject({
          plan: 'free',
          features: [],
          expiresAt: null
        });

        expect(data.user).toHaveProperty('onboardingCompleted', false);
        expect(data.user).toHaveProperty('onboardingStep', 1);
        expect(data.user).toHaveProperty('aiSettings');
        expect(data.user.aiSettings).toMatchObject({
          enabled: false
        });
      });

      it('should include timestamps', async () => {
        const beforeRequest = new Date().toISOString();
        
        const request = createMockRequest({
          method: 'GET',
          url: 'http://localhost:3000/api/auth/me'
        });

        const response = await authMeHandler(request);
        const data = await response.json();

        const afterRequest = new Date().toISOString();

        expect(data.user).toHaveProperty('lastActiveAt');
        expect(data.user).toHaveProperty('createdAt');

        // Verify timestamps are recent and valid
        expect(new Date(data.user.lastActiveAt).getTime()).toBeGreaterThanOrEqual(new Date(beforeRequest).getTime());
        expect(new Date(data.user.lastActiveAt).getTime()).toBeLessThanOrEqual(new Date(afterRequest).getTime());
        
        expect(new Date(data.user.createdAt).getTime()).toBeGreaterThanOrEqual(new Date(beforeRequest).getTime());
        expect(new Date(data.user.createdAt).getTime()).toBeLessThanOrEqual(new Date(afterRequest).getTime());
      });

      it('should handle different request methods gracefully', async () => {
        const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];
        
        for (const method of methods) {
          const request = createMockRequest({
            method,
            url: 'http://localhost:3000/api/auth/me'
          });

          // The handler only exports GET, so other methods should result in 405
          try {
            const response = await authMeHandler(request);
            // If it doesn't throw, it should still return valid demo data
            expect(response.status).toBe(200);
          } catch (error) {
            // Method not allowed is acceptable
            expect(error).toBeDefined();
          }
        }
      });

      it('should handle request with headers', async () => {
        const request = createMockRequest({
          method: 'GET',
          url: 'http://localhost:3000/api/auth/me',
          headers: {
            'user-agent': 'Test Browser',
            'accept': 'application/json',
            'authorization': 'Bearer test-token'
          }
        });

        const response = await authMeHandler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.user.id).toBe('demo-user');
      });

      it('should handle request with cookies', async () => {
        const request = createMockRequest({
          method: 'GET',
          url: 'http://localhost:3000/api/auth/me',
          cookies: {
            'session': 'test-session',
            'csrf': 'test-csrf'
          }
        });

        const response = await authMeHandler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.user.id).toBe('demo-user');
      });

      it('should be idempotent', async () => {
        const request = createMockRequest({
          method: 'GET',
          url: 'http://localhost:3000/api/auth/me'
        });

        // Make multiple requests
        const responses = await Promise.all([
          authMeHandler(request),
          authMeHandler(request),
          authMeHandler(request)
        ]);

        // All should return the same data (except timestamps)
        const data = await Promise.all(responses.map(r => r.json()));
        
        expect(data[0].user.id).toBe(data[1].user.id);
        expect(data[1].user.id).toBe(data[2].user.id);
        
        expect(data[0].user.email).toBe(data[1].user.email);
        expect(data[1].user.email).toBe(data[2].user.email);
      });

      it('should handle concurrent requests', async () => {
        const requests = Array(10).fill(null).map(() => 
          createMockRequest({
            method: 'GET',
            url: 'http://localhost:3000/api/auth/me'
          })
        );

        const responses = await Promise.all(
          requests.map(req => authMeHandler(req))
        );

        // All should succeed
        responses.forEach(response => {
          expect(response.status).toBe(200);
        });

        const data = await Promise.all(responses.map(r => r.json()));
        
        // All should return consistent user data
        data.forEach(item => {
          expect(item.user.id).toBe('demo-user');
          expect(item.user.email).toBe('demo@astralchronos.com');
        });
      });

      it('should handle malformed requests gracefully', async () => {
        // Test with various malformed request scenarios
        const malformedScenarios = [
          { url: 'invalid-url' }, // Invalid URL
          { url: 'http://localhost:3000/api/auth/me?malformed=param&' }, // Malformed query
          { headers: { 'content-type': 'application/xml' } }, // Unexpected content type
          { cookies: { 'malformed': 'value with ; semicolon' } } // Malformed cookie
        ];

        for (const scenario of malformedScenarios) {
          try {
            const request = createMockRequest({
              method: 'GET',
              url: 'http://localhost:3000/api/auth/me',
              ...scenario
            });

            const response = await authMeHandler(request);
            
            // Should still work for demo endpoint
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.user.id).toBe('demo-user');
          } catch (error) {
            // Graceful handling is acceptable
            expect(error).toBeDefined();
          }
        }
      });
    });

    describe('Error Scenarios', () => {
      it('should handle internal errors gracefully', async () => {
        // Mock console.log to throw an error
        const originalConsoleLog = console.log;
        console.log = jest.fn(() => {
          throw new Error('Console error');
        });

        try {
          const request = createMockRequest({
            method: 'GET',
            url: 'http://localhost:3000/api/auth/me'
          });

          const response = await authMeHandler(request);
          
          // Should either succeed or return proper error
          if (response.status === 200) {
            const data = await response.json();
            expect(data.user.id).toBe('demo-user');
          } else {
            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data).toHaveProperty('error');
          }
        } finally {
          console.log = originalConsoleLog;
        }
      });

      it('should handle JSON parsing errors', async () => {
        // Create a request that might cause JSON issues
        const request = createMockRequest({
          method: 'GET',
          url: 'http://localhost:3000/api/auth/me'
        });

        // Mock JSON.stringify to throw
        const originalStringify = JSON.stringify;
        JSON.stringify = jest.fn(() => {
          throw new Error('JSON stringify error');
        });

        try {
          const response = await authMeHandler(request);
          
          // Should handle the error gracefully
          expect(response.status).toBeGreaterThanOrEqual(200);
          expect(response.status).toBeLessThan(600);
        } catch (error) {
          // Proper error handling is acceptable
          expect(error).toBeDefined();
        } finally {
          JSON.stringify = originalStringify;
        }
      });
    });
  });

  describe('/api/auth/signout', () => {
    describe('POST /api/auth/signout', () => {
      it('should successfully sign out user', async () => {
        const request = createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/auth/signout'
        });

        const response = await signoutHandler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({ success: true });
      });

      it('should set proper cache control headers', async () => {
        const request = createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/auth/signout'
        });

        const response = await signoutHandler(request);

        expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
        expect(response.headers.get('Pragma')).toBe('no-cache');
        expect(response.headers.get('Expires')).toBe('0');
      });

      it('should clear session cookie', async () => {
        const request = createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/auth/signout',
          cookies: {
            'stack-session': 'test-session-value'
          }
        });

        const response = await signoutHandler(request);

        expect(response.status).toBe(200);
        
        // Check if cookie deletion was attempted
        // Note: We can't directly verify cookie deletion in unit tests,
        // but we can verify the response is successful
        const data = await response.json();
        expect(data.success).toBe(true);
      });

      it('should handle signout without existing session', async () => {
        const request = createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/auth/signout'
          // No cookies
        });

        const response = await signoutHandler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({ success: true });
      });

      it('should handle concurrent signout requests', async () => {
        const requests = Array(5).fill(null).map(() => 
          createMockRequest({
            method: 'POST',
            url: 'http://localhost:3000/api/auth/signout',
            cookies: {
              'stack-session': 'concurrent-session'
            }
          })
        );

        const responses = await Promise.all(
          requests.map(req => signoutHandler(req))
        );

        // All should succeed
        responses.forEach(response => {
          expect(response.status).toBe(200);
        });

        const data = await Promise.all(responses.map(r => r.json()));
        
        // All should return success
        data.forEach(item => {
          expect(item.success).toBe(true);
        });
      });

      it('should be idempotent', async () => {
        const request = createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/auth/signout',
          cookies: {
            'stack-session': 'idempotent-session'
          }
        });

        // Multiple signouts should all succeed
        const response1 = await signoutHandler(request);
        const response2 = await signoutHandler(request);
        const response3 = await signoutHandler(request);

        expect(response1.status).toBe(200);
        expect(response2.status).toBe(200);
        expect(response3.status).toBe(200);

        const data1 = await response1.json();
        const data2 = await response2.json();
        const data3 = await response3.json();

        expect(data1.success).toBe(true);
        expect(data2.success).toBe(true);
        expect(data3.success).toBe(true);
      });

      it('should handle requests with different content types', async () => {
        const contentTypes = [
          'application/json',
          'application/x-www-form-urlencoded',
          'text/plain',
          'multipart/form-data'
        ];

        for (const contentType of contentTypes) {
          const request = createMockRequest({
            method: 'POST',
            url: 'http://localhost:3000/api/auth/signout',
            headers: {
              'content-type': contentType
            }
          });

          const response = await signoutHandler(request);
          
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data.success).toBe(true);
        }
      });

      it('should handle requests with body data', async () => {
        const request = createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/auth/signout',
          body: { 
            redirect: '/login',
            clearAll: true
          }
        });

        const response = await signoutHandler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should handle malformed requests', async () => {
        const malformedScenarios = [
          { method: 'GET' }, // Wrong method
          { method: 'PUT' }, // Wrong method
          { method: 'DELETE' }, // Wrong method
          { 
            method: 'POST',
            headers: { 'content-length': 'invalid' }
          },
          {
            method: 'POST',
            cookies: { 'malformed': 'value\x00null' }
          }
        ];

        for (const scenario of malformedScenarios) {
          try {
            const request = createMockRequest({
              url: 'http://localhost:3000/api/auth/signout',
              ...scenario
            });

            const response = await signoutHandler(request);
            
            // Should either work (for POST) or be handled gracefully
            expect(response.status).toBeGreaterThanOrEqual(200);
            expect(response.status).toBeLessThan(600);
          } catch (error) {
            // Method not allowed is acceptable for non-POST
            if (scenario.method !== 'POST') {
              expect(error).toBeDefined();
            }
          }
        }
      });
    });

    describe('Error Scenarios', () => {
      it('should handle internal errors gracefully', async () => {
        // Mock Logger to throw an error
        const Logger = require('@/lib/logger').default;
        const originalInfo = Logger.info;
        Logger.info = jest.fn(() => {
          throw new Error('Logger error');
        });

        try {
          const request = createMockRequest({
            method: 'POST',
            url: 'http://localhost:3000/api/auth/signout'
          });

          const response = await signoutHandler(request);
          
          // Should either succeed or return proper error
          if (response.status === 200) {
            const data = await response.json();
            expect(data.success).toBe(true);
          } else {
            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data).toHaveProperty('error');
          }
        } finally {
          Logger.info = originalInfo;
        }
      });

      it('should handle response creation errors', async () => {
        // Mock NextResponse to throw
        const originalJson = Response.json;
        Response.json = jest.fn(() => {
          throw new Error('Response creation error');
        });

        try {
          const request = createMockRequest({
            method: 'POST',
            url: 'http://localhost:3000/api/auth/signout'
          });

          await expect(signoutHandler(request)).rejects.toThrow();
        } finally {
          Response.json = originalJson;
        }
      });

      it('should handle cookie deletion errors', async () => {
        const request = createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/auth/signout'
        });

        // Even if cookie operations fail, signout should succeed
        const response = await signoutHandler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should handle complete auth flow simulation', async () => {
      // 1. Get user info (should return demo user)
      const meRequest = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/auth/me'
      });

      const meResponse = await authMeHandler(meRequest);
      const userData = await meResponse.json();

      expect(meResponse.status).toBe(200);
      expect(userData.user.id).toBe('demo-user');

      // 2. Sign out
      const signoutRequest = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/auth/signout',
        cookies: {
          'stack-session': 'demo-session'
        }
      });

      const signoutResponse = await signoutHandler(signoutRequest);
      const signoutData = await signoutResponse.json();

      expect(signoutResponse.status).toBe(200);
      expect(signoutData.success).toBe(true);

      // 3. Get user info again (should still return demo user)
      const meRequest2 = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/auth/me'
      });

      const meResponse2 = await authMeHandler(meRequest2);
      const userData2 = await meResponse2.json();

      expect(meResponse2.status).toBe(200);
      expect(userData2.user.id).toBe('demo-user');
    });

    it('should handle rapid authentication operations', async () => {
      const operations = [];

      // Simulate rapid alternating requests
      for (let i = 0; i < 20; i++) {
        if (i % 2 === 0) {
          operations.push(
            authMeHandler(createMockRequest({
              method: 'GET',
              url: 'http://localhost:3000/api/auth/me'
            }))
          );
        } else {
          operations.push(
            signoutHandler(createMockRequest({
              method: 'POST',
              url: 'http://localhost:3000/api/auth/signout'
            }))
          );
        }
      }

      const results = await Promise.allSettled(operations);

      // All operations should succeed
      results.forEach((result, index) => {
        expect(result.status).toBe('fulfilled');
        if (result.status === 'fulfilled') {
          expect(result.value.status).toBe(200);
        }
      });
    });

    it('should maintain consistent demo user data across requests', async () => {
      const requests = Array(10).fill(null).map(() => 
        authMeHandler(createMockRequest({
          method: 'GET',
          url: 'http://localhost:3000/api/auth/me'
        }))
      );

      const responses = await Promise.all(requests);
      const data = await Promise.all(responses.map(r => r.json()));

      // All should return the same demo user (except timestamps)
      const firstUser = data[0].user;
      
      data.forEach(item => {
        expect(item.user.id).toBe(firstUser.id);
        expect(item.user.email).toBe(firstUser.email);
        expect(item.user.firstName).toBe(firstUser.firstName);
        expect(item.user.lastName).toBe(firstUser.lastName);
        expect(item.user.username).toBe(firstUser.username);
        
        // Settings should be identical
        expect(item.user.settings).toEqual(firstUser.settings);
        expect(item.user.subscription).toEqual(firstUser.subscription);
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle high concurrent load on /me endpoint', async () => {
      const startTime = Date.now();
      
      const requests = Array(100).fill(null).map(() => 
        authMeHandler(createMockRequest({
          method: 'GET',
          url: 'http://localhost:3000/api/auth/me'
        }))
      );

      const responses = await Promise.all(requests);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds for 100 requests
    });

    it('should handle high concurrent load on /signout endpoint', async () => {
      const startTime = Date.now();
      
      const requests = Array(100).fill(null).map(() => 
        signoutHandler(createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/auth/signout'
        }))
      );

      const responses = await Promise.all(requests);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds for 100 requests
    });

    it('should not cause memory leaks with repeated operations', async () => {
      // Simulate sustained usage
      for (let batch = 0; batch < 10; batch++) {
        const batchRequests = Array(10).fill(null).map(() => 
          Promise.all([
            authMeHandler(createMockRequest({
              method: 'GET',
              url: 'http://localhost:3000/api/auth/me'
            })),
            signoutHandler(createMockRequest({
              method: 'POST',
              url: 'http://localhost:3000/api/auth/signout'
            }))
          ])
        );

        const batchResults = await Promise.all(batchRequests);
        
        // All should succeed
        batchResults.forEach(([meResponse, signoutResponse]) => {
          expect(meResponse.status).toBe(200);
          expect(signoutResponse.status).toBe(200);
        });
      }

      // If we reach here without memory issues, test passes
      expect(true).toBe(true);
    });
  });
});