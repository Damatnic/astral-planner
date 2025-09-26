import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/auth-utils';

import { getPusherServer } from '@/lib/pusher/server';

async function handlePOST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pusher = getPusherServer();
    if (!pusher) {
      return NextResponse.json(
        { error: 'Pusher server not configured' },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'broadcast';
    const body = await req.json();

    switch (action) {
      case 'broadcast': {
        const { workspaceId, event, data } = body;
        if (!workspaceId || !event) {
          return NextResponse.json(
            { error: 'Missing workspaceId or event' },
            { status: 400 }
          );
        }

        await pusher.trigger(
          `presence-workspace-${workspaceId}`,
          event,
          {
            type: event,
            data,
            userId: user.id,
            timestamp: Date.now(),
          }
        );

        console.log('Broadcast sent', { workspaceId, event, userId: user.id });
        break;
      }

      case 'cursor': {
        const { workspaceId, documentId, cursor } = body;
        if (!workspaceId || !cursor) {
          return NextResponse.json(
            { error: 'Missing workspaceId or cursor data' },
            { status: 400 }
          );
        }

        await pusher.trigger(
          `presence-workspace-${workspaceId}`,
          'cursor-moved',
          {
            type: 'cursor-moved',
            data: { cursor, documentId },
            userId: user.id,
            timestamp: Date.now(),
          }
        );
        break;
      }

      case 'selection': {
        const { workspaceId, documentId, selection } = body;
        if (!workspaceId || !selection) {
          return NextResponse.json(
            { error: 'Missing workspaceId or selection data' },
            { status: 400 }
          );
        }

        await pusher.trigger(
          `presence-workspace-${workspaceId}`,
          'selection-changed',
          {
            type: 'selection-changed',
            data: { selection, documentId },
            userId: user.id,
            timestamp: Date.now(),
          }
        );
        break;
      }

      case 'typing': {
        const { workspaceId, documentId, isTyping } = body;
        if (!workspaceId || typeof isTyping !== 'boolean') {
          return NextResponse.json(
            { error: 'Missing workspaceId or isTyping flag' },
            { status: 400 }
          );
        }

        await pusher.trigger(
          `presence-workspace-${workspaceId}`,
          'user-typing',
          {
            type: 'user-typing',
            data: { isTyping, documentId },
            userId: user.id,
            timestamp: Date.now(),
          }
        );
        break;
      }

      case 'notify': {
        const { targetUserId, notification } = body;
        if (!targetUserId || !notification) {
          return NextResponse.json(
            { error: 'Missing targetUserId or notification data' },
            { status: 400 }
          );
        }

        await pusher.trigger(
          `private-user-${targetUserId}`,
          'notification',
          {
            ...notification,
            fromUserId: user.id,
            fromUser: {
              name: user.firstName + ' ' + user.lastName,
              avatar: user.imageUrl,
            },
          }
        );

        console.log('Notification sent', { 
          targetUserId, 
          fromUserId: user.id,
          type: notification.type 
        });
        break;
      }

      case 'task-update': {
        const { workspaceId, taskId, action, task } = body;
        if (!workspaceId || !taskId || !action) {
          return NextResponse.json(
            { error: 'Missing required fields for task update' },
            { status: 400 }
          );
        }

        await pusher.trigger(
          `presence-workspace-${workspaceId}`,
          'task-updated',
          {
            type: 'task-updated',
            data: { taskId, action, task },
            userId: user.id,
            timestamp: Date.now(),
          }
        );

        console.log('Task update broadcast', { workspaceId, taskId, action, userId: user.id });
        break;
      }

      case 'goal-update': {
        const { workspaceId, goalId, action, goal } = body;
        if (!workspaceId || !goalId || !action) {
          return NextResponse.json(
            { error: 'Missing required fields for goal update' },
            { status: 400 }
          );
        }

        await pusher.trigger(
          `presence-workspace-${workspaceId}`,
          'goal-updated',
          {
            type: 'goal-updated',
            data: { goalId, action, goal },
            userId: user.id,
            timestamp: Date.now(),
          }
        );

        console.log('Goal update broadcast', { workspaceId, goalId, action, userId: user.id });
        break;
      }

      case 'habit-update': {
        const { workspaceId, habitId, action, habit } = body;
        if (!workspaceId || !habitId || !action) {
          return NextResponse.json(
            { error: 'Missing required fields for habit update' },
            { status: 400 }
          );
        }

        await pusher.trigger(
          `presence-workspace-${workspaceId}`,
          'habit-updated',
          {
            type: 'habit-updated',
            data: { habitId, action, habit },
            userId: user.id,
            timestamp: Date.now(),
          }
        );

        console.log('Habit update broadcast', { workspaceId, habitId, action, userId: user.id });
        break;
      }

      case 'calendar-update': {
        const { workspaceId, eventId, action, event } = body;
        if (!workspaceId || !eventId || !action) {
          return NextResponse.json(
            { error: 'Missing required fields for calendar update' },
            { status: 400 }
          );
        }

        await pusher.trigger(
          `presence-workspace-${workspaceId}`,
          'calendar-updated',
          {
            type: 'calendar-updated',
            data: { eventId, action, event },
            userId: user.id,
            timestamp: Date.now(),
          }
        );

        console.log('Calendar update broadcast', { workspaceId, eventId, action, userId: user.id });
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Pusher trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger event' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return await handlePOST(req);
}