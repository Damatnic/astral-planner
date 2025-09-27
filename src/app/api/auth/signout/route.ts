/**
 * Revolutionary Sign Out API Endpoint
 * Secure logout with comprehensive session cleanup
 */

import { NextRequest, NextResponse } from 'next/server';
import { signOut, clearAuthCookies } from '@/lib/auth/auth-service';
import { getSecureTokenHeaders } from '@/lib/auth/token-service';
import Logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    Logger.info('Sign out attempt', {
      ip: request.headers.get('x-forwarded-for') || request.ip,
      userAgent: request.headers.get('user-agent')
    });

    const signOutResult = await signOut(request);

    if (!signOutResult.success) {
      const processingTime = Date.now() - startTime;
      
      Logger.warn('Sign out failed', {
        error: signOutResult.error,
        processingTime
      });

      return NextResponse.json(
        {
          success: false,
          error: signOutResult.error
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

    const processingTime = Date.now() - startTime;

    Logger.info('Sign out successful', { processingTime });

    // Create response with cleared cookies
    const response = clearAuthCookies();
    
    // Update response body
    const responseData = {
      success: true,
      message: 'Signed out successfully',
      timestamp: new Date().toISOString()
    };

    // Add security headers
    Object.entries(getSecureTokenHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    response.headers.set('X-Processing-Time', processingTime.toString());

    // Update response body
    return NextResponse.json(responseData, {
      status: 200,
      headers: response.headers
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    Logger.error('Sign out endpoint error', { 
      error,
      processingTime,
      ip: request.headers.get('x-forwarded-for') || request.ip
    });

    // Still clear cookies even if there was an error
    const response = clearAuthCookies();

    return NextResponse.json(
      { 
        success: false, 
        error: 'Sign out service temporarily unavailable' 
      },
      { 
        status: 500,
        headers: {
          'X-Processing-Time': processingTime.toString(),
          ...getSecureTokenHeaders(),
          ...Object.fromEntries(response.headers.entries())
        }
      }
    );
  }
}

// Also allow GET for logout links (but log as potentially suspicious)
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  Logger.warn('GET request to sign out endpoint - potential CSRF or accidental link', {
    ip: request.headers.get('x-forwarded-for') || request.ip,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer')
  });

  // Perform the same logout logic but with additional security checks
  try {
    const signOutResult = await signOut(request);
    const processingTime = Date.now() - startTime;

    if (signOutResult.success) {
      Logger.info('GET sign out successful (with warning)', { processingTime });
      
      const response = clearAuthCookies();
      
      Object.entries(getSecureTokenHeaders()).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      response.headers.set('X-Processing-Time', processingTime.toString());
      response.headers.set('X-Logout-Method', 'GET');
      response.headers.set('X-Security-Warning', 'GET logout detected');

      return NextResponse.json({
        success: true,
        message: 'Signed out successfully',
        warning: 'GET method used for logout - consider using POST for better security',
        timestamp: new Date().toISOString()
      }, {
        status: 200,
        headers: response.headers
      });
    }

    return NextResponse.json(
      { success: false, error: 'Sign out failed' },
      { status: 500 }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    Logger.error('GET sign out endpoint error', { 
      error,
      processingTime,
      ip: request.headers.get('x-forwarded-for') || request.ip
    });

    const response = clearAuthCookies();

    return NextResponse.json(
      { 
        success: false, 
        error: 'Sign out service temporarily unavailable' 
      },
      { 
        status: 500,
        headers: {
          'X-Processing-Time': processingTime.toString(),
          ...getSecureTokenHeaders(),
          ...Object.fromEntries(response.headers.entries())
        }
      }
    );
  }
}

// Disable other HTTP methods
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

export async function PATCH() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}