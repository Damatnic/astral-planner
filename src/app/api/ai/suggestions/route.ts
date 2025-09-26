import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/auth-utils';
import { withAuth, withFeature } from '@/lib/auth/auth-utils';

import { AIService } from '@/lib/ai/ai-service';
import { db } from '@/db';
import { goals } from '@/db/schema/goals';
import { habits } from '@/db/schema/habits';
import { workspaces } from '@/db/schema/workspaces';
import { users } from '@/db/schema/users';
import { events } from '@/db/schema/analytics';
import { eq, desc } from 'drizzle-orm';

// Types for AI suggestions
interface TaskSuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  category: string;
  tags: string[];
}

interface ProductivityInsight {
  insights: string[];
  recommendations: string[];
  score: number;
}

interface GoalBreakdown {
  milestones: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    deadline?: string;
  }>;
  suggestedTasks: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    estimatedHours: number;
  }>;
}

async function handlePOST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, context } = body;

    let result;
    
    switch (type) {
      case 'tasks':
        result = await generateTaskSuggestions(user.id, context);
        break;
      case 'goal-breakdown':
        result = await generateGoalBreakdown(user.id, context);
        break;
      case 'insights':
        result = await generateProductivityInsights(user.id, context);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid suggestion type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      data: result,
    });
  } catch (error) {
    console.error('AI suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI suggestions' },
      { status: 500 }
    );
  }
}

/**
 * Generate task suggestions based on user context
 */
async function generateTaskSuggestions(userId: string, context: any): Promise<TaskSuggestion[]> {
  // Get user context from database
  const aiContext = await buildUserContext(userId);
  
  // Use AI service to generate suggestions
  const aiSuggestions = await AIService.generateTaskSuggestions(aiContext);
  
  // Convert AI suggestions to API format
  return aiSuggestions.map(suggestion => ({
    title: suggestion.title,
    description: suggestion.description,
    priority: suggestion.priority,
    estimatedHours: suggestion.estimatedHours,
    category: suggestion.category,
    tags: suggestion.tags
  }));
}

/**
 * Generate goal breakdown with milestones and tasks
 */
async function generateGoalBreakdown(userId: string, context: any): Promise<GoalBreakdown> {
  const { goalTitle, goalDescription } = context;
  
  // Get user context from database
  const aiContext = await buildUserContext(userId);
  
  // Use AI service to generate goal breakdown
  const aiBreakdown = await AIService.generateGoalBreakdown(goalTitle, goalDescription, aiContext);
  
  // Convert AI breakdown to API format
  return {
    milestones: aiBreakdown.milestones,
    suggestedTasks: aiBreakdown.suggestedTasks
  };
}

/**
 * Generate productivity insights and recommendations
 */
async function generateProductivityInsights(userId: string, context: any): Promise<ProductivityInsight> {
  // Get user context from database
  const aiContext = await buildUserContext(userId);
  
  // Use AI service to generate insights
  const aiInsights = await AIService.generateProductivityInsights(aiContext);
  
  // Convert AI insights to API format
  return {
    score: aiInsights.score,
    insights: aiInsights.insights,
    recommendations: aiInsights.recommendations
  };
}

/**
 * Build user context for AI analysis
 */
async function buildUserContext(userId: string) {
  try {
    // Get user with preferences and settings
    const userRecord = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
    const user = userRecord[0];
    
    // Get user's workspaces
    const userWorkspaces = await db.select().from(workspaces).where(eq(workspaces.ownerId, user?.id || userId));
    const workspaceIds = userWorkspaces.map(w => w.id);
    
    // Get user's goals
    let userGoals: any[] = [];
    if (workspaceIds.length > 0) {
      userGoals = await db.select().from(goals).where(
        eq(goals.workspaceId, workspaceIds[0]) // For now, just use first workspace
      );
    }
    
    // Get user's habits
    const userHabits = await db.select().from(habits).where(eq(habits.userId, user?.id || userId));
    
    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentActivity = await db.select()
      .from(events)
      .where(eq(events.userId, user?.id || userId))
      .orderBy(desc(events.timestamp))
      .limit(100);
    
    // Extract user preferences from settings
    const userPreferences = user?.settings || {
      theme: 'system',
      workingHours: { start: '09:00', end: '17:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
      notifications: { email: true, push: true, desktop: true, reminders: true, digest: 'daily' },
      defaultView: 'day',
      timeFormat: '24h'
    };
    
    return {
      userId,
      userGoals,
      userHabits,
      recentActivity,
      userPreferences,
      aiSettings: user?.aiSettings || {
        enabled: true,
        autoSuggestions: true,
        planningAssistant: true,
        naturalLanguage: true,
        smartScheduling: true,
        insights: true
      }
    };
  } catch (error) {
    console.error('Error building user context for AI:', error);
    return {
      userId,
      userGoals: [],
      userHabits: [],
      recentActivity: [],
      userPreferences: {
        theme: 'system',
        workingHours: { start: '09:00', end: '17:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
        notifications: { email: true, push: true, desktop: true, reminders: true, digest: 'daily' },
        defaultView: 'day',
        timeFormat: '24h'
      },
      aiSettings: {
        enabled: true,
        autoSuggestions: true,
        planningAssistant: true,
        naturalLanguage: true,
        smartScheduling: true,
        insights: true
      }
    };
  }
}

// Apply middleware: require authentication and AI features
export async function POST(req: NextRequest) {
  return await handlePOST(req);
}