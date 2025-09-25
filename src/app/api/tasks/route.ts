import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withUsageLimit } from '@/lib/auth/middleware';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { blocks } from '@/db/schema/blocks';
import { workspaces } from '@/db/schema/workspaces';
import { eq, and } from 'drizzle-orm';
import Logger from '@/lib/logger';

async function handlePOST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      title, 
      description, 
      priority = 'medium',
      estimatedHours,
      tags = [],
      type = 'task',
      workspaceId,
      dueDate,
      status = 'todo'
    } = body;

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Get user's default workspace if not specified
    let targetWorkspaceId = workspaceId;
    if (!targetWorkspaceId) {
      const userWorkspaces = await db.select().from(workspaces)
        .where(eq(workspaces.ownerId, user.id))
        .limit(1);
      
      if (userWorkspaces.length === 0) {
        return NextResponse.json(
          { error: 'No workspace found for user' },
          { status: 400 }
        );
      }
      
      targetWorkspaceId = userWorkspaces[0].id;
    }

    // Create the task/block
    const [newTask] = await db.insert(blocks).values({
      type: type,
      title: title.trim(),
      description: description?.trim() || null,
      workspaceId: targetWorkspaceId,
      status: status,
      priority: priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: user.id,
      lastEditedBy: user.id,
      tags: tags,
      aiGenerated: req.headers.get('x-ai-generated') === 'true',
      metadata: {
        estimatedHours: estimatedHours || null,
        source: 'api' // Track that this was created via API
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    Logger.info('Task created:', { 
      taskId: newTask.id, 
      userId: user.id, 
      title: newTask.title,
      aiGenerated: newTask.aiGenerated || false
    });

    return NextResponse.json({
      success: true,
      task: {
        id: newTask.id,
        title: newTask.title,
        description: newTask.description,
        type: newTask.type,
        status: newTask.status,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        estimatedHours: (newTask.metadata as any)?.estimatedHours,
        tags: newTask.tags || [],
        workspaceId: newTask.workspaceId,
        createdAt: newTask.createdAt,
      }
    });
  } catch (error) {
    Logger.error('Task creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

async function handleGET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status');
    const type = searchParams.get('type') || 'task';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get user's workspaces
    let workspaceCondition;
    if (workspaceId) {
      // Verify user owns this workspace
      const workspace = await db.select().from(workspaces)
        .where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, user.id)))
        .limit(1);
      
      if (workspace.length === 0) {
        return NextResponse.json(
          { error: 'Workspace not found or access denied' },
          { status: 403 }
        );
      }
      
      workspaceCondition = eq(blocks.workspaceId, workspaceId);
    } else {
      // Get all user's workspace IDs
      const userWorkspaces = await db.select({ id: workspaces.id }).from(workspaces)
        .where(eq(workspaces.ownerId, user.id));
      
      const workspaceIds = userWorkspaces.map(w => w.id);
      if (workspaceIds.length === 0) {
        return NextResponse.json({ tasks: [] });
      }
      
      // For simplicity, just use the first workspace for now
      // In a real implementation, you'd use an IN clause
      workspaceCondition = eq(blocks.workspaceId, workspaceIds[0]);
    }

    // Build conditions array
    const conditions = [workspaceCondition];
    
    if (type) {
      conditions.push(eq(blocks.type, type));
    }
    
    if (status) {
      conditions.push(eq(blocks.status, status));
    }

    const tasks = await db.select().from(blocks)
      .where(and(...conditions))
      .limit(limit)
      .orderBy(blocks.createdAt);

    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      estimatedHours: (task.metadata as any)?.estimatedHours,
      tags: task.tags || [],
      workspaceId: task.workspaceId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error) {
    Logger.error('Task fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// Apply middleware
export const POST = withUsageLimit('blocks', withAuth(handlePOST));
export const GET = withAuth(handleGET);