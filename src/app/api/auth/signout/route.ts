/**
 * Signout API Route
 * Clears authentication cookies and logs out the user
 */

import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/lib/logger/edge';

const apiLogger = Logger.child({ component: 'auth-signout' });

export async function POST(req: NextRequest) {
  try {
    apiLogger.info('User signing out');

    const response = NextResponse.json(
      {
        success: true,
        message: 'Signed out successfully'
      },
      { status: 200 }
    );

    // Clear auth cookie
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    return response;

  } catch (error) {
    apiLogger.error('Signout error', error as Error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'An error occurred during signout. Please try again.' 
      },
      { status: 500 }
    );
  }
}
