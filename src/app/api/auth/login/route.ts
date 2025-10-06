/**
 * Login API Route
 * Handles user authentication for demo and regular accounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/lib/logger/edge';
import { z } from 'zod';

const apiLogger = Logger.child({ component: 'auth-login' });

// Demo account credentials
const DEMO_ACCOUNTS = [
  {
    id: 'demo-user',
    accountId: 'demo-user',
    pin: '0000',
    username: 'demo',
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@astralplanner.com',
    isDemo: true,
    isPremium: false,
    role: 'user' as const
  },
  {
    id: 'nick-planner',
    accountId: 'nick-planner',
    pin: '7347',
    username: 'nick',
    firstName: 'Nick',
    lastName: '',
    email: 'nick@astralplanner.com',
    isDemo: false,
    isPremium: true,
    role: 'premium' as const
  }
];

const loginSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  pin: z.string().length(4, 'PIN must be 4 digits'),
  deviceInfo: z.object({
    fingerprint: z.string().optional()
  }).optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error.errors[0]?.message || 'Invalid request data' 
        },
        { status: 400 }
      );
    }

    const { accountId, pin } = validation.data;

    // Find the account
    const account = DEMO_ACCOUNTS.find(acc => acc.accountId === accountId);
    
    if (!account) {
      apiLogger.warn('Login attempt with invalid account ID', { accountId });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid account or PIN' 
        },
        { status: 401 }
      );
    }

    // Verify PIN
    if (account.pin !== pin) {
      apiLogger.warn('Login attempt with incorrect PIN', { accountId, username: account.username });
      
      // In production, track failed attempts per account
      // For now, return a generic error with mock attempt tracking
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid PIN for ${account.firstName}'s account. Please check your PIN and try again.`,
          attemptsRemaining: 4 // Mock rate limiting - in production, track this per user
        },
        { status: 401 }
      );
    }

    // Generate mock tokens (in production, use proper JWT)
    const accessToken = Buffer.from(JSON.stringify({ 
      userId: account.id, 
      exp: Date.now() + 3600000 // 1 hour
    })).toString('base64');

    const refreshToken = Buffer.from(JSON.stringify({ 
      userId: account.id, 
      exp: Date.now() + 604800000 // 7 days
    })).toString('base64');

    // Successful login
    apiLogger.info('User logged in successfully', { accountId, isDemo: account.isDemo });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: account.id,
          username: account.username,
          firstName: account.firstName,
          lastName: account.lastName,
          email: account.email,
          isDemo: account.isDemo,
          isPremium: account.isPremium,
          role: account.role,
          imageUrl: account.isDemo ? '🎯' : '�‍💼',
          onboardingCompleted: !account.isDemo, // Demo completes onboarding, Nick doesn't need it
          onboardingStep: account.isDemo ? 4 : 0,
          settings: {
            theme: account.isDemo ? 'green' : 'blue',
            notifications: true
          }
        },
        tokens: {
          accessToken,
          refreshToken
        }
      },
      { status: 200 }
    );

    // Set auth cookie
    response.cookies.set('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/'
    });

    return response;

  } catch (error) {
    apiLogger.error('Login error', error as Error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'An error occurred during login. Please try again.' 
      },
      { status: 500 }
    );
  }
}
