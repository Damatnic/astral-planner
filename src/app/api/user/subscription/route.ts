import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdmin } from '@/lib/auth/middleware';
import { UserService } from '@/lib/auth/user-service';
import { getUserFromRequest } from '@/lib/auth';
import Logger from '@/lib/logger';

async function handlePUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, subscription } = body;

    if (!userId || !subscription) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, subscription' },
        { status: 400 }
      );
    }

    // Validate subscription plan
    const validPlans = ['free', 'pro', 'team', 'admin'];
    if (!validPlans.includes(subscription.plan)) {
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      );
    }

    const updatedUser = await UserService.updateSubscription(userId, subscription);
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      );
    }

    Logger.info('Subscription updated:', { 
      userId, 
      plan: subscription.plan,
      status: subscription.status 
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        subscription: updatedUser.subscription,
      },
    });
  } catch (error) {
    Logger.error('Subscription update failed:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

async function handleGET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await UserService.getUserById(user.id);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      subscription: dbUser.subscription,
    });
  } catch (error) {
    Logger.error('Subscription fetch failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

// GET: any authenticated user can see their own subscription
export const GET = withAuth(handleGET);

// PUT: only admins can update subscriptions (or webhook endpoints with proper validation)
export const PUT = withAdmin(handlePUT);