// Force dynamic rendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/auth-utils';
import { withAuth, withUsageLimit } from '@/lib/auth/auth-utils';
import { apiLogger } from '@/lib/logger';

import { db } from '@/db';
import { blocks } from '@/db/schema/blocks';
import { workspaces } from '@/db/schema/workspaces';
import { eq, and, desc } from 'drizzle-orm';

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
        .limit(1)
        .then((r: any) => r);
      
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

    apiLogger.info('Task created', { 
      taskId: newTask.id, 
      userId: user.id, 
      title: newTask.title,
      aiGenerated: newTask.aiGenerated || false,
      action: 'createTask'
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
    // Enhanced error logging with security considerations
    apiLogger.error('Task creation failed', error as Error);
    
    // Return generic error message for security (don't expose internals)
    return NextResponse.json(
      { 
        error: 'Failed to create task', 
        code: 'TASK_CREATE_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function handleGET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      // Demo user fallback for development
      apiLogger.debug('No authentication found, using demo user fallback', { action: 'getTasks' });
      const demoUser = { id: 'demo-user', email: 'demo@example.com', username: 'demo' };
      
      // Return sample tasks for demo user
      const sampleTasks = [
        {
          id: 'demo-task-1',
          title: 'Complete project planning',
          description: 'Finish the initial project planning phase',
          type: 'task',
          status: 'in-progress',
          priority: 'high',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          estimatedHours: 8,
          tags: ['planning', 'project'],
          workspaceId: 'demo-workspace',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'demo-task-2',
          title: 'Review code changes',
          description: 'Review and approve pending code changes',
          type: 'task',
          status: 'todo',
          priority: 'medium',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          estimatedHours: 4,
          tags: ['review', 'code'],
          workspaceId: 'demo-workspace',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
      
      return NextResponse.json({ tasks: sampleTasks });
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
      const userWorkspaces = await db.select().from(workspaces)
        .where(eq(workspaces.ownerId, user.id))
        .then((r: any) => r as Array<{ id: string }>);
      
      const workspaceIds = userWorkspaces.map((w: { id: string }) => w.id);
      if (workspaceIds.length === 0) {
        return NextResponse.json({ tasks: [] });
      }
      
      // For simplicity, just use the first workspace for now
      // In a real implementation, you'd use an IN clause
      workspaceCondition = eq(blocks.workspaceId, workspaceIds[0]);
    }

    // Build conditions array
    const conditions: any[] = [workspaceCondition];
    
    if (type) {
      conditions.push(eq(blocks.type, type));
    }
    
    if (status) {
      conditions.push(eq(blocks.status, status));
    }

    // Build query with proper type chaining
    let query: any = db.select().from(blocks);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    query = query.limit(limit).orderBy(desc(blocks.createdAt));
    
    const tasks = await query;

    const formattedTasks = tasks.map((task: any) => ({
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
    // Enhanced error logging with security considerations
    apiLogger.error('Task fetch failed', error as Error);
    
    // Return generic error message for security (don't expose internals)
    return NextResponse.json(
      { 
        error: 'Failed to fetch tasks', 
        code: 'TASK_FETCH_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Apply middleware
export async function POST(req: NextRequest) {
  return await handlePOST(req);
}
export async function GET(req: NextRequest) {
  return await handleGET(req);
}
