/**
 * Authentication utilities for Stack Auth integration
 */

import { NextRequest } from 'next/server';
import Logger, { AppError } from './logger';

// Stack Auth configuration
const STACK_PROJECT_ID = process.env.STACK_PROJECT_ID;
const STACK_SECRET_SERVER_KEY = process.env.STACK_SECRET_SERVER_KEY;
const STACK_PUBLISHABLE_CLIENT_KEY = process.env.STACK_PUBLISHABLE_CLIENT_KEY;

// Production-ready Stack Auth configuration with fallback
const isStackAuthConfigured = !!(
  STACK_PROJECT_ID && 
  STACK_SECRET_SERVER_KEY && 
  STACK_PUBLISHABLE_CLIENT_KEY &&
  process.env.NODE_ENV === 'production'
);

if (!isStackAuthConfigured) {
  console.warn('Stack Auth temporarily disabled for production deployment');
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  username?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: User;
  sessionId: string;
  expiresAt: Date;
}

/**
 * Extract user from Stack Auth session token
 */
export async function getUserFromRequest(req: NextRequest): Promise<User | null> {
  try {
    // If Stack Auth is not configured, return null (no authentication)
    if (!isStackAuthConfigured) {
      return null;
    }

    // Get token from Authorization header or cookie
    const authHeader = req.headers.get('authorization');
    const sessionCookie = req.cookies.get('stack-session')?.value;
    
    const token = authHeader?.replace('Bearer ', '') || sessionCookie;
    
    if (!token) {
      return null;
    }

    // Verify token with Stack Auth API
    const response = await fetch(`https://api.stack-auth.com/api/v1/projects/${STACK_PROJECT_ID}/sessions/current`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-stack-secret-server-key': STACK_SECRET_SERVER_KEY!,
        'x-stack-project-id': STACK_PROJECT_ID!,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null; // Invalid or expired token
      }
      throw new Error(`Stack Auth API error: ${response.status}`);
    }

    const session = await response.json();
    
    if (!session.user) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.primary_email,
      firstName: session.user.display_name?.split(' ')[0] || undefined,
      lastName: session.user.display_name?.split(' ').slice(1).join(' ') || undefined,
      imageUrl: session.user.profile_image_url || undefined,
      username: session.user.username || undefined,
      createdAt: new Date(session.user.created_at_millis),
      updatedAt: new Date(session.user.updated_at_millis),
    };
  } catch (error) {
    Logger.error('Authentication error:', error);
    return null;
  }
}

/**
 * Require authenticated user - throws if not authenticated
 */
export async function requireAuth(req: NextRequest): Promise<User> {
  const user = await getUserFromRequest(req);
  
  if (!user) {
    throw new AppError('Authentication required', 401, true);
  }
  
  return user;
}

/**
 * Get user ID from request - returns null if not authenticated
 */
export async function getUserId(req: NextRequest): Promise<string | null> {
  const user = await getUserFromRequest(req);
  return user?.id || null;
}

/**
 * Create authentication middleware
 */
export function withAuth(handler: (req: NextRequest, user: User) => Promise<Response>) {
  return async (req: NextRequest) => {
    try {
      const user = await requireAuth(req);
      return await handler(req, user);
    } catch (error) {
      if (error instanceof AppError) {
        return Response.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }
      
      Logger.error('Authentication middleware error:', error);
      return Response.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Development mode fallback for testing
 */
export function getTestUser(): User {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Test user only available in development mode');
  }
  
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    imageUrl: undefined,
    username: 'testuser',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Get user for request with development fallback
 */
export async function getUserForRequest(req: NextRequest): Promise<User | null> {
  // In production, always require proper authentication
  if (process.env.NODE_ENV === 'production') {
    return await getUserFromRequest(req);
  }
  
  // In development, try Stack Auth first, fallback to test user
  const user = await getUserFromRequest(req);
  if (user) {
    return user;
  }
  
  // Only use test user if explicitly enabled
  if (process.env.ENABLE_TEST_USER === 'true') {
    Logger.warn('Using test user for development - disable in production!');
    return getTestUser();
  }
  
  return null;
}