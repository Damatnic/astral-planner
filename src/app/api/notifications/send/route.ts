import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/resend'
import { WelcomeEmail } from '@/emails/WelcomeEmail'
import { ReminderEmail } from '@/emails/ReminderEmail'
import { db } from '@/db'
import { users, blocks } from '@/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, recipientEmail, data } = await req.json()

    if (!type || !recipientEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let emailResult

    switch (type) {
      case 'welcome':
        emailResult = await sendEmail({
          to: recipientEmail,
          subject: 'Welcome to Astral Planner! 🎉',
          react: WelcomeEmail({
            firstName: data?.firstName,
            loginUrl: process.env.NEXT_PUBLIC_APP_URL,
          }),
        })
        break

      case 'daily-reminder':
        // Fetch user's tasks for today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const todaysTasks = await db
          .select()
          .from(blocks)
          .where(
            and(
              eq(blocks.createdBy, userId),
              eq(blocks.type, 'task'),
              gte(blocks.dueDate, today),
              lte(blocks.dueDate, tomorrow)
            )
          )

        const tasks = todaysTasks.map(task => ({
          title: task.title,
          dueTime: task.dueDate?.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          priority: task.priority || undefined,
        }))

        emailResult = await sendEmail({
          to: recipientEmail,
          subject: `You have ${tasks.length} tasks due today`,
          react: ReminderEmail({
            firstName: data?.firstName,
            tasks,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
          }),
        })
        break

      case 'custom':
        emailResult = await sendEmail({
          to: recipientEmail,
          subject: data?.subject || 'Notification from Astral Planner',
          html: data?.html,
          text: data?.text,
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        )
    }

    if (!emailResult.success) {
      throw new Error('Failed to send email')
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      data: emailResult.data,
    })
  } catch (error) {
    console.error('Notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}

// GET endpoint to test email templates
export async function GET(req: NextRequest) {
  const template = req.nextUrl.searchParams.get('template')
  
  if (!template) {
    return NextResponse.json(
      { error: 'Template parameter required' },
      { status: 400 }
    )
  }

  switch (template) {
    case 'welcome':
      return new Response(
        WelcomeEmail({ firstName: 'John' }) as any,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      )
    
    case 'reminder':
      return new Response(
        ReminderEmail({
          firstName: 'John',
          tasks: [
            { title: 'Complete project proposal', dueTime: '10:00 AM', priority: 'high' },
            { title: 'Team meeting', dueTime: '2:00 PM', priority: 'medium' },
            { title: 'Review pull requests', priority: 'low' },
          ],
        }) as any,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      )
    
    default:
      return NextResponse.json(
        { error: 'Invalid template' },
        { status: 400 }
      )
  }
}