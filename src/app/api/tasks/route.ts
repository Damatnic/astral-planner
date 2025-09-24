import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { blocks, users, workspaces, workspaceMembers, blockActivity } from '@/db/schema';
import { eq, and, desc, or, like, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  type: z.enum(['task', 'note', 'event', 'goal', 'habit', 'journal', 'time_block', 'project']).default('task'),
  workspaceId: z.string().uuid(),
  status: z.enum(['todo', 'in_progress', 'completed', 'cancelled', 'waiting']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  estimatedDuration: z.number().optional(),
  tags: z.array(z.string()).optional(),
  assignedTo: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
});

// GET /api/tasks - List tasks
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build query conditions
    const conditions = [
      eq(blocks.createdBy, userId),
      eq(blocks.type, 'task'),
      eq(blocks.isDeleted, false)
    ];

    if (workspaceId) {
      conditions.push(eq(blocks.workspaceId, workspaceId));
    }

    if (status) {
      conditions.push(eq(blocks.status, status));
    }

    if (priority) {
      conditions.push(eq(blocks.priority, priority));
    }

    if (search) {
      const searchCondition = or(
        like(blocks.title, `%${search}%`),
        like(blocks.description, `%${search}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Get user from database to check permissions
    const userRecord = await db.query.users.findFirst({
      where: (users: any, { eq }: any) => eq(users.clerkId, userId)
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Query tasks
    const tasks = await db.query.blocks.findMany({
      where: and(...conditions),
      orderBy: [
        desc(blocks.priority),
        desc(blocks.createdAt)
      ],
      limit,
      offset,
      with: {
        workspace: true,
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true
          }
        },
        assignee: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true
          }
        }
      }
    });

    // Get total count for pagination
    const totalCount = await db.select({ count: sql`count(*)` })
      .from(blocks)
      .where(and(...conditions))
      .then((result: any) => Number(result[0]?.count || 0));

    return NextResponse.json({
      tasks,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create task
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
    const validated = CreateTaskSchema.parse(body);

    // Get user from database
    const userRecord = await db.query.users.findFirst({
      where: (users: any, { eq }: any) => eq(users.clerkId, userId)
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify user has access to workspace
    const workspace = await db.query.workspaces.findFirst({
      where: (workspaces: any, { eq, and }: any) => 
        and(
          eq(workspaces.id, validated.workspaceId),
          eq(workspaces.ownerId, userRecord.id)
        )
    });

    if (!workspace) {
      // Check if user is a member of the workspace
      const membership = await db.query.workspaceMembers.findFirst({
        where: (members: any, { eq, and }: any) =>
          and(
            eq(members.workspaceId, validated.workspaceId),
            eq(members.userId, userRecord.id)
          )
      });

      if (!membership) {
        return NextResponse.json(
          { error: 'Access denied to workspace' },
          { status: 403 }
        );
      }
    }

    // Get the highest position for ordering
    const lastTask = await db.query.blocks.findFirst({
      where: and(
        eq(blocks.workspaceId, validated.workspaceId),
        eq(blocks.type, 'task')
      ),
      orderBy: desc(blocks.position)
    });

    const position = lastTask ? lastTask.position + 1 : 0;

    // Create the task
    const newTaskResult = await db.insert(blocks).values({
      ...validated,
      createdBy: userRecord.id,
      position,
      content: {
        text: validated.description || ''
      },
      metadata: {
        source: 'web',
        version: 1
      },
      dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
      startDate: validated.startDate ? new Date(validated.startDate) : undefined,
    }).returning();

    const newTask = Array.isArray(newTaskResult) ? newTaskResult[0] : newTaskResult;

    // Update user stats
    await db.update(users)
      .set({
        totalTasksCreated: sql`${users.totalTasksCreated} + 1`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userRecord.id));

    // Create activity log
    await db.insert(blockActivity).values({
      blockId: newTask.id,
      userId: userRecord.id,
      action: 'created',
      metadata: {
        title: newTask.title,
        type: newTask.type
      }
    });

    return NextResponse.json(newTask);
  } catch (error) {
    console.error('Failed to create task:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}