import Pusher from 'pusher'

let pusherServer: Pusher | null = null

export function getPusherServer() {
  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
      useTLS: true,
    })
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