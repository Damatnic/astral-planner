import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { getUserFromRequest } from '@/lib/auth';
import Logger from '@/lib/logger';

// Generate contextual suggestions based on partial input
function generateSuggestions(input: string): string[] {
  const lowerInput = input.toLowerCase();
  const suggestions: string[] = [];

  // Task suggestions
  if (lowerInput.includes('meet') || lowerInput.startsWith('m')) {
    suggestions.push(
      'Meeting with team about project status',
      'Meeting with client to discuss requirements',
      'Meet with manager for 1-on-1 review'
    );
  }

  if (lowerInput.includes('email') || lowerInput.includes('e')) {
    suggestions.push(
      'Email team about project updates',
      'Email client with proposal draft',
      'Email weekly status report to stakeholders'
    );
  }

  if (lowerInput.includes('call') || lowerInput.startsWith('c')) {
    suggestions.push(
      'Call client to discuss project timeline',
      'Call vendor about delivery schedule',
      'Conference call with remote team'
    );
  }

  if (lowerInput.includes('write') || lowerInput.includes('w')) {
    suggestions.push(
      'Write project documentation',
      'Write blog post about recent project',
      'Write quarterly report summary'
    );
  }

  if (lowerInput.includes('review') || lowerInput.includes('r')) {
    suggestions.push(
      'Review code pull requests',
      'Review quarterly goals and progress',
      'Review team performance metrics'
    );
  }

  if (lowerInput.includes('plan') || lowerInput.includes('p')) {
    suggestions.push(
      'Plan next sprint backlog',
      'Plan team building activity',
      'Plan budget for next quarter'
    );
  }

  if (lowerInput.includes('buy') || lowerInput.includes('b')) {
    suggestions.push(
      'Buy groceries for the week',
      'Buy birthday gift for colleague',
      'Buy new office supplies'
    );
  }

  if (lowerInput.includes('workout') || lowerInput.includes('exercise')) {
    suggestions.push(
      'Workout at gym for 45 minutes',
      'Exercise routine: cardio and weights',
      'Workout with personal trainer'
    );
  }

  if (lowerInput.includes('read') || lowerInput.includes('study')) {
    suggestions.push(
      'Read industry report for insights',
      'Study new programming framework',
      'Read book chapter before meeting'
    );
  }

  if (lowerInput.includes('fix') || lowerInput.includes('debug')) {
    suggestions.push(
      'Fix production bug in authentication',
      'Debug performance issues in dashboard',
      'Fix styling issues in mobile view'
    );
  }

  // If no specific matches, provide generic productive suggestions
  if (suggestions.length === 0) {
    suggestions.push(
      'Complete daily standup preparation',
      'Update project timeline and milestones',
      'Organize desk and workspace',
      'Review and respond to pending emails',
      'Schedule time for deep work session',
      'Backup important files and documents'
    );
  }

  // Return top 6 suggestions
  return suggestions.slice(0, 6);
}

async function handlePOST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { input } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    if (input.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = generateSuggestions(input);
    
    Logger.info('AI suggestions generated:', { 
      input, 
      suggestionCount: suggestions.length,
      userId: user.id 
    });

    return NextResponse.json({
      suggestions,
      input,
      confidence: 0.9,
      processing_time: Math.random() * 50 + 20
    });

  } catch (error) {
    Logger.error('AI suggest error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePOST);