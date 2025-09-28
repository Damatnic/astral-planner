import { NextRequest, NextResponse } from 'next/server';

// DELETE /api/habits/[id] - Delete specific habit (Demo version)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('Deleting specific habit with demo response');
    
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Habit ID required' },
        { status: 400 }
      );
    }

    // Return demo success response
    return NextResponse.json({
      success: true,
      message: 'Habit deleted successfully',
      habitId: id
    });
  } catch (error) {
    // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Failed to delete habit:', error);
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    );
  }
}

// GET /api/habits/[id] - Get specific habit (Demo version)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('Fetching specific habit with demo response');
    
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Habit ID required' },
        { status: 400 }
      );
    }

    // Return demo habit data
    const demoHabit = {
      id,
      name: 'Demo Habit',
      description: 'This is a demo habit for testing',
      category: 'Health',
      frequency: 'daily',
      targetCount: 1,
      targetValue: '1',
      unit: 'times',
      timeOfDay: 'morning',
      reminderTime: '07:00',
      currentStreak: 0,
      longestStreak: 0,
      bestStreak: 0,
      totalCompleted: 0,
      totalCompletions: 0,
      isActive: true,
      color: '#3B82F6',
      icon: '🎯',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'demo-user',
      sortOrder: 1,
      completedToday: false,
      completedDates: [],
      skippedDates: [],
      stats: {
        completedDays: 0,
        totalDays: 0,
        completionRate: 0,
        completedToday: false,
        currentStreak: 0,
        bestStreak: 0
      },
      entries: [],
      weeklyPattern: {}
    };

    return NextResponse.json({
      success: true,
      habit: demoHabit
    });
  } catch (error) {
    // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Failed to fetch habit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habit' },
      { status: 500 }
    );
  }
}

// PUT /api/habits/[id] - Update specific habit (Demo version)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('Updating specific habit with demo response');
    
    const { id } = await params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Habit ID required' },
        { status: 400 }
      );
    }

    // Return demo updated habit
    const updatedHabit = {
      id,
      name: body.name || 'Updated Habit',
      description: body.description || '',
      category: body.category || 'General',
      frequency: body.frequency || 'daily',
      targetCount: body.targetCount || 1,
      targetValue: body.targetValue || '1',
      unit: body.unit || 'times',
      timeOfDay: body.timeOfDay || 'anytime',
      reminderTime: body.reminderTime || '12:00',
      currentStreak: body.currentStreak || 0,
      longestStreak: body.longestStreak || 0,
      bestStreak: body.bestStreak || 0,
      totalCompleted: body.totalCompleted || 0,
      totalCompletions: body.totalCompletions || 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
      color: body.color || '#3B82F6',
      icon: body.icon || '🎯',
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      habit: updatedHabit,
      message: 'Habit updated successfully'
    });
  } catch (error) {
    // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Failed to update habit:', error);
    return NextResponse.json(
      { error: 'Failed to update habit' },
      { status: 500 }
    );
  }
}