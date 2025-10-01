import { Resend } from 'resend'
import { logger } from '@/lib/logger';

export const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string | string[]
  subject: string
  react?: React.ReactElement
  html?: string
  text?: string
  from?: string
  replyTo?: string
}

export async function sendEmail(options: EmailOptions) {
  const { to, subject, react, html, text, from, replyTo } = options

  try {
    const data = await resend.emails.send({
      from: from || 'Astral Planner <noreply@astralplanner.com>',
      to,
      subject,
      react,
      html,
      text,
      replyTo,
    })

    return { success: true, data }
  } catch (error) {
    logger.error('Failed to send email', { to, subject }, error as Error);
    return { success: false, error }
  }
}