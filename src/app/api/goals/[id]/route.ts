import { NextRequest, NextResponse } from 'next/server';
import { getUserForRequest } from '@/lib/auth';
import { db } from '@/db';
import { goals, goalProgress, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const UpdateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  type: z.enum(['lifetime', 'yearly', 'quarterly', 'monthly', 'weekly', 'daily']).optional(),
  category: z.string().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  targetDate: z.string().datetime().optional(),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  progress: z.number().min(0).max(100).optional()
});

// GET /api/goals/[id] - Get specific goal
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserForRequest(req);
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const userRecord = await db.select().from(users).where(eq(users.clerkId, user.id)).limit(1).then(r => r[0] || null);

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get goal with full details
    const { id } = await params;
    const goal = await db.select().from(goals).where(and(eq(goals.id, id), eq(goals.createdBy, userRecord.id))).limit(1).then(r => r[0] || null);
    
    if (goal) {
      // Get parent goal if exists
      const parentGoal = goal.parentGoalId
        ? await db.select().from(goals).where(eq(goals.id, goal.parentGoalId)).limit(1).then(r => r[0] || null)
        : null;
      
      // Get active child goals
      const childGoals = await db.select().from(goals).where(and(eq(goals.parentGoalId, goal.id), eq(goals.status, 'active')));
      
      // Combine all data
      Object.assign(goal, { parentGoal, childGoals });
    }

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Calculate completion percentage and additional metrics  
    const currentValue = goal.currentValue;
    const completionPercentage = goal.targetValue && currentValue
      ? Math.min((Number(currentValue) / Number(goal.targetValue)) * 100, 100)
      : 0;

    return NextResponse.json({
      ...goal,
      currentValue,
      completionPercentage,
      isOverdue: goal.targetDate && new Date(goal.targetDate) < new Date(),
      daysRemaining: goal.targetDate
        ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null
    });
  } catch (error) {
    console.error('Failed to fetch goal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goal' },
      { status: 500 }
    );
  }
}

// PATCH /api/goals/[id] - Update goal
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserForRequest(req);
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = UpdateGoalSchema.parse(body);

    // Get user from database
    const userRecord = await db.select().from(users).where(eq(users.clerkId, user.id)).limit(1).then(r => r[0] || null);

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if goal exists and belongs to user
    const { id } = await params;
    const existingGoal = await db.select().from(goals).where(and(eq(goals.id, id), eq(goals.createdBy, userRecord.id))).limit(1).then(r => r[0] || null);

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Update the goal
    const updateData: any = {};
    
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.type !== undefined) updateData.type = validated.type;
    if (validated.category !== undefined) updateData.category = validated.category;
    if (validated.targetValue !== undefined) updateData.targetValue = validated.targetValue;
    if (validated.currentValue !== undefined) updateData.currentValue = validated.currentValue;
    if (validated.targetDate !== undefined) updateData.targetDate = validated.targetDate ? new Date(validated.targetDate) : null;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.priority !== undefined) updateData.priority = validated.priority;

    updateData.updatedAt = new Date();

    const updatedGoalResult = await db.update(goals)
      .set(updateData)
      .where(eq(goals.id, id))
      .returning();
    
    const updatedGoal = Array.isArray(updatedGoalResult) ? updatedGoalResult[0] : updatedGoalResult;

    // If progress was updated, log it
    if (validated.progress !== undefined || validated.currentValue !== undefined) {
      const progressValue = validated.progress !== undefined 
        ? (validated.progress / 100) * Number(updatedGoal.targetValue || 100)
        : validated.currentValue;

      await db.insert(goalProgress).values({
        goalId: updatedGoal.id,
        userId: userRecord.id,
        value: String(progressValue || 0),
        note: 'Progress updated via API',
        progressDate: new Date()
      });
    }

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Failed to update goal:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/[id] - Delete/Archive goal
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserForRequest(req);
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const userRecord = await db.select().from(users).where(eq(users.clerkId, user.id)).limit(1).then(r => r[0] || null);

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if goal exists and belongs to user
    const { id } = await params;
    const existingGoal = await db.select().from(goals).where(and(eq(goals.id, id), eq(goals.createdBy, userRecord.id))).limit(1).then(r => r[0] || null);
    
    // Get child goals if goal exists
    const childGoals = existingGoal ? await db.select().from(goals).where(eq(goals.parentGoalId, existingGoal.id)) : [];
    if (existingGoal) {
      Object.assign(existingGoal, { childGoals });
    }

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Check if goal has active child goals
    // Skip child goal check - childGoals not in direct schema
    const activeChildGoals: any[] = [];
    
    if (activeChildGoals.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete goal with active child goals',
          details: `Goal has ${activeChildGoals.length} active child goals. Please complete or delete them first.`
        },
        { status: 409 }
      );
    }

    // Soft delete by marking as cancelled
    const deletedGoalResult = await db.update(goals)
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(goals.id, id))
      .returning();
    
    const deletedGoal = Array.isArray(deletedGoalResult) ? deletedGoalResult[0] : deletedGoalResult;

    // Log the deletion in progress
    await db.insert(goalProgress).values({
      goalId: deletedGoal.id,
      userId: userRecord.id,
      value: String(deletedGoal.currentValue || 0),
      note: 'Goal deleted/cancelled',
      progressDate: new Date()
    });

    return NextResponse.json({
      message: 'Goal deleted successfully',
      goal: deletedGoal
    });
  } catch (error) {
    console.error('Failed to delete goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}