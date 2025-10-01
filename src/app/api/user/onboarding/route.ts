// Force dynamic rendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server'
import { apiLogger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    apiLogger.info('Onboarding completion request received', { action: 'completeOnboarding' });
    
    const body = await req.json();
    apiLogger.debug('Onboarding data received', { 
      action: 'completeOnboarding',
      role: body.role,
      planningStyle: body.planningStyle
    });

    // In production, we're using a simplified approach without database updates
    // Store onboarding data in localStorage on the client side
    // This would normally be stored in a database with proper user authentication

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role,
        goals: body.goals,
        categories: body.categories,
        planningStyle: body.planningStyle,
        enabledFeatures: body.enabledFeatures,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString(),
      }
    })
  } catch (error) {
    apiLogger.error('Onboarding error', { action: 'completeOnboarding' }, error as Error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}
