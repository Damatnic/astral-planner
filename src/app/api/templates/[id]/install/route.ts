import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { templates, templateUsage, users, workspaces, blocks, goals, habits } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const InstallTemplateSchema = z.object({
  workspaceName: z.string().min(1).max(100).optional(),
  installOptions: z.object({
    includeWorkspaces: z.boolean().default(true),
    includeBlocks: z.boolean().default(true),
    includeGoals: z.boolean().default(true),
    includeHabits: z.boolean().default(true),
    includeSettings: z.boolean().default(false)
  }).optional()
});

// POST /api/templates/[id]/install - Install/Use a template
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = InstallTemplateSchema.parse(body);

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

    // Get template
    const template = await db.query.templates.findFirst({
      where: eq(templates.id, id)
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (template.status !== 'published' && template.creatorId !== userRecord.id) {
      return NextResponse.json(
        { error: 'Access denied - template is private' },
        { status: 403 }
      );
    }

    // Check if user already used this template
    const existingUsage = await db.query.templateUsage.findFirst({
      where: and(
        eq(templateUsage.templateId, id),
        eq(templateUsage.userId, userRecord.id)
      )
    });

    const installOptions = validated.installOptions || {
      includeWorkspaces: true,
      includeBlocks: true,
      includeGoals: true,
      includeHabits: true,
      includeSettings: false
    };

    const installResults = {
      workspaces: 0,
      blocks: 0,
      goals: 0,
      habits: 0,
      settings: 0
    };

    // Install template content
    const templateContent = template.structure as any;
    
    try {
      // Install workspaces
      if (installOptions.includeWorkspaces && templateContent.workspaces) {
        for (const workspace of templateContent.workspaces) {
          const newWorkspaceResult = await db.insert(workspaces).values({
            ...workspace,
            id: undefined, // Let database generate new ID
            userId: userRecord.id,
            name: validated.workspaceName || workspace.name || `${template.name} Workspace`,
            createdAt: new Date(),
            updatedAt: new Date()
          }).returning();
          
          const newWorkspace = Array.isArray(newWorkspaceResult) ? newWorkspaceResult[0] : newWorkspaceResult;
          
          installResults.workspaces++;
        }
      }

      // Install blocks
      if (installOptions.includeBlocks && templateContent.blocks) {
        for (const block of templateContent.blocks) {
          await db.insert(blocks).values({
            ...block,
            id: undefined, // Let database generate new ID
            userId: userRecord.id,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          installResults.blocks++;
        }
      }

      // Install goals
      if (installOptions.includeGoals && templateContent.goals) {
        for (const goal of templateContent.goals) {
          await db.insert(goals).values({
            ...goal,
            id: undefined, // Let database generate new ID
            userId: userRecord.id,
            currentValue: 0,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          installResults.goals++;
        }
      }

      // Install habits
      if (installOptions.includeHabits && templateContent.habits) {
        for (const habit of templateContent.habits) {
          await db.insert(habits).values({
            ...habit,
            id: undefined, // Let database generate new ID
            userId: userRecord.id,
            currentStreak: 0,
            longestStreak: 0,
            totalCompleted: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          installResults.habits++;
        }
      }

    } catch (installError) {
      console.error('Error installing template content:', installError);
      return NextResponse.json(
        { error: 'Failed to install template content' },
        { status: 500 }
      );
    }

    // Record usage
    if (!existingUsage) {
      await db.insert(templateUsage).values({
        templateId: id,
        userId: userRecord.id,
        action: 'used',
        context: {
          installOptions: validated,
          installResults
        }
      });

      // Increment usage count
      await db.update(templates)
        .set({
          useCount: sql`${templates.useCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(templates.id, id));
    }

    return NextResponse.json({
      message: 'Template installed successfully',
      installed: installResults,
      templateName: template.name,
      totalItems: Object.values(installResults).reduce((sum, count) => sum + count, 0)
    });
  } catch (error) {
    console.error('Failed to install template:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to install template' },
      { status: 500 }
    );
  }
}