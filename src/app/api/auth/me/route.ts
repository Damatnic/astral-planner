/**
 * Get Current User API Route
 * Returns the currently authenticated user's information
 */

import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/lib/logger/edge';

const apiLogger = Logger.child({ component: 'auth-me' });

export async function GET(req: NextRequest) {
  try {
    // Get auth token from cookie
    const authToken = req.cookies.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Not authenticated' 
        },
        { status: 401 }
      );
    }

    // Decode token (in production, use proper JWT verification)
    try {
      const decoded = JSON.parse(Buffer.from(authToken, 'base64').toString());
      
      // Check if token is expired
      if (decoded.exp < Date.now()) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Token expired' 
          },
          { status: 401 }
        );
      }

      // Mock user data based on userId
      const mockUsers = {
        'demo-user': {
          id: 'demo-user',
          username: 'demo',
          firstName: 'Demo',
          lastName: 'User',
          email: 'demo@astralplanner.com',
          isDemo: true,
          role: 'user',
          imageUrl: '🎯'
        },
        'nick-planner': {
          id: 'nick-planner',
          username: 'nick',
          firstName: 'Nick',
          lastName: null,
          email: 'nick@astralplanner.com',
          isDemo: false,
          role: 'user',
          imageUrl: '👤'
        }
      };

      const user = mockUsers[decoded.userId as keyof typeof mockUsers];

      if (!user) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'User not found' 
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          user
        },
        { status: 200 }
      );

    } catch (error) {
      apiLogger.error('Token decode error', error as Error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid token' 
        },
        { status: 401 }
      );
    }

  } catch (error) {
    apiLogger.error('Auth me error', error as Error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'An error occurred. Please try again.' 
      },
      { status: 500 }
    );
  }
}
