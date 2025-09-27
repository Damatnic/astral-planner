/**
 * Revolutionary Token Refresh API Endpoint
 * Secure token refresh with advanced validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { refreshTokens } from '@/lib/auth/auth-service';
import { getSecureTokenHeaders } from '@/lib/auth/token-service';
import Logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    Logger.info('Token refresh attempt', {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent')
    });

    const refreshResult = await refreshTokens(request);

    if (refreshResult.error) {
      const processingTime = Date.now() - startTime;
      
      Logger.warn('Token refresh failed', {
        error: refreshResult.error,
        processingTime
      });

      return NextResponse.json(
        {
          success: false,
          error: refreshResult.error
        },
        { 
          status: 401,
          headers: {
            'X-Processing-Time': processingTime.toString(),
            ...getSecureTokenHeaders()
          }
        }
      );
    }

    if (!refreshResult.tokens) {
      Logger.error('Token refresh succeeded but missing tokens');
      return NextResponse.json(
        { success: false, error: 'Token refresh failed' },
        { status: 500 }
      );
    }

    const processingTime = Date.now() - startTime;

    Logger.info('Token refresh successful', { processingTime });

    // Create response with new tokens
    const response = NextResponse.json({
      success: true,
      tokens: {
        expiresIn: refreshResult.tokens.expiresIn,
        refreshExpiresIn: refreshResult.tokens.refreshExpiresIn,
        sessionExpiresIn: refreshResult.tokens.sessionExpiresIn
      }
    });

    // Update HTTP-only cookies with new tokens
    const isProduction = process.env.NODE_ENV === 'production';
    
    response.cookies.set('access_token', refreshResult.tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: refreshResult.tokens.expiresIn,
      path: '/'
    });

    response.cookies.set('session_token', refreshResult.tokens.sessionToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: refreshResult.tokens.sessionExpiresIn,
      path: '/'
    });

    // Add security headers
    Object.entries(getSecureTokenHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    response.headers.set('X-Processing-Time', processingTime.toString());

    return response;

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    Logger.error('Token refresh endpoint error', { 
      error,
      processingTime,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Token refresh service temporarily unavailable' 
      },
      { 
        status: 500,
        headers: {
          'X-Processing-Time': processingTime.toString(),
          ...getSecureTokenHeaders()
        }
      }
    );
  }
}

// Disable other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}