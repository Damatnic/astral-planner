/**
 * Refresh Token API Route
 * Refreshes the access token using a refresh token
 */

import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/lib/logger/edge';

const apiLogger = Logger.child({ component: 'auth-refresh' });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Refresh token required' 
        },
        { status: 400 }
      );
    }

    // Decode refresh token (in production, use proper JWT verification)
    try {
      const decoded = JSON.parse(Buffer.from(refreshToken, 'base64').toString());
      
      // Check if refresh token is expired
      if (decoded.exp < Date.now()) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Refresh token expired' 
          },
          { status: 401 }
        );
      }

      // Generate new access token
      const newAccessToken = Buffer.from(JSON.stringify({ 
        userId: decoded.userId, 
        exp: Date.now() + 3600000 // 1 hour
      })).toString('base64');

      apiLogger.info('Token refreshed successfully', { userId: decoded.userId });

      const response = NextResponse.json(
        {
          success: true,
          tokens: {
            accessToken: newAccessToken,
            refreshToken // Return same refresh token
          }
        },
        { status: 200 }
      );

      // Update auth cookie
      response.cookies.set('auth_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600, // 1 hour
        path: '/'
      });

      return response;

    } catch (error) {
      apiLogger.error('Refresh token decode error', error as Error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid refresh token' 
        },
        { status: 401 }
      );
    }

  } catch (error) {
    apiLogger.error('Refresh token error', error as Error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'An error occurred during token refresh. Please try again.' 
      },
      { status: 500 }
    );
  }
}
