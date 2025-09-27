/**
 * Revolutionary Login API Endpoint
 * Production-ready authentication with comprehensive security
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createAuthResponse } from '@/lib/auth/auth-service';
import Logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    Logger.info('Login attempt initiated', {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent')
    });

    // Authenticate user with comprehensive security checks
    const authResult = await authenticateUser(request);

    if (!authResult.success) {
      const processingTime = Date.now() - startTime;
      
      Logger.warn('Login failed', {
        error: authResult.error,
        lockoutUntil: authResult.lockoutUntil,
        attemptsRemaining: authResult.attemptsRemaining,
        processingTime
      });

      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
          lockoutUntil: authResult.lockoutUntil,
          attemptsRemaining: authResult.attemptsRemaining
        },
        { 
          status: 401,
          headers: {
            'X-Processing-Time': processingTime.toString(),
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );
    }

    if (!authResult.tokens || !authResult.user) {
      Logger.error('Authentication succeeded but missing tokens or user data');
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 500 }
      );
    }

    const processingTime = Date.now() - startTime;

    Logger.info('Login successful', {
      userId: authResult.user.id,
      isDemo: authResult.user.isDemo,
      processingTime
    });

    // Create secure response with tokens and cookies
    const response = createAuthResponse(authResult.tokens, authResult.user);
    response.headers.set('X-Processing-Time', processingTime.toString());

    return response;

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    Logger.error('Login endpoint error', { 
      error,
      processingTime,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Authentication service temporarily unavailable' 
      },
      { 
        status: 500,
        headers: {
          'X-Processing-Time': processingTime.toString(),
          'Cache-Control': 'no-store, no-cache, must-revalidate'
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