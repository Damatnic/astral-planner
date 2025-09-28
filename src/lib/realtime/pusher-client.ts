import Pusher from 'pusher-js';
import { useEffect, useRef, useState, useCallback } from 'react';

let pusherClient: Pusher | null = null;

export function getPusherClient() {
  if (!pusherClient && typeof window !== 'undefined') {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    
    if (!pusherKey) {
      // Only log in development mode to reduce console noise in production
      if (process.env.NODE_ENV === 'development') {
        console.log('Pusher key not configured - real-time features disabled');
      }
      return null;
    }
    
    try {
      pusherClient = new Pusher(pusherKey, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
        authEndpoint: '/api/pusher/auth',
        auth: {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      });
    } catch (error) {
      // TODO: Replace with proper logging - console.error('Failed to initialize Pusher client:', error);
      return null;
    }
  }
  return pusherClient;
}

export interface PresenceData {
  user_id: string;
  user_info: {
    name: string;
    email: string;
    avatar?: string;
    color?: string;
    cursor?: { x: number; y: number };
    selection?: { start: number; end: number };
  };
}

export interface RealtimeEvent<T = any> {
  type: string;
  data: T;
  userId: string;
  timestamp: number;
}

export function useRealtimeSync(workspaceId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [members, setMembers] = useState<PresenceData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const pusher = getPusherClient();
    if (!pusher) {
      setError('Real-time features not available - Pusher not configured');
      return;
    }

    pusherRef.current = pusher;
    
    // Subscribe to workspace channel
    const channel = pusher.subscribe(`presence-workspace-${workspaceId}`);
    channelRef.current = channel;

    // Connection events
    channel.bind('pusher:subscription_succeeded', (members: any) => {
      setIsConnected(true);
      setError(null);
      const memberList = Object.keys(members.members).map(id => ({
        user_id: id,
        user_info: members.members[id],
      }));
      setMembers(memberList);
    });

    channel.bind('pusher:subscription_error', (error: any) => {
      setIsConnected(false);
      setError(error.message || 'Failed to connect to real-time channel');
    });

    channel.bind('pusher:member_added', (member: any) => {
      setMembers(prev => [...prev, {
        user_id: member.id,
        user_info: member.info,
      }]);
    });

    channel.bind('pusher:member_removed', (member: any) => {
      setMembers(prev => prev.filter(m => m.user_id !== member.id));
    });

    // Workspace events
    channel.bind('block-created', handleBlockCreated);
    channel.bind('block-updated', handleBlockUpdated);
    channel.bind('block-deleted', handleBlockDeleted);
    channel.bind('cursor-moved', handleCursorMoved);
    channel.bind('selection-changed', handleSelectionChanged);
    channel.bind('user-typing', handleUserTyping);

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusher?.unsubscribe(`presence-workspace-${workspaceId}`);
      }
    };
  }, [workspaceId]);

  const handleBlockCreated = useCallback((data: RealtimeEvent) => {
    // Handle real-time block creation
    if (data.userId === getCurrentUserId()) return;
    // Update local state or trigger refetch
  }, []);

  const handleBlockUpdated = useCallback((data: RealtimeEvent) => {
    // Handle real-time block updates
    if (data.userId === getCurrentUserId()) return;
    // Update local state or trigger refetch
  }, []);

  const handleBlockDeleted = useCallback((data: RealtimeEvent) => {
    // Handle real-time block deletion
    if (data.userId === getCurrentUserId()) return;
    // Update local state or trigger refetch
  }, []);

  const handleCursorMoved = useCallback((data: RealtimeEvent<{ x: number; y: number; userId: string }>) => {
    // Update cursor position for collaborative editing
    setMembers(prev => prev.map(m => 
      m.user_id === data.userId 
        ? { ...m, user_info: { ...m.user_info, cursor: data.data } }
        : m
    ));
  }, []);

  const handleSelectionChanged = useCallback((data: RealtimeEvent<{ start: number; end: number; userId: string }>) => {
    // Update selection for collaborative editing
    setMembers(prev => prev.map(m => 
      m.user_id === data.userId 
        ? { ...m, user_info: { ...m.user_info, selection: data.data } }
        : m
    ));
  }, []);

  const handleUserTyping = useCallback((data: RealtimeEvent<{ isTyping: boolean; userId: string }>) => {
    // Handle typing indicators
  }, []);

  const broadcast = useCallback((event: string, data: any) => {
    if (!channelRef.current || !isConnected) return;
    
    channelRef.current.trigger(`client-${event}`, {
      type: event,
      data,
      userId: getCurrentUserId(),
      timestamp: Date.now(),
    });
  }, [isConnected]);

  const sendCursorPosition = useCallback((x: number, y: number) => {
    broadcast('cursor-moved', { x, y });
  }, [broadcast]);

  const sendSelection = useCallback((start: number, end: number) => {
    broadcast('selection-changed', { start, end });
  }, [broadcast]);

  const sendTypingStatus = useCallback((isTyping: boolean) => {
    broadcast('user-typing', { isTyping });
  }, [broadcast]);

  return {
    isConnected,
    members,
    error,
    broadcast,
    sendCursorPosition,
    sendSelection,
    sendTypingStatus,
  };
}

export function useRealtimePresence(channelName: string) {
  const [members, setMembers] = useState<Map<string, PresenceData>>(new Map());
  const [myInfo, setMyInfo] = useState<PresenceData | null>(null);
  
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('Pusher not available for presence channel:', channelName);
      }
      return;
    }

    const channel = pusher.subscribe(`presence-${channelName}`);

    channel.bind('pusher:subscription_succeeded', (data: any) => {
      const membersMap = new Map<string, PresenceData>();
      
      Object.keys(data.members).forEach(id => {
        membersMap.set(id, {
          user_id: id,
          user_info: data.members[id],
        });
      });
      
      setMembers(membersMap);
      setMyInfo({
        user_id: data.myID,
        user_info: data.me,
      });
    });

    channel.bind('pusher:member_added', (member: any) => {
      setMembers(prev => {
        const newMembers = new Map(prev);
        newMembers.set(member.id, {
          user_id: member.id,
          user_info: member.info,
        });
        return newMembers;
      });
    });

    channel.bind('pusher:member_removed', (member: any) => {
      setMembers(prev => {
        const newMembers = new Map(prev);
        newMembers.delete(member.id);
        return newMembers;
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`presence-${channelName}`);
    };
  }, [channelName]);

  return {
    members: Array.from(members.values()),
    myInfo,
    onlineCount: members.size,
  };
}

function getCurrentUserId(): string {
  // This would get the actual user ID from your auth system
  // Since we're in client-side code, we can't directly access Clerk auth here
  // In a real implementation, you'd pass this through props or context
  if (typeof window !== 'undefined' && (window as any).__USER_ID__) {
    return (window as any).__USER_ID__;
  }
  return 'anonymous';
}