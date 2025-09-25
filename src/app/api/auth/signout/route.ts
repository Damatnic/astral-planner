import { NextRequest, NextResponse } from 'next/server';
import Logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    // For Stack Auth, we'll clear the session cookie and redirect
    const response = NextResponse.json({ success: true });
    
    // Clear the Stack Auth session cookie
    response.cookies.delete('stack-session');
    
    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    Logger.info('User signed out successfully');
    
    return response;
  } catch (error) {
    Logger.error('Sign out failed:', error);
    return NextResponse.json(
      { error: 'Sign out failed' },
      { status: 500 }
    );
  }
}