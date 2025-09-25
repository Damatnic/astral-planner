import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { goals, goalProgress, goalMilestones, users, workspaces } from '@/db/schema';
import { eq, and, desc, sql, count, or, like } from 'drizzle-orm';
import { z } from 'zod';
import { 
  createGoalSchema, 
  paginationSchema, 
  filterSchema, 
  validateRequest,
  sanitizeRequestData 
} from '@/lib/validation';
import { securityMiddleware, corsHeaders, securityHeaders } from '@/lib/security';
import { requireAuth, getUserForRequest } from '@/lib/auth';
import Logger, { AppError } from '@/lib/logger';
import { APIResponse, Goal, GoalWithStats } from '@/types';

// Enhanced goal creation schema with all fields
const CreateGoalSchema = createGoalSchema.extend({
  type: z.enum(['lifetime', 'yearly', 'quarterly', 'monthly', 'weekly', 'daily']).optional(),
  category: z.string().min(1, 'Category is required'),
  targetValue: z.number().positive().optional(),
  currentValue: z.number().min(0).optional().default(0),
  milestones: z.array(z.object({
    title: z.string().min(1, 'Milestone title is required'),
    targetValue: z.number().positive(),
    targetDate: z.string().datetime()
  })).optional()
});

// GET /api/goals - List goals with enhanced filtering and pagination
export async function GET(req: NextRequest) {
  // Apply security middleware
  const securityResponse = await securityMiddleware(req);
  if (securityResponse) return securityResponse;

  const startTime = Date.now();
  Logger.info(`GET /api/goals - Request started`, { 
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
    userAgent: req.headers.get('user-agent')
  });

  try {
    // Get authenticated user
    const user = await getUserForRequest(req);
    
    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    // Parse and validate query parameters
    const searchParams = req.nextUrl.searchParams;
    const paginationParams = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort: searchParams.get('sort'),
      order: searchParams.get('order')
    });

    const filterParams = filterSchema.parse({
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      priority: searchParams.get('priority'),
      category: searchParams.get('category'),
      tags: searchParams.get('tags')
    });

    // Additional goal-specific filters
    const type = searchParams.get('type');
    const parentId = searchParams.get('parentId');
    const isCompleted = searchParams.get('completed') === 'true';

    // Get or create user record
    let userRecord = await db.select().from(users).where(eq(users.clerkId, user.id)).limit(1).then(r => r[0] || null);

    if (!userRecord && process.env.NODE_ENV === 'development') {
      // Create mock user for development
      userRecord = {
        id: 'mock-user-id',
        clerkId: user.id,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any;
    }

    if (!userRecord) {
      throw new AppError('User not found', 404);
    }

    // Build dynamic query conditions
    const conditions = [eq(goals.createdBy, userRecord.id)];

    // Status filtering
    if (filterParams.status) {
      conditions.push(eq(goals.status, filterParams.status));
    } else if (!isCompleted) {
      conditions.push(or(
        eq(goals.status, 'not_started'),
        eq(goals.status, 'in_progress'),
        eq(goals.status, 'on_hold')
      ) || eq(goals.status, 'not_started'));
    }

    // Search functionality
    if (filterParams.search) {
      conditions.push(
        or(
          like(goals.title, `%${filterParams.search}%`),
          like(goals.description, `%${filterParams.search}%`)
        ) || like(goals.title, `%${filterParams.search}%`)
      );
    }

    // Category filtering
    if (filterParams.category) {
      conditions.push(eq(goals.category, filterParams.category));
    }

    // Priority filtering
    if (filterParams.priority) {
      conditions.push(eq(goals.priority, filterParams.priority));
    }

    // Type filtering
    if (type) {
      conditions.push(eq(goals.type, type));
    }

    // Parent filtering
    if (parentId) {
      conditions.push(eq(goals.parentGoalId, parentId));
    }

    // Get total count for pagination
    const [totalResult] = await db.select({ count: count() })
      .from(goals)
      .where(and(...conditions));
    
    const total = totalResult.count;
    const totalPages = Math.ceil(total / paginationParams.limit);

    // Build sort column mapping
    const sortColumns: Record<string, any> = {
      createdAt: goals.createdAt,
      updatedAt: goals.updatedAt,
      title: goals.title,
      priority: goals.priority,
      dueDate: goals.targetDate,
      status: goals.status
    };

    const sortColumn = sortColumns[paginationParams.sort] || goals.createdAt;
    const orderBy = paginationParams.order === 'asc' ? [sortColumn] : [desc(sortColumn)];

    // Query goals with basic data first
    const userGoals = await db.select().from(goals)
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(paginationParams.limit)
      .offset((paginationParams.page - 1) * paginationParams.limit);

    // Get related data for each goal
    const goalsWithRelations = await Promise.all(userGoals.map(async (goal) => {
      // Get parent goal if exists
      const parentGoal = goal.parentGoalId 
        ? await db.select().from(goals).where(eq(goals.id, goal.parentGoalId)).limit(1).then(r => r[0] || null)
        : null;
      
      // Get child goals in progress
      const childGoals = await db.select().from(goals)
        .where(and(eq(goals.parentGoalId, goal.id), eq(goals.status, 'in_progress')));
      
      // Get milestones
      const milestones = await db.select().from(goalMilestones).where(eq(goalMilestones.goalId, goal.id));
      
      // Get latest progress
      const progress = await db.select().from(goalProgress)
        .where(eq(goalProgress.goalId, goal.id))
        .orderBy(desc(goalProgress.progressDate))
        .limit(1);
      
      return {
        ...goal,
        parentGoal,
        childGoals,
        milestones,
        progress
      };
    }));

    // Enhanced goal processing with statistics
    const goalsWithStats: GoalWithStats[] = goalsWithRelations.map((goal: any) => {
      const currentValue = parseFloat(goal.currentValue) || 0;
      const targetValue = parseFloat(goal.targetValue) || 100;
      const progress = Math.min((currentValue / targetValue) * 100, 100);
      
      // Calculate task statistics (mock for now)
      const totalTasks = goal.childGoals?.length || 0;
      const completedTasks = goal.childGoals?.filter((child: any) => child.status === 'completed')?.length || 0;
      
      return {
        ...goal,
        currentValue,
        targetValue,
        progress,
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        isOverdue: goal.targetDate && new Date(goal.targetDate) < new Date(),
        daysRemaining: goal.targetDate
          ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
        milestoneProgress: goal.milestones?.filter((m: any) => m.isCompleted).length || 0,
        totalMilestones: goal.milestones?.length || 0
      };
    });

    // Calculate summary statistics
    const stats = {
      total,
      completed: goalsWithStats.filter(g => g.progress === 100).length,
      inProgress: goalsWithStats.filter(g => g.progress > 0 && g.progress < 100).length,
      notStarted: goalsWithStats.filter(g => g.progress === 0).length,
      overdue: goalsWithStats.filter(g => g.isOverdue).length,
      averageProgress: goalsWithStats.length > 0 
        ? goalsWithStats.reduce((sum, g) => sum + g.progress, 0) / goalsWithStats.length 
        : 0
    };

    const responseTime = Date.now() - startTime;
    Logger.info(`GET /api/goals - Success`, { 
      responseTime, 
      goalCount: goalsWithStats.length,
      userId: userRecord.id
    });

    return NextResponse.json({
      success: true,
      data: goalsWithStats,
      meta: {
        page: paginationParams.page,
        limit: paginationParams.limit,
        total,
        totalPages
      },
      stats
    }, {
      headers: {
        ...corsHeaders(req),
        ...securityHeaders()
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    Logger.error('GET /api/goals - Error', { error, responseTime });

    if (error instanceof AppError) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { 
        status: error.statusCode,
        headers: {
          ...corsHeaders(req),
          ...securityHeaders()
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch goals'
    }, { 
      status: 500,
      headers: {
        ...corsHeaders(req),
        ...securityHeaders()
      }
    });
  }
}

// POST /api/goals - Create goal  
export async function POST(req: NextRequest) {
  // Apply security middleware
  const securityResponse = await securityMiddleware(req);
  if (securityResponse) return securityResponse;

  const startTime = Date.now();
  Logger.info(`POST /api/goals - Request started`);

  try {
    // Get authenticated user
    const user = await getUserForRequest(req);
    
    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    const body = await req.json();
    const sanitizedBody = sanitizeRequestData(body);
    const validated = CreateGoalSchema.parse(sanitizedBody);

    // Get or create user record
    let userRecord = await db.select().from(users).where(eq(users.clerkId, user.id)).limit(1).then(r => r[0] || null);

    if (!userRecord && process.env.NODE_ENV === 'development') {
      // Create mock user for development
      userRecord = {
        id: 'mock-user-id',
        clerkId: user.id,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any;
    }

    if (!userRecord) {
      throw new AppError('User not found', 404);
    }

    // Create the goal in the database
    const goalData = {
      title: validated.title,
      description: validated.description,
      type: validated.type || 'monthly',
      category: validated.category,
      priority: validated.priority || 'medium',
      status: validated.status || 'not_started',
      targetValue: validated.targetValue?.toString() || '100',
      currentValue: validated.currentValue?.toString() || '0',
      targetDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
      parentGoalId: validated.parentId || undefined,
      workspaceId: userRecord.id, // Use user ID as workspace ID for now
      createdBy: userRecord.id,
      isPublic: validated.isPublic || false
    };

    const [newGoal] = await db.insert(goals).values(goalData).returning();

    // Add milestones if provided
    if (validated.milestones && validated.milestones.length > 0) {
      await Promise.all(validated.milestones.map(async (milestone, index) => {
        await db.insert(goalMilestones).values({
          goalId: newGoal.id,
          title: milestone.title,
          targetValue: milestone.targetValue.toString(),
          targetDate: new Date(milestone.targetDate),
          position: index + 1
        });
      }));
    }

    const responseTime = Date.now() - startTime;
    Logger.info(`POST /api/goals - Success`, { 
      responseTime,
      goalId: newGoal.id,
      userId: userRecord.id
    });

    return NextResponse.json({
      success: true,
      data: newGoal,
      message: 'Goal created successfully'
    }, {
      headers: {
        ...corsHeaders(req),
        ...securityHeaders()
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    Logger.error('POST /api/goals - Error', { error, responseTime });

    if (error instanceof AppError) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { 
        status: error.statusCode,
        headers: {
          ...corsHeaders(req),
          ...securityHeaders()
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create goal'
    }, { 
      status: 500,
      headers: {
        ...corsHeaders(req),
        ...securityHeaders()
      }
    });
  }
}


