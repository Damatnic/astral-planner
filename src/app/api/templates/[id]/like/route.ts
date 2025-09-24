import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { templates, templateFavorites, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// POST /api/templates/[id]/like - Like a template
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

    // Check if template exists
    const template = await db.query.templates.findFirst({
      where: eq(templates.id, id)
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check if template is public or user owns it
    if (!template.isPublic && template.createdBy !== userRecord.id) {
      return NextResponse.json(
        { error: 'Cannot like private template' },
        { status: 403 }
      );
    }

    // Check if already liked
    const existingLike = await db.query.templateFavorites.findFirst({
      where: and(
        eq(templateFavorites.templateId, id),
        eq(templateFavorites.userId, userRecord.id)
      )
    });

    if (existingLike) {
      return NextResponse.json(
        { error: 'Template already liked' },
        { status: 409 }
      );
    }

    // Create the like
    await db.insert(templateFavorites).values({
      templateId: id,
      userId: userRecord.id
    });

    // Increment like count
    await db.update(templates)
      .set({
        likeCount: sql`${templates.likeCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(templates.id, id));

    return NextResponse.json({
      message: 'Template liked successfully',
      liked: true
    });
  } catch (error) {
    console.error('Failed to like template:', error);
    return NextResponse.json(
      { error: 'Failed to like template' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id]/like - Unlike a template
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

    // Check if like exists
    const existingLike = await db.query.templateFavorites.findFirst({
      where: and(
        eq(templateFavorites.templateId, id),
        eq(templateFavorites.userId, userRecord.id)
      )
    });

    if (!existingLike) {
      return NextResponse.json(
        { error: 'Template not liked' },
        { status: 404 }
      );
    }

    // Remove the like
    await db.delete(templateFavorites)
      .where(and(
        eq(templateFavorites.templateId, id),
        eq(templateFavorites.userId, userRecord.id)
      ));

    // Decrement like count
    await db.update(templates)
      .set({
        likeCount: sql`GREATEST(${templates.likeCount} - 1, 0)`,
        updatedAt: new Date()
      })
      .where(eq(templates.id, id));

    return NextResponse.json({
      message: 'Template unliked successfully',
      liked: false
    });
  } catch (error) {
    console.error('Failed to unlike template:', error);
    return NextResponse.json(
      { error: 'Failed to unlike template' },
      { status: 500 }
    );
  }
}