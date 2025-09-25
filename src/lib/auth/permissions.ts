import { getUserFromRequest } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { permissions, featureFlags, type Permission, type Role } from './config';
import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { users } from '@/db/schema/users';
import { workspaces, workspaceMembers } from '@/db/schema/workspaces';
import { goals } from '@/db/schema/goals';
import { habits } from '@/db/schema/habits';
import { blocks } from '@/db/schema/blocks';

/**
 * Get user's role from database
 */
async function getUserRoleFromDB(userId: string): Promise<Role> {
  try {
    const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userRecord[0];
    
    if (!user?.subscription) {
      return 'FREE';
    }
    
    const subscription = user.subscription as { plan?: string };
    const plan = subscription.plan?.toLowerCase();
    
    // Map subscription plan to role
    switch (plan) {
      case 'pro':
        return 'PRO';
      case 'team':
        return 'TEAM';
      case 'admin':
        return 'ADMIN';
      default:
        return 'FREE';
    }
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'FREE'; // Default fallback
  }
}

/**
 * Check if the current user has a specific permission
 */
export async function hasPermission(req: NextRequest, permission: Permission): Promise<boolean> {
  const user = await getUserFromRequest(req);
  
  if (!user?.id) return false;
  
  // Get user role from database
  const userRole = await getUserRoleFromDB(user.id);
  const userPermissions = permissions[userRole] || permissions.FREE;
  
  // Admin has all permissions
  if (userRole === 'ADMIN') return true;
  
  // Check for wildcard permission
  if (userPermissions.includes('*')) return true;
  
  // Check exact permission match
  if (userPermissions.includes(permission)) return true;
  
  // Check for wildcard resource permissions (e.g., "workspace:*")
  const [resource] = permission.split(':');
  if (userPermissions.includes(`${resource}:*`)) return true;
  
  return false;
}

/**
 * Check if the current user has access to a specific feature
 */
export async function hasFeature(req: NextRequest, feature: keyof typeof featureFlags.FREE): Promise<boolean> {
  const user = await getUserFromRequest(req);
  
  if (!user?.id) return false;
  
  // Get user role from database
  const userRole = await getUserRoleFromDB(user.id);
  const userFeatures = featureFlags[userRole] || featureFlags.FREE;
  
  return Boolean(userFeatures[feature]);
}

/**
 * Get the current user's feature limits
 */
export async function getFeatureLimits(req: NextRequest) {
  const user = await getUserFromRequest(req);
  
  if (!user?.id) return featureFlags.FREE;
  
  // Get user role from database
  const userRole = await getUserRoleFromDB(user.id);
  return featureFlags[userRole] || featureFlags.FREE;
}

/**
 * Check if user can perform action on resource
 */
export async function canAccess(
  req: NextRequest,
  resource: string,
  action: string,
  resourceOwnerId?: string,
  workspaceId?: string
): Promise<boolean> {
  const user = await getUserFromRequest(req);
  
  if (!user?.id) return false;
  
  const permission = `${resource}:${action}`;
  
  // Check basic permission
  const hasBasicPermission = await hasPermission(req, permission);
  if (!hasBasicPermission) return false;
  
  // Check ownership for :own permissions
  if (permission.includes(':own') && resourceOwnerId) {
    return user.id === resourceOwnerId;
  }
  
  // Check team access for :team permissions
  if (permission.includes(':team') && workspaceId) {
    return await isWorkspaceMember(req, workspaceId);
  }
  
  return true;
}

/**
 * Check if user is a member of a workspace
 */
export async function isWorkspaceMember(req: NextRequest, workspaceId: string): Promise<boolean> {
  const user = await getUserFromRequest(req);
  
  if (!user?.id) return false;
  
  try {
    // Check if user is workspace owner
    const workspace = await db.select().from(workspaces).where(
      and(
        eq(workspaces.id, workspaceId),
        eq(workspaces.ownerId, user.id)
      )
    ).limit(1);
    
    if (workspace.length > 0) return true;
    
    // Check if user is a workspace member
    const membership = await db.select().from(workspaceMembers).where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, user.id)
      )
    ).limit(1);
    
    return membership.length > 0;
  } catch (error) {
    console.error('Error checking workspace membership:', error);
    return false;
  }
}

/**
 * Check if user is workspace owner or admin
 */
export async function isWorkspaceAdmin(req: NextRequest, workspaceId: string): Promise<boolean> {
  const user = await getUserFromRequest(req);
  
  if (!user?.id) return false;
  
  try {
    // Check if user is workspace owner
    const workspace = await db.select().from(workspaces).where(
      and(
        eq(workspaces.id, workspaceId),
        eq(workspaces.ownerId, user.id)
      )
    ).limit(1);
    
    if (workspace.length > 0) return true;
    
    // Check if user is workspace admin
    const membership = await db.select().from(workspaceMembers).where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, user.id),
        eq(workspaceMembers.role, 'admin')
      )
    ).limit(1);
    
    return membership.length > 0;
  } catch (error) {
    console.error('Error checking workspace admin status:', error);
    return false;
  }
}

/**
 * Get user's role
 */
export async function getUserRole(req: NextRequest): Promise<Role> {
  const user = await getUserFromRequest(req);
  
  if (!user?.id) return 'FREE';
  
  return await getUserRoleFromDB(user.id);
}

/**
 * Check if user has reached usage limits
 */
export async function checkUsageLimits(req: NextRequest, resource: string): Promise<{
  allowed: boolean;
  limit: number;
  current: number;
  remaining: number;
}> {
  const user = await getUserFromRequest(req);
  
  if (!user?.id) {
    return { allowed: false, limit: 0, current: 0, remaining: 0 };
  }
  
  const limits = await getFeatureLimits(req);
  
  // Get current usage from database
  let current = 0;
  let limit = 0;
  
  try {
    switch (resource) {
      case 'workspaces':
        const workspaceCount = await db.select().from(workspaces).where(eq(workspaces.ownerId, user.id));
        current = workspaceCount.length;
        limit = limits.maxWorkspaces;
        break;
        
      case 'goals':
        // Goals belong to workspaces, which belong to users
        const goalCount = await db.select().from(goals)
          .innerJoin(workspaces, eq(goals.workspaceId, workspaces.id))
          .where(eq(workspaces.ownerId, user.id));
        current = goalCount.length;
        limit = limits.maxGoals;
        break;
        
      case 'habits':
        const habitCount = await db.select().from(habits).where(eq(habits.userId, user.id));
        current = habitCount.length;
        limit = limits.maxHabits;
        break;
        
      case 'blocks':
        // Blocks belong to workspaces, which belong to users
        const blockCount = await db.select().from(blocks)
          .innerJoin(workspaces, eq(blocks.workspaceId, workspaces.id))
          .where(eq(workspaces.ownerId, user.id));
        current = blockCount.length;
        limit = limits.maxBlocksPerWorkspace;
        break;
        
      default:
        return { allowed: true, limit: Infinity, current: 0, remaining: Infinity };
    }
  } catch (error) {
    console.error('Error checking usage limits:', error);
    // Return conservative limits on error
    return { allowed: false, limit: 0, current: 0, remaining: 0 };
  }
  
  const remaining = Math.max(0, limit - current);
  const allowed = remaining > 0 || limit === Infinity;
  
  return { allowed, limit, current, remaining };
}

/**
 * Require specific permission (throws if not authorized)
 */
export async function requirePermission(req: NextRequest, permission: Permission): Promise<void> {
  const allowed = await hasPermission(req, permission);
  
  if (!allowed) {
    throw new Error(`Insufficient permissions: ${permission}`);
  }
}

/**
 * Require specific feature (throws if not available)
 */
export async function requireFeature(req: NextRequest, feature: keyof typeof featureFlags.FREE): Promise<void> {
  const allowed = await hasFeature(req, feature);
  
  if (!allowed) {
    throw new Error(`Feature not available: ${feature}`);
  }
}

/**
 * Create permission decorator for API routes
 */
export function withPermission(permission: Permission) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (req: NextRequest, ...args: any[]) {
      await requirePermission(req, permission);
      return originalMethod.apply(this, [req, ...args]);
    };
    
    return descriptor;
  };
}

/**
 * Create feature flag decorator for API routes
 */
export function withFeature(feature: keyof typeof featureFlags.FREE) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (req: NextRequest, ...args: any[]) {
      await requireFeature(req, feature);
      return originalMethod.apply(this, [req, ...args]);
    };
    
    return descriptor;
  };
}