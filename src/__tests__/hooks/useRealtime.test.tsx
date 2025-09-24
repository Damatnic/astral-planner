import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useRealtime } from '@/features/collaboration/hooks/useRealtime'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock Pusher
const mockChannel = {
  bind: jest.fn(),
  unbind: jest.fn(),
  unbind_all: jest.fn(),
  trigger: jest.fn(),
}

const mockPusher = {
  subscribe: jest.fn(() => mockChannel),
  unsubscribe: jest.fn(),
  disconnect: jest.fn(),
}

jest.mock('@/lib/realtime/pusher-client', () => ({
  getPusherClient: () => mockPusher,
}))

// Mock fetch
global.fetch = jest.fn()

const createWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useRealtime', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(
      () => useRealtime({ workspaceId: 'test-workspace' }),
      { wrapper: createWrapper }
    )

    expect(result.current.isConnected).toBe(false)
    expect(result.current.collaborators).toEqual([])
    expect(result.current.onlineCount).toBe(0)
    expect(result.current.notifications).toEqual([])
  })

  it('should subscribe to workspace channel on mount', () => {
    renderHook(
      () => useRealtime({ workspaceId: 'test-workspace' }),
      { wrapper: createWrapper }
    )

    expect(mockPusher.subscribe).toHaveBeenCalledWith('presence-workspace-test-workspace')
  })

  it('should handle successful connection', async () => {
    const { result } = renderHook(
      () => useRealtime({ workspaceId: 'test-workspace' }),
      { wrapper: createWrapper }
    )

    // Simulate successful subscription
    const subscriptionSuccessHandler = mockChannel.bind.mock.calls.find(
      call => call[0] === 'pusher:subscription_succeeded'
    )?.[1]

    if (subscriptionSuccessHandler) {
      act(() => {
        subscriptionSuccessHandler({
          members: {
            'user-1': {
              name: 'John Doe',
              email: 'john@example.com',
              color: '#ff0000',
            },
            'user-2': {
              name: 'Jane Smith',
              email: 'jane@example.com',
              color: '#00ff00',
            },
          },
        })
      })
    }

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
      expect(result.current.onlineCount).toBe(2)
      expect(result.current.collaborators).toHaveLength(2)
    })
  })

  it('should handle connection errors', async () => {
    const { result } = renderHook(
      () => useRealtime({ workspaceId: 'test-workspace' }),
      { wrapper: createWrapper }
    )

    // Simulate connection error
    const errorHandler = mockChannel.bind.mock.calls.find(
      call => call[0] === 'pusher:subscription_error'
    )?.[1]

    if (errorHandler) {
      act(() => {
        errorHandler({ message: 'Connection failed' })
      })
    }

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false)
      expect(result.current.connectionError).toBe('Connection failed')
    })
  })

  it('should handle member added events', async () => {
    const { result } = renderHook(
      () => useRealtime({ workspaceId: 'test-workspace' }),
      { wrapper: createWrapper }
    )

    // First establish connection
    const subscriptionSuccessHandler = mockChannel.bind.mock.calls.find(
      call => call[0] === 'pusher:subscription_succeeded'
    )?.[1]

    act(() => {
      subscriptionSuccessHandler?.({ members: {} })
    })

    // Then add a member
    const memberAddedHandler = mockChannel.bind.mock.calls.find(
      call => call[0] === 'pusher:member_added'
    )?.[1]

    if (memberAddedHandler) {
      act(() => {
        memberAddedHandler({
          id: 'user-3',
          info: {
            name: 'New User',
            email: 'newuser@example.com',
            color: '#0000ff',
          },
        })
      })
    }

    await waitFor(() => {
      expect(result.current.collaborators).toHaveLength(1)
      expect(result.current.collaborators[0].name).toBe('New User')
    })
  })

  it('should handle member removed events', async () => {
    const { result } = renderHook(
      () => useRealtime({ workspaceId: 'test-workspace' }),
      { wrapper: createWrapper }
    )

    // Setup initial members
    const subscriptionSuccessHandler = mockChannel.bind.mock.calls.find(
      call => call[0] === 'pusher:subscription_succeeded'
    )?.[1]

    act(() => {
      subscriptionSuccessHandler?.({
        members: {
          'user-1': { name: 'User 1', email: 'user1@example.com', color: '#ff0000' },
          'user-2': { name: 'User 2', email: 'user2@example.com', color: '#00ff00' },
        },
      })
    })

    // Remove a member
    const memberRemovedHandler = mockChannel.bind.mock.calls.find(
      call => call[0] === 'pusher:member_removed'
    )?.[1]

    if (memberRemovedHandler) {
      act(() => {
        memberRemovedHandler({
          id: 'user-1',
          info: { name: 'User 1' },
        })
      })
    }

    await waitFor(() => {
      expect(result.current.collaborators).toHaveLength(1)
      expect(result.current.collaborators[0].name).toBe('User 2')
    })
  })

  it('should broadcast events correctly', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    const { result } = renderHook(
      () => useRealtime({ workspaceId: 'test-workspace' }),
      { wrapper: createWrapper }
    )

    // Establish connection first
    const subscriptionSuccessHandler = mockChannel.bind.mock.calls.find(
      call => call[0] === 'pusher:subscription_succeeded'
    )?.[1]

    act(() => {
      subscriptionSuccessHandler?.({ members: {} })
    })

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    // Test broadcast
    await act(async () => {
      await result.current.broadcast('test-event', { message: 'Hello' })
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/pusher/trigger?action=broadcast',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'test-workspace',
          event: 'test-event',
          data: { message: 'Hello' },
        }),
      })
    )
  })

  it('should handle cursor position updates', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    const { result } = renderHook(
      () => useRealtime({ workspaceId: 'test-workspace' }),
      { wrapper: createWrapper }
    )

    // Establish connection
    const subscriptionSuccessHandler = mockChannel.bind.mock.calls.find(
      call => call[0] === 'pusher:subscription_succeeded'
    )?.[1]

    act(() => {
      subscriptionSuccessHandler?.({ members: {} })
    })

    await act(async () => {
      await result.current.sendCursorPosition(100, 200, 'document-1')
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/pusher/trigger?action=cursor',
      expect.objectContaining({
        body: JSON.stringify({
          workspaceId: 'test-workspace',
          documentId: 'document-1',
          cursor: { x: 100, y: 200 },
        }),
      })
    )
  })

  it('should handle typing indicators with debouncing', async () => {
    jest.useFakeTimers()
    
    const { result } = renderHook(
      () => useRealtime({ workspaceId: 'test-workspace' }),
      { wrapper: createWrapper }
    )

    // Setup initial connection and add a user
    const subscriptionSuccessHandler = mockChannel.bind.mock.calls.find(
      call => call[0] === 'pusher:subscription_succeeded'
    )?.[1]

    act(() => {
      subscriptionSuccessHandler?.({
        members: {
          'user-1': { name: 'User 1', email: 'user1@example.com', color: '#ff0000' },
        },
      })
    })

    // Simulate user typing event
    const userTypingHandler = mockChannel.bind.mock.calls.find(
      call => call[0] === 'user-typing'
    )?.[1]

    if (userTypingHandler) {
      act(() => {
        userTypingHandler({
          userId: 'user-1',
          data: { isTyping: true },
          timestamp: Date.now(),
        })
      })
    }

    await waitFor(() => {
      expect(result.current.collaborators[0].isTyping).toBe(true)
    })

    // Fast-forward timers to trigger debounce
    act(() => {
      jest.advanceTimersByTime(3000)
    })

    await waitFor(() => {
      expect(result.current.collaborators[0].isTyping).toBe(false)
    })

    jest.useRealTimers()
  })

  it('should clean up on unmount', () => {
    const { unmount } = renderHook(
      () => useRealtime({ workspaceId: 'test-workspace' }),
      { wrapper: createWrapper }
    )

    unmount()

    expect(mockChannel.unbind_all).toHaveBeenCalled()
    expect(mockPusher.unsubscribe).toHaveBeenCalledWith('presence-workspace-test-workspace')
  })

  it('should handle disabled features correctly', () => {
    renderHook(
      () => useRealtime({
        workspaceId: 'test-workspace',
        enablePresence: false,
        enableNotifications: false,
        enableCollaboration: false,
      }),
      { wrapper: createWrapper }
    )

    // Should still subscribe to main channel but not bind collaboration events
    expect(mockPusher.subscribe).toHaveBeenCalledWith('presence-workspace-test-workspace')
    
    // Check that collaboration events are not bound when disabled
    const boundEvents = mockChannel.bind.mock.calls.map(call => call[0])
    expect(boundEvents).not.toContain('cursor-moved')
    expect(boundEvents).not.toContain('selection-changed')
    expect(boundEvents).not.toContain('user-typing')
  })
})