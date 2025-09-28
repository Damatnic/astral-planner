import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    console.log('Onboarding completion request received')
    
    const body = await req.json()
    console.log('Onboarding data:', body)

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
    // TODO: Replace with proper logging - console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}