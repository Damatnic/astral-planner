// Edge Runtime compatible pusher implementation
let pusherServer: any = null

export function getPusherServer() {
  if (!pusherServer) {
    try {
      // Only import and use Pusher if environment variables are available
      if (process.env.PUSHER_APP_ID && process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.PUSHER_SECRET) {
        const Pusher = require('pusher');
        pusherServer = new Pusher({
          appId: process.env.PUSHER_APP_ID,
          key: process.env.NEXT_PUBLIC_PUSHER_KEY,
          secret: process.env.PUSHER_SECRET,
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
          useTLS: true,
        });
      } else {
        // Mock pusher for deployment without configuration
        pusherServer = {
          trigger: (channel: string, event: string, data: any) => {
            console.log('Mock pusher trigger:', { channel, event, data });
            return Promise.resolve();
          }
        };
      }
    } catch (error) {
      // Fallback to mock if Pusher fails to initialize
      console.warn('Pusher initialization failed, using mock:', error);
      pusherServer = {
        trigger: (channel: string, event: string, data: any) => {
          console.log('Mock pusher trigger:', { channel, event, data });
          return Promise.resolve();
        }
      };
    }
  }
  
  return pusherServer
}

export async function broadcast(channel: string, event: string, data: any) {
  const pusher = getPusherServer()
  return pusher.trigger(channel, event, data)
}

export async function broadcastToUser(userId: string, event: string, data: any) {
  return broadcast(`private-user-${userId}`, event, data)
}

export async function broadcastToWorkspace(workspaceId: string, event: string, data: any) {
  return broadcast(`presence-workspace-${workspaceId}`, event, data)
}