/**
 * Comprehensive unit tests for authentication utilities
 * Testing all auth functions, edge cases, and security scenarios
 */

import { NextRequest } from 'next/server';
import { getUserFromRequest, requireAuth, getUserId, withAuth, getTestUser, getUserForRequest } from '../auth';
import Logger, { AppError } from '../../logger';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Logger
jest.mock('../../logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  AppError: class MockAppError extends Error {
    constructor(message: string, public statusCode: number, public isOperational: boolean) {
      super(message);
      this.name = 'AppError';
    }
  }
}));

// Mock environment variables
const originalEnv = process.env;

describe('Authentication Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Environment Configuration', () => {
    it('should detect Stack Auth configuration correctly', () => {
      process.env.STACK_PROJECT_ID = 'test-project';
      process.env.STACK_SECRET_SERVER_KEY = 'test-secret';
      process.env.STACK_PUBLISHABLE_CLIENT_KEY = 'test-key';
      process.env.NODE_ENV = 'production';
      
      // Re-import to get updated environment
      jest.resetModules();
      const { getUserFromRequest } = require('../auth');
      
      expect(getUserFromRequest).toBeDefined();
    });

    it('should handle missing Stack Auth configuration', () => {
      delete process.env.STACK_PROJECT_ID;
      delete process.env.STACK_SECRET_SERVER_KEY;
      delete process.env.STACK_PUBLISHABLE_CLIENT_KEY;
      
      // Should not throw and should warn about disabled auth
      expect(() => {
        jest.resetModules();
        require('../auth');
      }).not.toThrow();
    });
  });

  describe('getUserFromRequest', () => {
    const createMockRequest = (headers: Record<string, string> = {}, cookies: Record<string, string> = {}) => {
      const request = {
        headers: {
          get: jest.fn((key: string) => headers[key] || null)
        },
        cookies: {
          get: jest.fn((key: string) => cookies[key] ? { value: cookies[key] } : undefined)
        }
      } as unknown as NextRequest;
      
      return request;
    };

    beforeEach(() => {
      // Set up Stack Auth environment
      process.env.STACK_PROJECT_ID = 'test-project';
      process.env.STACK_SECRET_SERVER_KEY = 'test-secret';
      process.env.STACK_PUBLISHABLE_CLIENT_KEY = 'test-key';
      process.env.NODE_ENV = 'production';
    });

    it('should return null when Stack Auth is not configured', async () => {
      delete process.env.STACK_PROJECT_ID;
      jest.resetModules();
      const { getUserFromRequest } = require('../auth');
      
      const request = createMockRequest();
      const result = await getUserFromRequest(request);
      
      expect(result).toBeNull();
    });

    it('should return null when no token is provided', async () => {
      const request = createMockRequest();
      const result = await getUserFromRequest(request);
      
      expect(result).toBeNull();
    });

    it('should extract token from Authorization header', async () => {
      const mockUser = {
        user: {
          id: 'user-123',
          primary_email: 'test@example.com',
          display_name: 'Test User',
          username: 'testuser',
          created_at_millis: Date.now(),
          updated_at_millis: Date.now()
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      });

      const request = createMockRequest({
        authorization: 'Bearer test-token'
      });

      const result = await getUserFromRequest(request);

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        imageUrl: undefined,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.stack-auth.com/api/v1/projects/test-project/sessions/current`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'x-stack-secret-server-key': 'test-secret',
            'x-stack-project-id': 'test-project'
          })
        })
      );
    });

    it('should extract token from session cookie', async () => {
      const mockUser = {
        user: {
          id: 'user-123',
          primary_email: 'test@example.com',
          display_name: 'Test User',
          username: 'testuser',
          created_at_millis: Date.now(),
          updated_at_millis: Date.now()
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      });

      const request = createMockRequest({}, { 'stack-session': 'cookie-token' });

      const result = await getUserFromRequest(request);

      expect(result).toBeDefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer cookie-token'
          })
        })
      );
    });

    it('should handle 401 unauthorized response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const request = createMockRequest({
        authorization: 'Bearer invalid-token'
      });

      const result = await getUserFromRequest(request);

      expect(result).toBeNull();
    });

    it('should handle Stack Auth API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const request = createMockRequest({
        authorization: 'Bearer test-token'
      });

      const result = await getUserFromRequest(request);

      expect(result).toBeNull();
      expect(Logger.error).toHaveBeenCalled();
    });

    it('should handle session without user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: null })
      });

      const request = createMockRequest({
        authorization: 'Bearer test-token'
      });

      const result = await getUserFromRequest(request);

      expect(result).toBeNull();
    });

    it('should handle malformed user data', async () => {
      const mockUser = {
        user: {
          id: 'user-123',
          // Missing required fields
          created_at_millis: Date.now(),
          updated_at_millis: Date.now()
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      });

      const request = createMockRequest({
        authorization: 'Bearer test-token'
      });

      const result = await getUserFromRequest(request);

      expect(result).toEqual({
        id: 'user-123',
        email: undefined,
        firstName: undefined,
        lastName: undefined,
        username: undefined,
        imageUrl: undefined,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });

    it('should parse display name correctly', async () => {
      const mockUser = {
        user: {
          id: 'user-123',
          primary_email: 'test@example.com',
          display_name: 'John Doe Smith',
          created_at_millis: Date.now(),
          updated_at_millis: Date.now()
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser)
      });

      const request = createMockRequest({
        authorization: 'Bearer test-token'
      });

      const result = await getUserFromRequest(request);

      expect(result?.firstName).toBe('John');
      expect(result?.lastName).toBe('Doe Smith');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const request = createMockRequest({
        authorization: 'Bearer test-token'
      });

      const result = await getUserFromRequest(request);

      expect(result).toBeNull();
      expect(Logger.error).toHaveBeenCalledWith('Authentication error:', expect.any(Error));
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      const request = createMockRequest({
        authorization: 'Bearer test-token'
      });

      const result = await getUserFromRequest(request);

      expect(result).toBeNull();
      expect(Logger.error).toHaveBeenCalled();
    });
  });

  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        imageUrl: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock getUserFromRequest to return a user
      jest.doMock('../auth', () => ({
        ...jest.requireActual('../auth'),
        getUserFromRequest: jest.fn().mockResolvedValue(mockUser)
      }));

      const { requireAuth } = require('../auth');
      const request = {} as NextRequest;

      const result = await requireAuth(request);

      expect(result).toEqual(mockUser);
    });

    it('should throw AppError when not authenticated', async () => {
      // Mock getUserFromRequest to return null
      jest.doMock('../auth', () => ({
        ...jest.requireActual('../auth'),
        getUserFromRequest: jest.fn().mockResolvedValue(null)
      }));

      const { requireAuth } = require('../auth');
      const request = {} as NextRequest;

      await expect(requireAuth(request)).rejects.toThrow(AppError);
      await expect(requireAuth(request)).rejects.toMatchObject({
        message: 'Authentication required',
        statusCode: 401,
        isOperational: true
      });
    });
  });

  describe('getUserId', () => {
    it('should return user ID when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        imageUrl: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.doMock('../auth', () => ({
        ...jest.requireActual('../auth'),
        getUserFromRequest: jest.fn().mockResolvedValue(mockUser)
      }));

      const { getUserId } = require('../auth');
      const request = {} as NextRequest;

      const result = await getUserId(request);

      expect(result).toBe('user-123');
    });

    it('should return null when not authenticated', async () => {
      jest.doMock('../auth', () => ({
        ...jest.requireActual('../auth'),
        getUserFromRequest: jest.fn().mockResolvedValue(null)
      }));

      const { getUserId } = require('../auth');
      const request = {} as NextRequest;

      const result = await getUserId(request);

      expect(result).toBeNull();
    });
  });

  describe('withAuth middleware', () => {
    it('should call handler when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        imageUrl: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockHandler = jest.fn().mockResolvedValue(new Response('Success'));

      jest.doMock('../auth', () => ({
        ...jest.requireActual('../auth'),
        requireAuth: jest.fn().mockResolvedValue(mockUser)
      }));

      const { withAuth } = require('../auth');
      const request = {} as NextRequest;

      const wrappedHandler = withAuth(mockHandler);
      const result = await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledWith(request, mockUser);
      expect(result).toBeInstanceOf(Response);
    });

    it('should return 401 when not authenticated', async () => {
      const mockHandler = jest.fn();

      jest.doMock('../auth', () => ({
        ...jest.requireActual('../auth'),
        requireAuth: jest.fn().mockRejectedValue(new AppError('Authentication required', 401, true))
      }));

      const { withAuth } = require('../auth');
      const request = {} as NextRequest;

      const wrappedHandler = withAuth(mockHandler);
      const result = await wrappedHandler(request);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(Response);
      
      const json = await result.json();
      expect(json).toEqual({ error: 'Authentication required' });
      expect(result.status).toBe(401);
    });

    it('should return 500 on internal error', async () => {
      const mockHandler = jest.fn();

      jest.doMock('../auth', () => ({
        ...jest.requireActual('../auth'),
        requireAuth: jest.fn().mockRejectedValue(new Error('Internal error'))
      }));

      const { withAuth } = require('../auth');
      const request = {} as NextRequest;

      const wrappedHandler = withAuth(mockHandler);
      const result = await wrappedHandler(request);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(Response);
      
      const json = await result.json();
      expect(json).toEqual({ error: 'Internal server error' });
      expect(result.status).toBe(500);
      expect(Logger.error).toHaveBeenCalled();
    });
  });

  describe('getTestUser', () => {
    it('should return test user in development mode', () => {
      process.env.NODE_ENV = 'development';

      const result = getTestUser();

      expect(result).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        imageUrl: undefined,
        username: 'testuser',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });

    it('should throw error in production mode', () => {
      process.env.NODE_ENV = 'production';

      expect(() => getTestUser()).toThrow('Test user only available in development mode');
    });
  });

  describe('getUserForRequest', () => {
    it('should use Stack Auth in production', async () => {
      process.env.NODE_ENV = 'production';
      
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        imageUrl: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.doMock('../auth', () => ({
        ...jest.requireActual('../auth'),
        getUserFromRequest: jest.fn().mockResolvedValue(mockUser)
      }));

      const { getUserForRequest } = require('../auth');
      const request = {} as NextRequest;

      const result = await getUserForRequest(request);

      expect(result).toEqual(mockUser);
    });

    it('should fallback to test user in development when enabled', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ENABLE_TEST_USER = 'true';

      jest.doMock('../auth', () => ({
        ...jest.requireActual('../auth'),
        getUserFromRequest: jest.fn().mockResolvedValue(null)
      }));

      const { getUserForRequest } = require('../auth');
      const request = {} as NextRequest;

      const result = await getUserForRequest(request);

      expect(result).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        imageUrl: undefined,
        username: 'testuser',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });

      expect(Logger.warn).toHaveBeenCalledWith('Using test user for development - disable in production!');
    });

    it('should return null in development when test user is disabled', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ENABLE_TEST_USER = 'false';

      jest.doMock('../auth', () => ({
        ...jest.requireActual('../auth'),
        getUserFromRequest: jest.fn().mockResolvedValue(null)
      }));

      const { getUserForRequest } = require('../auth');
      const request = {} as NextRequest;

      const result = await getUserForRequest(request);

      expect(result).toBeNull();
    });

    it('should prioritize real user over test user in development', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ENABLE_TEST_USER = 'true';

      const realUser = {
        id: 'real-user-123',
        email: 'real@example.com',
        firstName: 'Real',
        lastName: 'User',
        username: 'realuser',
        imageUrl: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.doMock('../auth', () => ({
        ...jest.requireActual('../auth'),
        getUserFromRequest: jest.fn().mockResolvedValue(realUser)
      }));

      const { getUserForRequest } = require('../auth');
      const request = {} as NextRequest;

      const result = await getUserForRequest(request);

      expect(result).toEqual(realUser);
      expect(Logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle malicious tokens', async () => {
      const maliciousTokens = [
        'Bearer <script>alert("xss")</script>',
        'Bearer "; DROP TABLE users; --',
        'Bearer ' + 'A'.repeat(10000), // Very long token
        'Bearer null',
        'Bearer undefined',
        'Bearer {}',
        'Bearer []'
      ];

      for (const token of maliciousTokens) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401
        });

        const request = {
          headers: {
            get: jest.fn().mockReturnValue(token)
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          }
        } as unknown as NextRequest;

        const result = await getUserFromRequest(request);
        expect(result).toBeNull();
      }
    });

    it('should handle response bombing attacks', async () => {
      const hugeMockUser = {
        user: {
          id: 'A'.repeat(1000000), // 1MB string
          primary_email: 'test@example.com',
          display_name: 'B'.repeat(1000000),
          username: 'testuser',
          created_at_millis: Date.now(),
          updated_at_millis: Date.now()
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(hugeMockUser)
      });

      const request = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer test-token')
        },
        cookies: {
          get: jest.fn().mockReturnValue(undefined)
        }
      } as unknown as NextRequest;

      // Should handle large responses gracefully
      const result = await getUserFromRequest(request);
      expect(result).toBeDefined();
      expect(result?.id).toBe('A'.repeat(1000000));
    });

    it('should handle timing attacks consistently', async () => {
      const timings: number[] = [];
      
      // Test multiple scenarios to ensure consistent timing
      const scenarios = [
        { token: 'Bearer valid-token', response: { ok: true, json: () => Promise.resolve({ user: { id: '123', primary_email: 'test@test.com', created_at_millis: Date.now(), updated_at_millis: Date.now() } }) } },
        { token: 'Bearer invalid-token', response: { ok: false, status: 401 } },
        { token: null, response: null }
      ];

      for (const scenario of scenarios) {
        if (scenario.response) {
          mockFetch.mockResolvedValueOnce(scenario.response);
        }

        const request = {
          headers: {
            get: jest.fn().mockReturnValue(scenario.token)
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          }
        } as unknown as NextRequest;

        const startTime = Date.now();
        await getUserFromRequest(request);
        const endTime = Date.now();
        
        timings.push(endTime - startTime);
      }

      // Timing differences should be minimal (within reasonable bounds)
      const maxTiming = Math.max(...timings);
      const minTiming = Math.min(...timings);
      expect(maxTiming - minTiming).toBeLessThan(100); // 100ms tolerance
    });
  });
});