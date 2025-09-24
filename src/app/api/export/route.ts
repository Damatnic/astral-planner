import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import {
  users,
  blocks,
  goals,
  goalProgress,
  habits,
  habitEntries,
  events,
  workspaces,
  workspaceMembers,
  templates,
  integrations,
  notifications,
  userAnalytics
} from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { format as formatDate } from 'date-fns';
import JSZip from 'jszip';

type ExportFormat = 'json' | 'csv' | 'markdown';
type ExportScope = 'all' | 'tasks' | 'goals' | 'habits' | 'calendar' | 'analytics';

// GET /api/export - Export user data
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
    const format = (searchParams.get('format') as ExportFormat) || 'json';
    const scope = (searchParams.get('scope') as ExportScope) || 'all';
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');
    const includeArchived = searchParams.get('includeArchived') === 'true';

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

    // Collect data based on scope
    const exportData: any = {
      metadata: {
        exportDate: new Date().toISOString(),
        format,
        scope,
        user: {
          id: userRecord.id,
          email: userRecord.email,
          name: `${userRecord.firstName} ${userRecord.lastName}`
        }
      }
    };

    // Helper function to apply date filters
    const applyDateFilter = (conditions: any[], table: any) => {
      if (dateFrom) {
        conditions.push(gte(table.createdAt, new Date(dateFrom)));
      }
      if (dateTo) {
        conditions.push(lte(table.createdAt, new Date(dateTo)));
      }
      return conditions;
    };

    // Export tasks
    if (scope === 'all' || scope === 'tasks') {
      const taskConditions = [
        eq(blocks.createdBy, userRecord.id),
        eq(blocks.type, 'task')
      ];
      
      if (!includeArchived) {
        taskConditions.push(eq(blocks.status, 'active'));
      }

      const tasks = await db.query.blocks.findMany({
        where: and(...applyDateFilter(taskConditions, blocks))
      });

      exportData.tasks = tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.content?.description,
        status: task.status,
        priority: task.priority,
        tags: task.tags,
        dueDate: task.metadata?.dueDate,
        completedAt: task.metadata?.completedAt,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }));
    }

    // Export goals
    if (scope === 'all' || scope === 'goals') {
      const goalConditions = [eq(goals.userId, userRecord.id)];
      
      if (!includeArchived) {
        goalConditions.push(eq(goals.status, 'active'));
      }

      const userGoals = await db.query.goals.findMany({
        where: and(...applyDateFilter(goalConditions, goals)),
        with: {
          progress: {
            orderBy: (progress: any, { desc }: any) => [desc(progress.date)]
          }
        }
      });

      exportData.goals = userGoals.map(goal => ({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        type: goal.type,
        category: goal.category,
        targetValue: goal.targetValue,
        currentValue: goal.currentValue,
        targetDate: goal.targetDate,
        status: goal.status,
        progress: goal.progress.map((p: any) => ({
          date: p.date,
          value: p.value,
          notes: p.notes
        })),
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt
      }));
    }

    // Export habits
    if (scope === 'all' || scope === 'habits') {
      const habitConditions = [eq(habits.userId, userRecord.id)];
      
      if (!includeArchived) {
        habitConditions.push(eq(habits.status, 'active'));
      }

      const userHabits = await db.query.habits.findMany({
        where: and(...habitConditions),
        with: {
          entries: {
            orderBy: (entries: any, { desc }: any) => [desc(entries.date)]
          }
        }
      });

      exportData.habits = userHabits.map(habit => ({
        id: habit.id,
        name: habit.name,
        description: habit.description,
        category: habit.category,
        frequency: habit.frequency,
        targetValue: habit.targetValue,
        currentStreak: habit.currentStreak,
        bestStreak: habit.longestStreak,
        totalCompletions: habit.totalCompleted,
        entries: habit.entries.map((entry: any) => ({
          date: entry.date,
          completed: entry.completed,
          value: entry.value,
          notes: entry.note
        })),
        createdAt: habit.createdAt,
        updatedAt: habit.updatedAt
      }));
    }

    // Export calendar events
    if (scope === 'all' || scope === 'calendar') {
      const eventConditions = [eq(events.userId, userRecord.id)];
      
      if (dateFrom) {
        eventConditions.push(gte(events.startTime, new Date(dateFrom)));
      }
      if (dateTo) {
        eventConditions.push(lte(events.startTime, new Date(dateTo)));
      }

      const calendarEvents = await db.query.events.findMany({
        where: and(...eventConditions)
      });

      exportData.calendar = calendarEvents.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        isAllDay: event.isAllDay,
        location: event.location,
        reminders: event.reminders,
        recurrence: event.recurrence,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      }));
    }

    // Export analytics
    if (scope === 'all' || scope === 'analytics') {
      const analyticsConditions = [eq(userAnalytics.userId, userRecord.id)];
      
      if (dateFrom) {
        analyticsConditions.push(gte(userAnalytics.date, new Date(dateFrom)));
      }
      if (dateTo) {
        analyticsConditions.push(lte(userAnalytics.date, new Date(dateTo)));
      }

      const analyticsData = await db.query.userAnalytics.findMany({
        where: and(...analyticsConditions)
      });

      exportData.analytics = analyticsData.map(stat => ({
        date: stat.date,
        tasksCompleted: stat.tasksCompleted,
        tasksCreated: stat.tasksCreated,
        focusTime: stat.focusTime,
        wellnessScore: stat.wellnessScore,
        habitsTracked: stat.habitsTracked,
        goalsAchieved: stat.goalsAchieved
      }));
    }

    // Format the response based on requested format
    let responseData: any;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'csv':
        responseData = await convertToCSV(exportData);
        contentType = 'text/csv';
        filename = `planner-export-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`;
        break;

      case 'markdown':
        responseData = await convertToMarkdown(exportData);
        contentType = 'text/markdown';
        filename = `planner-export-${formatDate(new Date(), 'yyyy-MM-dd')}.md`;
        break;

      case 'json':
      default:
        responseData = JSON.stringify(exportData, null, 2);
        contentType = 'application/json';
        filename = `planner-export-${formatDate(new Date(), 'yyyy-MM-dd')}.json`;
        break;
    }

    // For multiple data types, create a zip file
    if (scope === 'all' && format !== 'json') {
      const zip = new JSZip();
      
      for (const [key, data] of Object.entries(exportData)) {
        if (key !== 'metadata' && Array.isArray(data)) {
          const content = format === 'csv' 
            ? await convertToCSV({ [key]: data })
            : await convertToMarkdown({ [key]: data });
          zip.file(`${key}.${format === 'csv' ? 'csv' : 'md'}`, content);
        }
      }

      const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
      
      return new NextResponse(zipBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="planner-export-${formatDate(new Date(), 'yyyy-MM-dd')}.zip"`
        }
      });
    }

    return new NextResponse(responseData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Failed to export data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

// Helper function to convert data to CSV
async function convertToCSV(data: any): Promise<string> {
  const csvRows: string[] = [];

  // Process each data type
  for (const [key, items] of Object.entries(data)) {
    if (key === 'metadata' || !Array.isArray(items)) continue;

    if (items.length === 0) continue;

    // Add section header
    csvRows.push(`\n# ${key.toUpperCase()}`);
    
    // Get headers from first item
    const headers = Object.keys(items[0]).filter(k => 
      typeof items[0][k] !== 'object' || items[0][k] === null
    );
    csvRows.push(headers.join(','));

    // Add data rows
    for (const item of items) {
      const values = headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        if (value instanceof Date) {
          return formatDate(value, 'yyyy-MM-dd HH:mm:ss');
        }
        return String(value);
      });
      csvRows.push(values.join(','));
    }
  }

  return csvRows.join('\n');
}

// Helper function to convert data to Markdown
async function convertToMarkdown(data: any): Promise<string> {
  const mdLines: string[] = [];

  // Add metadata
  mdLines.push('# Digital Planner Export');
  mdLines.push(`\nExport Date: ${data.metadata?.exportDate || new Date().toISOString()}`);
  if (data.metadata?.user) {
    mdLines.push(`User: ${data.metadata.user.name} (${data.metadata.user.email})`);
  }
  mdLines.push('\n---\n');

  // Process each data type
  for (const [key, items] of Object.entries(data)) {
    if (key === 'metadata' || !Array.isArray(items)) continue;

    mdLines.push(`## ${key.charAt(0).toUpperCase() + key.slice(1)}\n`);

    if (items.length === 0) {
      mdLines.push('*No data available*\n');
      continue;
    }

    // Format based on data type
    switch (key) {
      case 'tasks':
        for (const task of items) {
          const checkbox = task.status === 'completed' ? '[x]' : '[ ]';
          mdLines.push(`- ${checkbox} **${task.title}**`);
          if (task.description) mdLines.push(`  - ${task.description}`);
          if (task.priority) mdLines.push(`  - Priority: ${task.priority}`);
          if (task.dueDate) mdLines.push(`  - Due: ${formatDate(new Date(task.dueDate), 'MMM dd, yyyy')}`);
          if (task.tags?.length) mdLines.push(`  - Tags: ${task.tags.join(', ')}`);
          mdLines.push('');
        }
        break;

      case 'goals':
        for (const goal of items) {
          const progress = goal.currentValue && goal.targetValue 
            ? Math.round((goal.currentValue / goal.targetValue) * 100)
            : 0;
          mdLines.push(`### ${goal.title}`);
          if (goal.description) mdLines.push(`${goal.description}\n`);
          mdLines.push(`- Type: ${goal.type}`);
          mdLines.push(`- Category: ${goal.category}`);
          mdLines.push(`- Progress: ${progress}% (${goal.currentValue}/${goal.targetValue})`);
          if (goal.targetDate) mdLines.push(`- Target Date: ${formatDate(new Date(goal.targetDate), 'MMM dd, yyyy')}`);
          mdLines.push('');
        }
        break;

      case 'habits':
        for (const habit of items) {
          mdLines.push(`### ${habit.name}`);
          if (habit.description) mdLines.push(`${habit.description}\n`);
          mdLines.push(`- Frequency: ${habit.frequency}`);
          mdLines.push(`- Target: ${habit.targetCount} ${habit.unit || 'times'}`);
          mdLines.push(`- Current Streak: ${habit.currentStreak} days`);
          mdLines.push(`- Best Streak: ${habit.bestStreak} days`);
          mdLines.push(`- Total Completions: ${habit.totalCompletions}`);
          mdLines.push('');
        }
        break;

      case 'calendar':
        mdLines.push('| Date | Time | Event | Location |');
        mdLines.push('|------|------|-------|----------|');
        for (const event of items) {
          const date = formatDate(new Date(event.startTime), 'MMM dd, yyyy');
          const time = event.isAllDay 
            ? 'All Day' 
            : `${formatDate(new Date(event.startTime), 'HH:mm')} - ${formatDate(new Date(event.endTime), 'HH:mm')}`;
          const location = event.location || '-';
          mdLines.push(`| ${date} | ${time} | ${event.title} | ${location} |`);
        }
        mdLines.push('');
        break;

      default:
        // Generic table format
        if (items.length > 0) {
          const headers = Object.keys(items[0]).filter(k => 
            typeof items[0][k] !== 'object' || items[0][k] === null
          );
          mdLines.push(`| ${headers.join(' | ')} |`);
          mdLines.push(`| ${headers.map(() => '---').join(' | ')} |`);
          
          for (const item of items) {
            const values = headers.map(h => String(item[h] || '-'));
            mdLines.push(`| ${values.join(' | ')} |`);
          }
          mdLines.push('');
        }
    }
  }

  return mdLines.join('\n');
}