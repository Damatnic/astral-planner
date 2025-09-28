'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getPusherClient, RealtimeEvent } from '@/lib/realtime/pusher-client';
import { toast } from 'sonner';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  cursor?: { x: number; y: number };
  selection?: { start: number; end: number };
  isTyping?: boolean;
  lastSeen: number;
}

export interface RealtimeOptions {
  workspaceId: string;
  enablePresence?: boolean;
  enableNotifications?: boolean;
  enableCollaboration?: boolean;
}

export function useRealtime(options: RealtimeOptions) {
  const { workspaceId, enablePresence = true, enableNotifications = true, enableCollaboration = true } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<Map<string, CollaborationUser>>(new Map());
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const pusherRef = useRef<any>(null);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!workspaceId) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    pusherRef.current = pusher;
    const channelName = `presence-workspace-${workspaceId}`;
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    // Connection events
    channel.bind('pusher:subscription_succeeded', (members: any) => {
      setIsConnected(true);
      setConnectionError(null);
      
      if (enablePresence) {
        const collaboratorsMap = new Map<string, CollaborationUser>();
        Object.keys(members.members).forEach(id => {
          const member = members.members[id];
          collaboratorsMap.set(id, {
            id,
            name: member.name || 'Anonymous',
            email: member.email || '',
            avatar: member.avatar,
            color: member.color || '#4285F4',
            lastSeen: Date.now(),
          });
        });
        setCollaborators(collaboratorsMap);
      }
    });

    channel.bind('pusher:subscription_error', (error: any) => {
      setIsConnected(false);
      setConnectionError(error.message || 'Failed to connect to real-time service');
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Pusher subscription error:', error);
    });

    channel.bind('pusher:member_added', (member: any) => {
      if (!enablePresence) return;
      
      setCollaborators(prev => {
        const newMap = new Map(prev);
        newMap.set(member.id, {
          id: member.id,
          name: member.info.name || 'Anonymous',
          email: member.info.email || '',
          avatar: member.info.avatar,
          color: member.info.color || '#4285F4',
          lastSeen: Date.now(),
        });
        return newMap;
      });

      if (enableNotifications) {
        toast.info(`${member.info.name || 'Someone'} joined the workspace`);
      }
    });

    channel.bind('pusher:member_removed', (member: any) => {
      if (!enablePresence) return;
      
      setCollaborators(prev => {
        const newMap = new Map(prev);
        newMap.delete(member.id);
        return newMap;
      });

      if (enableNotifications) {
        toast.info(`${member.info.name || 'Someone'} left the workspace`);
      }
    });

    // Data events
    channel.bind('task-updated', handleTaskUpdate);
    channel.bind('goal-updated', handleGoalUpdate);
    channel.bind('habit-updated', handleHabitUpdate);
    channel.bind('calendar-updated', handleCalendarUpdate);

    // Collaboration events
    if (enableCollaboration) {
      channel.bind('cursor-moved', handleCursorMove);
      channel.bind('selection-changed', handleSelectionChange);
      channel.bind('user-typing', handleUserTyping);
    }

    // Notification events
    if (enableNotifications) {
      const privateChannel = pusher.subscribe(`private-user-${workspaceId}`);
      privateChannel.bind('notification', handleNotification);
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusher.unsubscribe(channelName);
        
        if (enableNotifications) {
          pusher.unsubscribe(`private-user-${workspaceId}`);
        }
      }
      
      // Clear debounce timers
      debounceTimers.current.forEach(timer => clearTimeout(timer));
      debounceTimers.current.clear();
    };
  }, [workspaceId, enablePresence, enableNotifications, enableCollaboration]);

  const handleTaskUpdate = useCallback((event: RealtimeEvent) => {
    const { taskId, action, task } = event.data;
    
    // Update React Query cache
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    
    if (enableNotifications) {
      const actionText = action === 'created' ? 'created' : action === 'updated' ? 'updated' : 'deleted';
      toast.success(`Task "${task?.title || taskId}" was ${actionText}`);
    }
  }, [queryClient, enableNotifications]);

  const handleGoalUpdate = useCallback((event: RealtimeEvent) => {
    const { goalId, action, goal } = event.data;
    
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
    
    if (enableNotifications && action === 'progress') {
      toast.success(`Goal "${goal?.title || goalId}" progress updated`);
    }
  }, [queryClient, enableNotifications]);

  const handleHabitUpdate = useCallback((event: RealtimeEvent) => {
    const { habitId, action, habit } = event.data;
    
    queryClient.invalidateQueries({ queryKey: ['habits'] });
    queryClient.invalidateQueries({ queryKey: ['habit', habitId] });
    
    if (enableNotifications && action === 'completed') {
      toast.success(`Habit "${habit?.title || habitId}" was completed!`);
    }
  }, [queryClient, enableNotifications]);

  const handleCalendarUpdate = useCallback((event: RealtimeEvent) => {
    const { eventId, action } = event.data;
    
    queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    queryClient.invalidateQueries({ queryKey: ['calendar-event', eventId] });
  }, [queryClient]);

  const handleCursorMove = useCallback((event: RealtimeEvent) => {
    if (!enableCollaboration) return;
    
    const { cursor } = event.data;
    setCollaborators(prev => {
      const newMap = new Map(prev);
      const user = newMap.get(event.userId);
      if (user) {
        newMap.set(event.userId, {
          ...user,
          cursor,
          lastSeen: Date.now(),
        });
      }
      return newMap;
    });
  }, [enableCollaboration]);

  const handleSelectionChange = useCallback((event: RealtimeEvent) => {
    if (!enableCollaboration) return;
    
    const { selection } = event.data;
    setCollaborators(prev => {
      const newMap = new Map(prev);
      const user = newMap.get(event.userId);
      if (user) {
        newMap.set(event.userId, {
          ...user,
          selection,
          lastSeen: Date.now(),
        });
      }
      return newMap;
    });
  }, [enableCollaboration]);

  const handleUserTyping = useCallback((event: RealtimeEvent) => {
    if (!enableCollaboration) return;
    
    const { isTyping } = event.data;
    const userId = event.userId;
    
    setCollaborators(prev => {
      const newMap = new Map(prev);
      const user = newMap.get(userId);
      if (user) {
        newMap.set(userId, {
          ...user,
          isTyping,
          lastSeen: Date.now(),
        });
      }
      return newMap;
    });

    // Clear typing indicator after timeout
    if (isTyping) {
      const existingTimer = debounceTimers.current.get(userId);
      if (existingTimer) clearTimeout(existingTimer);
      
      const timer = setTimeout(() => {
        setCollaborators(prev => {
          const newMap = new Map(prev);
          const user = newMap.get(userId);
          if (user) {
            newMap.set(userId, { ...user, isTyping: false });
          }
          return newMap;
        });
        debounceTimers.current.delete(userId);
      }, 3000);
      
      debounceTimers.current.set(userId, timer);
    }
  }, [enableCollaboration]);

  const handleNotification = useCallback((notification: any) => {
    if (!enableNotifications) return;
    
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
    
    // Show toast notification
    const toastFn = notification.type === 'error' ? toast.error : 
                   notification.type === 'warning' ? toast.warning :
                   notification.type === 'success' ? toast.success : toast.info;
    
    toastFn(notification.title, {
      description: notification.message,
      action: notification.actionUrl ? {
        label: 'View',
        onClick: () => window.location.href = notification.actionUrl,
      } : undefined,
    });
  }, [enableNotifications]);

  // Broadcasting functions
  const broadcast = useCallback(async (event: string, data: any) => {
    if (!isConnected) return;
    
    try {
      const response = await fetch('/api/pusher/trigger?action=broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          event,
          data,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to broadcast event');
      }
    } catch (error) {
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Broadcast error:', error);
    }
  }, [isConnected, workspaceId]);

  const sendCursorPosition = useCallback(async (x: number, y: number, documentId?: string) => {
    if (!isConnected || !enableCollaboration) return;
    
    try {
      await fetch('/api/pusher/trigger?action=cursor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          documentId: documentId || 'default',
          cursor: { x, y },
        }),
      });
    } catch (error) {
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Cursor broadcast error:', error);
    }
  }, [isConnected, enableCollaboration, workspaceId]);

  const sendSelection = useCallback(async (start: number, end: number, documentId?: string) => {
    if (!isConnected || !enableCollaboration) return;
    
    try {
      await fetch('/api/pusher/trigger?action=selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          documentId: documentId || 'default',
          selection: { start, end },
        }),
      });
    } catch (error) {
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Selection broadcast error:', error);
    }
  }, [isConnected, enableCollaboration, workspaceId]);

  const sendTypingStatus = useCallback(async (isTyping: boolean, documentId?: string) => {
    if (!isConnected || !enableCollaboration) return;
    
    try {
      await fetch('/api/pusher/trigger?action=typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          documentId: documentId || 'default',
          isTyping,
        }),
      });
    } catch (error) {
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Typing broadcast error:', error);
    }
  }, [isConnected, enableCollaboration, workspaceId]);

  const sendNotification = useCallback(async (
    targetUserId: string, 
    notification: {
      title: string;
      message: string;
      type?: 'info' | 'success' | 'warning' | 'error';
      actionUrl?: string;
    }
  ) => {
    try {
      await fetch('/api/pusher/trigger?action=notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId,
          notification: {
            id: Math.random().toString(36).substr(2, 9),
            ...notification,
            type: notification.type || 'info',
            timestamp: Date.now(),
          },
        }),
      });
    } catch (error) {
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Notification send error:', error);
    }
  }, []);

  return {
    // Connection status
    isConnected,
    connectionError,
    
    // Presence
    collaborators: Array.from(collaborators.values()),
    onlineCount: collaborators.size,
    
    // Notifications
    notifications,
    
    // Broadcasting
    broadcast,
    sendCursorPosition,
    sendSelection,
    sendTypingStatus,
    sendNotification,
    
    // Utilities
    clearNotifications: () => setNotifications([]),
  };
}