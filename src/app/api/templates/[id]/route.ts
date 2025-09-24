import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { templates, templateFavorites, templateUsage, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  category: z.enum(['productivity', 'business', 'education', 'health', 'creative', 'development', 'personal']).optional(),
  content: z.object({
    workspaces: z.array(z.any()).optional(),
    blocks: z.array(z.any()).optional(),
    goals: z.array(z.any()).optional(),
    habits: z.array(z.any()).optional(),
    settings: z.record(z.any()).optional()
  }).optional(),
  tags: z.array(z.string()).max(10).optional(),
  isPublic: z.boolean().optional(),
  isPro: z.boolean().optional(),
  previewImage: z.string().optional()
});

// GET /api/templates/[id] - Get specific template
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { userId } = auth();

    // Get template with creator details
    const template = await db.query.templates.findFirst({
      where: eq(templates.id, id),
      with: {
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true
          }
        }
      }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this template
    if (template.status !== 'published' && userId) {
      const userRecord = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.clerkId, userId)
      });

      if (!userRecord || template.creatorId !== userRecord.id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    } else if (template.status !== 'published' && !userId) {
      return NextResponse.json(
        { error: 'Template is private' },
        { status: 403 }
      );
    }

    // Check if user has liked this template
    let isLiked = false;
    let hasUsed = false;
    
    if (userId) {
      const userRecord = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.clerkId, userId)
      });

      if (userRecord) {
        // Check if liked
        const like = await db.query.templateFavorites.findFirst({
          where: and(
            eq(templateFavorites.templateId, template.id),
            eq(templateFavorites.userId, userRecord.id)
          )
        });
        isLiked = !!like;

        // Check if used
        const usage = await db.query.templateUsage.findFirst({
          where: and(
            eq(templateUsage.templateId, template.id),
            eq(templateUsage.userId, userRecord.id)
          )
        });
        hasUsed = !!usage;
      }
    }

    // Note: View count tracking not implemented as templates table doesn't have viewCount field
    // Could track in a separate analytics table if needed

    return NextResponse.json({
      ...template,
      isLiked,
      hasUsed,
      author: template.creator && !Array.isArray(template.creator) ? 
        `${template.creator.firstName} ${template.creator.lastName}` : 
        'Anonymous',
      isOwner: userId && template.creator && !Array.isArray(template.creator) ? 
        template.creator.id === userId : 
        false
    });
  } catch (error) {
    console.error('Failed to fetch template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// PATCH /api/templates/[id] - Update template
export async function PATCH(
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
    const validated = UpdateTemplateSchema.parse(body);

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

    // Check if template exists and user owns it
    const existingTemplate = await db.query.templates.findFirst({
      where: eq(templates.id, id)
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (existingTemplate.creatorId !== userRecord.id) {
      return NextResponse.json(
        { error: 'Access denied - you can only update your own templates' },
        { status: 403 }
      );
    }

    // Update the template
    const updateData: any = {};
    
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.category !== undefined) updateData.category = validated.category;
    if (validated.content !== undefined) updateData.content = validated.content;
    if (validated.tags !== undefined) updateData.tags = validated.tags;
    if (validated.isPublic !== undefined) updateData.isPublic = validated.isPublic;
    if (validated.isPro !== undefined) updateData.isPro = validated.isPro;
    if (validated.previewImage !== undefined) updateData.previewImage = validated.previewImage;

    // Update version for template changes
    updateData.version = existingTemplate.version ? 
      `${parseInt(existingTemplate.version.split('.')[0]) + 1}.0.0` : 
      '2.0.0';
    
    updateData.updatedAt = new Date();

    const updatedTemplateResult = await db.update(templates)
      .set(updateData)
      .where(eq(templates.id, id))
      .returning();
      
    const updatedTemplate = Array.isArray(updatedTemplateResult) ? updatedTemplateResult[0] : updatedTemplateResult;

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error('Failed to update template:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - Delete template
export async function DELETE(
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

    // Check if template exists and user owns it
    const existingTemplate = await db.query.templates.findFirst({
      where: eq(templates.id, id)
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (existingTemplate.creatorId !== userRecord.id) {
      return NextResponse.json(
        { error: 'Access denied - you can only delete your own templates' },
        { status: 403 }
      );
    }

    // Soft delete by marking as inactive instead of hard delete
    // This preserves usage history and allows for recovery
    const deletedTemplateResult = await db.update(templates)
      .set({
        status: 'draft', // Change status from published to draft
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(templates.id, id))
      .returning();
      
    const deletedTemplate = Array.isArray(deletedTemplateResult) ? deletedTemplateResult[0] : deletedTemplateResult;

    return NextResponse.json({
      message: 'Template deleted successfully',
      template: deletedTemplate
    });
  } catch (error) {
    console.error('Failed to delete template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}