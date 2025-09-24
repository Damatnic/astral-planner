import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateTaskSuggestions, breakdownGoal, optimizeSchedule, generateProductivityInsights } from '@/lib/ai/openai'
import { db } from '@/db'
import { users, blocks, goals } from '@/db/schema'
import { eq, and, gte, desc, sql } from 'drizzle-orm'
import { z } from 'zod'

const SuggestionsSchema = z.object({
  type: z.enum(['tasks', 'goal-breakdown', 'schedule', 'insights']),
  context: z.object({
    userGoals: z.array(z.string()).optional(),
    recentTasks: z.array(z.string()).optional(), 
    workContext: z.string().optional(),
    goalTitle: z.string().optional(),
    goalDescription: z.string().optional(),
    deadline: z.string().optional(),
    tasks: z.array(z.any()).optional(),
    availableHours: z.number().optional(),
    preferences: z.any().optional(),
  }),
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has AI features enabled
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Rate limiting check for AI requests
    const aiRequestsResult = await db.select({ count: sql`count(*)` })
      .from(blocks)
      .where(
        and(
          eq(blocks.createdBy, user.id),
          gte(blocks.createdAt, new Date(new Date().setHours(0, 0, 0, 0)))
        )
      )
    
    const aiRequestsToday = Number(aiRequestsResult[0]?.count || 0)

    if (aiRequestsToday > 50) { // Limit AI requests per day
      return NextResponse.json(
        { error: 'Daily AI request limit exceeded' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { type, context } = SuggestionsSchema.parse(body)

    let result: any

    switch (type) {
      case 'tasks':
        // Fetch user context if not provided
        if (!context.recentTasks || !context.userGoals) {
          const [recentTasks, userGoals] = await Promise.all([
            db.query.blocks.findMany({
              where: and(
                eq(blocks.createdBy, user.id),
                eq(blocks.type, 'task')
              ),
              orderBy: [desc(blocks.createdAt)],
              limit: 10,
              columns: { title: true },
            }),
            db.query.goals.findMany({
              where: and(
                eq(goals.userId, user.id),
                eq(goals.status, 'active')
              ),
              limit: 5,
              columns: { title: true },
            }),
          ])

          context.recentTasks = recentTasks.map(t => t.title)
          context.userGoals = userGoals.map(g => g.title)
        }

        result = await generateTaskSuggestions({
          userGoals: context.userGoals,
          recentTasks: context.recentTasks,
          workContext: context.workContext,
          preferences: user.settings,
        })
        break

      case 'goal-breakdown':
        if (!context.goalTitle || !context.goalDescription) {
          return NextResponse.json(
            { error: 'Goal title and description are required' },
            { status: 400 }
          )
        }

        result = await breakdownGoal(
          context.goalTitle,
          context.goalDescription,
          context.deadline
        )
        break

      case 'schedule':
        if (!context.tasks || !context.availableHours) {
          return NextResponse.json(
            { error: 'Tasks and available hours are required' },
            { status: 400 }
          )
        }

        result = await optimizeSchedule(
          context.tasks,
          context.availableHours,
          context.preferences
        )
        break

      case 'insights':
        // Calculate user stats
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const [allTasks, completedTasks] = await Promise.all([
          db.query.blocks.findMany({
            where: and(
              eq(blocks.createdBy, user.id),
              eq(blocks.type, 'task'),
              gte(blocks.createdAt, thirtyDaysAgo)
            ),
          }),
          db.query.blocks.findMany({
            where: and(
              eq(blocks.createdBy, user.id),
              eq(blocks.type, 'task'),
              eq(blocks.status, 'completed'),
              gte(blocks.createdAt, thirtyDaysAgo)
            ),
          }),
        ])

        const userStats = {
          completedTasks: completedTasks.length,
          totalTasks: allTasks.length,
          averageCompletionTime: completedTasks.reduce((acc, task) => {
            if (task.createdAt && task.completedAt) {
              return acc + (task.completedAt.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60)
            }
            return acc
          }, 0) / completedTasks.length || 0,
          mostProductiveHours: ['9:00-11:00', '14:00-16:00'], // This could be calculated from actual data
          commonTags: [], // Extract from tasks
          streaks: { current: 5, best: 12 }, // This would come from habits data
        }

        result = await generateProductivityInsights(userStats)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid suggestion type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      type,
      data: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('AI suggestions error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate AI suggestions' },
      { status: 500 }
    )
  }
}