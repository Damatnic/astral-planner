/**
 * Comprehensive unit tests for AuthProvider
 * Testing React context, session management, and authentication flows
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '../auth-provider';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn()
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Test component that uses auth context
const TestComponent = () => {
  const { user, loading, login, signOut, isAuthenticated } = useAuth();

  const handleLogin = () => {
    login({
      id: 'test-user',
      name: 'Test User',
      displayName: 'Test User',
      avatar: '/avatar.png',
      theme: 'dark',
      loginTime: new Date().toISOString()
    });
  };

  return (
    <div>
      {loading && <div data-testid="loading">Loading...</div>}
      {isAuthenticated ? (
        <div>
          <div data-testid="user-name">{user?.name}</div>
          <div data-testid="user-id">{user?.id}</div>
          <button data-testid="signout-btn" onClick={signOut}>
            Sign Out
          </button>
        </div>
      ) : (
        <div>
          <div data-testid="not-authenticated">Not Authenticated</div>
          <button data-testid="login-btn" onClick={handleLogin}>
            Login
          </button>
        </div>
      )}
    </div>
  );
};

const renderWithAuth = (pathname = '/dashboard') => {
  const mockPush = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  (usePathname as jest.Mock).mockReturnValue(pathname);

  const result = render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );

  return { ...result, mockPush };
};

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should show loading initially', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      renderWithAuth();

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should load user from localStorage when valid', async () => {
      const userData = {
        id: 'stored-user',
        name: 'Stored User',
        displayName: 'Stored User',
        theme: 'light',
        loginTime: new Date().toISOString()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userData));
      
      const { mockPush } = renderWithAuth();

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('user-name')).toHaveTextContent('Stored User');
      expect(screen.getByTestId('user-id')).toHaveTextContent('stored-user');
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should clear expired session and redirect to login', async () => {
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 25); // 25 hours ago

      const expiredUserData = {
        id: 'expired-user',
        name: 'Expired User',
        displayName: 'Expired User',
        theme: 'light',
        loginTime: expiredDate.toISOString()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredUserData));
      
      const { mockPush } = renderWithAuth('/dashboard');

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('current-user');
      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(screen.getByTestId('not-authenticated')).toBeInTheDocument();
    });

    it('should handle corrupted localStorage data', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      
      const { mockPush } = renderWithAuth('/dashboard');

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('current-user');
      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(screen.getByTestId('not-authenticated')).toBeInTheDocument();
    });

    it('should redirect to login when no session on protected route', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const { mockPush } = renderWithAuth('/dashboard');

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(screen.getByTestId('not-authenticated')).toBeInTheDocument();
    });

    it('should not redirect on public routes', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const { mockPush } = renderWithAuth('/');

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByTestId('not-authenticated')).toBeInTheDocument();
    });
  });

  describe('Public Routes Handling', () => {
    const publicRoutes = ['/', '/login'];

    publicRoutes.forEach(route => {
      it(`should allow access to public route ${route} without authentication`, async () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        
        const { mockPush } = renderWithAuth(route);

        await waitFor(() => {
          expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        });

        expect(mockPush).not.toHaveBeenCalled();
        expect(screen.getByTestId('not-authenticated')).toBeInTheDocument();
      });
    });
  });

  describe('Authentication Redirects', () => {
    it('should redirect authenticated user away from login page', async () => {
      const userData = {
        id: 'auth-user',
        name: 'Auth User',
        displayName: 'Auth User',
        theme: 'dark',
        loginTime: new Date().toISOString()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userData));
      
      const { mockPush } = renderWithAuth('/login');

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should not redirect authenticated user on other pages', async () => {
      const userData = {
        id: 'auth-user',
        name: 'Auth User',
        displayName: 'Auth User',
        theme: 'dark',
        loginTime: new Date().toISOString()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userData));
      
      const { mockPush } = renderWithAuth('/dashboard');

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByTestId('user-name')).toHaveTextContent('Auth User');
    });
  });

  describe('Login Function', () => {
    it('should log in user and store in localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      renderWithAuth('/');

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      const loginBtn = screen.getByTestId('login-btn');
      
      act(() => {
        fireEvent.click(loginBtn);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'current-user',
        expect.stringContaining('"id":"test-user"')
      );

      // Verify the stored data includes loginTime
      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      expect(storedData.loginTime).toBeDefined();
      expect(new Date(storedData.loginTime).getTime()).toBeCloseTo(Date.now(), -2);
    });

    it('should preserve all user data during login', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      renderWithAuth('/');

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      const complexUserData = {
        id: 'complex-user',
        name: 'Complex User',
        displayName: 'Dr. Complex User PhD',
        avatar: 'https://example.com/avatar.jpg',
        theme: 'system',
        customField: 'custom-value'
      };

      const TestComplexLogin = () => {
        const { login } = useAuth();
        return (
          <button 
            data-testid="complex-login-btn" 
            onClick={() => login(complexUserData as any)}
          >
            Complex Login
          </button>
        );
      };

      const { rerender } = renderWithAuth('/');
      rerender(
        <AuthProvider>
          <TestComplexLogin />
        </AuthProvider>
      );

      const loginBtn = screen.getByTestId('complex-login-btn');
      
      act(() => {
        fireEvent.click(loginBtn);
      });

      // Verify all data is stored
      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      
      expect(storedData).toMatchObject({
        id: 'complex-user',
        name: 'Complex User',
        displayName: 'Dr. Complex User PhD',
        avatar: 'https://example.com/avatar.jpg',
        theme: 'system',
        customField: 'custom-value',
        loginTime: expect.any(String)
      });
    });
  });

  describe('SignOut Function', () => {
    it('should sign out user and clear localStorage', async () => {
      const userData = {
        id: 'signout-user',
        name: 'Signout User',
        displayName: 'Signout User',
        theme: 'dark',
        loginTime: new Date().toISOString()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userData));
      
      const { mockPush } = renderWithAuth('/dashboard');

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('user-name')).toHaveTextContent('Signout User');

      const signoutBtn = screen.getByTestId('signout-btn');
      
      act(() => {
        fireEvent.click(signoutBtn);
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('current-user');
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should clear user-specific data on signout', async () => {
      const userData = {
        id: 'cleanup-user',
        name: 'Cleanup User',
        displayName: 'Cleanup User',
        theme: 'light',
        loginTime: new Date().toISOString()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userData));

      // Mock Object.keys to simulate user-specific data
      const mockKeys = jest.fn().mockReturnValue([
        'current-user',
        'preferences-user-123',
        'data-user-settings',
        'random-key',
        'preferences-another-user',
        'data-cache'
      ]);
      Object.keys = mockKeys;
      
      const { mockPush } = renderWithAuth('/dashboard');

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      const signoutBtn = screen.getByTestId('signout-btn');
      
      act(() => {
        fireEvent.click(signoutBtn);
      });

      // Should remove current-user and user-specific data
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('current-user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('preferences-user-123');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('data-user-settings');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('preferences-another-user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('data-cache');

      // Should not remove random keys
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('random-key');

      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('Session Expiry', () => {
    it('should handle session within 24 hours', async () => {
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 12); // 12 hours ago

      const userData = {
        id: 'recent-user',
        name: 'Recent User',
        displayName: 'Recent User',
        theme: 'light',
        loginTime: recentDate.toISOString()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userData));
      
      const { mockPush } = renderWithAuth('/dashboard');

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByTestId('user-name')).toHaveTextContent('Recent User');
    });

    it('should handle edge case of exactly 24 hours', async () => {
      const exactDate = new Date();
      exactDate.setHours(exactDate.getHours() - 24); // Exactly 24 hours ago

      const userData = {
        id: 'edge-user',
        name: 'Edge User',
        displayName: 'Edge User',
        theme: 'light',
        loginTime: exactDate.toISOString()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userData));
      
      const { mockPush } = renderWithAuth('/dashboard');

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Should expire (>= 24 hours)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('current-user');
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should handle future login times gracefully', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1); // 1 hour in future

      const userData = {
        id: 'future-user',
        name: 'Future User',
        displayName: 'Future User',
        theme: 'light',
        loginTime: futureDate.toISOString()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userData));
      
      const { mockPush } = renderWithAuth('/dashboard');

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Should accept future times (clock skew tolerance)
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByTestId('user-name')).toHaveTextContent('Future User');
    });

    it('should handle invalid date formats', async () => {
      const userData = {
        id: 'invalid-date-user',
        name: 'Invalid Date User',
        displayName: 'Invalid Date User',
        theme: 'light',
        loginTime: 'invalid-date'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userData));
      
      const { mockPush } = renderWithAuth('/dashboard');

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Should clear invalid session
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('current-user');
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('Context Hook', () => {
    it('should throw error when used outside provider', () => {
      const TestWithoutProvider = () => {
        useAuth(); // This should throw
        return <div>Test</div>;
      };

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestWithoutProvider />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should provide correct context values', async () => {
      const userData = {
        id: 'context-user',
        name: 'Context User',
        displayName: 'Context User',
        theme: 'dark',
        loginTime: new Date().toISOString()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userData));

      const TestContextValues = () => {
        const auth = useAuth();
        
        return (
          <div>
            <div data-testid="is-authenticated">{auth.isAuthenticated.toString()}</div>
            <div data-testid="loading">{auth.loading.toString()}</div>
            <div data-testid="user-exists">{(!!auth.user).toString()}</div>
            <div data-testid="has-login">{(typeof auth.login === 'function').toString()}</div>
            <div data-testid="has-signout">{(typeof auth.signOut === 'function').toString()}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestContextValues />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('user-exists')).toHaveTextContent('true');
      expect(screen.getByTestId('has-login')).toHaveTextContent('true');
      expect(screen.getByTestId('has-signout')).toHaveTextContent('true');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage access errors', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });
      
      const { mockPush } = renderWithAuth('/dashboard');

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('current-user');
      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(screen.getByTestId('not-authenticated')).toBeInTheDocument();
    });

    it('should handle router errors gracefully', async () => {
      const mockPush = jest.fn().mockImplementation(() => {
        throw new Error('Router error');
      });
      (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
      (usePathname as jest.Mock).mockReturnValue('/dashboard');

      mockLocalStorage.getItem.mockReturnValue(null);

      // Should not crash the app
      expect(() => {
        renderWithAuth('/dashboard');
      }).not.toThrow();

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('Performance and Memory', () => {
    it('should not cause memory leaks with multiple mounts/unmounts', async () => {
      const userData = {
        id: 'memory-user',
        name: 'Memory User',
        displayName: 'Memory User',
        theme: 'light',
        loginTime: new Date().toISOString()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userData));

      // Mount and unmount multiple times
      for (let i = 0; i < 5; i++) {
        const { unmount } = renderWithAuth('/dashboard');
        
        await waitFor(() => {
          expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        });

        unmount();
      }

      // Should not accumulate side effects
      expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(5);
    });

    it('should handle rapid state changes', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const TestRapidChanges = () => {
        const { login, signOut, isAuthenticated } = useAuth();

        return (
          <div>
            <div data-testid="auth-status">{isAuthenticated.toString()}</div>
            <button 
              data-testid="rapid-login" 
              onClick={() => {
                // Rapid login/logout
                for (let i = 0; i < 10; i++) {
                  login({
                    id: `user-${i}`,
                    name: `User ${i}`,
                    displayName: `User ${i}`,
                    theme: 'dark',
                    loginTime: new Date().toISOString()
                  });
                  signOut();
                }
              }}
            >
              Rapid Changes
            </button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestRapidChanges />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('false');
      });

      const rapidBtn = screen.getByTestId('rapid-login');
      
      act(() => {
        fireEvent.click(rapidBtn);
      });

      // Should stabilize to final state (signed out)
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('false');
      });
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent login attempts', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const TestConcurrentLogin = () => {
        const { login, user } = useAuth();

        const handleConcurrentLogins = () => {
          // Simulate concurrent login attempts
          Promise.all([
            Promise.resolve(login({
              id: 'user-1',
              name: 'User 1',
              displayName: 'User 1',
              theme: 'dark',
              loginTime: new Date().toISOString()
            })),
            Promise.resolve(login({
              id: 'user-2',
              name: 'User 2',
              displayName: 'User 2',
              theme: 'light',
              loginTime: new Date().toISOString()
            }))
          ]);
        };

        return (
          <div>
            <div data-testid="final-user">{user?.name || 'None'}</div>
            <button data-testid="concurrent-login" onClick={handleConcurrentLogins}>
              Concurrent Login
            </button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestConcurrentLogin />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('final-user')).toHaveTextContent('None');
      });

      const concurrentBtn = screen.getByTestId('concurrent-login');
      
      act(() => {
        fireEvent.click(concurrentBtn);
      });

      // Should settle to one of the users (last one wins)
      await waitFor(() => {
        const finalUser = screen.getByTestId('final-user').textContent;
        expect(['User 1', 'User 2']).toContain(finalUser);
      });
    });
  });
});