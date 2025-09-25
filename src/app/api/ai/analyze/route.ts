import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { getUserFromRequest } from '@/lib/auth';
import Logger from '@/lib/logger';

interface ProductivityData {
  tasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
    completedAt?: Date;
    estimatedDuration?: number;
    actualDuration?: number;
    priority?: string;
  }>;
  goals?: Array<{
    id: string;
    title: string;
    progress: number;
    targetDate?: Date;
  }>;
  habits?: Array<{
    id: string;
    name: string;
    completions: Array<{ date: Date; completed: boolean }>;
  }>;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

interface ProductivityInsights {
  overallScore: number;
  completionRate: number;
  averageTaskDuration: number;
  productivityTrends: Array<{
    date: string;
    score: number;
    tasksCompleted: number;
  }>;
  recommendations: string[];
  strengths: string[];
  improvements: string[];
  habits: {
    bestStreak: number;
    currentStreak: number;
    consistency: number;
  };
}

function analyzeProductivityData(data: ProductivityData): ProductivityInsights {
  const { tasks = [], goals = [], habits = [] } = data;
  
  // Calculate completion rate
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Calculate average task duration
  const completedTasksWithDuration = tasks.filter(t => t.completed && t.actualDuration);
  const averageTaskDuration = completedTasksWithDuration.length > 0
    ? completedTasksWithDuration.reduce((sum, task) => sum + (task.actualDuration || 0), 0) / completedTasksWithDuration.length
    : 0;

  // Calculate habit consistency
  let totalHabitDays = 0;
  let completedHabitDays = 0;
  let bestStreak = 0;
  
  habits.forEach(habit => {
    totalHabitDays += habit.completions.length;
    completedHabitDays += habit.completions.filter(c => c.completed).length;
    
    // Calculate streak for this habit
    let currentStreak = 0;
    let maxStreak = 0;
    
    habit.completions.forEach(completion => {
      if (completion.completed) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
    
    bestStreak = Math.max(bestStreak, maxStreak);
  });

  const habitConsistency = totalHabitDays > 0 ? (completedHabitDays / totalHabitDays) * 100 : 0;

  // Calculate overall productivity score
  const goalProgress = goals.length > 0 
    ? goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length 
    : 0;
    
  const overallScore = Math.round(
    (completionRate * 0.4) + 
    (habitConsistency * 0.3) + 
    (goalProgress * 0.3)
  );

  // Generate productivity trends (mock data for last 7 days)
  const productivityTrends = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    
    const dayTasks = tasks.filter(task => 
      task.completedAt && 
      new Date(task.completedAt).toDateString() === date.toDateString()
    );
    
    return {
      date: date.toISOString().split('T')[0],
      score: Math.min(100, (dayTasks.length * 20) + Math.random() * 30),
      tasksCompleted: dayTasks.length
    };
  });

  // Generate recommendations
  const recommendations: string[] = [];
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (completionRate >= 80) {
    strengths.push("Excellent task completion rate");
  } else if (completionRate < 50) {
    improvements.push("Focus on completing more tasks");
    recommendations.push("Break large tasks into smaller, manageable chunks");
  }

  if (habitConsistency >= 80) {
    strengths.push("Strong habit consistency");
  } else if (habitConsistency < 60) {
    improvements.push("Improve daily habit consistency");
    recommendations.push("Set smaller, more achievable daily habits");
  }

  if (averageTaskDuration > 0) {
    if (averageTaskDuration <= 60) {
      strengths.push("Good time estimation for tasks");
    } else {
      improvements.push("Tasks taking longer than expected");
      recommendations.push("Improve time estimation by tracking actual durations");
    }
  }

  // Goal-based recommendations
  const overdueGoals = goals.filter(goal => 
    goal.targetDate && new Date(goal.targetDate) < new Date() && goal.progress < 100
  );
  
  if (overdueGoals.length > 0) {
    improvements.push("Some goals are overdue");
    recommendations.push("Review and adjust goal timelines to be more realistic");
  }

  // Priority-based insights
  const highPriorityCompleted = tasks.filter(t => t.priority === 'high' && t.completed).length;
  const totalHighPriority = tasks.filter(t => t.priority === 'high').length;
  
  if (totalHighPriority > 0 && (highPriorityCompleted / totalHighPriority) >= 0.8) {
    strengths.push("Excellent at completing high-priority tasks");
  }

  // Default recommendations if none generated
  if (recommendations.length === 0) {
    recommendations.push(
      "Continue your current productive workflow",
      "Consider setting new challenges to maintain momentum"
    );
  }

  return {
    overallScore,
    completionRate: Math.round(completionRate),
    averageTaskDuration: Math.round(averageTaskDuration),
    productivityTrends,
    recommendations: recommendations.slice(0, 5),
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    habits: {
      bestStreak,
      currentStreak: Math.floor(Math.random() * bestStreak), // Mock current streak
      consistency: Math.round(habitConsistency)
    }
  };
}

async function handlePOST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const productivityData: ProductivityData = body;

    if (!productivityData) {
      return NextResponse.json({ error: 'Productivity data is required' }, { status: 400 });
    }

    const insights = analyzeProductivityData(productivityData);
    
    Logger.info('Productivity analysis completed:', { 
      overallScore: insights.overallScore,
      completionRate: insights.completionRate,
      userId: user.id 
    });

    return NextResponse.json({
      insights,
      metadata: {
        analyzedAt: new Date().toISOString(),
        dataPoints: {
          tasks: productivityData.tasks?.length || 0,
          goals: productivityData.goals?.length || 0,
          habits: productivityData.habits?.length || 0
        },
        analysisVersion: '1.0.0'
      }
    });

  } catch (error) {
    Logger.error('Productivity analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze productivity data' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePOST);