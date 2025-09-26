import { NextRequest, NextResponse } from 'next/server';

// GET /api/habits - List habits with logs (Demo version)
export async function GET(req: NextRequest) {
  try {
    console.log('Fetching habits with demo data');

    // Return demo habits data for production demo
    const demoHabits = [
      {
        id: 'habit-1',
        name: 'Morning Meditation',
        description: 'Start each day with 10 minutes of meditation',
        category: 'Wellness',
        frequency: 'daily',
        targetValue: '1',
        unit: 'session',
        currentStreak: 7,
        longestStreak: 21,
        totalCompleted: 45,
        color: '#3B82F6',
        icon: 'Brain',
        stats: {
          completedDays: 7,
          totalDays: 30,
          completionRate: 23.3,
          completedToday: true,
          currentStreak: 7,
          longestStreak: 21
        },
        logs: {}
      },
      {
        id: 'habit-2',
        name: 'Daily Exercise',
        description: 'Get at least 30 minutes of physical activity',
        category: 'Health',
        frequency: 'daily',
        targetValue: '30',
        unit: 'minutes',
        currentStreak: 3,
        longestStreak: 15,
        totalCompleted: 28,
        color: '#10B981',
        icon: 'Activity',
        stats: {
          completedDays: 5,
          totalDays: 30,
          completionRate: 16.7,
          completedToday: false,
          currentStreak: 3,
          longestStreak: 15
        },
        logs: {}
      },
      {
        id: 'habit-3',
        name: 'Read 30 Pages',
        description: 'Read at least 30 pages of a book every day',
        category: 'Learning',
        frequency: 'daily',
        targetValue: '30',
        unit: 'pages',
        currentStreak: 12,
        longestStreak: 28,
        totalCompleted: 67,
        color: '#8B5CF6',
        icon: 'BookOpen',
        stats: {
          completedDays: 12,
          totalDays: 30,
          completionRate: 40.0,
          completedToday: true,
          currentStreak: 12,
          longestStreak: 28
        },
        logs: {}
      },
      {
        id: 'habit-4',
        name: 'Drink 8 Glasses Water',
        description: 'Stay hydrated with 8 glasses of water daily',
        category: 'Health',
        frequency: 'daily',
        targetValue: '8',
        unit: 'glasses',
        currentStreak: 5,
        longestStreak: 14,
        totalCompleted: 22,
        color: '#06B6D4',
        icon: 'Droplets',
        stats: {
          completedDays: 8,
          totalDays: 30,
          completionRate: 26.7,
          completedToday: false,
          currentStreak: 5,
          longestStreak: 14
        },
        logs: {}
      }
    ];

    // Overall statistics
    const overallStats = {
      totalHabits: demoHabits.length,
      activeToday: demoHabits.filter(h => h.stats.completedToday).length,
      totalCompletions: demoHabits.reduce((sum, h) => sum + h.stats.completedDays, 0),
      averageCompletionRate: demoHabits.reduce((sum, h) => sum + h.stats.completionRate, 0) / demoHabits.length,
      longestStreak: Math.max(...demoHabits.map(h => h.longestStreak))
    };

    return NextResponse.json({
      habits: demoHabits,
      stats: overallStats,
      dateRange: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
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

// POST /api/habits - Create habit (Demo version)
export async function POST(req: NextRequest) {
  try {
    console.log('Creating habit with demo response');
    
    const body = await req.json();
    
    // Return demo response for habit creation
    const newHabit = {
      id: `habit-${Date.now()}`,
      name: body.name || 'New Habit',
      description: body.description || '',
      category: body.category || 'General',
      frequency: body.frequency || 'daily',
      targetValue: body.targetCount?.toString() || '1',
      unit: body.unit || 'times',
      currentStreak: 0,
      longestStreak: 0,
      totalCompleted: 0,
      color: body.color || '#3B82F6',
      icon: body.icon || 'Circle',
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      habit: newHabit,
      message: 'Habit created successfully'
    });
  } catch (error) {
    console.error('Failed to create habit:', error);
    return NextResponse.json(
      { error: 'Failed to create habit' },
      { status: 500 }
    );
  }
}

// PATCH /api/habits - Update habit completion (Demo version)
export async function PATCH(req: NextRequest) {
  try {
    console.log('Updating habit completion with demo response');
    
    const body = await req.json();
    const { habitId, date, completed, value, notes } = body;

    if (!habitId) {
      return NextResponse.json(
        { error: 'Habit ID required' },
        { status: 400 }
      );
    }

    // Return demo response for habit logging
    const updatedLog = {
      id: `log-${Date.now()}`,
      habitId,
      date: date || new Date().toISOString().split('T')[0],
      completed: completed || false,
      value: value || '1',
      note: notes || '',
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
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