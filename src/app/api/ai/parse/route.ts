import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { NaturalLanguageParser } from '@/lib/ai/parser';
import { z } from 'zod';

const RequestSchema = z.object({
  input: z.string().min(1).max(1000),
  preview: z.boolean().optional(),
  context: z.object({
    defaultType: z.string().optional(),
    defaultCategory: z.string().optional(),
    currentDate: z.string().optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = RequestSchema.parse(body);

    const parser = new NaturalLanguageParser();
    
    if (validated.preview) {
      // Generate a preview/suggestion instead of full parsing
      const suggestions = await parser.suggestCompletion(validated.input);
      return NextResponse.json({
        suggestion: suggestions[0] || validated.input,
        suggestions,
      });
    }

    // Full parsing
    const parsed = await parser.parseInput(
      validated.input,
      {
        ...validated.context,
        currentDate: validated.context?.currentDate 
          ? new Date(validated.context.currentDate)
          : undefined,
      }
    );

    return NextResponse.json({
      parsed,
      success: true,
    });
  } catch (error) {
    console.error('AI parse error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to parse input' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}