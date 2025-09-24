import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { realtimeService } from '@/lib/realtime/pusher-server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.text();
    const params = new URLSearchParams(body);
    
    const socketId = params.get('socket_id');
    const channelName = params.get('channel_name');

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate channel access
    if (!await validateChannelAccess(userId, channelName)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const authData = await realtimeService.authenticateUser(
      socketId,
      channelName,
      userId
    );

    return NextResponse.json(authData);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

async function validateChannelAccess(userId: string, channelName: string): Promise<boolean> {
  try {
    // Extract channel type and ID
    if (channelName.startsWith('presence-workspace-')) {
      const workspaceId = channelName.replace('presence-workspace-', '');
      return await hasWorkspaceAccess(userId, workspaceId);
    }
    
    if (channelName.startsWith('private-user-')) {
      const targetUserId = channelName.replace('private-user-', '');
      return userId === targetUserId;
    }
    
    if (channelName.startsWith('presence-document-')) {
      const documentId = channelName.replace('presence-document-', '');
      return await hasDocumentAccess(userId, documentId);
    }

    return false;
  } catch (error) {
    console.error('Channel access validation error:', error);
    return false;
  }
}

async function hasWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
  // For now, allow access to all workspaces
  // In a real app, you'd check workspace membership from the database
  return true;
}

async function hasDocumentAccess(userId: string, documentId: string): Promise<boolean> {
  // For now, allow access to all documents
  // In a real app, you'd check document permissions from the database
  return true;
}