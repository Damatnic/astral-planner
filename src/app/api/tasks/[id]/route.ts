import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { blocks, users, workspaces, workspaceMembers, blockActivity } from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { z } from 'zod';

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'completed', 'cancelled', 'waiting']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  estimatedDuration: z.number().optional(),
  actualDuration: z.number().optional(),
  tags: z.array(z.string()).optional(),
  assignedTo: z.string().uuid().optional(),
  position: z.number().optional(),
  completedAt: z.string().datetime().optional()
});

// GET /api/tasks/[id] - Get specific task
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
){ 
  const { id } = await params;
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const userRecord = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkId, userId)
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get task with relations
    const task = await db.query.blocks.findFirst({
      where: eq(blocks.id, id),
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
        },
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (task.createdBy !== userRecord.id) {
      // Check workspace access
      if (task.workspace && !Array.isArray(task.workspace) && task.workspace.ownerId !== userRecord.id) {
        const membership = await db.query.workspaceMembers.findFirst({
          where: and(
            eq(workspaceMembers.workspaceId, task.workspaceId),
            eq(workspaceMembers.userId, userRecord.id)
          )
        });

        if (!membership) {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          );
        }
      }
    }

    // Get activity history
    const activities = await db.query.blockActivity.findMany({
      where: eq(blockActivity.blockId, id),
      orderBy: [desc(blockActivity.createdAt)],
      limit: 20,
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true
          }
        }
      }
    });

    return NextResponse.json({
      ...task,
      activities,
      canEdit: task.createdBy === userRecord.id || (task.workspace && !Array.isArray(task.workspace) && task.workspace.ownerId === userRecord.id)
    });
  } catch (error) {
    console.error('Failed to fetch task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] - Update task
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
){ 
  const { id } = await params;
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = UpdateTaskSchema.parse(body);

    // Get user from database
    const userRecord = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkId, userId)
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get existing task
    const existingTask = await db.query.blocks.findFirst({
      where: eq(blocks.id, id),
      with: {
        workspace: true
      }
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (existingTask.createdBy !== userRecord.id && existingTask.workspace && !Array.isArray(existingTask.workspace) && existingTask.workspace.ownerId !== userRecord.id) {
      const membership = await db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.workspaceId, existingTask.workspaceId),
          eq(workspaceMembers.userId, userRecord.id)
        )
      });

      if (!membership) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    const changes: any = {};
    
    if (validated.title !== undefined && validated.title !== existingTask.title) {
      updateData.title = validated.title;
      changes.title = { from: existingTask.title, to: validated.title };
    }
    
    if (validated.description !== undefined) {
      const newContent = { ...(existingTask.content || {}), text: validated.description };
      updateData.content = newContent;
      changes.description = { from: (existingTask.content as any)?.text || '', to: validated.description };
    }

    if (validated.status !== undefined && validated.status !== existingTask.status) {
      updateData.status = validated.status;
      changes.status = { from: existingTask.status, to: validated.status };
      
      // Set completion time if marking as completed
      if (validated.status === 'completed') {
        updateData.completedAt = new Date();
        changes.completedAt = new Date().toISOString();
      } else if (existingTask.completedAt) {
        updateData.completedAt = null;
        changes.completedAt = null;
      }
    }

    if (validated.priority !== undefined && validated.priority !== existingTask.priority) {
      updateData.priority = validated.priority;
      changes.priority = { from: existingTask.priority, to: validated.priority };
    }

    if (validated.dueDate !== undefined) {
      const newDueDate = validated.dueDate ? new Date(validated.dueDate) : null;
      if (newDueDate?.getTime() !== existingTask.dueDate?.getTime()) {
        updateData.dueDate = newDueDate;
        changes.dueDate = { from: existingTask.dueDate, to: newDueDate };
      }
    }

    if (validated.startDate !== undefined) {
      const newStartDate = validated.startDate ? new Date(validated.startDate) : null;
      if (newStartDate?.getTime() !== existingTask.startDate?.getTime()) {
        updateData.startDate = newStartDate;
        changes.startDate = { from: existingTask.startDate, to: newStartDate };
      }
    }

    if (validated.estimatedDuration !== undefined && validated.estimatedDuration !== existingTask.estimatedDuration) {
      updateData.estimatedDuration = validated.estimatedDuration;
      changes.estimatedDuration = { from: existingTask.estimatedDuration, to: validated.estimatedDuration };
    }

    if (validated.actualDuration !== undefined && validated.actualDuration !== existingTask.actualDuration) {
      updateData.actualDuration = validated.actualDuration;
      changes.actualDuration = { from: existingTask.actualDuration, to: validated.actualDuration };
    }

    if (validated.tags !== undefined) {
      updateData.tags = validated.tags;
      changes.tags = { from: existingTask.tags, to: validated.tags };
    }

    if (validated.assignedTo !== undefined && validated.assignedTo !== existingTask.assignedTo) {
      updateData.assignedTo = validated.assignedTo;
      changes.assignedTo = { from: existingTask.assignedTo, to: validated.assignedTo };
    }

    if (validated.position !== undefined && validated.position !== existingTask.position) {
      updateData.position = validated.position;
      changes.position = { from: existingTask.position, to: validated.position };
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        message: 'No changes detected',
        task: existingTask
      });
    }

    updateData.updatedAt = new Date();

    // Update task
    const updatedTaskResult = await db.update(blocks)
      .set(updateData)
      .where(eq(blocks.id, id))
      .returning();
    
    const updatedTask = Array.isArray(updatedTaskResult) ? updatedTaskResult[0] : updatedTaskResult;

    // Update user stats if task was completed
    if (validated.status === 'completed' && existingTask.status !== 'completed') {
      await db.update(users)
        .set({
          totalTasksCompleted: sql`${users.totalTasksCompleted} + 1`,
          updatedAt: new Date()
        })
        .where(eq(users.id, userRecord.id));
    }

    // Log activity
    if (Object.keys(changes).length > 0) {
      await db.insert(blockActivity).values({
        blockId: updatedTask.id,
        userId: userRecord.id,
        action: 'updated',
        metadata: {
          changes,
          title: updatedTask.title
        }
      });
    }

    return NextResponse.json({
      message: 'Task updated successfully',
      task: updatedTask,
      changes
    });
  } catch (error) {
    console.error('Failed to update task:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
){ 
  const { id } = await params;
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const permanent = searchParams.get('permanent') === 'true';

    // Get user from database
    const userRecord = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkId, userId)
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get existing task
    const existingTask = await db.query.blocks.findFirst({
      where: eq(blocks.id, id),
      with: {
        workspace: true
      }
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (existingTask.createdBy !== userRecord.id && existingTask.workspace && !Array.isArray(existingTask.workspace) && existingTask.workspace.ownerId !== userRecord.id) {
      const membership = await db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.workspaceId, existingTask.workspaceId),
          eq(workspaceMembers.userId, userRecord.id)
        )
      });

      if (!membership) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // TODO: Add children check once relations are restored

    if (permanent) {
      // Hard delete: Remove task completely
      await db.delete(blocks)
        .where(eq(blocks.id, id));

      return NextResponse.json({
        message: 'Task permanently deleted',
        deleted: true
      });
    } else {
      // Soft delete: Mark as deleted
      const deletedTaskResult = await db.update(blocks)
        .set({
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(blocks.id, id))
        .returning();
        
      const deletedTask = Array.isArray(deletedTaskResult) ? deletedTaskResult[0] : deletedTaskResult;

      // Log activity
      await db.insert(blockActivity).values({
        blockId: deletedTask.id,
        userId: userRecord.id,
        action: 'deleted',
        metadata: {
          title: deletedTask.title,
          permanent: false
        }
      });

      return NextResponse.json({
        message: 'Task moved to trash',
        task: deletedTask
      });
    }
  } catch (error) {
    console.error('Failed to delete task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}