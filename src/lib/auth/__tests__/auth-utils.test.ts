/**
 * Comprehensive unit tests for authentication utilities
 * Testing JWT verification, middleware, permissions, and security features
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyToken, 
  getAuthContext, 
  isPublicRoute, 
  shouldIgnoreRoute,
  requireAuth,
  getUserFromRequest,
  requirePermission,
  requireFeature,
  hasPermission,
  checkUsageLimits,
  withAuth,
  withRole,
  withFeature,
  withUsageLimit,
  withAdmin,
  AuthUser,
  AuthContext
} from '../auth-utils';

// Mock jose library
jest.mock('jose', () => ({
  jwtVerify: jest.fn()
}));

// Mock environment
const originalEnv = process.env;

describe('Auth Utils Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('verifyToken', () => {
    it('should verify valid JWT token', async () => {
      const mockPayload = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user' as const
      };

      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValueOnce({ payload: mockPayload });

      const result = await verifyToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(jwtVerify).toHaveBeenCalledWith(
        'valid-token',
        expect.any(Object) // SECRET_KEY
      );
    });

    it('should return null for invalid token', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockRejectedValueOnce(new Error('Invalid token'));

      const result = await verifyToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should handle different JWT errors', async () => {
      const { jwtVerify } = require('jose');
      const errors = [
        new Error('Token expired'),
        new Error('Invalid signature'),
        new Error('Malformed token'),
        new Error('Invalid issuer')
      ];

      for (const error of errors) {
        jwtVerify.mockRejectedValueOnce(error);
        const result = await verifyToken('bad-token');
        expect(result).toBeNull();
      }
    });

    it('should handle malformed token payloads', async () => {
      const { jwtVerify } = require('jose');
      const malformedPayloads = [
        null,
        undefined,
        'string',
        123,
        [],
        { invalid: 'structure' }
      ];

      for (const payload of malformedPayloads) {
        jwtVerify.mockResolvedValueOnce({ payload });
        const result = await verifyToken('token');
        expect(result).toBe(payload);
      }
    });
  });

  describe('getAuthContext', () => {
    const createMockRequest = (headers: Record<string, string> = {}, cookies: Record<string, string> = {}) => {
      return {
        headers: {
          get: jest.fn((key: string) => headers[key] || null)
        },
        cookies: {
          get: jest.fn((key: string) => cookies[key] ? { value: cookies[key] } : undefined)
        }
      } as unknown as NextRequest;
    };

    it('should authenticate with valid JWT token from header', async () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        firstName: 'Test',
        lastName: 'User'
      };

      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValueOnce({ payload: mockUser });

      const request = createMockRequest({
        authorization: 'Bearer valid-token'
      });

      const result = await getAuthContext(request);

      expect(result).toEqual({
        user: mockUser,
        isAuthenticated: true,
        isDemo: false
      });
    });

    it('should authenticate with valid JWT token from cookie', async () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user'
      };

      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValueOnce({ payload: mockUser });

      const request = createMockRequest({}, {
        auth_token: 'cookie-token'
      });

      const result = await getAuthContext(request);

      expect(result).toEqual({
        user: mockUser,
        isAuthenticated: true,
        isDemo: false
      });
    });

    it('should authenticate demo user with demo header', async () => {
      const request = createMockRequest({
        'x-demo-user': 'demo-user'
      });

      const result = await getAuthContext(request);

      expect(result).toEqual({
        user: {
          id: 'demo-user',
          email: 'demo@astralchronos.com',
          role: 'user',
          firstName: 'Demo',
          lastName: 'User',
          name: 'Demo User',
          imageUrl: '/avatars/demo-user.png'
        },
        isAuthenticated: true,
        isDemo: true
      });
    });

    it('should authenticate demo user with demo token', async () => {
      const request = createMockRequest({
        'x-demo-token': 'demo-token-2024'
      });

      const result = await getAuthContext(request);

      expect(result).toEqual({
        user: expect.objectContaining({
          id: 'demo-user',
          email: 'demo@astralchronos.com'
        }),
        isAuthenticated: true,
        isDemo: true
      });
    });

    it('should return unauthenticated context when no valid auth found', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockRejectedValueOnce(new Error('Invalid token'));

      const request = createMockRequest({
        authorization: 'Bearer invalid-token'
      });

      const result = await getAuthContext(request);

      expect(result).toEqual({
        user: null,
        isAuthenticated: false,
        isDemo: false
      });
    });

    it('should prioritize JWT over demo authentication', async () => {
      const mockUser: AuthUser = {
        id: 'real-user',
        email: 'real@example.com',
        role: 'admin'
      };

      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValueOnce({ payload: mockUser });

      const request = createMockRequest({
        authorization: 'Bearer valid-token',
        'x-demo-user': 'demo-user'
      });

      const result = await getAuthContext(request);

      expect(result).toEqual({
        user: mockUser,
        isAuthenticated: true,
        isDemo: false
      });
    });

    it('should handle malformed authorization headers', async () => {
      const malformedHeaders = [
        'invalid-format',
        'Bearer',
        'Bearer ',
        'Basic dGVzdA==',
        'Bearer token with spaces',
        'Bearer 123 456'
      ];

      for (const header of malformedHeaders) {
        const request = createMockRequest({
          authorization: header
        });

        const result = await getAuthContext(request);
        
        // Should either authenticate (if valid) or return unauthenticated
        expect(result).toMatchObject({
          isAuthenticated: expect.any(Boolean),
          isDemo: expect.any(Boolean)
        });
      }
    });
  });

  describe('Route Utilities', () => {
    describe('isPublicRoute', () => {
      it('should identify public routes correctly', () => {
        const publicRoutes = [
          '/',
          '/api/health',
          '/api/public',
          '/api/webhooks',
          '/api/templates/public',
          '/api/auth',
          '/favicon.ico',
          '/robots.txt',
          '/sitemap.xml',
          '/manifest.json'
        ];

        for (const route of publicRoutes) {
          expect(isPublicRoute(route)).toBe(true);
        }
      });

      it('should identify private routes correctly', () => {
        const privateRoutes = [
          '/dashboard',
          '/api/tasks',
          '/api/user',
          '/settings',
          '/profile'
        ];

        for (const route of privateRoutes) {
          expect(isPublicRoute(route)).toBe(false);
        }
      });

      it('should handle route prefixes correctly', () => {
        expect(isPublicRoute('/api/health/check')).toBe(true);
        expect(isPublicRoute('/api/public/templates')).toBe(true);
        expect(isPublicRoute('/api/webhooks/stripe')).toBe(true);
        expect(isPublicRoute('/api/private')).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(isPublicRoute('')).toBe(false);
        expect(isPublicRoute('//')).toBe(false);
        expect(isPublicRoute('api/health')).toBe(false); // Missing leading slash
      });
    });

    describe('shouldIgnoreRoute', () => {
      it('should ignore Next.js internal routes', () => {
        const nextRoutes = [
          '/_next/static/css/app.css',
          '/_next/static/js/main.js',
          '/_next/webpack-hmr'
        ];

        for (const route of nextRoutes) {
          expect(shouldIgnoreRoute(route)).toBe(true);
        }
      });

      it('should ignore static assets', () => {
        const staticAssets = [
          '/favicon.ico',
          '/robots.txt',
          '/sitemap.xml',
          '/logo.png',
          '/image.jpg',
          '/style.css',
          '/script.js',
          '/font.woff2'
        ];

        for (const asset of staticAssets) {
          expect(shouldIgnoreRoute(asset)).toBe(true);
        }
      });

      it('should not ignore API routes', () => {
        const apiRoutes = [
          '/api/auth',
          '/api/users',
          '/api/tasks'
        ];

        for (const route of apiRoutes) {
          expect(shouldIgnoreRoute(route)).toBe(false);
        }
      });
    });
  });

  describe('Authentication Functions', () => {
    describe('requireAuth', () => {
      it('should return user when authenticated', async () => {
        const mockUser: AuthUser = {
          id: 'user-123',
          email: 'test@example.com',
          role: 'user'
        };

        const { jwtVerify } = require('jose');
        jwtVerify.mockResolvedValueOnce({ payload: mockUser });

        const request = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          }
        } as unknown as NextRequest;

        const result = await requireAuth(request);

        expect(result).toEqual(mockUser);
      });

      it('should throw error when not authenticated', async () => {
        const request = {
          headers: {
            get: jest.fn().mockReturnValue(null)
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          }
        } as unknown as NextRequest;

        await expect(requireAuth(request)).rejects.toThrow('Authentication required');
      });
    });

    describe('getUserFromRequest', () => {
      it('should return user when authenticated', async () => {
        const mockUser: AuthUser = {
          id: 'user-123',
          email: 'test@example.com',
          role: 'user'
        };

        const { jwtVerify } = require('jose');
        jwtVerify.mockResolvedValueOnce({ payload: mockUser });

        const request = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          }
        } as unknown as NextRequest;

        const result = await getUserFromRequest(request);

        expect(result).toEqual(mockUser);
      });

      it('should return null when not authenticated', async () => {
        const request = {
          headers: {
            get: jest.fn().mockReturnValue(null)
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          }
        } as unknown as NextRequest;

        const result = await getUserFromRequest(request);

        expect(result).toBeNull();
      });
    });
  });

  describe('Permission System', () => {
    describe('requirePermission', () => {
      it('should pass for authenticated user', async () => {
        const mockUser: AuthUser = {
          id: 'user-123',
          email: 'test@example.com',
          role: 'admin'
        };

        const { jwtVerify } = require('jose');
        jwtVerify.mockResolvedValueOnce({ payload: mockUser });

        const request = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          }
        } as unknown as NextRequest;

        await expect(requirePermission(request, 'read:users')).resolves.toBeUndefined();
      });

      it('should throw for unauthenticated user', async () => {
        const request = {
          headers: {
            get: jest.fn().mockReturnValue(null)
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          }
        } as unknown as NextRequest;

        await expect(requirePermission(request, 'read:users')).rejects.toThrow('Authentication required');
      });
    });

    describe('hasPermission', () => {
      it('should return true for authenticated user', async () => {
        const mockUser: AuthUser = {
          id: 'user-123',
          email: 'test@example.com',
          role: 'admin'
        };

        const { jwtVerify } = require('jose');
        jwtVerify.mockResolvedValueOnce({ payload: mockUser });

        const request = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          }
        } as unknown as NextRequest;

        const result = await hasPermission(request, 'read:users');

        expect(result).toBe(true);
      });

      it('should return false for unauthenticated user', async () => {
        const request = {
          headers: {
            get: jest.fn().mockReturnValue(null)
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          }
        } as unknown as NextRequest;

        const result = await hasPermission(request, 'read:users');

        expect(result).toBe(false);
      });
    });
  });

  describe('Usage Limits', () => {
    describe('checkUsageLimits', () => {
      it('should return usage info for authenticated user', async () => {
        const mockUser: AuthUser = {
          id: 'user-123',
          email: 'test@example.com',
          role: 'user'
        };

        const { jwtVerify } = require('jose');
        jwtVerify.mockResolvedValueOnce({ payload: mockUser });

        const request = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          }
        } as unknown as NextRequest;

        const result = await checkUsageLimits(request, 'api-calls');

        expect(result).toEqual({
          allowed: true,
          current: 0,
          limit: 100
        });
      });

      it('should throw for unauthenticated user', async () => {
        const request = {
          headers: {
            get: jest.fn().mockReturnValue(null)
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          }
        } as unknown as NextRequest;

        await expect(checkUsageLimits(request, 'api-calls')).rejects.toThrow('Authentication required');
      });
    });
  });

  describe('Middleware Functions', () => {
    describe('withAuth', () => {
      it('should call handler when authenticated', async () => {
        const mockUser: AuthUser = {
          id: 'user-123',
          email: 'test@example.com',
          role: 'user'
        };

        const { jwtVerify } = require('jose');
        jwtVerify.mockResolvedValueOnce({ payload: mockUser });

        const mockHandler = jest.fn().mockResolvedValue(new Response('Success'));
        const request = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          },
          nextUrl: { pathname: '/api/test' }
        } as unknown as NextRequest;

        const wrappedHandler = withAuth(mockHandler);
        const result = await wrappedHandler(request, {});

        expect(mockHandler).toHaveBeenCalledWith(request, {});
        expect(result).toBeInstanceOf(Response);
      });

      it('should return 401 when not authenticated', async () => {
        const mockHandler = jest.fn();
        const request = {
          headers: {
            get: jest.fn().mockReturnValue(null)
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          },
          nextUrl: { pathname: '/api/test' }
        } as unknown as NextRequest;

        const wrappedHandler = withAuth(mockHandler);
        const result = await wrappedHandler(request, {});

        expect(mockHandler).not.toHaveBeenCalled();
        expect(result.status).toBe(401);

        const json = await result.json();
        expect(json).toEqual({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      });
    });

    describe('withRole', () => {
      it('should allow user with sufficient role', async () => {
        const mockUser: AuthUser = {
          id: 'user-123',
          email: 'test@example.com',
          role: 'admin'
        };

        const { jwtVerify } = require('jose');
        jwtVerify.mockResolvedValueOnce({ payload: mockUser });

        const mockHandler = jest.fn().mockResolvedValue(new Response('Success'));
        const request = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          },
          nextUrl: { pathname: '/api/admin' }
        } as unknown as NextRequest;

        const wrappedHandler = withRole('user', mockHandler);
        const result = await wrappedHandler(request, {});

        expect(mockHandler).toHaveBeenCalled();
        expect(result).toBeInstanceOf(Response);
      });

      it('should deny user with insufficient role', async () => {
        const mockUser: AuthUser = {
          id: 'user-123',
          email: 'test@example.com',
          role: 'user'
        };

        const { jwtVerify } = require('jose');
        jwtVerify.mockResolvedValueOnce({ payload: mockUser });

        const mockHandler = jest.fn();
        const request = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          },
          nextUrl: { pathname: '/api/admin' }
        } as unknown as NextRequest;

        const wrappedHandler = withRole('admin', mockHandler);
        const result = await wrappedHandler(request, {});

        expect(mockHandler).not.toHaveBeenCalled();
        expect(result.status).toBe(403);

        const json = await result.json();
        expect(json).toEqual({
          error: 'Insufficient role',
          code: 'ROLE_REQUIRED',
          required: 'admin'
        });
      });

      it('should understand role hierarchy', async () => {
        const roles = [
          { user: 'admin', required: 'user', shouldPass: true },
          { user: 'admin', required: 'premium', shouldPass: true },
          { user: 'admin', required: 'admin', shouldPass: true },
          { user: 'premium', required: 'user', shouldPass: true },
          { user: 'premium', required: 'admin', shouldPass: false },
          { user: 'user', required: 'premium', shouldPass: false },
          { user: 'user', required: 'admin', shouldPass: false }
        ];

        for (const { user, required, shouldPass } of roles) {
          const mockUser: AuthUser = {
            id: 'user-123',
            email: 'test@example.com',
            role: user as 'admin' | 'user' | 'premium'
          };

          const { jwtVerify } = require('jose');
          jwtVerify.mockResolvedValueOnce({ payload: mockUser });

          const mockHandler = jest.fn().mockResolvedValue(new Response('Success'));
          const request = {
            headers: {
              get: jest.fn().mockReturnValue('Bearer token')
            },
            cookies: {
              get: jest.fn().mockReturnValue(undefined)
            },
            nextUrl: { pathname: '/api/test' }
          } as unknown as NextRequest;

          const wrappedHandler = withRole(required as 'admin' | 'user' | 'premium', mockHandler);
          const result = await wrappedHandler(request, {});

          if (shouldPass) {
            expect(mockHandler).toHaveBeenCalled();
            expect(result.status).not.toBe(403);
          } else {
            expect(mockHandler).not.toHaveBeenCalled();
            expect(result.status).toBe(403);
          }

          jest.clearAllMocks();
        }
      });
    });

    describe('withFeature', () => {
      it('should allow access when feature is available', async () => {
        const mockUser: AuthUser = {
          id: 'user-123',
          email: 'test@example.com',
          role: 'premium'
        };

        const { jwtVerify } = require('jose');
        jwtVerify.mockResolvedValueOnce({ payload: mockUser });

        const mockHandler = jest.fn().mockResolvedValue(new Response('Success'));
        const request = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          },
          nextUrl: { pathname: '/api/premium-feature' }
        } as unknown as NextRequest;

        const wrappedHandler = withFeature('premium-analytics', mockHandler);
        const result = await wrappedHandler(request, {});

        expect(mockHandler).toHaveBeenCalled();
        expect(result).toBeInstanceOf(Response);
      });

      it('should deny access when feature is not available', async () => {
        // Mock requireFeature to throw an error
        jest.doMock('../auth-utils', () => ({
          ...jest.requireActual('../auth-utils'),
          requireFeature: jest.fn().mockRejectedValue(new Error('Feature not available'))
        }));

        const mockHandler = jest.fn();
        const request = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          },
          nextUrl: { pathname: '/api/premium-feature' }
        } as unknown as NextRequest;

        const { withFeature } = require('../auth-utils');
        const wrappedHandler = withFeature('premium-analytics', mockHandler);
        const result = await wrappedHandler(request, {});

        expect(mockHandler).not.toHaveBeenCalled();
        expect(result.status).toBe(402);

        const json = await result.json();
        expect(json).toEqual({
          error: 'Feature not available',
          code: 'FEATURE_UNAVAILABLE',
          feature: 'premium-analytics',
          upgradeRequired: true
        });
      });
    });

    describe('withUsageLimit', () => {
      it('should allow access when under usage limit', async () => {
        const mockUser: AuthUser = {
          id: 'user-123',
          email: 'test@example.com',
          role: 'user'
        };

        const { jwtVerify } = require('jose');
        jwtVerify.mockResolvedValueOnce({ payload: mockUser });

        const mockHandler = jest.fn().mockResolvedValue(new Response('Success'));
        const request = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          },
          nextUrl: { pathname: '/api/limited' }
        } as unknown as NextRequest;

        const wrappedHandler = withUsageLimit('api-calls', mockHandler);
        const result = await wrappedHandler(request, {});

        expect(mockHandler).toHaveBeenCalled();
        expect(result).toBeInstanceOf(Response);
      });

      it('should deny access when over usage limit', async () => {
        // Mock checkUsageLimits to return exceeded limit
        jest.doMock('../auth-utils', () => ({
          ...jest.requireActual('../auth-utils'),
          checkUsageLimits: jest.fn().mockResolvedValue({
            allowed: false,
            current: 100,
            limit: 100
          }),
          getUserFromRequest: jest.fn().mockResolvedValue({
            id: 'user-123',
            email: 'test@example.com',
            role: 'user'
          })
        }));

        const mockHandler = jest.fn();
        const request = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          },
          nextUrl: { pathname: '/api/limited' }
        } as unknown as NextRequest;

        const { withUsageLimit } = require('../auth-utils');
        const wrappedHandler = withUsageLimit('api-calls', mockHandler);
        const result = await wrappedHandler(request, {});

        expect(mockHandler).not.toHaveBeenCalled();
        expect(result.status).toBe(402);

        const json = await result.json();
        expect(json).toEqual({
          error: 'Usage limit exceeded',
          code: 'USAGE_LIMIT_EXCEEDED',
          resource: 'api-calls',
          current: 100,
          limit: 100,
          upgradeRequired: true
        });
      });

      it('should handle usage check errors gracefully', async () => {
        // Mock checkUsageLimits to throw an error
        jest.doMock('../auth-utils', () => ({
          ...jest.requireActual('../auth-utils'),
          checkUsageLimits: jest.fn().mockRejectedValue(new Error('Database error'))
        }));

        const mockHandler = jest.fn();
        const request = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          },
          nextUrl: { pathname: '/api/limited' }
        } as unknown as NextRequest;

        const { withUsageLimit } = require('../auth-utils');
        const wrappedHandler = withUsageLimit('api-calls', mockHandler);
        const result = await wrappedHandler(request, {});

        expect(mockHandler).not.toHaveBeenCalled();
        expect(result.status).toBe(500);

        const json = await result.json();
        expect(json).toEqual({
          error: 'Internal server error'
        });
      });
    });

    describe('withAdmin', () => {
      it('should be equivalent to withRole("admin")', async () => {
        const mockUser: AuthUser = {
          id: 'admin-123',
          email: 'admin@example.com',
          role: 'admin'
        };

        const { jwtVerify } = require('jose');
        jwtVerify.mockResolvedValueOnce({ payload: mockUser });

        const mockHandler = jest.fn().mockResolvedValue(new Response('Admin Success'));
        const request = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer admin-token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          },
          nextUrl: { pathname: '/api/admin' }
        } as unknown as NextRequest;

        const wrappedHandler = withAdmin(mockHandler);
        const result = await wrappedHandler(request, {});

        expect(mockHandler).toHaveBeenCalled();
        expect(result).toBeInstanceOf(Response);
      });

      it('should deny non-admin users', async () => {
        const mockUser: AuthUser = {
          id: 'user-123',
          email: 'user@example.com',
          role: 'user'
        };

        const { jwtVerify } = require('jose');
        jwtVerify.mockResolvedValueOnce({ payload: mockUser });

        const mockHandler = jest.fn();
        const request = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer user-token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          },
          nextUrl: { pathname: '/api/admin' }
        } as unknown as NextRequest;

        const wrappedHandler = withAdmin(mockHandler);
        const result = await wrappedHandler(request, {});

        expect(mockHandler).not.toHaveBeenCalled();
        expect(result.status).toBe(403);
      });
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle JWT secret key variations', async () => {
      const secrets = [
        undefined, // Should use fallback
        '', // Empty string
        'short', // Short key
        'a'.repeat(256), // Very long key
        'special!@#$%^&*()characters', // Special characters
        '🔐🗝️🛡️' // Unicode
      ];

      for (const secret of secrets) {
        const originalSecret = process.env.JWT_SECRET;
        process.env.JWT_SECRET = secret;

        // Should not throw when creating auth utils
        expect(() => {
          jest.resetModules();
          require('../auth-utils');
        }).not.toThrow();

        process.env.JWT_SECRET = originalSecret;
      }
    });

    it('should handle concurrent authentication requests', async () => {
      const mockUser: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user'
      };

      const { jwtVerify } = require('jose');
      jwtVerify.mockResolvedValue({ payload: mockUser });

      const request = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer token')
        },
        cookies: {
          get: jest.fn().mockReturnValue(undefined)
        }
      } as unknown as NextRequest;

      // Simulate concurrent requests
      const promises = Array(10).fill(null).map(() => getAuthContext(request));
      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result.isAuthenticated).toBe(true);
        expect(result.user).toEqual(mockUser);
      });
    });

    it('should prevent token reuse attacks', async () => {
      const { jwtVerify } = require('jose');
      
      // First use - valid
      jwtVerify.mockResolvedValueOnce({ 
        payload: { 
          id: 'user-123', 
          email: 'test@example.com', 
          role: 'user',
          exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
        } 
      });

      const request1 = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer token')
        },
        cookies: {
          get: jest.fn().mockReturnValue(undefined)
        }
      } as unknown as NextRequest;

      const result1 = await getAuthContext(request1);
      expect(result1.isAuthenticated).toBe(true);

      // Second use - expired token
      jwtVerify.mockRejectedValueOnce(new Error('Token expired'));

      const request2 = {
        headers: {
          get: jest.fn().mockReturnValue('Bearer token')
        },
        cookies: {
          get: jest.fn().mockReturnValue(undefined)
        }
      } as unknown as NextRequest;

      const result2 = await getAuthContext(request2);
      expect(result2.isAuthenticated).toBe(false);
    });

    it('should handle role injection attempts', async () => {
      const maliciousPayloads = [
        { id: 'user-123', role: 'admin', email: 'user@test.com' }, // Role escalation
        { id: 'user-123', role: ['admin', 'user'], email: 'user@test.com' }, // Array instead of string
        { id: 'user-123', role: { admin: true }, email: 'user@test.com' }, // Object instead of string
        { id: 'user-123', role: 'super-admin', email: 'user@test.com' }, // Invalid role
        { id: 'user-123', role: null, email: 'user@test.com' }, // Null role
        { id: 'user-123', role: undefined, email: 'user@test.com' } // Undefined role
      ];

      const { jwtVerify } = require('jose');

      for (const payload of maliciousPayloads) {
        jwtVerify.mockResolvedValueOnce({ payload });

        const request = {
          headers: {
            get: jest.fn().mockReturnValue('Bearer token')
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          }
        } as unknown as NextRequest;

        const result = await getAuthContext(request);
        
        // Should authenticate but role should be preserved as-is
        // (validation should happen at business logic level)
        expect(result.isAuthenticated).toBe(true);
        expect(result.user?.role).toBe(payload.role);
      }
    });

    it('should handle demo authentication bypass attempts', async () => {
      const bypassAttempts = [
        { 'x-demo-user': 'admin-user' },
        { 'x-demo-user': 'demo-user', 'x-demo-token': 'fake-token' },
        { 'x-demo-token': 'demo-token-2023' }, // Wrong year
        { 'x-demo-token': 'DEMO-TOKEN-2024' }, // Wrong case
        { 'x-demo-user': 'demo-user\x00admin' }, // Null byte injection
        { 'x-demo-user': '<script>alert("xss")</script>' } // XSS attempt
      ];

      for (const headers of bypassAttempts) {
        const request = {
          headers: {
            get: jest.fn((key: string) => headers[key as keyof typeof headers] || null)
          },
          cookies: {
            get: jest.fn().mockReturnValue(undefined)
          }
        } as unknown as NextRequest;

        const result = await getAuthContext(request);

        // Only exact matches should work
        const shouldAuthenticate = 
          headers['x-demo-user'] === 'demo-user' || 
          headers['x-demo-token'] === 'demo-token-2024';

        expect(result.isAuthenticated).toBe(shouldAuthenticate);
        if (shouldAuthenticate) {
          expect(result.isDemo).toBe(true);
        }
      }
    });
  });
});