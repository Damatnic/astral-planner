import { broadcast, broadcastToWorkspace, broadcastToUser } from '@/lib/pusher/server';
import { Logger } from '@/lib/logger/edge';

export interface BroadcastOptions {
  workspaceId: string;
  userId: string;
  excludeUserId?: string; // Don't broadcast to this user (usually the one who made the change)
}

export class RealtimeBroadcaster {
  // Task broadcasts
  static async broadcastTaskUpdate(
    options: BroadcastOptions,
    data: {
      taskId: string;
      action: 'created' | 'updated' | 'deleted' | 'status_changed';
      task?: any;
      changes?: Record<string, any>;
    }
  ) {
    try {
      await broadcastToWorkspace(options.workspaceId, 'task-updated', {
        type: 'task-updated',
        data,
        userId: options.userId,
        timestamp: Date.now(),
      });

      Logger.info('Task update broadcast', {
        workspaceId: options.workspaceId,
        taskId: data.taskId,
        action: data.action,
        userId: options.userId,
      });
    } catch (error) {
      Logger.error('Failed to broadcast task update:', error);
    }
  }

  // Goal broadcasts
  static async broadcastGoalUpdate(
    options: BroadcastOptions,
    data: {
      goalId: string;
      action: 'created' | 'updated' | 'deleted' | 'progress' | 'completed';
      goal?: any;
      progress?: number;
    }
  ) {
    try {
      await broadcastToWorkspace(options.workspaceId, 'goal-updated', {
        type: 'goal-updated',
        data,
        userId: options.userId,
        timestamp: Date.now(),
      });

      Logger.info('Goal update broadcast', {
        workspaceId: options.workspaceId,
        goalId: data.goalId,
        action: data.action,
        userId: options.userId,
      });
    } catch (error) {
      Logger.error('Failed to broadcast goal update:', error);
    }
  }

  // Habit broadcasts
  static async broadcastHabitUpdate(
    options: BroadcastOptions,
    data: {
      habitId: string;
      action: 'created' | 'updated' | 'deleted' | 'completed' | 'streak_updated';
      habit?: any;
      streak?: number;
    }
  ) {
    try {
      await broadcastToWorkspace(options.workspaceId, 'habit-updated', {
        type: 'habit-updated',
        data,
        userId: options.userId,
        timestamp: Date.now(),
      });

      Logger.info('Habit update broadcast', {
        workspaceId: options.workspaceId,
        habitId: data.habitId,
        action: data.action,
        userId: options.userId,
      });
    } catch (error) {
      Logger.error('Failed to broadcast habit update:', error);
    }
  }

  // Calendar broadcasts
  static async broadcastCalendarUpdate(
    options: BroadcastOptions,
    data: {
      eventId: string;
      action: 'created' | 'updated' | 'deleted' | 'moved';
      event?: any;
    }
  ) {
    try {
      await broadcastToWorkspace(options.workspaceId, 'calendar-updated', {
        type: 'calendar-updated',
        data,
        userId: options.userId,
        timestamp: Date.now(),
      });

      Logger.info('Calendar update broadcast', {
        workspaceId: options.workspaceId,
        eventId: data.eventId,
        action: data.action,
        userId: options.userId,
      });
    } catch (error) {
      Logger.error('Failed to broadcast calendar update:', error);
    }
  }

  // Workspace broadcasts
  static async broadcastWorkspaceUpdate(
    options: BroadcastOptions,
    data: {
      action: 'member_added' | 'member_removed' | 'settings_changed' | 'deleted';
      member?: any;
      settings?: any;
    }
  ) {
    try {
      await broadcastToWorkspace(options.workspaceId, 'workspace-updated', {
        type: 'workspace-updated',
        data,
        userId: options.userId,
        timestamp: Date.now(),
      });

      Logger.info('Workspace update broadcast', {
        workspaceId: options.workspaceId,
        action: data.action,
        userId: options.userId,
      });
    } catch (error) {
      Logger.error('Failed to broadcast workspace update:', error);
    }
  }

  // User notifications
  static async sendNotification(
    targetUserId: string,
    notification: {
      id?: string;
      title: string;
      message: string;
      type?: 'info' | 'success' | 'warning' | 'error';
      actionUrl?: string;
      actionLabel?: string;
      fromUserId?: string;
      metadata?: Record<string, any>;
    }
  ) {
    try {
      await broadcastToUser(targetUserId, 'notification', {
        id: notification.id || Math.random().toString(36).substr(2, 9),
        ...notification,
        type: notification.type || 'info',
        timestamp: Date.now(),
      });

      Logger.info('Notification sent', {
        targetUserId,
        type: notification.type,
        fromUserId: notification.fromUserId,
      });
    } catch (error) {
      Logger.error('Failed to send notification:', error);
    }
  }

  // Bulk notification for workspace members
  static async broadcastNotificationToWorkspace(
    options: BroadcastOptions,
    notification: {
      title: string;
      message: string;
      type?: 'info' | 'success' | 'warning' | 'error';
      actionUrl?: string;
      actionLabel?: string;
      metadata?: Record<string, any>;
    },
    memberIds: string[] = []
  ) {
    try {
      // If no member IDs provided, broadcast to the whole workspace channel
      if (memberIds.length === 0) {
        await broadcastToWorkspace(options.workspaceId, 'workspace-notification', {
          ...notification,
          type: notification.type || 'info',
          fromUserId: options.userId,
          timestamp: Date.now(),
        });
      } else {
        // Send individual notifications to specific members
        await Promise.all(
          memberIds
            .filter(id => id !== options.excludeUserId)
            .map(memberId => this.sendNotification(memberId, {
              ...notification,
              fromUserId: options.userId,
            }))
        );
      }

      Logger.info('Workspace notification broadcast', {
        workspaceId: options.workspaceId,
        memberCount: memberIds.length,
        fromUserId: options.userId,
      });
    } catch (error) {
      Logger.error('Failed to broadcast workspace notification:', error);
    }
  }

  // Activity feed broadcasts
  static async broadcastActivity(
    options: BroadcastOptions,
    activity: {
      id?: string;
      type: 'task_created' | 'goal_completed' | 'habit_streak' | 'workspace_joined' | 'comment_added';
      description: string;
      entityId?: string;
      entityType?: 'task' | 'goal' | 'habit' | 'workspace';
      metadata?: Record<string, any>;
    }
  ) {
    try {
      await broadcastToWorkspace(options.workspaceId, 'activity-created', {
        type: 'activity-created',
        data: {
          id: activity.id || Math.random().toString(36).substr(2, 9),
          ...activity,
          userId: options.userId,
          timestamp: Date.now(),
        },
        userId: options.userId,
        timestamp: Date.now(),
      });

      Logger.info('Activity broadcast', {
        workspaceId: options.workspaceId,
        activityType: activity.type,
        userId: options.userId,
      });
    } catch (error) {
      Logger.error('Failed to broadcast activity:', error);
    }
  }

  // Presence updates (typing, cursors, etc.)
  static async broadcastPresence(
    options: BroadcastOptions,
    presence: {
      type: 'cursor' | 'selection' | 'typing' | 'focus' | 'blur';
      documentId?: string;
      data: Record<string, any>;
    }
  ) {
    try {
      const eventName = `presence-${presence.type}`;
      await broadcastToWorkspace(options.workspaceId, eventName, {
        type: eventName,
        data: {
          ...presence.data,
          documentId: presence.documentId,
        },
        userId: options.userId,
        timestamp: Date.now(),
      });

      // Don't log presence events as they're high frequency
    } catch (error) {
      Logger.error('Failed to broadcast presence:', error);
    }
  }

  // Collaboration events
  static async broadcastCollaborationEvent(
    options: BroadcastOptions,
    event: {
      type: 'document_locked' | 'document_unlocked' | 'edit_conflict' | 'merge_required';
      documentId: string;
      data?: Record<string, any>;
    }
  ) {
    try {
      await broadcastToWorkspace(options.workspaceId, 'collaboration-event', {
        type: 'collaboration-event',
        data: {
          ...event,
          documentId: event.documentId,
        },
        userId: options.userId,
        timestamp: Date.now(),
      });

      Logger.info('Collaboration event broadcast', {
        workspaceId: options.workspaceId,
        eventType: event.type,
        documentId: event.documentId,
        userId: options.userId,
      });
    } catch (error) {
      Logger.error('Failed to broadcast collaboration event:', error);
    }
  }
}

// Convenience functions for easier usage
export const broadcastTaskUpdate = RealtimeBroadcaster.broadcastTaskUpdate.bind(RealtimeBroadcaster);
export const broadcastGoalUpdate = RealtimeBroadcaster.broadcastGoalUpdate.bind(RealtimeBroadcaster);
export const broadcastHabitUpdate = RealtimeBroadcaster.broadcastHabitUpdate.bind(RealtimeBroadcaster);
export const broadcastCalendarUpdate = RealtimeBroadcaster.broadcastCalendarUpdate.bind(RealtimeBroadcaster);
export const sendNotification = RealtimeBroadcaster.sendNotification.bind(RealtimeBroadcaster);
export const broadcastActivity = RealtimeBroadcaster.broadcastActivity.bind(RealtimeBroadcaster);