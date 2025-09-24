import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { habits, habitEntries, users } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { format } from 'date-fns';

const UpdateHabitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'custom']).optional(),
  targetCount: z.number().min(1).optional(),
  unit: z.string().optional(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'anytime']).optional(),
  reminderTime: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed', 'abandoned']).optional(),
  color: z.string().optional(),
  icon: z.string().optional()
});

// GET /api/habits/[id] - Get specific habit with detailed logs
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      where: (users: any, { eq }: any) => eq(users.clerkId, userId)
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get habit
    const { id } = await params;
    const habit = await db.query.habits.findFirst({
      where: (habits: any, { eq, and }: any) => and(
        eq(habits.id, id),
        eq(habits.userId, userRecord.id)
      )
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    // Get all entries for this habit (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgoString = ninetyDaysAgo.toISOString().split('T')[0];
    
    const entries = await db.query.habitEntries.findMany({
      where: (entries: any, { eq, gte }: any) => and(
        eq(entries.habitId, id),
        gte(entries.date, ninetyDaysAgoString)
      ),
      orderBy: [desc(habitEntries.date)]
    });

    // Calculate comprehensive statistics
    const totalEntries = entries.length;
    const completedEntries = entries.filter((e: any) => e.completed).length;
    const completionRate = totalEntries > 0 ? (completedEntries / totalEntries) * 100 : 0;

    // Check if completed today
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const todayEntry = entries.find((e: any) => {
      const entryDate = typeof e.date === 'string' ? e.date : format(new Date(e.date), 'yyyy-MM-dd');
      return entryDate === todayKey;
    });
    const completedToday = todayEntry?.completed || false;

    // Calculate streak history
    const streakHistory = [];
    let currentStreak = 0;
    let tempStreak = 0;
    const sortedEntries = [...entries].reverse(); // Oldest first

    for (const entry of sortedEntries) {
      if (entry.completed) {
        tempStreak++;
      } else {
        if (tempStreak > 0) {
          streakHistory.push({
            length: tempStreak,
            endDate: entry.date
          });
        }
        tempStreak = 0;
      }
    }

    // Calculate weekly patterns
    const weeklyPattern = entries.reduce((acc: any, entry: any) => {
      const entryDate = typeof entry.date === 'string' ? new Date(entry.date) : new Date(entry.date);
      const dayOfWeek = entryDate.getDay();
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
      
      if (!acc[dayName]) {
        acc[dayName] = { total: 0, completed: 0 };
      }
      
      acc[dayName].total++;
      if (entry.completed) {
        acc[dayName].completed++;
      }
      
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    return NextResponse.json({
      ...habit,
      entries: entries.slice(0, 30), // Return last 30 entries
      stats: {
        totalEntries,
        completedEntries,
        completionRate,
        completedToday,
        currentStreak: habit.currentStreak,
        longestStreak: habit.longestStreak,
        totalCompleted: habit.totalCompleted,
        streakHistory: streakHistory.slice(-10), // Last 10 streaks
        weeklyPattern
      }
    });
  } catch (error) {
    console.error('Failed to fetch habit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habit' },
      { status: 500 }
    );
  }
}

// PATCH /api/habits/[id] - Update habit
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const validated = UpdateHabitSchema.parse(body);

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

    // Check if habit exists and belongs to user
    const existingHabit = await db.query.habits.findFirst({
      where: (habits: any, { eq, and }: any) => and(
        eq(habits.id, id),
        eq(habits.userId, userRecord.id)
      )
    });

    if (!existingHabit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    // Update the habit
    const updateData: any = {};
    
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.category !== undefined) updateData.category = validated.category;
    if (validated.frequency !== undefined) updateData.frequency = validated.frequency;
    if (validated.targetCount !== undefined) updateData.targetCount = validated.targetCount;
    if (validated.unit !== undefined) updateData.unit = validated.unit;
    if (validated.timeOfDay !== undefined) updateData.timeOfDay = validated.timeOfDay;
    if (validated.reminderTime !== undefined) updateData.reminderTime = validated.reminderTime;
    if (validated.status !== undefined) updateData.status = validated.status;

    // Handle color and icon updates
    if (validated.color !== undefined) updateData.color = validated.color;
    if (validated.icon !== undefined) updateData.icon = validated.icon;

    updateData.updatedAt = new Date();

    const updatedHabitResult = await db.update(habits)
      .set(updateData)
      .where(eq(habits.id, id))
      .returning();
      
    const updatedHabit = Array.isArray(updatedHabitResult) ? updatedHabitResult[0] : updatedHabitResult;

    return NextResponse.json(updatedHabit);
  } catch (error) {
    console.error('Failed to update habit:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update habit' },
      { status: 500 }
    );
  }
}

// DELETE /api/habits/[id] - Delete/Archive habit
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      where: (users: any, { eq }: any) => eq(users.clerkId, userId)
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if habit exists and belongs to user
    const existingHabit = await db.query.habits.findFirst({
      where: (habits: any, { eq, and }: any) => and(
        eq(habits.id, id),
        eq(habits.userId, userRecord.id)
      )
    });

    if (!existingHabit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    if (permanent) {
      // Hard delete: Remove habit and all associated entries
      // First delete all habit entries
      await db.delete(habitEntries)
        .where(eq(habitEntries.habitId, id));
      
      // Then delete the habit
      await db.delete(habits)
        .where(eq(habits.id, id));

      return NextResponse.json({
        message: 'Habit permanently deleted',
        deleted: true
      });
    } else {
      // Soft delete: Mark as inactive
      const deletedHabitResult = await db.update(habits)
        .set({
          status: 'abandoned',
          isArchived: true,
          archivedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(habits.id, id))
        .returning();
        
      const deletedHabit = Array.isArray(deletedHabitResult) ? deletedHabitResult[0] : deletedHabitResult;

      return NextResponse.json({
        message: 'Habit archived successfully',
        habit: deletedHabit
      });
    }
  } catch (error) {
    console.error('Failed to delete habit:', error);
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    );
  }
}