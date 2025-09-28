/**
 * Test utilities for React Testing Library
 * Provides custom render function and common test helpers
 */
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from 'next-themes';

// Mock providers for testing
interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Updated from cacheTime to gcTime for TanStack Query v5
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey="pk_test_test">
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
        </ThemeProvider>
      </ClerkProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Common test data
export const mockUser = {
  id: 'test-user-123',
  firstName: 'Test',
  lastName: 'User',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
  imageUrl: '/test-avatar.png',
};

export const mockTask = {
  id: '1',
  title: 'Test Task',
  description: 'Test Description',
  completed: false,
  priority: 'medium' as const,
  dueDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockHabit = {
  id: '1',
  name: 'Test Habit',
  description: 'Test habit description',
  frequency: 'daily' as const,
  streak: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockGoal = {
  id: '1',
  title: 'Test Goal',
  description: 'Test goal description',
  targetDate: new Date(),
  progress: 50,
  status: 'active' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Test helpers
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

export const createMockApiResponse = <T,>(data: T, status = 200) => ({
  ok: status < 400,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
});

export const setupFetchMock = () => {
  global.fetch = jest.fn();
  return global.fetch as jest.MockedFunction<typeof fetch>;
};

export const mockLocalStorage = () => {
  const mockStorage: Record<string, string> = {};
  
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((key: string) => mockStorage[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: jest.fn(() => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
      }),
    },
    writable: true,
  });
  
  return mockStorage;
};

export const mockSessionStorage = () => {
  const mockStorage: Record<string, string> = {};
  
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: jest.fn((key: string) => mockStorage[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: jest.fn(() => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
      }),
    },
    writable: true,
  });
  
  return mockStorage;
};

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now();
  renderFn();
  await waitForLoadingToFinish();
  const end = performance.now();
  return end - start;
};

// Accessibility testing utilities
export const checkAccessibility = async (container: HTMLElement) => {
  // Note: This is a placeholder - actual accessibility testing will be done with Playwright
  // The axe-core testing is properly handled in the e2e test suite
  return Promise.resolve({ violations: [] });
};