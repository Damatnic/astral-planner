import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface WelcomeEmailProps {
  firstName?: string
  loginUrl?: string
}

export const WelcomeEmail = ({
  firstName = 'there',
  loginUrl = 'https://app.astralplanner.com',
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Astral Planner - Your Journey to Productivity Starts Here</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logo}>
            <Heading style={heading}>✨ Astral Planner</Heading>
          </Section>
          
          <Heading style={h1}>Welcome {firstName}!</Heading>
          
          <Text style={text}>
            We're thrilled to have you join Astral Planner. You've taken the first step toward
            organizing your life and achieving your goals with the most advanced digital planning
            system.
          </Text>
          
          <Section style={featureSection}>
            <Heading as="h2" style={h2}>
              Here's what you can do with Astral Planner:
            </Heading>
            
            <div style={featureGrid}>
              <div style={feature}>
                <Text style={featureIcon}>🎯</Text>
                <Text style={featureTitle}>Set & Track Goals</Text>
                <Text style={featureDescription}>
                  Break down big goals into manageable tasks
                </Text>
              </div>
              
              <div style={feature}>
                <Text style={featureIcon}>⏰</Text>
                <Text style={featureTitle}>Time Blocking</Text>
                <Text style={featureDescription}>
                  Schedule your day for maximum productivity
                </Text>
              </div>
              
              <div style={feature}>
                <Text style={featureIcon}>💪</Text>
                <Text style={featureTitle}>Build Habits</Text>
                <Text style={featureDescription}>
                  Track streaks and build lasting habits
                </Text>
              </div>
              
              <div style={feature}>
                <Text style={featureIcon}>🤖</Text>
                <Text style={featureTitle}>AI Assistant</Text>
                <Text style={featureDescription}>
                  Get smart suggestions and insights
                </Text>
              </div>
            </div>
          </Section>
          
          <Section style={buttonContainer}>
            <Button style={button} href={loginUrl}>
              Get Started
            </Button>
          </Section>
          
          <Hr style={hr} />
          
          <Section>
            <Heading as="h3" style={h3}>
              Quick Tips to Get Started:
            </Heading>
            <Text style={list}>
              1. Complete your profile to personalize your experience
            </Text>
            <Text style={list}>
              2. Create your first workspace for work or personal use
            </Text>
            <Text style={list}>
              3. Add your first tasks and set up your calendar
            </Text>
            <Text style={list}>
              4. Explore templates to jumpstart your planning
            </Text>
          </Section>
          
          <Hr style={hr} />
          
          <Text style={footer}>
            Need help? Reply to this email or check out our{' '}
            <Link href="https://help.astralplanner.com" style={link}>
              help center
            </Link>
            .
          </Text>
          
          <Text style={footer}>
            Happy planning,
            <br />
            The Astral Planner Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default WelcomeEmail

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

const logo = {
  padding: '0 40px',
}

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#3b82f6',
  padding: '17px 0 0',
}

const h1 = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  color: '#1f2937',
  padding: '0 40px',
  margin: '30px 0',
}

const h2 = {
  fontSize: '20px',
  lineHeight: '1.4',
  fontWeight: '600',
  color: '#1f2937',
  padding: '0 40px',
  margin: '0 0 20px',
}

const h3 = {
  fontSize: '16px',
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

const list = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#4b5563',
  padding: '0 40px',
  margin: '0 0 10px',
}

const buttonContainer = {
  padding: '27px 40px',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '14px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '42px 40px',
}

const footer = {
  fontSize: '12px',
  lineHeight: '1.5',
  color: '#9ca3af',
  padding: '0 40px',
  margin: '0 0 10px',
}

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
}

const featureSection = {
  padding: '0 40px',
  margin: '30px 0',
}

const featureGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '20px',
}

const feature = {
  textAlign: 'center' as const,
  padding: '20px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
}

const featureIcon = {
  fontSize: '32px',
  margin: '0 0 10px',
}

const featureTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 5px',
}

const featureDescription = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0',
}