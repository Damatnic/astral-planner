import { clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getUserForRequest } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const user = await getUserForRequest(req)
    
    if (!user?.id) {
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
      .where(eq(users.clerkId, user.id))

    // Skip Clerk metadata update - using Stack Auth now
    // await clerkClient.users.updateUserMetadata(user.id, {
    //   publicMetadata: {
    //     onboardingCompleted: true,
    //     role: body.experience === 'advanced' ? 'power_user' : 'user',
    //   },
    // })

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