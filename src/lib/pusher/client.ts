import Pusher from 'pusher-js'

let pusherClient: Pusher | null = null

export function getPusherClient() {
  if (!pusherClient && typeof window !== 'undefined') {
    pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
      authEndpoint: '/api/pusher/auth',
    })
  }
  
  return pusherClient
}

export function subscribeTo(channel: string, event: string, callback: (data: any) => void) {
  const client = getPusherClient()
  if (!client) return

  const pusherChannel = client.subscribe(channel)
  pusherChannel.bind(event, callback)

  return () => {
    pusherChannel.unbind(event, callback)
    client.unsubscribe(channel)
  }
}

export function triggerEvent(channel: string, event: string, data: any) {
  fetch('/api/pusher/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, event, data }),
  })
}