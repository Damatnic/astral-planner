// Force dynamic rendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { getAccountData } from '@/lib/account-data';
import { apiLogger } from '@/lib/logger';

// GET /api/goals - List goals with account-specific data (Demo version)
export async function GET(req: NextRequest) {
  try {
    apiLogger.debug('Fetching goals with account-specific data', { action: 'getGoals' });
    
    // Get user ID from query params or headers (fallback to demo)
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || 'demo-user';
    
    apiLogger.debug('Fetching goals for user', { userId, action: 'getGoals' });

    // Get account-specific data
    const accountData = getAccountData(userId);
    const userGoals = accountData.goals;

    // Calculate summary statistics
    const stats = {
      total: userGoals.length,
      completed: userGoals.filter(g => g.status === 'completed' || g.progress === 100).length,
      inProgress: userGoals.filter(g => g.status === 'active' && g.progress < 100).length,
      notStarted: userGoals.filter(g => g.progress === 0).length,
      overdue: userGoals.filter(g => g.isOverdue).length,
      averageProgress: userGoals.length > 0 
        ? userGoals.reduce((sum, g) => sum + g.progress, 0) / userGoals.length 
        : 0
    };

    return NextResponse.json({
      success: true,
      data: userGoals,
      stats,
      meta: {
        page: 1,
        limit: 50,
        total: userGoals.length,
        totalPages: 1
      },
      dateRange: {
        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      }
    });
  } catch (error) {
    apiLogger.error('Failed to fetch goals', { action: 'getGoals' }, error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// POST /api/goals - Create goal (Demo version)
export async function POST(req: NextRequest) {
  try {
    apiLogger.info('Creating goal', { action: 'createGoal' });
    
    const body = await req.json();
    
    // Return demo response for goal creation
    const newGoal = {
      id: `goal-${Date.now()}`,
      title: body.title || 'New Goal',
      description: body.description || '',
      type: body.type || 'monthly',
      category: body.category || 'General',
      priority: body.priority || 'medium',
      status: body.status || 'active',
      targetValue: body.targetValue || 100,
      currentValue: body.currentValue || 0,
      progress: 0,
      targetDate: body.targetDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOverdue: false,
      daysRemaining: 90
    };

    return NextResponse.json({
      success: true,
      data: newGoal,
      message: 'Goal created successfully'
    });
  } catch (error) {
    apiLogger.error('Failed to create goal', { action: 'createGoal' }, error as Error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}
