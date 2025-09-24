import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider } from '@clerk/nextjs'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <ClerkProvider publishableKey="pk_test_test">
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ClerkProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) =>
  render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Jest requires at least one test in test files
describe('test-utils', () => {
  it('exports render function', () => {
    expect(customRender).toBeDefined()
  })
})

// Mock data generators
export const mockUser = {
  id: 'test-user-id',
  firstName: 'Test',
  lastName: 'User',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
}

export const mockTask = {
  id: 'task-1',
  title: 'Test Task',
  description: 'Test task description',
  type: 'task' as const,
  status: 'todo' as const,
  priority: 'medium' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  createdBy: 'test-user-id',
  workspaceId: 'workspace-1',
}

export const mockGoal = {
  id: 'goal-1',
  title: 'Test Goal',
  description: 'Test goal description',
  category: 'personal',
  targetValue: 100,
  currentValue: 50,
  unit: 'points',
  deadline: new Date('2024-12-31'),
  status: 'active' as const,
  priority: 'high' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  createdBy: 'test-user-id',
  workspaceId: 'workspace-1',
}

export const mockHabit = {
  id: 'habit-1',
  title: 'Test Habit',
  description: 'Test habit description',
  frequency: 'daily' as const,
  targetValue: 1,
  category: 'health',
  status: 'active' as const,
  currentStreak: 5,
  longestStreak: 10,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  createdBy: 'test-user-id',
  workspaceId: 'workspace-1',
}

export const mockTemplate = {
  id: 'template-1',
  title: 'Test Template',
  description: 'Test template description',
  category: 'productivity',
  type: 'template' as const,
  content: { tasks: [], goals: [], habits: [] },
  tags: ['test', 'template'],
  isPublic: true,
  downloads: 42,
  rating: 4.5,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  createdBy: 'test-user-id',
}

// API response mocks
export const mockApiResponse = <T,>(data: T, success = true) => ({
  data,
  success,
  message: success ? 'Success' : 'Error',
})

export const mockApiError = (message: string, status = 500) => ({
  success: false,
  error: message,
  status,
})

// Query mocks
export const createMockQuery = <T,>(data: T, isLoading = false, error = null) => ({
  data,
  isLoading,
  error,
  isError: !!error,
  isSuccess: !isLoading && !error,
  refetch: jest.fn(),
  fetchStatus: isLoading ? 'fetching' : 'idle',
  status: error ? 'error' : isLoading ? 'pending' : 'success',
})

export const createMockMutation = <T,>(
  isLoading = false,
  error = null,
  onMutate?: () => void
) => ({
  mutate: jest.fn(onMutate),
  mutateAsync: jest.fn(),
  isLoading,
  isPending: isLoading,
  error,
  isError: !!error,
  isSuccess: !isLoading && !error,
  data: null as T | null,
  reset: jest.fn(),
})

// Event helpers
export const createMockEvent = (overrides = {}) => ({
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  target: { value: '' },
  currentTarget: { value: '' },
  ...overrides,
})

// Storage mocks
export const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Async helpers
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0))

// Custom matchers
expect.extend({
  toHaveBeenCalledWithUser(received, userId) {
    const pass = received.mock.calls.some(call => 
      call.some(arg => 
        typeof arg === 'object' && arg !== null && arg.userId === userId
      )
    )
    
    return {
      message: () => 
        `expected ${received} ${pass ? 'not ' : ''}to have been called with user ID ${userId}`,
      pass,
    }
  },
})

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveBeenCalledWithUser(userId: string): R
    }
  }
}