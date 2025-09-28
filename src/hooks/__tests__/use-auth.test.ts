// ============================================================================
// ZENITH HOOK TESTS - USE AUTH HOOK
// ============================================================================

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../use-auth';

// ============================================================================
// MOCKS
// ============================================================================

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// ============================================================================
// TEST SETUP
// ============================================================================

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  jest.clearAllMocks();
  mockLocalStorage.getItem.mockReturnValue(null);
  mockFetch.mockClear();
});

// ============================================================================
// UNIT TESTS
// ============================================================================

describe('useAuth Hook', () => {
  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(true); // Initially loading
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should provide all required methods', () => {
      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.refreshSession).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('Authentication Flow', () => {
    it('should handle successful login', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          user: {
            id: 'test-user',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'user',
            isDemo: false,
          },
          tokens: {
            refreshToken: 'refresh-token-123',
          },
        }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const { result } = renderHook(() => useAuth());

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login({
          accountId: 'test-account',
          pin: '1234',
        });
      });

      expect(loginResult).toEqual({ success: true });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toMatchObject({
        id: 'test-user',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });
    });

    it('should handle failed login', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: 'Invalid credentials',
        }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const { result } = renderHook(() => useAuth());

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login({
          accountId: 'test-account',
          pin: 'wrong-pin',
        });
      });

      expect(loginResult).toEqual({ success: false, error: 'Invalid credentials' });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBe('Invalid credentials');
    });

    it('should handle logout', async () => {
      // First login
      const loginResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          user: { id: 'test-user', email: 'test@example.com', role: 'user', isDemo: false },
        }),
      };

      mockFetch.mockResolvedValueOnce(loginResponse as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login({
          accountId: 'test-account',
          pin: '1234',
        });
      });

      // Now logout
      const logoutResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      };

      mockFetch.mockResolvedValueOnce(logoutResponse as any);

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('current-user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('demo-auth');
    });
  });

  describe('Session Management', () => {
    it('should restore session from localStorage', async () => {
      const mockUserSession = JSON.stringify({
        id: 'stored-user',
        name: 'Stored User',
        loginTime: new Date().toISOString(),
        isDemo: false,
      });

      mockLocalStorage.getItem.mockReturnValue(mockUserSession);

      const authResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          authenticated: true,
          user: {
            id: 'stored-user',
            email: 'stored@example.com',
            role: 'user',
            isDemo: false,
          },
        }),
      };

      mockFetch.mockResolvedValueOnce(authResponse as any);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.id).toBe('stored-user');
    });

    it('should clear expired session', async () => {
      const expiredSession = JSON.stringify({
        id: 'expired-user',
        name: 'Expired User',
        loginTime: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
        isDemo: false,
      });

      mockLocalStorage.getItem.mockReturnValue(expiredSession);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('current-user');
    });

    it('should handle session refresh', async () => {
      mockLocalStorage.getItem.mockReturnValue('refresh-token-123');

      const refreshResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      };

      mockFetch.mockResolvedValueOnce(refreshResponse as any);

      const { result } = renderHook(() => useAuth());

      let refreshResult;
      await act(async () => {
        refreshResult = await result.current.refreshSession();
      });

      expect(refreshResult).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/refresh', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'refresh-token-123' }),
      }));
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during login', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth());

      let loginResult;
      await act(async () => {
        loginResult = await result.current.login({
          accountId: 'test-account',
          pin: '1234',
        });
      });

      expect(loginResult).toEqual({ success: false, error: 'Network error' });
      expect(result.current.error).toContain('Network error');
    });

    it('should handle invalid JSON responses', async () => {
      const invalidResponse = {
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      };

      mockFetch.mockResolvedValueOnce(invalidResponse as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login({
          accountId: 'test-account',
          pin: '1234',
        });
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should clear error when requested', async () => {
      // First set an error
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login({
          accountId: 'test-account',
          pin: 'wrong',
        });
      });

      expect(result.current.error).toBeTruthy();

      // Now clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Security Features', () => {
    it('should include device fingerprinting in login request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, user: {} }),
      } as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login({
          accountId: 'test-account',
          pin: '1234',
        });
      });

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1]?.body as string);

      expect(requestBody.deviceInfo.fingerprint).toBeDefined();
      expect(typeof requestBody.deviceInfo.fingerprint).toBe('string');
    });

    it('should handle account lockout', async () => {
      const lockoutResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: 'Account locked',
          lockoutUntil: Date.now() + 15 * 60 * 1000, // 15 minutes
          attemptsRemaining: 0,
        }),
      };

      mockFetch.mockResolvedValueOnce(lockoutResponse as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login({
          accountId: 'test-account',
          pin: 'wrong',
        });
      });

      expect(result.current.lockoutUntil).toBeDefined();
      expect(result.current.attemptsRemaining).toBe(0);
      expect(result.current.error).toBe('Account locked');
    });
  });

  describe('Performance', () => {
    it('should complete login within reasonable time', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, user: {} }),
      } as any);

      const { result } = renderHook(() => useAuth());

      const startTime = performance.now();

      await act(async () => {
        await result.current.login({
          accountId: 'test-account',
          pin: '1234',
        });
      });

      const loginTime = performance.now() - startTime;
      expect(loginTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should not cause memory leaks on unmount', () => {
      const { unmount } = renderHook(() => useAuth());

      expect(() => unmount()).not.toThrow();
    });
  });
});