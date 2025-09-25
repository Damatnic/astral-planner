import { NextResponse } from 'next/server';

// Simple health check endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API is running',
    environment: process.env.NODE_ENV || 'unknown',
    hasDatabase: !!process.env.DATABASE_URL,
    hasStackAuth: !!process.env.STACK_PROJECT_ID
  });
}