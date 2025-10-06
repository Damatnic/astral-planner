/**
 * Revolutionary Authentication Hook
 * Zero-trust client-side authentication with comprehensive security
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Logger as authLogger } from '@/lib/logger/edge';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  imageUrl?: string;
  role: 'admin' | 'user' | 'premium';
  isDemo: boolean;
  sessionId?: string;
  settings?: any;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
}

export interface LoginCredentials {
  accountId: string;
  pin: string;
  deviceInfo?: {
    fingerprint?: string;
  };
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  lockoutUntil?: number;
  attemptsRemaining?: number;
}

export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  clearError: () => void;
}

export type UseAuthReturn = AuthState & AuthActions;

// Session refresh interval (14 minutes - before 15 minute token expiry)
const SESSION_REFRESH_INTERVAL = 14 * 60 * 1000;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Generate device fingerprint
 */
function generateDeviceFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  } catch (error) {
    // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.warn('Failed to generate device fingerprint:', error);
    return 'unknown-device';
  }
}

/**
 * Make authenticated API request with retry logic
 */
async function makeAuthRequest(
  url: string, 
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // If token expired, try to refresh once
    if (response.status === 401 && retries > 0) {
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: localStorage.getItem('refresh_token')
        })
      });

      if (refreshResponse.ok) {
        // Retry original request
        return makeAuthRequest(url, options, retries - 1);
      }
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return makeAuthRequest(url, options, retries - 1);
    }
    throw error;
  }
}

/**
 * Revolutionary authentication hook
 */
export function useAuth(): UseAuthReturn {
  // Initialize with hydration-safe defaults to prevent server/client mismatch
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });
  const [isHydrated, setIsHydrated] = useState(false);

  const router = useRouter();
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  /**
   * Update state safely
   */
  const updateState = useCallback((updates: Partial<AuthState>) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  /**
   * Clear authentication state
   */
  const clearAuthState = useCallback(() => {
    updateState({
      user: null,
      isAuthenticated: false,
      error: null,
      lockoutUntil: undefined,
      attemptsRemaining: undefined
    });

    // Clear local storage
    localStorage.removeItem('current-user');
    localStorage.removeItem('demo-auth');
    localStorage.removeItem('refresh_token');

    // Clear session timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
  }, [updateState]);

  /**
   * Schedule session refresh
   */
  const scheduleRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        const success = await refreshSession();
        if (success) {
          scheduleRefresh(); // Schedule next refresh
        }
      } catch (error) {
        // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.warn('Scheduled session refresh failed:', error);
      }
    }, SESSION_REFRESH_INTERVAL);
  }, []);

  /**
   * Login function with comprehensive security
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      updateState({ loading: true, error: null });

      const loginData = {
        ...credentials,
        deviceInfo: {
          fingerprint: generateDeviceFingerprint(),
          ...credentials.deviceInfo
        }
      };

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        updateState({
          loading: false,
          error: data.error,
          lockoutUntil: data.lockoutUntil,
          attemptsRemaining: data.attemptsRemaining
        });
        return { success: false, error: data.error };
      }

      if (data.success && data.user) {
        // Store refresh token securely
        if (data.tokens?.refreshToken) {
          localStorage.setItem('refresh_token', data.tokens.refreshToken);
        }

        // Store user session for client-side state
        const userSession = {
          id: data.user.id,
          name: data.user.firstName ? `${data.user.firstName} ${data.user.lastName || ''}`.trim() : data.user.username,
          displayName: data.user.firstName || data.user.username,
          avatar: data.user.imageUrl || (data.user.isDemo ? '🎯' : '👤'),
          theme: data.user.isDemo ? 'green' : 'blue',
          loginTime: new Date().toISOString(),
          isDemo: data.user.isDemo
        };

        localStorage.setItem('current-user', JSON.stringify(userSession));

        if (data.user.isDemo) {
          localStorage.setItem('demo-auth', 'true');
        }

        updateState({
          user: data.user,
          isAuthenticated: true,
          loading: false,
          error: null,
          lockoutUntil: undefined,
          attemptsRemaining: undefined
        });

        // Schedule automatic token refresh
        scheduleRefresh();

        return { success: true };
      }

      updateState({ loading: false, error: 'Login failed' });
      return { success: false, error: 'Login failed' };

    } catch (error) {
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Login error:', error);
      updateState({ 
        loading: false, 
        error: 'Network error. Please check your connection and try again.' 
      });
      return { success: false, error: 'Network error' };
    }
  }, [updateState, scheduleRefresh]);

  /**
   * Logout function with secure cleanup
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      updateState({ loading: true });

      // Call logout API
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error) {
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local state regardless of API success
      clearAuthState();
      updateState({ loading: false });
      
      // Redirect to login
      router.push('/login');
    }
  }, [updateState, clearAuthState, router]);

  /**
   * Refresh session
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        return false;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        authLogger.info('Session refreshed successfully');
        return true;
      }

      if (response.status === 401) {
        // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.warn('Refresh token expired, redirecting to login');
        clearAuthState();
        router.push('/login');
      }

      return false;
    } catch (error) {
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Session refresh failed:', error);
      return false;
    }
  }, [clearAuthState, router]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  /**
   * Check authentication status on mount - hydration-safe
   */
  useEffect(() => {
    let mounted = true;

    const checkAuthStatus = async () => {
      try {
        // Mark as hydrated to ensure consistent state
        setIsHydrated(true);
        
        // Only check localStorage on client side
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('current-user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            
            // Verify session is still valid (within 24 hours)
            const loginTime = new Date(userData.loginTime);
            const now = new Date();
            const timeDiff = now.getTime() - loginTime.getTime();
            const hoursDiff = timeDiff / (1000 * 3600);
            
            if (hoursDiff >= 24) {
              // Session expired
              clearAuthState();
              if (mounted) updateState({ loading: false });
              return;
            }

            // Verify with server
            const response = await makeAuthRequest('/api/auth/me');
            
            if (response.ok) {
              const data = await response.json();
              if (data.authenticated && data.user) {
                if (mounted) {
                  updateState({
                    user: data.user,
                    isAuthenticated: true,
                    loading: false,
                    error: null
                  });
                  scheduleRefresh();
                }
                return;
              }
            }
          }
        }

        // No valid session
        clearAuthState();
        if (mounted) updateState({ loading: false });

      } catch (error) {
        authLogger.warn('Auth status check failed', error as Error);
        clearAuthState();
        if (mounted) updateState({ loading: false });
      }
    };

    checkAuthStatus();

    return () => {
      mounted = false;
    };
  }, [updateState, clearAuthState, scheduleRefresh]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    // Override isAuthenticated to be hydration-safe
    isAuthenticated: isHydrated ? state.isAuthenticated : false,
    login,
    logout,
    refreshSession,
    clearError,
  };
}