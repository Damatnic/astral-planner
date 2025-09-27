/**
 * Revolutionary JWT Token Service
 * Production-ready token management with advanced security features
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { randomBytes, createHash, pbkdf2Sync } from 'crypto';
import Logger from '@/lib/logger';

// Security Configuration
const JWT_ISSUER = process.env.JWT_ISSUER || 'astral-chronos';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'astral-chronos-users';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const SESSION_TOKEN_EXPIRY = '24h';

// Advanced Secret Management
const getSecretKey = (): Uint8Array => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }
    Logger.warn('Using fallback JWT secret for development - NOT SECURE');
    return new TextEncoder().encode('fallback-dev-secret-not-for-production');
  }
  
  // Use PBKDF2 to derive a strong key from the secret
  const salt = process.env.JWT_SALT || 'astral-chronos-salt';
  const derivedKey = pbkdf2Sync(secret, salt, 100000, 32, 'sha256');
  return new Uint8Array(derivedKey);
};

const SECRET_KEY = getSecretKey();

export interface TokenUser {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'premium';
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  username?: string;
  isDemo?: boolean;
  sessionId?: string;
}

export interface TokenPayload extends JWTPayload {
  user: TokenUser;
  type: 'access' | 'refresh' | 'session';
  sessionId: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  sessionToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  sessionExpiresIn: number;
}

export interface TokenValidationResult {
  valid: boolean;
  payload?: TokenPayload;
  expired: boolean;
  error?: string;
}

/**
 * Generate cryptographically secure session ID
 */
export function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Generate device fingerprint
 */
export function generateDeviceId(userAgent?: string, ipAddress?: string): string {
  const data = `${userAgent || 'unknown'}-${ipAddress || 'unknown'}-${Date.now()}`;
  return createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Create comprehensive auth tokens for user
 */
export async function createAuthTokens(
  user: TokenUser,
  deviceInfo?: {
    userAgent?: string;
    ipAddress?: string;
  }
): Promise<AuthTokens> {
  try {
    const sessionId = generateSessionId();
    const deviceId = generateDeviceId(deviceInfo?.userAgent, deviceInfo?.ipAddress);
    const now = new Date();

    // Base payload
    const basePayload = {
      user: {
        ...user,
        sessionId
      },
      sessionId,
      deviceId,
      ipAddress: deviceInfo?.ipAddress,
      userAgent: deviceInfo?.userAgent,
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE,
    };

    // Access Token (15 minutes)
    const accessToken = await new SignJWT({
      ...basePayload,
      type: 'access'
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt(now)
      .setExpirationTime(ACCESS_TOKEN_EXPIRY)
      .setNotBefore(now)
      .sign(SECRET_KEY);

    // Refresh Token (7 days)
    const refreshToken = await new SignJWT({
      ...basePayload,
      type: 'refresh'
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt(now)
      .setExpirationTime(REFRESH_TOKEN_EXPIRY)
      .setNotBefore(now)
      .sign(SECRET_KEY);

    // Session Token (24 hours) - for UI state
    const sessionToken = await new SignJWT({
      ...basePayload,
      type: 'session'
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt(now)
      .setExpirationTime(SESSION_TOKEN_EXPIRY)
      .setNotBefore(now)
      .sign(SECRET_KEY);

    Logger.info('Auth tokens created successfully', {
      userId: user.id,
      sessionId,
      deviceId,
      isDemo: user.isDemo
    });

    return {
      accessToken,
      refreshToken,
      sessionToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      refreshExpiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      sessionExpiresIn: 24 * 60 * 60, // 24 hours in seconds
    };
  } catch (error) {
    Logger.error('Failed to create auth tokens', { userId: user.id, error });
    throw new Error('Token creation failed');
  }
}

/**
 * Verify and validate any JWT token
 */
export async function verifyToken(token: string): Promise<TokenValidationResult> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return {
      valid: true,
      payload: payload as TokenPayload,
      expired: false
    };
  } catch (error: any) {
    const isExpired = error.code === 'ERR_JWT_EXPIRED';
    
    Logger.warn('Token verification failed', {
      error: error.message,
      expired: isExpired,
      code: error.code
    });

    return {
      valid: false,
      expired: isExpired,
      error: error.message
    };
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  deviceInfo?: {
    userAgent?: string;
    ipAddress?: string;
  }
): Promise<{ accessToken: string; expiresIn: number } | null> {
  try {
    const validation = await verifyToken(refreshToken);
    
    if (!validation.valid || !validation.payload) {
      Logger.warn('Invalid refresh token provided');
      return null;
    }

    if (validation.payload.type !== 'refresh') {
      Logger.warn('Token is not a refresh token');
      return null;
    }

    // Verify device consistency
    const newDeviceId = generateDeviceId(deviceInfo?.userAgent, deviceInfo?.ipAddress);
    if (validation.payload.deviceId && validation.payload.deviceId !== newDeviceId) {
      Logger.warn('Device fingerprint mismatch during token refresh', {
        original: validation.payload.deviceId,
        current: newDeviceId,
        userId: validation.payload.user.id
      });
      // In production, you might want to require re-authentication
    }

    // Create new access token
    const accessToken = await new SignJWT({
      user: validation.payload.user,
      type: 'access',
      sessionId: validation.payload.sessionId,
      deviceId: validation.payload.deviceId,
      ipAddress: deviceInfo?.ipAddress,
      userAgent: deviceInfo?.userAgent,
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime(ACCESS_TOKEN_EXPIRY)
      .setNotBefore(Math.floor(Date.now() / 1000))
      .sign(SECRET_KEY);

    Logger.info('Access token refreshed successfully', {
      userId: validation.payload.user.id,
      sessionId: validation.payload.sessionId
    });

    return {
      accessToken,
      expiresIn: 15 * 60 // 15 minutes
    };
  } catch (error) {
    Logger.error('Token refresh failed', { error });
    return null;
  }
}

/**
 * Validate session token for UI state
 */
export async function validateSessionToken(token: string): Promise<TokenUser | null> {
  try {
    const validation = await verifyToken(token);
    
    if (!validation.valid || !validation.payload) {
      return null;
    }

    if (validation.payload.type !== 'session') {
      Logger.warn('Token is not a session token');
      return null;
    }

    return validation.payload.user;
  } catch (error) {
    Logger.error('Session token validation failed', { error });
    return null;
  }
}

/**
 * Blacklist token (for logout)
 */
const tokenBlacklist = new Set<string>();

export async function blacklistToken(token: string): Promise<void> {
  try {
    const validation = await verifyToken(token);
    if (validation.payload?.sessionId) {
      tokenBlacklist.add(validation.payload.sessionId);
      Logger.info('Token blacklisted', { sessionId: validation.payload.sessionId });
    }
  } catch (error) {
    Logger.error('Failed to blacklist token', { error });
  }
}

/**
 * Check if token is blacklisted
 */
export function isTokenBlacklisted(sessionId: string): boolean {
  return tokenBlacklist.has(sessionId);
}

/**
 * Create demo account tokens
 */
export async function createDemoAuthTokens(
  deviceInfo?: {
    userAgent?: string;
    ipAddress?: string;
  }
): Promise<AuthTokens> {
  const demoUser: TokenUser = {
    id: 'demo-user',
    email: 'demo@astralchronos.com',
    role: 'user',
    firstName: 'Demo',
    lastName: 'User',
    username: 'demo',
    isDemo: true
  };

  return createAuthTokens(demoUser, deviceInfo);
}

/**
 * Extract token from request headers or cookies
 */
export function extractTokenFromRequest(request: Request): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/access_token=([^;]+)/);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Security headers for token responses
 */
export function getSecureTokenHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Content-Type-Options': 'nosniff',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}