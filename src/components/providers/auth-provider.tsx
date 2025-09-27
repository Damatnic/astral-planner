'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { AuthUser } from '@/hooks/use-auth';

interface User {
  id: string;
  name: string;
  displayName: string;
  avatar?: string;
  theme: string;
  loginTime: string;
  isDemo?: boolean;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  refreshSession: () => Promise<boolean>;
  sessionValid: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/'];

// Session refresh interval (14 minutes)
const SESSION_REFRESH_INTERVAL = 14 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const isAuthenticated = !!user && sessionValid;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  /**
   * Clear authentication state securely
   */
  const clearAuthState = useCallback(() => {
    if (!mountedRef.current) return;
    
    setUser(null);
    setSessionValid(false);
    
    // Clear local storage
    localStorage.removeItem('current-user');
    localStorage.removeItem('demo-auth');
    localStorage.removeItem('refresh_token');
    
    // Clear all user-specific data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('preferences-') || key.startsWith('data-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear refresh timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = undefined;
    }
  }, []);

  /**
   * Schedule automatic session refresh
   */
  const scheduleRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      
      try {
        const success = await refreshSession();
        if (success) {
          scheduleRefresh(); // Schedule next refresh
        }
      } catch (error) {
        console.warn('Scheduled session refresh failed:', error);
      }
    }, SESSION_REFRESH_INTERVAL);
  }, []);

  /**
   * Refresh session with server
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
        console.log('Session refreshed successfully');
        setSessionValid(true);
        return true;
      }

      if (response.status === 401) {
        console.warn('Refresh token expired');
        clearAuthState();
        if (!isPublicRoute) {
          router.push('/login');
        }
      }

      return false;
    } catch (error) {
      console.error('Session refresh failed:', error);
      setSessionValid(false);
      return false;
    }
  }, [clearAuthState, isPublicRoute, router]);

  /**
   * Verify session with server
   */
  const verifySession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          // Update user data from server
          const enhancedUser: User = {
            id: data.user.id,
            name: data.user.firstName ? `${data.user.firstName} ${data.user.lastName || ''}`.trim() : data.user.username,
            displayName: data.user.firstName || data.user.username,
            avatar: data.user.imageUrl || (data.user.isDemo ? '🎯' : '👤'),
            theme: data.user.isDemo ? 'green' : 'blue',
            loginTime: new Date().toISOString(),
            isDemo: data.user.isDemo,
            role: data.user.role
          };

          setUser(enhancedUser);
          setSessionValid(true);
          
          // Update local storage
          localStorage.setItem('current-user', JSON.stringify(enhancedUser));
          
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Session verification failed:', error);
      return false;
    }
  }, []);

  /**
   * Check authentication status on mount and route changes
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for existing session
        const storedUser = localStorage.getItem('current-user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          // Verify session is still valid (within 24 hours)
          const loginTime = new Date(userData.loginTime);
          const now = new Date();
          const timeDiff = now.getTime() - loginTime.getTime();
          const hoursDiff = timeDiff / (1000 * 3600);
          
          if (hoursDiff >= 24) {
            // Local session expired
            clearAuthState();
            if (!isPublicRoute) {
              router.push('/login');
            }
            return;
          }

          // Set local user data first
          setUser(userData);
          
          // Then verify with server
          const verified = await verifySession();
          if (verified) {
            scheduleRefresh();
          } else {
            // Server session invalid
            clearAuthState();
            if (!isPublicRoute) {
              router.push('/login');
            }
          }
        } else if (!isPublicRoute) {
          // No session and trying to access protected route
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        clearAuthState();
        if (!isPublicRoute) {
          router.push('/login');
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    checkAuth();
  }, [router, pathname, isPublicRoute, clearAuthState, verifySession, scheduleRefresh]);

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (isAuthenticated && pathname === '/login') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, pathname, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Login function (legacy compatibility)
   */
  const login = useCallback((userData: User) => {
    const userWithLoginTime = {
      ...userData,
      loginTime: new Date().toISOString()
    };
    
    setUser(userWithLoginTime);
    setSessionValid(true);
    localStorage.setItem('current-user', JSON.stringify(userWithLoginTime));
    
    // Schedule refresh for this session
    scheduleRefresh();
  }, [scheduleRefresh]);

  /**
   * Sign out function with secure cleanup
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Call logout API
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local state regardless of API success
      clearAuthState();
      setLoading(false);
      
      // Redirect to login
      router.push('/login');
    }
  }, [clearAuthState, router]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      signOut, 
      isAuthenticated, 
      refreshSession,
      sessionValid 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}