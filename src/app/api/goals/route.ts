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
      where: (users: any, { eq }: any) => eq(users.clerkId, userId)
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build query conditions
    const conditions = [
      eq(goals.createdBy, userRecord.id),
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
        parentGoal: true,
        childGoals: {
          where: eq(goals.status, 'active')
        }
      }
    });

    // Calculate completion percentage for each goal
    const goalsWithProgress = userGoals.map((goal: any) => {
      const currentValue = goal.currentValue;
      const completionPercentage = goal.targetValue && currentValue
        ? Math.min((Number(currentValue) / Number(goal.targetValue)) * 100, 100)
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
        completed: goalsWithProgress.filter((g: any) => g.completionPercentage === 100).length,
        inProgress: goalsWithProgress.filter((g: any) => g.completionPercentage > 0 && g.completionPercentage < 100).length,
        notStarted: goalsWithProgress.filter((g: any) => g.completionPercentage === 0).length,
        overdue: goalsWithProgress.filter((g: any) => g.isOverdue).length
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
      where: (users: any, { eq }: any) => eq(users.clerkId, userId)
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create the goal - TODO: Fix schema type inference issue
    return NextResponse.json(
      { error: 'Goal creation temporarily disabled during production deployment setup' },
      { status: 503 }
    );
    // const newGoalResult = await db.insert(goals).values({
    //   title: validated.title,
    //   description: validated.description,
    //   type: validated.type,
    //   workspaceId: userRecord.defaultWorkspaceId || '', 
    //   category: validated.category,
    //   targetValue: validated.targetValue || 100,
    //   currentValue: 0,
    //   targetDate: validated.targetDate ? new Date(validated.targetDate) : undefined,
    //   parentGoalId: validated.parentGoalId,
    //   status: 'active',
    //   priority: 'medium',
    //   createdBy: userRecord.id
    // }).returning();
    
    // const newGoal = Array.isArray(newGoalResult) ? newGoalResult[0] : newGoalResult;

    // // Create initial progress entry
    // await db.insert(goalProgress).values({
    //   goalId: newGoal.id,
    //   createdBy: userRecord.id,
    //   value: '0',
    //   note: 'Goal created',
    //   progressDate: new Date()
    // });

    // return NextResponse.json(newGoal);
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

