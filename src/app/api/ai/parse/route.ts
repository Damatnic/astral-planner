import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { getUserFromRequest } from '@/lib/auth';
import Logger from '@/lib/logger';

// Simple AI parser that extracts task information from natural language
function parseNaturalLanguage(input: string): {
  type: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority?: string;
  estimatedDuration?: number;
  tags?: string[];
} {
  const lowerInput = input.toLowerCase();
  
  // Determine type based on keywords
  let type = 'task'; // default
  
  if (lowerInput.includes('meet') || lowerInput.includes('appointment') || 
      lowerInput.includes('call') || lowerInput.includes('at ') || 
      lowerInput.includes('on ')) {
    type = 'event';
  } else if (lowerInput.includes('goal') || lowerInput.includes('achieve') || 
             lowerInput.includes('target')) {
    type = 'goal';
  } else if (lowerInput.includes('habit') || lowerInput.includes('daily') || 
             lowerInput.includes('every day') || lowerInput.includes('routine')) {
    type = 'habit';
  } else if (lowerInput.includes('note') || lowerInput.includes('remember') || 
             lowerInput.includes('idea')) {
    type = 'note';
  }

  // Extract priority
  let priority = 'medium';
  if (lowerInput.includes('urgent') || lowerInput.includes('asap') || 
      lowerInput.includes('critical') || lowerInput.includes('important')) {
    priority = 'high';
  } else if (lowerInput.includes('low priority') || lowerInput.includes('when possible') || 
             lowerInput.includes('someday')) {
    priority = 'low';
  }

  // Extract time estimates
  let estimatedDuration = undefined;
  const timeMatch = input.match(/(\d+)\s*(min|minute|minutes|hr|hour|hours)/i);
  if (timeMatch) {
    const amount = parseInt(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    if (unit.startsWith('min')) {
      estimatedDuration = amount;
    } else {
      estimatedDuration = amount * 60;
    }
  }

  // Extract dates (simple patterns)
  let dueDate = undefined;
  const today = new Date();
  
  if (lowerInput.includes('today')) {
    dueDate = new Date(today);
  } else if (lowerInput.includes('tomorrow')) {
    dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 1);
  } else if (lowerInput.includes('next week')) {
    dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 7);
  } else if (lowerInput.includes('next month')) {
    dueDate = new Date(today);
    dueDate.setMonth(today.getMonth() + 1);
  }

  // Extract time for events
  const timeMatch2 = input.match(/(\d+):?(\d*)\s*(am|pm)/i);
  if (timeMatch2 && dueDate) {
    let hours = parseInt(timeMatch2[1]);
    const minutes = parseInt(timeMatch2[2]) || 0;
    const ampm = timeMatch2[3].toLowerCase();
    
    if (ampm === 'pm' && hours !== 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    
    dueDate.setHours(hours, minutes, 0, 0);
  }

  // Extract tags (words with #)
  const tagMatches = input.match(/#\w+/g);
  const tags = tagMatches ? tagMatches.map(tag => tag.substring(1)) : [];

  // Clean up the title (remove time references and other extracted data)
  let title = input
    .replace(/(\d+):?(\d*)\s*(am|pm)/gi, '')
    .replace(/(\d+)\s*(min|minute|minutes|hr|hour|hours)/gi, '')
    .replace(/(today|tomorrow|next week|next month)/gi, '')
    .replace(/(urgent|asap|critical|important|low priority)/gi, '')
    .replace(/#\w+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!title) {
    title = input; // fallback to original input
  }

  return {
    type,
    title,
    dueDate,
    priority,
    estimatedDuration,
    tags: tags.length > 0 ? tags : undefined
  };
}

// Generate completion suggestions
function generateSuggestion(input: string): string {
  const lowerInput = input.toLowerCase();
  
  // Common completion patterns
  if (lowerInput.includes('meeting')) {
    return `${input} at 2pm tomorrow`;
  } else if (lowerInput.includes('call')) {
    return `${input} about project update`;
  } else if (lowerInput.includes('buy')) {
    return `${input} from grocery store`;
  } else if (lowerInput.includes('workout')) {
    return `${input} for 45 minutes`;
  } else if (lowerInput.includes('read')) {
    return `${input} for 30 minutes`;
  } else if (lowerInput.includes('write')) {
    return `${input} draft by Friday`;
  } else if (lowerInput.includes('email')) {
    return `${input} to team about updates`;
  } else {
    // Add generic completions
    const completions = [
      ' by end of day',
      ' this week',
      ' as soon as possible',
      ' when I have time',
      ' before lunch'
    ];
    const randomCompletion = completions[Math.floor(Math.random() * completions.length)];
    return `${input}${randomCompletion}`;
  }
}

async function handlePOST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { input, preview = false } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    // For preview mode, return a suggestion
    if (preview) {
      const suggestion = generateSuggestion(input);
      Logger.info('AI parse preview:', { input, suggestion, userId: user.id });
      
      return NextResponse.json({
        suggestion,
        confidence: 0.8
      });
    }

    // For full parsing, return structured data
    const parsed = parseNaturalLanguage(input);
    
    Logger.info('AI parse result:', { 
      input, 
      parsed: { ...parsed, dueDate: parsed.dueDate?.toISOString() },
      userId: user.id 
    });

    return NextResponse.json({
      parsed,
      confidence: 0.85, // Mock confidence score
      processing_time: Math.random() * 100 + 50 // Mock processing time
    });

  } catch (error) {
    Logger.error('AI parse error:', error);
    return NextResponse.json(
      { error: 'Failed to parse input' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePOST);