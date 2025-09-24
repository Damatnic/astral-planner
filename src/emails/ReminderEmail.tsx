import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface Task {
  title: string
  dueTime?: string
  priority?: string
}

interface ReminderEmailProps {
  firstName?: string
  tasks?: Task[]
  dashboardUrl?: string
}

export const ReminderEmail = ({
  firstName = 'there',
  tasks = [],
  dashboardUrl = 'https://app.astralplanner.com/dashboard',
}: ReminderEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>You have {tasks.length} tasks due today</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>✨ Astral Planner</Heading>
          </Section>
          
          <Heading style={h1}>Good morning, {firstName}!</Heading>
          
          <Text style={text}>
            Here's your daily reminder. You have <strong>{tasks.length} tasks</strong> scheduled for today.
          </Text>
          
          {tasks.length > 0 && (
            <Section style={taskSection}>
              <Heading as="h2" style={h2}>
                Today's Tasks
              </Heading>
              
              {tasks.map((task, index) => (
                <div key={index} style={taskItem}>
                  <div style={taskContent}>
                    <Text style={taskTitle}>{task.title}</Text>
                    <div style={taskMeta}>
                      {task.dueTime && (
                        <Text style={taskTime}>⏰ {task.dueTime}</Text>
                      )}
                      {task.priority && (
                        <Text style={getPriorityStyle(task.priority)}>
                          {getPriorityLabel(task.priority)}
                        </Text>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </Section>
          )}
          
          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              View All Tasks
            </Button>
          </Section>
          
          <Hr style={hr} />
          
          <Section>
            <Text style={tip}>
              💡 <strong>Productivity Tip:</strong> Start with your highest priority task when your
              energy is at its peak. You'll feel accomplished and motivated to tackle the rest of
              your list.
            </Text>
          </Section>
          
          <Hr style={hr} />
          
          <Text style={footer}>
            You're receiving this because you have daily reminders enabled.{' '}
            <Link href={`${dashboardUrl}/settings/notifications`} style={link}>
              Manage preferences
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ReminderEmail

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'high':
      return '🔴 High Priority'
    case 'medium':
      return '🟡 Medium Priority'
    case 'low':
      return '🟢 Low Priority'
    default:
      return ''
  }
}

const getPriorityStyle = (priority: string) => {
  const base = {
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    margin: '0 4px',
  }
  
  switch (priority) {
    case 'high':
      return { ...base, color: '#dc2626', backgroundColor: '#fee2e2' }
    case 'medium':
      return { ...base, color: '#ca8a04', backgroundColor: '#fef3c7' }
    case 'low':
      return { ...base, color: '#16a34a', backgroundColor: '#dcfce7' }
    default:
      return base
  }
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const header = {
  padding: '0 40px',
}

const logo = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#3b82f6',
  padding: '17px 0 0',
}

const h1 = {
  fontSize: '28px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#1f2937',
  padding: '0 40px',
  margin: '30px 0 20px',
}

const h2 = {
  fontSize: '18px',
  lineHeight: '1.4',
  fontWeight: '600',
  color: '#1f2937',
  padding: '0 40px',
  margin: '0 0 15px',
}

const text = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#4b5563',
  padding: '0 40px',
  margin: '0 0 20px',
}

const taskSection = {
  padding: '0 40px',
  margin: '20px 0',
}

const taskItem = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '12px 16px',
  marginBottom: '8px',
  border: '1px solid #e5e7eb',
}

const taskContent = {
  display: 'flex',
  flexDirection: 'column' as const,
}

const taskTitle = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#1f2937',
  margin: '0 0 4px',
}

const taskMeta = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

const taskTime = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0',
}

const buttonContainer = {
  padding: '20px 40px',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 40px',
}

const tip = {
  fontSize: '13px',
  lineHeight: '1.6',
  color: '#4b5563',
  padding: '12px 40px',
  margin: '0',
  backgroundColor: '#f0f9ff',
  borderLeft: '3px solid #3b82f6',
}

const footer = {
  fontSize: '12px',
  lineHeight: '1.5',
  color: '#9ca3af',
  padding: '0 40px',
  margin: '0',
}

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
}