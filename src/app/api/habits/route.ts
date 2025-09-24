import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { habits, habitEntries, users } from '@/db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

const CreateHabitSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string(),
  frequency: z.enum(['daily', 'weekly', 'custom']),
  targetCount: z.number().min(1),
  unit: z.string().optional(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'anytime']).optional(),
  reminderTime: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional()
});

// GET /api/habits - List habits with logs
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
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');

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
    const conditions = [eq(habits.userId, userRecord.id)];
    
    if (!includeArchived) {
      conditions.push(eq(habits.status, 'active'));
    }

    // Get habits
    const userHabits = await db.query.habits.findMany({
      where: and(...conditions),
      orderBy: [desc(habits.currentStreak), desc(habits.createdAt)]
    });

    // Get logs for date range (default last 30 days)
    const fromDate = dateFrom ? new Date(dateFrom) : subDays(new Date(), 30);
    const toDate = dateTo ? new Date(dateTo) : new Date();

    const habitIds = userHabits.map(h => h.id);
    const fromDateString = format(startOfDay(fromDate), 'yyyy-MM-dd');
    const toDateString = format(endOfDay(toDate), 'yyyy-MM-dd');
    
    const logs = habitIds.length > 0 
      ? await db.query.habitEntries.findMany({
          where: and(
            sql`${habitEntries.habitId} IN ${sql.raw(`(${habitIds.map(id => `'${id}'`).join(',')})`)}`,
            gte(habitEntries.date, fromDateString),
            lte(habitEntries.date, toDateString)
          )
        })
      : [];

    // Group logs by habit and date
    const logsByHabitAndDate = logs.reduce((acc, log) => {
      const dateKey = typeof log.date === 'string' ? log.date : format(new Date(log.date), 'yyyy-MM-dd');
      const habitKey = log.habitId;
      
      if (!acc[habitKey]) {
        acc[habitKey] = {};
      }
      acc[habitKey][dateKey] = log;
      
      return acc;
    }, {} as Record<string, Record<string, typeof logs[0]>>);

    // Calculate statistics for each habit
    const habitsWithStats = userHabits.map(habit => {
      const habitEntries = logsByHabitAndDate[habit.id] || {};
      const dates = Object.keys(habitEntries);
      const completedDays = dates.filter(date => habitEntries[date].completed).length;
      const totalDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
      const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

      // Check if completed today
      const todayKey = format(new Date(), 'yyyy-MM-dd');
      const completedToday = habitEntries[todayKey]?.completed || false;

      // Calculate current streak (handled by database, but we can verify)
      let currentStreak = 0;
      let date = new Date();
      while (true) {
        const dateKey = format(date, 'yyyy-MM-dd');
        if (habitEntries[dateKey]?.completed) {
          currentStreak++;
          date = subDays(date, 1);
        } else {
          break;
        }
      }

      return {
        ...habit,
        logs: habitEntries,
        stats: {
          completedDays,
          totalDays,
          completionRate,
          completedToday,
          currentStreak: Math.max(habit.currentStreak || 0, currentStreak),
          longestStreak: habit.longestStreak
        }
      };
    });

    // Overall statistics
    const overallStats = {
      totalHabits: habitsWithStats.length,
      activeToday: habitsWithStats.filter(h => h.stats.completedToday).length,
      totalCompletions: habitsWithStats.reduce((sum, h) => sum + h.stats.completedDays, 0),
      averageCompletionRate: habitsWithStats.length > 0
        ? habitsWithStats.reduce((sum, h) => sum + h.stats.completionRate, 0) / habitsWithStats.length
        : 0,
      longestStreak: Math.max(...habitsWithStats.map(h => h.longestStreak || 0), 0)
    };

    return NextResponse.json({
      habits: habitsWithStats,
      stats: overallStats,
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to fetch habits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habits' },
      { status: 500 }
    );
  }
}

// POST /api/habits - Create habit
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
    const validated = CreateHabitSchema.parse(body);

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

    // Create the habit
    const [newHabit] = await db.insert(habits).values({
      userId: userRecord.id,
      workspaceId: userRecord.id,
      name: validated.name,
      description: validated.description,
      category: validated.category,
      frequency: validated.frequency,
      targetValue: validated.targetCount?.toString(),
      unit: validated.unit || 'times',
      scheduledTime: validated.reminderTime,
      startDate: new Date().toISOString().split('T')[0],
      currentStreak: 0,
      longestStreak: 0,
      totalCompleted: 0,
      status: 'active',
      color: validated.color,
      icon: validated.icon
    }).returning();

    return NextResponse.json(newHabit);
  } catch (error) {
    console.error('Failed to create habit:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create habit' },
      { status: 500 }
    );
  }
}

// PATCH /api/habits/:id/log - Log habit completion
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { habitId, date, completed, value, notes } = body;

    if (!habitId) {
      return NextResponse.json(
        { error: 'Habit ID required' },
        { status: 400 }
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

    // Verify habit belongs to user
    const habit = await db.query.habits.findFirst({
      where: and(
        eq(habits.id, habitId),
        eq(habits.userId, userRecord.id)
      )
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    const logDate = date ? new Date(date) : new Date();
    const dateKey = format(logDate, 'yyyy-MM-dd');

    // Check if log exists for this date
    const existingLog = await db.query.habitEntries.findFirst({
      where: and(
        eq(habitEntries.habitId, habitId),
        sql`DATE(${habitEntries.date}) = ${dateKey}`
      )
    });

    let updatedLog;
    
    if (existingLog) {
      // Update existing log
      [updatedLog] = await db.update(habitEntries)
        .set({
          completed,
          value: value || (completed ? habit.targetValue : 0),
          notes
        })
        .where(eq(habitEntries.id, existingLog.id))
        .returning();
    } else {
      // Create new log
      [updatedLog] = await db.insert(habitEntries).values({
        habitId,
        date: logDate,
        completed,
        value: value || (completed ? habit.targetValue : 0),
        notes
      }).returning();
    }

    // Update habit streaks and stats
    if (completed) {
      // Calculate new streak
      let newStreak = 1;
      let checkDate = subDays(logDate, 1);
      
      for (let i = 0; i < 365; i++) {
        const prevLog = await db.query.habitEntries.findFirst({
          where: and(
            eq(habitEntries.habitId, habitId),
            sql`DATE(${habitEntries.date}) = ${format(checkDate, 'yyyy-MM-dd')}`,
            eq(habitEntries.completed, true)
          )
        });
        
        if (prevLog) {
          newStreak++;
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      }

      // Update habit stats
      await db.update(habits)
        .set({
          currentStreak: newStreak,
          longestStreak: sql`GREATEST(${habits.longestStreak}, ${newStreak})`,
          totalCompleted: sql`${habits.totalCompleted} + 1`,
          lastCompletedDate: logDate
        })
        .where(eq(habits.id, habitId));
    } else {
      // Reset current streak if uncompleting today's habit
      if (dateKey === format(new Date(), 'yyyy-MM-dd')) {
        await db.update(habits)
          .set({
            currentStreak: 0
          })
          .where(eq(habits.id, habitId));
      }
    }

    return NextResponse.json({
      log: updatedLog,
      message: completed ? 'Habit completed!' : 'Habit updated'
    });
  } catch (error) {
    console.error('Failed to log habit:', error);
    return NextResponse.json(
      { error: 'Failed to log habit' },
      { status: 500 }
    );
  }
}