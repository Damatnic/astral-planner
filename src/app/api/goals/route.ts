import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { goals, goalProgress, users } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

const CreateGoalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['lifetime', 'yearly', 'quarterly', 'monthly', 'weekly', 'daily']),
  category: z.string(),
  targetValue: z.number().optional(),
  targetDate: z.string().datetime().optional(),
  parentGoalId: z.string().uuid().optional(),
  milestones: z.array(z.object({
    title: z.string(),
    targetValue: z.number(),
    targetDate: z.string()
  })).optional()
});

// GET /api/goals - List goals
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
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'active';

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

    // Build query conditions
    const conditions = [
      eq(goals.userId, userRecord.id),
      eq(goals.status, status)
    ];

    if (type) {
      conditions.push(eq(goals.type, type));
    }

    if (category) {
      conditions.push(eq(goals.category, category));
    }

    // Query goals with progress
    const userGoals = await db.query.goals.findMany({
      where: and(...conditions),
      orderBy: [desc(goals.priority), desc(goals.createdAt)],
      with: {
        progress: {
          orderBy: (progress: any, { desc }: any) => [desc(progress.date)],
          limit: 1
        },
        parentGoal: true,
        childGoals: {
          where: eq(goals.status, 'active')
        }
      }
    });

    // Calculate completion percentage for each goal
    const goalsWithProgress = userGoals.map(goal => {
      const latestProgress = goal.progress[0];
      const currentValue = latestProgress?.value || goal.currentValue;
      const completionPercentage = goal.targetValue
        ? Math.min((currentValue / goal.targetValue) * 100, 100)
        : 0;

      return {
        ...goal,
        currentValue,
        completionPercentage,
        isOverdue: goal.targetDate && new Date(goal.targetDate) < new Date(),
        daysRemaining: goal.targetDate
          ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null
      };
    });

    return NextResponse.json({
      goals: goalsWithProgress,
      stats: {
        total: goalsWithProgress.length,
        completed: goalsWithProgress.filter(g => g.completionPercentage === 100).length,
        inProgress: goalsWithProgress.filter(g => g.completionPercentage > 0 && g.completionPercentage < 100).length,
        notStarted: goalsWithProgress.filter(g => g.completionPercentage === 0).length,
        overdue: goalsWithProgress.filter(g => g.isOverdue).length
      }
    });
  } catch (error) {
    console.error('Failed to fetch goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// POST /api/goals - Create goal
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
    const validated = CreateGoalSchema.parse(body);

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

    // Create the goal
    const [newGoal] = await db.insert(goals).values({
      userId: userRecord.id,
      title: validated.title,
      description: validated.description,
      type: validated.type,
      category: validated.category,
      targetValue: validated.targetValue || 100,
      currentValue: 0,
      targetDate: validated.targetDate ? new Date(validated.targetDate) : undefined,
      parentGoalId: validated.parentGoalId,
      status: 'active',
      priority: 'medium',
      metadata: {
        milestones: validated.milestones || [],
        createdFrom: 'web'
      }
    }).returning();

    // Create initial progress entry
    await db.insert(goalProgress).values({
      goalId: newGoal.id,
      value: 0,
      notes: 'Goal created',
      date: new Date()
    });

    return NextResponse.json(newGoal);
  } catch (error) {
    console.error('Failed to create goal:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}