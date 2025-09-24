import Pusher from 'pusher';

let pusherServer: Pusher | null = null;

export function getPusherServer() {
  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
      useTLS: true,
    });
  }
  return pusherServer;
}

export interface RealtimeEventData {
  type: string;
  payload: any;
  userId: string;
  timestamp: number;
  workspaceId?: string;
}

export class RealtimeService {
  private pusher: Pusher;

  constructor() {
    this.pusher = getPusherServer();
  }

  // Workspace-level events
  async broadcastToWorkspace(
    workspaceId: string, 
    event: string, 
    data: any, 
    userId: string,
    excludeUser: boolean = true
  ) {
    const eventData: RealtimeEventData = {
      type: event,
      payload: data,
      userId,
      timestamp: Date.now(),
      workspaceId,
    };

    await this.pusher.trigger(
      `presence-workspace-${workspaceId}`, 
      event, 
      eventData,
      { socket_id: excludeUser ? userId : undefined }
    );
  }

  // User-specific events
  async sendToUser(userId: string, event: string, data: any) {
    const eventData: RealtimeEventData = {
      type: event,
      payload: data,
      userId: 'system',
      timestamp: Date.now(),
    };

    await this.pusher.trigger(`private-user-${userId}`, event, eventData);
  }

  // Task-specific events
  async broadcastTaskUpdate(
    workspaceId: string,
    taskId: string,
    action: 'created' | 'updated' | 'deleted',
    task: any,
    userId: string
  ) {
    await this.broadcastToWorkspace(
      workspaceId,
      'task-updated',
      {
        taskId,
        action,
        task,
      },
      userId
    );
  }

  // Goal-specific events
  async broadcastGoalUpdate(
    workspaceId: string,
    goalId: string,
    action: 'created' | 'updated' | 'deleted' | 'progress',
    goal: any,
    userId: string
  ) {
    await this.broadcastToWorkspace(
      workspaceId,
      'goal-updated',
      {
        goalId,
        action,
        goal,
      },
      userId
    );
  }

  // Habit-specific events
  async broadcastHabitUpdate(
    workspaceId: string,
    habitId: string,
    action: 'created' | 'updated' | 'deleted' | 'completed',
    habit: any,
    userId: string
  ) {
    await this.broadcastToWorkspace(
      workspaceId,
      'habit-updated',
      {
        habitId,
        action,
        habit,
      },
      userId
    );
  }

  // Calendar events
  async broadcastCalendarEvent(
    workspaceId: string,
    eventId: string,
    action: 'created' | 'updated' | 'deleted',
    event: any,
    userId: string
  ) {
    await this.broadcastToWorkspace(
      workspaceId,
      'calendar-updated',
      {
        eventId,
        action,
        event,
      },
      userId
    );
  }

  // Collaborative editing events
  async broadcastCursorPosition(
    workspaceId: string,
    documentId: string,
    cursor: { x: number; y: number },
    userId: string
  ) {
    await this.broadcastToWorkspace(
      workspaceId,
      'cursor-moved',
      {
        documentId,
        cursor,
      },
      userId
    );
  }

  async broadcastSelection(
    workspaceId: string,
    documentId: string,
    selection: { start: number; end: number },
    userId: string
  ) {
    await this.broadcastToWorkspace(
      workspaceId,
      'selection-changed',
      {
        documentId,
        selection,
      },
      userId
    );
  }

  async broadcastTyping(
    workspaceId: string,
    documentId: string,
    isTyping: boolean,
    userId: string
  ) {
    await this.broadcastToWorkspace(
      workspaceId,
      'user-typing',
      {
        documentId,
        isTyping,
      },
      userId
    );
  }

  // Notification events
  async sendNotification(
    userId: string,
    notification: {
      id: string;
      title: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'error';
      timestamp: number;
      actionUrl?: string;
    }
  ) {
    await this.sendToUser(userId, 'notification', notification);
  }

  // Presence authentication
  async authenticateUser(socketId: string, channelName: string, userId: string) {
    // Get user info from database
    const userInfo = await this.getUserInfo(userId);
    
    if (channelName.startsWith('presence-')) {
      return this.pusher.authenticateUser(socketId, {
        id: userId,
        user_info: userInfo,
      });
    } else if (channelName.startsWith('private-')) {
      return this.pusher.authorizeChannel(socketId, channelName);
    }
    
    throw new Error('Invalid channel type');
  }

  private async getUserInfo(userId: string) {
    // This would fetch user info from your database
    // For now, return mock data
    return {
      name: 'User Name',
      email: 'user@example.com',
      avatar: null,
      color: this.generateUserColor(userId),
    };
  }

  private generateUserColor(userId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  // Analytics and monitoring
  async getChannelInfo(channelName: string) {
    try {
      const result = await this.pusher.get({ path: `/channels/${channelName}` });
      return result;
    } catch (error) {
      console.error('Failed to get channel info:', error);
      return null;
    }
  }

  async getActiveChannels() {
    try {
      const result = await this.pusher.get({ path: '/channels' });
      return result;
    } catch (error) {
      console.error('Failed to get active channels:', error);
      return null;
    }
  }
}

export const realtimeService = new RealtimeService();