import { NextRequest, NextResponse } from 'next/server';
import { getAccountData } from '@/lib/account-data';

// GET /api/habits - List habits with logs (Demo version) 
export async function GET(req: NextRequest) {
  try {
    console.log('Fetching habits with account-specific data');
    
    // Get user ID from query params or headers (fallback to demo)
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || 'demo-user';
    
    console.log('Fetching habits for user:', userId);

    // Get account-specific data with error handling
    let accountData;
    try {
      accountData = getAccountData(userId);
    } catch (accountError) {
      console.error('Failed to get account data:', accountError);
      return NextResponse.json(
        { error: 'Failed to retrieve account data', habits: [], stats: {} },
        { status: 200 } // Return 200 with empty data instead of 500
      );
    }
    const userHabits = accountData.habits;

    // Overall statistics
    const overallStats = {
      totalHabits: userHabits.length,
      activeToday: userHabits.filter(h => h.stats.completedToday).length,
      totalCompletions: userHabits.reduce((sum, h) => sum + h.stats.completedDays, 0),
      averageCompletionRate: userHabits.length > 0 
        ? userHabits.reduce((sum, h) => sum + h.stats.completionRate, 0) / userHabits.length 
        : 0,
      longestStreak: userHabits.length > 0 
        ? Math.max(...userHabits.map(h => h.longestStreak || h.bestStreak || 0))
        : 0
    };

    return NextResponse.json({
      habits: userHabits,
      stats: overallStats,
      dateRange: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to fetch habits:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch habits', 
        message: error instanceof Error ? error.message : 'Unknown error',
        habits: [], 
        stats: {
          totalHabits: 0,
          activeToday: 0,
          totalCompletions: 0,
          averageCompletionRate: 0,
          longestStreak: 0
        }
      },
      { 
        status: 200, // Return 200 instead of 500 to prevent browser from treating as server error
        headers: {
          'Content-Type': 'application/json'
        }
      }
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

// DELETE /api/habits - Delete habit (Demo version)
export async function DELETE(req: NextRequest) {
  try {
    console.log('Deleting habit with demo response');
    
    const { searchParams } = new URL(req.url);
    const habitId = searchParams.get('id');

    if (!habitId) {
      return NextResponse.json(
        { error: 'Habit ID required' },
        { status: 400 }
      );
    }

    // Return demo success response
    return NextResponse.json({
      success: true,
      message: 'Habit deleted successfully',
      habitId
    });
  } catch (error) {
    console.error('Failed to delete habit:', error);
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    );
  }
}