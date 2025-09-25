import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { templateLikes } from '@/db/schema/templates';
import { eq, and } from 'drizzle-orm';
import Logger from '@/lib/logger';

async function handlePOST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = params.id;

    // Check if user already liked this template
    const existingLike = await db.select()
      .from(templateLikes)
      .where(and(
        eq(templateLikes.templateId, templateId),
        eq(templateLikes.userId, user.id)
      ))
      .limit(1);

    if (existingLike.length > 0) {
      return NextResponse.json(
        { error: 'Template already liked' },
        { status: 400 }
      );
    }

    // Add like
    await db.insert(templateLikes).values({
      templateId,
      userId: user.id,
    });

    Logger.info('Template liked:', { templateId, userId: user.id });

    return NextResponse.json({ success: true, liked: true });
  } catch (error) {
    Logger.error('Template like error:', error);
    return NextResponse.json(
      { error: 'Failed to like template' },
      { status: 500 }
    );
  }
}

async function handleDELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = params.id;

    // Remove like
    await db.delete(templateLikes)
      .where(and(
        eq(templateLikes.templateId, templateId),
        eq(templateLikes.userId, user.id)
      ));

    Logger.info('Template unliked:', { templateId, userId: user.id });

    return NextResponse.json({ success: true, liked: false });
  } catch (error) {
    Logger.error('Template unlike error:', error);
    return NextResponse.json(
      { error: 'Failed to unlike template' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePOST);
export const DELETE = withAuth(handleDELETE);