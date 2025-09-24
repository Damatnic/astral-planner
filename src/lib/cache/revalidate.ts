import { revalidatePath, revalidateTag } from 'next/cache'
import { cache, CacheTags } from './redis'

export async function revalidateUser(userId: string) {
  // Invalidate Redis cache
  await cache.invalidateTag(CacheTags.USER(userId))
  
  // Invalidate Next.js cache
  revalidateTag(`user-${userId}`)
  revalidatePath('/dashboard')
  revalidatePath('/profile')
}

export async function revalidateWorkspace(workspaceId: string) {
  await cache.invalidateTag(CacheTags.WORKSPACE(workspaceId))
  revalidateTag(`workspace-${workspaceId}`)
  revalidatePath('/dashboard')
  revalidatePath(`/workspace/${workspaceId}`)
}

export async function revalidateTask(taskId: string, workspaceId?: string) {
  await cache.invalidateTag(CacheTags.TASK(taskId))
  
  if (workspaceId) {
    await cache.invalidateTag(CacheTags.WORKSPACE(workspaceId))
  }
  
  revalidateTag(`task-${taskId}`)
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
}

export async function revalidateGoal(goalId: string, userId: string) {
  await cache.invalidateTag(CacheTags.GOAL(goalId))
  await cache.invalidateTag(CacheTags.USER(userId))
  
  revalidateTag(`goal-${goalId}`)
  revalidatePath('/goals')
  revalidatePath('/dashboard')
}

export async function revalidateHabit(habitId: string, userId: string) {
  await cache.invalidateTag(CacheTags.HABIT(habitId))
  await cache.invalidateTag(CacheTags.USER(userId))
  
  revalidateTag(`habit-${habitId}`)
  revalidatePath('/habits')
  revalidatePath('/dashboard')
}

export async function revalidateTemplate(templateId: string) {
  await cache.invalidateTag(CacheTags.TEMPLATE(templateId))
  
  revalidateTag(`template-${templateId}`)
  revalidatePath('/templates')
}

// Batch revalidation for bulk operations
export async function revalidateBatch(
  type: 'task' | 'goal' | 'habit',
  ids: string[],
  userId?: string
) {
  const promises = ids.map(async (id) => {
    switch (type) {
      case 'task':
        return revalidateTask(id)
      case 'goal':
        return userId ? revalidateGoal(id, userId) : null
      case 'habit':
        return userId ? revalidateHabit(id, userId) : null
    }
  })
  
  await Promise.all(promises.filter(Boolean))
}