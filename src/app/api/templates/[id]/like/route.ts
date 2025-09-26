import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/auth-utils';

import { db } from '@/db';
import { templateLikes } from '@/db/schema/templates';
import { eq, and } from 'drizzle-orm';

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

    console.log('Template liked:', { templateId, userId: user.id });

    return NextResponse.json({ success: true, liked: true });
  } catch (error) {
    console.error('Template like error:', error);
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

    console.log('Template unliked:', { templateId, userId: user.id });

    return NextResponse.json({ success: true, liked: false });
  } catch (error) {
    console.error('Template unlike error:', error);
    return NextResponse.json(
      { error: 'Failed to unlike template' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return await handlePOST(req, { params: resolvedParams });
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return await handleDELETE(req, { params: resolvedParams });
}