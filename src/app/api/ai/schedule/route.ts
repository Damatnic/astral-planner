import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { getUserFromRequest } from '@/lib/auth';
import Logger from '@/lib/logger';

interface Task {
  id?: string;
  title: string;
  estimatedDuration?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  type?: string;
}

interface Preferences {
  workingHours?: {
    start: string; // "09:00"
    end: string;   // "17:00"
  };
  breakDuration?: number; // minutes
  focusSessionLength?: number; // minutes
  timezone?: string;
  workDays?: number[]; // [1,2,3,4,5] = Mon-Fri
}

interface ScheduleItem {
  task: Task;
  scheduledStart: Date;
  scheduledEnd: Date;
  confidence: number;
}

// Smart scheduling algorithm
function generateSmartSchedule(tasks: Task[], preferences: Preferences): ScheduleItem[] {
  const schedule: ScheduleItem[] = [];
  const now = new Date();
  
  // Default preferences
  const defaultPrefs: Preferences = {
    workingHours: { start: '09:00', end: '17:00' },
    breakDuration: 15,
    focusSessionLength: 90,
    timezone: 'UTC',
    workDays: [1, 2, 3, 4, 5] // Monday to Friday
  };
  
  const prefs = { ...defaultPrefs, ...preferences };
  
  // Sort tasks by priority and due date
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority || 'medium'];
    const bPriority = priorityOrder[b.priority || 'medium'];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority; // Higher priority first
    }
    
    // Then sort by due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else if (a.dueDate) {
      return -1; // Tasks with due dates come first
    } else if (b.dueDate) {
      return 1;
    }
    
    return 0;
  });

  // Find next available work slot
  let currentSlot = new Date(now);
  
  // Round to next quarter hour
  currentSlot.setMinutes(Math.ceil(currentSlot.getMinutes() / 15) * 15, 0, 0);
  
  // If outside working hours, move to next working day
  const workStart = parseInt(prefs.workingHours!.start!.split(':')[0]);
  const workEnd = parseInt(prefs.workingHours!.end!.split(':')[0]);
  
  if (currentSlot.getHours() < workStart || currentSlot.getHours() >= workEnd) {
    // Move to next working day at start time
    do {
      currentSlot.setDate(currentSlot.getDate() + 1);
    } while (!prefs.workDays!.includes(currentSlot.getDay()));
    
    currentSlot.setHours(workStart, 0, 0, 0);
  }

  // Schedule each task
  for (const task of sortedTasks) {
    const duration = task.estimatedDuration || 60; // Default 1 hour
    let confidence = 0.8;
    
    // Check if we need to move to next day
    const endTime = new Date(currentSlot.getTime() + duration * 60000);
    if (endTime.getHours() >= workEnd) {
      // Move to next working day
      do {
        currentSlot.setDate(currentSlot.getDate() + 1);
      } while (!prefs.workDays!.includes(currentSlot.getDay()));
      
      currentSlot.setHours(workStart, 0, 0, 0);
    }

    // Check if task is overdue
    if (task.dueDate && currentSlot > new Date(task.dueDate)) {
      confidence = 0.4; // Lower confidence for potentially overdue items
    }

    const scheduledEnd = new Date(currentSlot.getTime() + duration * 60000);
    
    schedule.push({
      task,
      scheduledStart: new Date(currentSlot),
      scheduledEnd,
      confidence
    });

    // Move to next slot with break
    currentSlot = new Date(scheduledEnd.getTime() + prefs.breakDuration! * 60000);
  }

  return schedule;
}

async function handlePOST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tasks, preferences = {} } = body;

    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Tasks array is required' }, { status: 400 });
    }

    const schedule = generateSmartSchedule(tasks, preferences);
    
    Logger.info('Smart schedule generated:', { 
      taskCount: tasks.length,
      scheduleCount: schedule.length,
      userId: user.id 
    });

    return NextResponse.json({
      schedule: schedule.map(item => ({
        ...item,
        scheduledStart: item.scheduledStart.toISOString(),
        scheduledEnd: item.scheduledEnd.toISOString()
      })),
      metadata: {
        totalTasks: tasks.length,
        totalDuration: schedule.reduce((total, item) => {
          return total + (item.task.estimatedDuration || 60);
        }, 0),
        averageConfidence: schedule.reduce((total, item) => total + item.confidence, 0) / schedule.length,
        schedulingAlgorithm: 'priority_and_duration_based',
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    Logger.error('AI schedule generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate schedule' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePOST);