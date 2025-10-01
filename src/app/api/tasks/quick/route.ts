// Force dynamic rendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/auth-utils';
import { apiLogger } from '@/lib/logger';

import { db } from '@/db';
import { blocks } from '@/db/schema/blocks';
import { goals } from '@/db/schema/goals';
import { habits } from '@/db/schema/habits';
import { workspaces } from '@/db/schema/workspaces';
import { eq } from 'drizzle-orm';

import { broadcastTaskUpdate } from '@/lib/realtime/broadcaster';

async function handlePOST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      title, 
      type = 'task', 
      description, 
      priority = 'medium', 
      dueDate, 
      estimatedDuration, 
      tags = [],
      category 
    } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Get user's default workspace
    const userWorkspaces = await db.select().from(workspaces).where(eq(workspaces.ownerId, user.id)).limit(1) as Array<{ id: string; ownerId: string; name: string }>;
    if (userWorkspaces.length === 0) {
      return NextResponse.json(
        { error: 'No workspace found for user' },
        { status: 400 }
      );
    }

    const workspaceId = userWorkspaces[0].id;
    let result = null;

    switch (type) {
      case 'task':
        const [newTask] = await db.insert(blocks).values({
          type: 'task',
          title,
          description: description || null,
          workspaceId,
          createdBy: user.id,
          lastEditedBy: user.id,
          status: 'todo',
          priority,
          dueDate: dueDate ? new Date(dueDate) : null,
          estimatedDuration: estimatedDuration ? Math.round(estimatedDuration) : null,
          tags,
          category: category || null,
          metadata: {
            source: 'quick_capture',
            createdVia: 'api'
          }
        }).returning();
        
        result = { ...newTask, type: 'task' };
        break;

      case 'event':
        const [newEvent] = await db.insert(blocks).values({
          type: 'event',
          title,
          description: description || null,
          workspaceId,
          createdBy: user.id,
          lastEditedBy: user.id,
          status: 'todo',
          priority,
          startDate: dueDate ? new Date(dueDate) : null,
          estimatedDuration: estimatedDuration ? Math.round(estimatedDuration) : 60,
          tags,
          category: category || 'meeting',
          metadata: {
            source: 'quick_capture',
            createdVia: 'api'
          }
        }).returning();
        
        result = { ...newEvent, type: 'event' };
        break;

      case 'goal':
        const [newGoal] = await db.insert(goals).values({
          title,
          description: description || null,
          type: 'weekly', // Default goal type
          workspaceId,
          createdBy: user.id,
          status: 'not_started',
          priority,
          targetDate: dueDate ? new Date(dueDate) : null,
          category: category || 'personal'
        }).returning();
        
        result = { ...newGoal, type: 'goal' };
        break;

      case 'habit':
        const [newHabit] = await db.insert(habits).values({
          name: title,
          description: description || null,
          userId: user.id,
          workspaceId,
          category: category || 'personal',
          type: 'boolean',
          frequency: 'daily',
          startDate: new Date().toISOString().split('T')[0],
          status: 'active'
        }).returning();
        
        result = { ...newHabit, type: 'habit' };
        break;

      case 'note':
        const [newNote] = await db.insert(blocks).values({
          type: 'note',
          title,
          description: description || title, // For notes, description is the main content
          workspaceId,
          createdBy: user.id,
          lastEditedBy: user.id,
          status: 'completed', // Notes are considered "complete" when created
          priority: 'low',
          tags,
          category: category || 'notes',
          metadata: {
            source: 'quick_capture',
            createdVia: 'api'
          }
        }).returning();
        
        result = { ...newNote, type: 'note' };
        break;

      case 'time':
        const [newTimeBlock] = await db.insert(blocks).values({
          type: 'time_block',
          title,
          description: description || null,
          workspaceId,
          createdBy: user.id,
          lastEditedBy: user.id,
          status: 'todo',
          priority,
          startDate: dueDate ? new Date(dueDate) : null,
          estimatedDuration: estimatedDuration ? Math.round(estimatedDuration) : 60,
          tags,
          category: category || 'focus',
          metadata: {
            source: 'quick_capture',
            createdVia: 'api'
          }
        }).returning();
        
        result = { ...newTimeBlock, type: 'time_block' };
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported item type: ${type}` },
          { status: 400 }
        );
    }

    // Broadcast real-time update
    try {
      if (type === 'task' || type === 'event' || type === 'note' || type === 'time') {
        await broadcastTaskUpdate(
          {
            workspaceId,
            userId: user.id,
          },
          {
            taskId: result.id,
            action: 'created',
            task: result,
          }
        );
      }
    } catch (broadcastError) {
      apiLogger.warn('Failed to broadcast task creation', { action: 'createQuickTask' }, broadcastError as Error);
      // Don't fail the request if broadcasting fails
    }

    apiLogger.info('Quick item created', { 
      type, 
      title, 
      userId: user.id,
      itemId: result?.id,
      action: 'createQuickTask'
    });

    return NextResponse.json({
      success: true,
      item: result,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully`
    });

  } catch (error) {
    apiLogger.error('Quick creation error', { action: 'createQuickTask' }, error as Error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return await handlePOST(req);
}
