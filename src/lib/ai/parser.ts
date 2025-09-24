import OpenAI from 'openai';
import { z } from 'zod';
import { format, parse, addDays, addWeeks, addMonths, setHours, setMinutes } from 'date-fns';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Schema for parsed task/event data
const ParsedInputSchema = z.object({
  type: z.enum(['task', 'event', 'goal', 'habit', 'note', 'time_block']),
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  duration: z.number().optional(), // in minutes
  recurrence: z.object({
    pattern: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number(),
    daysOfWeek: z.array(z.number()).optional(),
    endDate: z.string().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  assignee: z.string().optional(),
  location: z.string().optional(),
  reminders: z.array(z.object({
    type: z.enum(['notification', 'email', 'sms']),
    minutesBefore: z.number(),
  })).optional(),
  energy: z.enum(['low', 'medium', 'high']).optional(),
  focus: z.enum(['low', 'medium', 'high']).optional(),
  metadata: z.record(z.any()).optional(),
});

export type ParsedInput = z.infer<typeof ParsedInputSchema>;

export class NaturalLanguageParser {
  private systemPrompt = `You are an AI assistant that parses natural language input into structured task/event data.
Parse the user's input and extract relevant information to create tasks, events, goals, habits, or notes.

Current date: ${new Date().toISOString()}
User's timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}

Guidelines:
1. Identify the type of item (task, event, goal, habit, note, time_block)
2. Extract dates using natural language (tomorrow, next week, etc.)
3. Identify priority from keywords (urgent, important, asap = high/urgent)
4. Detect recurring patterns (every day, weekly, etc.)
5. Extract duration if mentioned (30 mins, 2 hours, etc.)
6. Identify tags and categories from context
7. Detect energy/focus requirements from keywords

Return a JSON object matching the provided schema.`;

  async parseInput(input: string, context?: {
    defaultType?: string;
    defaultCategory?: string;
    currentDate?: Date;
  }): Promise<ParsedInput> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: this.systemPrompt },
          { 
            role: 'user', 
            content: `Parse this input: "${input}"${context ? `\nContext: ${JSON.stringify(context)}` : ''}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 500,
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      
      // Validate and transform the result
      const validated = ParsedInputSchema.parse(result);
      
      // Post-process dates
      if (validated.dueDate) {
        validated.dueDate = this.parseRelativeDate(validated.dueDate, context?.currentDate);
      }
      if (validated.startDate) {
        validated.startDate = this.parseRelativeDate(validated.startDate, context?.currentDate);
      }
      if (validated.endDate) {
        validated.endDate = this.parseRelativeDate(validated.endDate, context?.currentDate);
      }

      return validated;
    } catch (error) {
      console.error('Failed to parse natural language input:', error);
      
      // Fallback to basic parsing
      return this.basicParse(input, context);
    }
  }

  private basicParse(input: string, context?: any): ParsedInput {
    // Basic fallback parser using regex patterns
    const lowerInput = input.toLowerCase();
    
    // Determine type
    let type: ParsedInput['type'] = 'task';
    if (lowerInput.includes('meeting') || lowerInput.includes('appointment')) {
      type = 'event';
    } else if (lowerInput.includes('goal') || lowerInput.includes('achieve')) {
      type = 'goal';
    } else if (lowerInput.includes('habit') || lowerInput.includes('every day')) {
      type = 'habit';
    } else if (lowerInput.includes('note') || lowerInput.includes('remember')) {
      type = 'note';
    }

    // Extract priority
    let priority: ParsedInput['priority'] = 'medium';
    if (lowerInput.match(/\b(urgent|asap|critical|emergency)\b/)) {
      priority = 'urgent';
    } else if (lowerInput.match(/\b(important|high)\b/)) {
      priority = 'high';
    } else if (lowerInput.match(/\b(low|minor|trivial)\b/)) {
      priority = 'low';
    }

    // Extract dates
    const tomorrow = lowerInput.includes('tomorrow');
    const nextWeek = lowerInput.match(/next\s+week/);
    const today = lowerInput.includes('today');
    
    let dueDate: string | undefined;
    if (tomorrow) {
      dueDate = addDays(new Date(), 1).toISOString();
    } else if (nextWeek) {
      dueDate = addWeeks(new Date(), 1).toISOString();
    } else if (today) {
      dueDate = new Date().toISOString();
    }

    // Extract time
    const timeMatch = input.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (timeMatch && dueDate) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2] || '0');
      const isPM = timeMatch[3]?.toLowerCase() === 'pm';
      
      const date = new Date(dueDate);
      date.setHours(isPM && hours !== 12 ? hours + 12 : hours);
      date.setMinutes(minutes);
      dueDate = date.toISOString();
    }

    // Extract duration
    const durationMatch = input.match(/(\d+)\s*(hours?|hrs?|minutes?|mins?)/i);
    let duration: number | undefined;
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      duration = unit.startsWith('hour') || unit.startsWith('hr') ? value * 60 : value;
    }

    // Clean up the title
    let title = input
      .replace(/tomorrow|today|next\s+week/gi, '')
      .replace(/\d{1,2}:\d{2}\s*(am|pm)?/gi, '')
      .replace(/\d+\s*(hours?|hrs?|minutes?|mins?)/gi, '')
      .replace(/\b(urgent|asap|important|high|low)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      type,
      title: title || input,
      priority,
      dueDate,
      duration,
    };
  }

  private parseRelativeDate(dateStr: string, baseDate?: Date): string {
    const base = baseDate || new Date();
    const lower = dateStr.toLowerCase();

    // Handle relative dates
    if (lower === 'today') {
      return base.toISOString();
    } else if (lower === 'tomorrow') {
      return addDays(base, 1).toISOString();
    } else if (lower.includes('next week')) {
      return addWeeks(base, 1).toISOString();
    } else if (lower.includes('next month')) {
      return addMonths(base, 1).toISOString();
    }

    // Try to parse as a date
    try {
      const parsed = parse(dateStr, 'yyyy-MM-dd', base);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    } catch {}

    // Return original if can't parse
    return dateStr;
  }

  async suggestCompletion(partialInput: string): Promise<string[]> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Suggest 3 completions for the partial task input. Return as JSON array of strings.'
          },
          { role: 'user', content: partialInput }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 150,
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{"suggestions":[]}');
      return result.suggestions || [];
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }

  async generateSmartSchedule(tasks: any[], preferences: any): Promise<any[]> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a scheduling AI. Given a list of tasks and user preferences, 
            create an optimal schedule that:
            1. Respects task priorities and deadlines
            2. Accounts for energy levels throughout the day
            3. Groups similar tasks together
            4. Includes appropriate breaks
            5. Avoids conflicts with existing calendar events
            
            Return a JSON array of scheduled tasks with specific time slots.`
          },
          {
            role: 'user',
            content: JSON.stringify({ tasks, preferences })
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
        max_tokens: 1000,
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{"schedule":[]}');
      return result.schedule || [];
    } catch (error) {
      console.error('Failed to generate schedule:', error);
      return tasks;
    }
  }

  async analyzeProductivity(data: any): Promise<{
    insights: string[];
    recommendations: string[];
    score: number;
  }> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Analyze the user's productivity data and provide:
            1. Key insights about their work patterns
            2. Actionable recommendations for improvement
            3. A productivity score (0-100)
            
            Consider factors like task completion rate, time management, 
            focus periods, and work-life balance.`
          },
          {
            role: 'user',
            content: JSON.stringify(data)
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
        max_tokens: 500,
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return {
        insights: result.insights || [],
        recommendations: result.recommendations || [],
        score: result.score || 0,
      };
    } catch (error) {
      console.error('Failed to analyze productivity:', error);
      return {
        insights: [],
        recommendations: [],
        score: 0,
      };
    }
  }
}

export const aiParser = new NaturalLanguageParser();