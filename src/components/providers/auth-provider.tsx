'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  name: string;
  displayName: string;
  avatar?: string;
  theme: string;
  loginTime: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = !!user;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('current-user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          // Verify session is still valid (within 24 hours)
          const loginTime = new Date(userData.loginTime);
          const now = new Date();
          const timeDiff = now.getTime() - loginTime.getTime();
          const hoursDiff = timeDiff / (1000 * 3600);
          
          if (hoursDiff < 24) {
            setUser(userData);
          } else {
            // Session expired, clear storage
            localStorage.removeItem('current-user');
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
        localStorage.removeItem('current-user');
        if (!isPublicRoute) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname, isPublicRoute]);

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (isAuthenticated && pathname === '/login') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, pathname, router]);

  const login = (userData: User) => {
    const userWithLoginTime = {
      ...userData,
      loginTime: new Date().toISOString()
    };
    
    setUser(userWithLoginTime);
    localStorage.setItem('current-user', JSON.stringify(userWithLoginTime));
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('current-user');
    
    // Clear all user-specific data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('preferences-') || key.startsWith('data-')) {
        localStorage.removeItem(key);
      }
    });
    
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signOut, isAuthenticated }}>
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