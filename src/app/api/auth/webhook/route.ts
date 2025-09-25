import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, workspaces } from '@/db/schema';
import { eq } from 'drizzle-orm';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || '';

if (!webhookSecret) {
  throw new Error('Missing CLERK_WEBHOOK_SECRET environment variable');
}

export async function POST(req: NextRequest) {
  // TEMPORARY: Clerk webhooks disabled during Stack Auth migration
  return NextResponse.json({ message: 'Webhook temporarily disabled' }, { status: 200 });
  
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: 'Missing required headers' },
      { status: 400 }
    );
  }

  const payload = await req.text();
  const body = JSON.parse(payload);

  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(payload, {
      'svix-id': svixId!,
      'svix-timestamp': svixTimestamp!,
      'svix-signature': svixSignature!,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 400 }
    );
  }

  const { id } = evt.data as any;
  const eventType = evt.type;

  console.log(`Webhook ${id} received: ${eventType}`);

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt);
        break;
      case 'user.updated':
        await handleUserUpdated(evt);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt);
        break;
      case 'session.created':
        await handleSessionCreated(evt);
        break;
      case 'session.ended':
        await handleSessionEnded(evt);
        break;
      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error handling webhook ${eventType}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleUserCreated(evt: WebhookEvent) {
  const data = evt.data as any as any; // Type assertion for webhook data
  const { id, email_addresses, first_name, last_name, image_url, username } = data;

  const primaryEmail = email_addresses?.find((email: any) => email.id === data.primary_email_address_id);

  if (!primaryEmail) {
    throw new Error('No primary email found');
  }

  // Create user in database
  const newUser = await db.insert(users).values({
    clerkId: id!,
    email: primaryEmail.email_address,
    firstName: first_name || null,
    lastName: last_name || null,
    imageUrl: image_url || null,
    username: username || null,
    onboardingCompleted: false,
    onboardingStep: 0,
  }).returning();

  // Create default personal workspace
  await db.insert(workspaces).values({
    name: 'Personal',
    description: 'Your personal planning workspace',
    slug: `personal-${newUser[0].id}`,
    ownerId: newUser[0].id,
    isPersonal: true,
    settings: {
      defaultView: 'kanban',
      allowComments: true,
      allowDuplicates: false,
      autoArchive: false,
      template: null,
      integrations: {
        calendar: false,
        slack: false,
        github: false
      },
      permissions: {
        allowGuests: false,
        defaultRole: 'viewer'
      }
    }
  });

  console.log(`User created: ${id} with email ${primaryEmail.email_address}`);
}

async function handleUserUpdated(evt: WebhookEvent) {
  const data = evt.data as any as any; // Type assertion for webhook data
  const { id, email_addresses, first_name, last_name, image_url, username } = data;

  const primaryEmail = email_addresses?.find((email: any) => email.id === data.primary_email_address_id);

  if (!primaryEmail) {
    throw new Error('No primary email found');
  }

  // Update user in database
  await db.update(users)
    .set({
      email: primaryEmail.email_address,
      firstName: first_name || null,
      lastName: last_name || null,
      imageUrl: image_url || null,
      username: username || null,
      updatedAt: new Date(),
    })
    .where(eq(users.clerkId, id!));

  console.log(`User updated: ${id}`);
}

async function handleUserDeleted(evt: WebhookEvent) {
  const { id } = evt.data as any;

  if (!id) {
    throw new Error('No user ID provided');
  }

  // Soft delete user (mark as deleted instead of hard delete)
  await db.update(users)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.clerkId, id));

  // Note: In a production system, you might want to:
  // 1. Archive or transfer user's workspaces
  // 2. Remove user from shared workspaces
  // 3. Cancel subscriptions
  // 4. Queue data export/deletion according to data retention policies

  console.log(`User deleted: ${id}`);
}

async function handleSessionCreated(evt: WebhookEvent) {
  const data = evt.data as any as any;
  const { user_id } = data;

  if (!user_id) {
    throw new Error('No user ID provided');
  }

  // Update last active timestamp
  await db.update(users)
    .set({
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.clerkId, user_id));

  console.log(`Session created for user: ${user_id}`);
}

async function handleSessionEnded(evt: WebhookEvent) {
  const { user_id } = evt.data as any;

  if (!user_id) {
    console.log('Session ended but no user ID provided');
    return;
  }

  // Could track session duration, update analytics, etc.
  console.log(`Session ended for user: ${user_id}`);
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}