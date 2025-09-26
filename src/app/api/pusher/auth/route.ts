import { NextRequest, NextResponse } from 'next/server';
import { getPusherServer } from '@/lib/pusher/server';
import { getUserFromRequest } from '@/lib/auth/auth-utils';
import { isWorkspaceMember } from '@/lib/auth/permissions';
import Logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { socket_id, channel_name } = body;

    if (!socket_id || !channel_name) {
      return NextResponse.json(
        { error: 'Missing socket_id or channel_name' },
        { status: 400 }
      );
    }

    const pusher = getPusherServer();
    if (!pusher) {
      return NextResponse.json(
        { error: 'Pusher server not configured' },
        { status: 500 }
      );
    }

    // Verify user has access to the channel
    if (channel_name.startsWith('private-user-')) {
      const userId = channel_name.replace('private-user-', '');
      if (userId !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    if (channel_name.startsWith('presence-workspace-')) {
      const workspaceId = channel_name.replace('presence-workspace-', '');
      
      // Check if user is a member of the workspace
      const isMember = await isWorkspaceMember(req, workspaceId);
      
      if (!isMember) {
        Logger.warn('Unauthorized workspace access attempt', { 
          userId: user.id, 
          workspaceId, 
          channel: channel_name 
        });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // For presence channels, provide user info
    const presenceData = channel_name.startsWith('presence-') ? {
      user_id: user.id,
      user_info: {
        name: (user.firstName || '') + ' ' + (user.lastName || ''),
        email: user.email,
        avatar: user.imageUrl,
        color: generateUserColor(user.id),
      },
    } : undefined;

    const authResponse = pusher.authorizeChannel(socket_id, channel_name, presenceData);
    
    Logger.info('Pusher auth successful', { 
      userId: user.id, 
      channel: channel_name,
      hasPresenceData: !!presenceData 
    });

    return NextResponse.json(authResponse);

  } catch (error) {
    Logger.error('Pusher auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

function generateUserColor(userId: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7DBDD'
  ];
  
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
}