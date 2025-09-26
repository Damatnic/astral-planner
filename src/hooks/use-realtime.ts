import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { subscribeTo, getPusherClient } from '@/lib/pusher/client'
import { useToast } from '@/hooks/use-toast'
import type { Task, RealtimeMessage, PresenceUser, RealtimeNotification } from '@/types'

interface RealtimeOptions {
  userId?: string
  workspaceId?: string
  onTaskUpdate?: (data: Task) => void
  onTaskCreate?: (data: Task) => void
  onTaskDelete?: (data: { taskId: string }) => void
  onUserJoin?: (data: PresenceUser) => void
  onUserLeave?: (data: PresenceUser) => void
  onNotification?: (data: RealtimeNotification) => void
}

export function useRealtime(options: RealtimeOptions = {}) {
  const { userId: authUserId } = useAuth()
  const { toast } = useToast()
  const [isConnected, setIsConnected] = useState(false)
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([])

  const userId = options.userId || authUserId

  useEffect(() => {
    if (!userId) return

    const pusher = getPusherClient()
    if (!pusher) return

    // Subscribe to user's private channel
    const userChannel = `private-user-${userId}`
    const unsubUser = subscribeTo(userChannel, 'notification', (data) => {
      if (options.onNotification) {
        options.onNotification(data)
      } else {
        toast({
          title: data.title,
          description: data.message,
        })
      }
    })

    // Subscribe to workspace presence channel if provided
    let unsubWorkspace: (() => void) | undefined
    if (options.workspaceId) {
      const workspaceChannel = `presence-workspace-${options.workspaceId}`
      
      // Task events
      if (options.onTaskUpdate) {
        subscribeTo(workspaceChannel, 'task-updated', options.onTaskUpdate)
      }
      if (options.onTaskCreate) {
        subscribeTo(workspaceChannel, 'task-created', options.onTaskCreate)
      }
      if (options.onTaskDelete) {
        subscribeTo(workspaceChannel, 'task-deleted', options.onTaskDelete)
      }

      // Presence events
      const channel = pusher.subscribe(workspaceChannel)
      
      channel.bind('pusher:subscription_succeeded', (members: { members: Record<string, PresenceUser> }) => {
        setIsConnected(true)
        const users = Object.values(members.members)
        setPresenceUsers(users)
      })

      channel.bind('pusher:member_added', (member: { info: PresenceUser }) => {
        setPresenceUsers((prev) => [...prev, member.info])
        if (options.onUserJoin) {
          options.onUserJoin(member.info)
        }
      })

      channel.bind('pusher:member_removed', (member: { id: string; info: PresenceUser }) => {
        setPresenceUsers((prev) => prev.filter((u) => u.id !== member.id))
        if (options.onUserLeave) {
          options.onUserLeave(member.info)
        }
      })

      unsubWorkspace = () => {
        pusher.unsubscribe(workspaceChannel)
      }
    }

    // Connection status
    pusher.connection.bind('connected', () => {
      setIsConnected(true)
    })

    pusher.connection.bind('disconnected', () => {
      setIsConnected(false)
    })

    return () => {
      unsubUser?.()
      unsubWorkspace?.()
    }
  }, [userId, options.workspaceId])

  const sendNotification = useCallback(
    async (targetUserId: string, title: string, message: string) => {
      await fetch('/api/pusher/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          title,
          message,
        }),
      })
    },
    []
  )

  return {
    isConnected,
    presenceUsers,
    sendNotification,
  }
}

interface TaskActivity {
  type: 'comment' | 'update' | 'status_change' | 'assignment';
  user: PresenceUser;
  message: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export function useRealtimeTask(taskId: string) {
  const [task, setTask] = useState<Task | null>(null)
  const [activities, setActivities] = useState<TaskActivity[]>([])

  useEffect(() => {
    if (!taskId) return

    const channel = `private-task-${taskId}`
    
    const unsubUpdate = subscribeTo(channel, 'updated', (data) => {
      setTask(data.task)
    })

    const unsubActivity = subscribeTo(channel, 'activity', (data) => {
      setActivities((prev) => [data.activity, ...prev])
    })

    const unsubComment = subscribeTo(channel, 'comment', (data) => {
      setActivities((prev) => [
        {
          type: 'comment',
          user: data.user,
          message: data.message,
          createdAt: data.createdAt,
        },
        ...prev,
      ])
    })

    return () => {
      unsubUpdate?.()
      unsubActivity?.()
      unsubComment?.()
    }
  }, [taskId])

  return { task, activities }
}