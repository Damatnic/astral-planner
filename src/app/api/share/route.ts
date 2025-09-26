import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/auth-utils';

import { db } from '@/db';
import { blocks } from '@/db/schema/blocks';
import { workspaces } from '@/db/schema/workspaces';
import { eq } from 'drizzle-orm';

async function handlePOST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const text = formData.get('text') as string;
    const url = formData.get('url') as string;
    const files = formData.getAll('file') as File[];

    // Get user's default workspace
    const userWorkspaces = await db.select().from(workspaces).where(eq(workspaces.ownerId, user.id)).limit(1);
    if (userWorkspaces.length === 0) {
      return NextResponse.json(
        { error: 'No workspace found for user' },
        { status: 400 }
      );
    }

    const workspaceId = userWorkspaces[0].id;

    // Create task from shared content
    const taskTitle = title || 'Shared Content';
    let taskDescription = text || '';
    
    if (url) {
      taskDescription += taskDescription ? `\n\nLink: ${url}` : `Link: ${url}`;
    }

    // Handle file attachments (basic implementation)
    if (files.length > 0) {
      taskDescription += taskDescription ? '\n\nAttached files:' : 'Attached files:';
      files.forEach(file => {
        taskDescription += `\n- ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      });
    }

    // Create the task
    const [newTask] = await db.insert(blocks).values({
      type: 'task',
      title: taskTitle.trim(),
      description: taskDescription.trim() || null,
      workspaceId,
      status: 'todo',
      priority: 'medium',
      createdBy: user.id,
      lastEditedBy: user.id,
      metadata: {
        source: 'web_share',
        sharedUrl: url || null,
        fileCount: files.length,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    console.log('Task created from web share:', {
      taskId: newTask.id,
      userId: user.id,
      title: newTask.title,
      hasUrl: !!url,
      fileCount: files.length,
    });

    // Redirect to dashboard with the new task
    const dashboardUrl = new URL('/dashboard', req.nextUrl.origin);
    dashboardUrl.searchParams.set('highlight', newTask.id);
    dashboardUrl.searchParams.set('shared', 'true');

    return NextResponse.redirect(dashboardUrl.toString());
  } catch (error) {
    console.error('Web share error:', error);
    
    // Redirect to dashboard with error
    const dashboardUrl = new URL('/dashboard', req.nextUrl.origin);
    dashboardUrl.searchParams.set('share_error', 'true');
    
    return NextResponse.redirect(dashboardUrl.toString());
  }
}

async function handleGET(req: NextRequest) {
  // Handle share target for browsers that don't support POST
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title');
  const text = searchParams.get('text');
  const url = searchParams.get('url');

  const dashboardUrl = new URL('/dashboard', req.nextUrl.origin);
  
  if (title) dashboardUrl.searchParams.set('share_title', title);
  if (text) dashboardUrl.searchParams.set('share_text', text);
  if (url) dashboardUrl.searchParams.set('share_url', url);
  
  return NextResponse.redirect(dashboardUrl.toString());
}

export async function POST(req: NextRequest) {
  return await handlePOST(req);
}
export async function GET(req: NextRequest) {
  return await handleGET(req);
}