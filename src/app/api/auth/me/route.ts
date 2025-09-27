/**
 * Revolutionary User Profile API Endpoint
 * Secure user profile retrieval with comprehensive authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/auth/auth-service';
import { getSecureTokenHeaders } from '@/lib/auth/token-service';
import Logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    Logger.info('User profile request', {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent')
    });

    const profileResult = await getUserProfile(request);

    if (profileResult.error) {
      const processingTime = Date.now() - startTime;
      
      Logger.warn('User profile access denied', {
        error: profileResult.error,
        processingTime
      });

      return NextResponse.json(
        {
          error: profileResult.error,
          authenticated: false
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

    if (!profileResult.user) {
      Logger.error('Profile request succeeded but missing user data');
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const processingTime = Date.now() - startTime;

    // Enhanced user profile with security information
    const enhancedProfile = {
      user: {
        id: profileResult.user.id,
        email: profileResult.user.email,
        firstName: profileResult.user.firstName,
        lastName: profileResult.user.lastName,
        username: profileResult.user.username,
        imageUrl: profileResult.user.imageUrl,
        role: profileResult.user.role,
        isDemo: profileResult.user.isDemo || false,
        sessionId: profileResult.user.sessionId,
        
        // Enhanced profile data
        timezone: 'UTC',
        locale: 'en-US',
        settings: {
          appearance: {
            theme: profileResult.user.isDemo ? 'green' : 'dark',
            accentColor: profileResult.user.isDemo ? '#22c55e' : '#3b82f6',
            fontSize: 'medium',
            reducedMotion: false,
            compactMode: false
          },
          notifications: {
            email: { 
              taskReminders: !profileResult.user.isDemo, 
              dailyDigest: !profileResult.user.isDemo, 
              weeklyReport: !profileResult.user.isDemo, 
              achievements: true, 
              mentions: true 
            },
            push: { 
              taskReminders: true, 
              mentions: true, 
              updates: !profileResult.user.isDemo, 
              breakReminders: true 
            },
            inApp: { sounds: true, badges: true, popups: true },
            quietHours: { enabled: false, start: '22:00', end: '08:00', days: [] }
          },
          productivity: {
            pomodoroLength: 25,
            shortBreakLength: 5,
            longBreakLength: 15,
            autoStartBreaks: false,
            autoStartPomodoros: false,
            dailyGoal: 8,
            workingHours: { 
              enabled: !profileResult.user.isDemo, 
              start: '09:00', 
              end: '17:00', 
              days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] 
            }
          },
          security: {
            sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
            requireReauthForSensitive: !profileResult.user.isDemo,
            logSecurityEvents: true
          }
        },
        subscription: { 
          plan: profileResult.user.role === 'premium' ? 'premium' : 'free', 
          features: profileResult.user.role === 'premium' ? ['collaboration', 'ai', 'advanced-analytics'] : [], 
          expiresAt: null 
        },
        onboardingCompleted: !profileResult.user.isDemo,
        onboardingStep: profileResult.user.isDemo ? 1 : 6,
        aiSettings: { enabled: profileResult.user.role === 'premium' },
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      authenticated: true,
      sessionValid: true
    };

    Logger.info('User profile retrieved successfully', {
      userId: profileResult.user.id,
      isDemo: profileResult.user.isDemo,
      role: profileResult.user.role,
      processingTime
    });

    const response = NextResponse.json(enhancedProfile);
    
    // Add security headers
    Object.entries(getSecureTokenHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    response.headers.set('X-Processing-Time', processingTime.toString());

    return response;

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    Logger.error('User profile endpoint error', { 
      error,
      processingTime,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });

    return NextResponse.json(
      { 
        error: 'Profile service temporarily unavailable',
        authenticated: false
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
export async function POST() {
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