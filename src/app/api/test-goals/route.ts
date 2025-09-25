import { NextRequest, NextResponse } from 'next/server';
import { healthCheck } from '@/db';

// Simple test endpoint to verify API and database connection
export async function GET(req: NextRequest) {
  try {
    // Test database connection
    const dbHealth = await healthCheck();
    
    return NextResponse.json({
      status: 'success',
      message: 'API endpoint working',
      database: dbHealth,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'API test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}