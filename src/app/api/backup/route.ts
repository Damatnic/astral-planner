import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { blocks, goals, habits, templates, workspaces, workspaceMembers } from '@/db/schema'
import { eq, and, or } from 'drizzle-orm'
import { z } from 'zod'

// Schema for backup data
const backupSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().optional(),
  }),
  data: z.object({
    workspaces: z.array(z.any()),
    blocks: z.array(z.any()),
    goals: z.array(z.any()),
    habits: z.array(z.any()),
    templates: z.array(z.any()),
  }),
})

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's workspaces
    const userWorkspaces = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, userId))
    
    const workspaceIds = userWorkspaces.map(w => w.id)
    
    // Fetch all user data
    const [userBlocks, userGoals, userHabits, userTemplates, userWorkspaceMembers] = await Promise.all([
      // Blocks from user's workspaces
      workspaceIds.length > 0
        ? db.select().from(blocks).where(
            or(...workspaceIds.map(id => eq(blocks.workspaceId, id)))
          )
        : [],
      
      // User's goals
      db.select().from(goals).where(eq(goals.createdBy, userId)),
      
      // User's habits
      db.select().from(habits).where(eq(habits.userId, userId)),
      
      // User's templates
      db.select().from(templates).where(eq(templates.creatorId, userId)),
      
      // Workspace memberships
      workspaceIds.length > 0
        ? db.select().from(workspaceMembers).where(
            or(...workspaceIds.map(id => eq(workspaceMembers.workspaceId, id)))
          )
        : [],
    ])

    // Create backup object
    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      user: {
        id: userId,
        email: req.nextUrl.searchParams.get('email') || undefined,
      },
      data: {
        workspaces: userWorkspaces,
        workspaceMembers: userWorkspaceMembers,
        blocks: userBlocks,
        goals: userGoals,
        habits: userHabits,
        templates: userTemplates,
      },
    }

    // Return as downloadable JSON file
    return new Response(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="astral-planner-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Validate backup data
    const validatedData = backupSchema.parse(body)
    
    // Check if backup belongs to the user
    if (validatedData.user.id !== userId) {
      return NextResponse.json(
        { error: 'This backup belongs to a different user' },
        { status: 403 }
      )
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      let restoredCount = {
        workspaces: 0,
        blocks: 0,
        goals: 0,
        habits: 0,
        templates: 0,
      }

      // Restore workspaces
      if (validatedData.data.workspaces?.length > 0) {
        for (const workspace of validatedData.data.workspaces) {
          // Check if workspace already exists
          const existing = await tx
            .select()
            .from(workspaces)
            .where(eq(workspaces.id, workspace.id))
            .limit(1)
          
          if (existing.length === 0) {
            await tx.insert(workspaces).values({
              ...workspace,
              ownerId: userId, // Ensure correct owner
              createdAt: new Date(workspace.createdAt),
              updatedAt: new Date(),
            })
            restoredCount.workspaces++
          }
        }
      }

      // Restore blocks
      if (validatedData.data.blocks?.length > 0) {
        for (const block of validatedData.data.blocks) {
          const existing = await tx
            .select()
            .from(blocks)
            .where(eq(blocks.id, block.id))
            .limit(1)
          
          if (existing.length === 0) {
            await tx.insert(blocks).values({
              ...block,
              createdBy: userId,
              createdAt: new Date(block.createdAt),
              updatedAt: new Date(),
              dueDate: block.dueDate ? new Date(block.dueDate) : null,
              completedAt: block.completedAt ? new Date(block.completedAt) : null,
            })
            restoredCount.blocks++
          }
        }
      }

      // Restore goals
      if (validatedData.data.goals?.length > 0) {
        for (const goal of validatedData.data.goals) {
          const existing = await tx
            .select()
            .from(goals)
            .where(eq(goals.id, goal.id))
            .limit(1)
          
          if (existing.length === 0) {
            await tx.insert(goals).values({
              ...goal,
              userId,
              createdAt: new Date(goal.createdAt),
              updatedAt: new Date(),
              deadline: goal.deadline ? new Date(goal.deadline) : null,
            })
            restoredCount.goals++
          }
        }
      }

      // Restore habits
      if (validatedData.data.habits?.length > 0) {
        for (const habit of validatedData.data.habits) {
          const existing = await tx
            .select()
            .from(habits)
            .where(eq(habits.id, habit.id))
            .limit(1)
          
          if (existing.length === 0) {
            await tx.insert(habits).values({
              ...habit,
              userId,
              createdAt: new Date(habit.createdAt),
              updatedAt: new Date(),
              lastCompletedAt: habit.lastCompletedAt ? new Date(habit.lastCompletedAt) : null,
            })
            restoredCount.habits++
          }
        }
      }

      // Restore templates
      if (validatedData.data.templates?.length > 0) {
        for (const template of validatedData.data.templates) {
          const existing = await tx
            .select()
            .from(templates)
            .where(eq(templates.id, template.id))
            .limit(1)
          
          if (existing.length === 0) {
            await tx.insert(templates).values({
              ...template,
              createdBy: userId,
              createdAt: new Date(template.createdAt),
              updatedAt: new Date(),
            })
            restoredCount.templates++
          }
        }
      }

      return restoredCount
    })

    return NextResponse.json({
      success: true,
      message: 'Backup restored successfully',
      restored: result,
    })
  } catch (error) {
    console.error('Restore error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid backup file format', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to restore backup' },
      { status: 500 }
    )
  }
}