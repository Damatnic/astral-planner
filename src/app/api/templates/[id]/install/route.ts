import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { templates, templateUsage } from '@/db/schema/templates';
import { blocks } from '@/db/schema/blocks';
import { goals } from '@/db/schema/goals';
import { habits } from '@/db/schema/habits';
import { workspaces } from '@/db/schema/workspaces';
import { eq } from 'drizzle-orm';
import Logger from '@/lib/logger';

// Predefined templates with content (matching the GET endpoint)
const PREDEFINED_TEMPLATES: Record<string, any> = {
  'daily-productivity': {
    name: 'Daily Productivity Planner',
    content: {
      blocks: [
        { type: 'task', title: 'Morning Review (15 min)', priority: 'high', estimatedHours: 0.25 },
        { type: 'task', title: 'Focus Block 1: Deep Work', priority: 'high', estimatedHours: 2 },
        { type: 'task', title: 'Focus Block 2: Communications', priority: 'medium', estimatedHours: 1 },
        { type: 'task', title: 'Focus Block 3: Admin Tasks', priority: 'medium', estimatedHours: 1 },
        { type: 'task', title: 'Evening Reflection (10 min)', priority: 'low', estimatedHours: 0.17 }
      ],
      goals: [
        { title: 'Complete 3 Priority Tasks', description: 'Focus on high-impact activities' }
      ]
    }
  },
  'weekly-review': {
    name: 'Weekly Review & Planning',
    content: {
      blocks: [
        { type: 'task', title: 'Review Last Week Achievements', priority: 'high', estimatedHours: 0.5 },
        { type: 'task', title: 'Identify Areas for Improvement', priority: 'medium', estimatedHours: 0.5 },
        { type: 'task', title: 'Set 3 Goals for Next Week', priority: 'high', estimatedHours: 0.5 },
        { type: 'task', title: 'Plan Major Tasks & Time Blocks', priority: 'high', estimatedHours: 1 }
      ]
    }
  },
  'project-kickoff': {
    name: 'Project Kickoff Template',
    content: {
      blocks: [
        { type: 'task', title: 'Define Project Scope & Objectives', priority: 'high', estimatedHours: 2 },
        { type: 'task', title: 'Identify Key Stakeholders', priority: 'high', estimatedHours: 1 },
        { type: 'task', title: 'Create Project Timeline', priority: 'high', estimatedHours: 2 },
        { type: 'task', title: 'Set Up Communication Channels', priority: 'medium', estimatedHours: 1 }
      ]
    }
  },
  'study-session': {
    name: 'Study Session Planner',
    content: {
      blocks: [
        { type: 'task', title: 'Review Previous Material (15 min)', priority: 'medium', estimatedHours: 0.25 },
        { type: 'task', title: 'Study Block 1: New Content', priority: 'high', estimatedHours: 1.5 },
        { type: 'task', title: 'Break (15 min)', priority: 'low', estimatedHours: 0.25 },
        { type: 'task', title: 'Study Block 2: Practice Problems', priority: 'high', estimatedHours: 1.5 },
        { type: 'task', title: 'Review & Note Taking (20 min)', priority: 'medium', estimatedHours: 0.33 }
      ]
    }
  },
  'fitness-routine': {
    name: 'Fitness & Wellness Tracker',
    content: {
      blocks: [
        { type: 'task', title: 'Morning Workout (45 min)', priority: 'high', estimatedHours: 0.75 },
        { type: 'task', title: 'Track Water Intake', priority: 'medium', estimatedHours: 0.1 },
        { type: 'task', title: 'Log Meals & Nutrition', priority: 'medium', estimatedHours: 0.25 },
        { type: 'task', title: 'Evening Stretch (15 min)', priority: 'low', estimatedHours: 0.25 }
      ]
    }
  }
};

async function handlePOST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = params.id;
    const body = await req.json();
    const { customizations = {} } = body;

    // Get user's default workspace
    const userWorkspaces = await db.select().from(workspaces).where(eq(workspaces.ownerId, user.id)).limit(1);
    if (userWorkspaces.length === 0) {
      return NextResponse.json(
        { error: 'No workspace found for user' },
        { status: 400 }
      );
    }

    const workspaceId = userWorkspaces[0].id;
    let templateData = null;

    // Check if it's a predefined template
    if (PREDEFINED_TEMPLATES[templateId]) {
      templateData = PREDEFINED_TEMPLATES[templateId];
    } else {
      // Check database for custom template
      const dbTemplate = await db.select().from(templates).where(eq(templates.id, templateId)).limit(1);
      if (dbTemplate.length === 0) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }
      templateData = {
        name: dbTemplate[0].name,
        content: dbTemplate[0].structure // Using 'structure' field from schema
      };
    }

    if (!templateData) {
      return NextResponse.json(
        { error: 'Template data not available' },
        { status: 400 }
      );
    }

    const installedItems: any = {
      blocks: [],
      goals: [],
      habits: []
    };

    // Install blocks/tasks
    if (templateData.content.blocks) {
      for (const blockTemplate of templateData.content.blocks) {
        const [newBlock] = await db.insert(blocks).values({
          type: blockTemplate.type || 'task',
          title: blockTemplate.title,
          description: blockTemplate.description || null,
          workspaceId,
          status: 'todo',
          priority: blockTemplate.priority || 'medium',
          estimatedDuration: blockTemplate.estimatedHours ? Math.round(blockTemplate.estimatedHours * 60) : null,
          createdBy: user.id,
          lastEditedBy: user.id,
          metadata: {
            source: 'template',
            templateId,
            originalTemplate: blockTemplate,
            ...customizations
          },
        }).returning();
        
        installedItems.blocks.push(newBlock);
      }
    }

    // Install goals
    if (templateData.content.goals) {
      for (const goalTemplate of templateData.content.goals) {
        const [newGoal] = await db.insert(goals).values({
          title: goalTemplate.title,
          description: goalTemplate.description || null,
          type: goalTemplate.type || 'weekly',
          workspaceId,
          createdBy: user.id,
          status: 'not_started',
          priority: goalTemplate.priority || 'medium',
        }).returning();
        
        installedItems.goals.push(newGoal);
      }
    }

    // Install habits
    if (templateData.content.habits) {
      for (const habitTemplate of templateData.content.habits) {
        const [newHabit] = await db.insert(habits).values({
          name: habitTemplate.name,
          description: habitTemplate.description || null,
          userId: user.id,
          workspaceId,
          category: habitTemplate.category || 'personal',
          type: habitTemplate.type || 'boolean',
          frequency: habitTemplate.frequency || 'daily',
          startDate: new Date().toISOString().split('T')[0], // date format YYYY-MM-DD
          status: 'active',
        }).returning();
        
        installedItems.habits.push(newHabit);
      }
    }

    // Record the installation
    await db.insert(templateUsage).values({
      templateId,
      userId: user.id,
      workspaceId,
      action: 'used',
      customizations,
      createdAt: new Date(),
    });

    Logger.info('Template installed:', { 
      templateId, 
      userId: user.id, 
      itemsInstalled: {
        blocks: installedItems.blocks.length,
        goals: installedItems.goals.length,
        habits: installedItems.habits.length
      }
    });

    return NextResponse.json({
      success: true,
      message: `Template "${templateData.name}" installed successfully`,
      installed: {
        blocks: installedItems.blocks.length,
        goals: installedItems.goals.length,
        habits: installedItems.habits.length,
        total: installedItems.blocks.length + installedItems.goals.length + installedItems.habits.length
      },
      items: installedItems
    });

  } catch (error) {
    Logger.error('Template installation error:', error);
    
    // Record failed installation
    try {
      const failedUser = await getUserFromRequest(req);
      if (failedUser) {
        await db.insert(templateUsage).values({
          templateId: params.id,
          userId: failedUser.id,
          workspaceId: '', // Will be empty for failed installs
          action: 'used',
          context: { 
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          },
          createdAt: new Date(),
        });
      }
    } catch (recordError) {
      Logger.error('Failed to record template installation error:', recordError);
    }

    return NextResponse.json(
      { error: 'Failed to install template' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePOST);