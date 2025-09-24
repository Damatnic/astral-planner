import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { realtimeService } from '@/lib/realtime/pusher-server';
import { z } from 'zod';

const TriggerEventSchema = z.object({
  channel: z.string(),
  event: z.string(),
  data: z.any(),
  excludeUser: z.boolean().optional().default(true),
});

const BroadcastSchema = z.object({
  workspaceId: z.string(),
  event: z.string(),
  data: z.any(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const action = req.nextUrl.searchParams.get('action');

    switch (action) {
      case 'trigger': {
        const validated = TriggerEventSchema.parse(body);
        await realtimeService.broadcastToWorkspace(
          validated.channel,
          validated.event,
          validated.data,
          userId,
          validated.excludeUser
        );
        break;
      }

      case 'broadcast': {
        const validated = BroadcastSchema.parse(body);
        await realtimeService.broadcastToWorkspace(
          validated.workspaceId,
          validated.event,
          validated.data,
          userId
        );
        break;
      }

      case 'notify': {
        const { targetUserId, notification } = body;
        await realtimeService.sendNotification(targetUserId, notification);
        break;
      }

      case 'cursor': {
        const { workspaceId, documentId, cursor } = body;
        await realtimeService.broadcastCursorPosition(
          workspaceId,
          documentId,
          cursor,
          userId
        );
        break;
      }

      case 'selection': {
        const { workspaceId, documentId, selection } = body;
        await realtimeService.broadcastSelection(
          workspaceId,
          documentId,
          selection,
          userId
        );
        break;
      }

      case 'typing': {
        const { workspaceId, documentId, isTyping } = body;
        await realtimeService.broadcastTyping(
          workspaceId,
          documentId,
          isTyping,
          userId
        );
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pusher trigger error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to trigger event' },
      { status: 500 }
    );
  }
}