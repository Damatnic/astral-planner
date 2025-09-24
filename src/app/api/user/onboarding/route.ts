import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Update user preferences in database
    await db
      .update(users)
      .set({
        settings: {
          goals: body.goals,
          experience: body.experience,
          features: body.features,
          timezone: body.timezone,
          notifications: body.notifications,
          onboardingCompleted: true,
          onboardingCompletedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, userId))

    // Update Clerk user metadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        onboardingCompleted: true,
        role: body.experience === 'advanced' ? 'power_user' : 'user',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
    })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}