import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { goals } from '@/db/schema';
import { desc } from 'drizzle-orm';

// Test endpoint to verify goals API logic with mock database
export async function GET(req: NextRequest) {
  try {
    console.log('Testing goals API with mock database...');
    
    // Try to query goals (will use mock database)
    const userGoals = await db.query.goals.findMany({
      orderBy: [desc(goals.createdAt)],
      limit: 5
    });

    // Test inserting a goal (mock)
    const testGoal = {
      title: 'Test Goal',
      description: 'This is a test goal',
      type: 'monthly',
      category: 'Testing',
      targetValue: '100',
      currentValue: '0',
      status: 'active',
      priority: 'medium',
      createdBy: 'test-user',
      assignedTo: 'test-user',
      workspaceId: 'test-workspace'
    };

    const insertResult = await db.insert(goals).values(testGoal as any).returning();

    return NextResponse.json({
      status: 'success',
      message: 'Mock database test completed',
      mockDatabase: true,
      results: {
        existingGoals: userGoals,
        insertTest: insertResult,
        totalGoals: userGoals?.length || 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Goals mock test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Goals API test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      mockDatabase: true
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log('Testing goals POST with mock database...');
    
    const testGoal = {
      ...body,
      createdBy: 'test-user',
      assignedTo: 'test-user',
      workspaceId: 'test-workspace',
      status: 'active',
      currentValue: '0'
    };

    const result = await db.insert(goals).values(testGoal as any).returning();

    return NextResponse.json({
      status: 'success',
      message: 'Mock goal created',
      goal: result,
      mockDatabase: true
    });

  } catch (error) {
    console.error('Goals mock POST test error:', error);
    return NextResponse.json({
      status: 'error', 
      message: 'Goals POST test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      mockDatabase: true
    }, { status: 500 });
  }
}