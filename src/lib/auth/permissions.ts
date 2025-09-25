import { getUserFromRequest } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { permissions, featureFlags, type Permission, type Role } from './config';

/**
 * Check if the current user has a specific permission
 */
export async function hasPermission(req: NextRequest, permission: Permission): Promise<boolean> {
  const user = await getUserFromRequest(req);
  
  if (!user?.id) return false;
  
  // For now, assume all authenticated users have basic permissions
  // In a real implementation, you'd check user role from the database
  const userRole = 'FREE' as Role; // Default role
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
  
  // For now, assume all authenticated users have FREE tier features
  const userRole = 'FREE' as Role; // Default role
  const userFeatures = featureFlags[userRole] || featureFlags.FREE;
  
  return Boolean(userFeatures[feature]);
}

/**
 * Get the current user's feature limits
 */
export async function getFeatureLimits(req: NextRequest) {
  const user = await getUserFromRequest(req);
  
  if (!user?.id) return featureFlags.FREE;
  
  // For now, assume all authenticated users have FREE tier limits
  const userRole = 'FREE' as Role; // Default role
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
  
  // This would query the database to check workspace membership
  // Implementation depends on your database setup
  // For now, return true as placeholder
  return true;
}

/**
 * Check if user is workspace owner or admin
 */
export async function isWorkspaceAdmin(req: NextRequest, workspaceId: string): Promise<boolean> {
  const user = await getUserFromRequest(req);
  
  if (!user?.id) return false;
  
  // This would query the database to check workspace admin status
  // Implementation depends on your database setup
  return true;
}

/**
 * Get user's role
 */
export async function getUserRole(req: NextRequest): Promise<Role> {
  const user = await getUserFromRequest(req);
  
  if (!user?.id) return 'FREE';
  
  // For now, return default role
  // In a real implementation, you'd get this from the database
  return 'FREE';
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
  
  // This would query the database to get current usage
  // For now, return mock data
  const mockCurrentUsage = {
    workspaces: 1,
    goals: 5,
    habits: 2,
    blocks: 50
  };
  
  let limit = 0;
  let current = 0;
  
  switch (resource) {
    case 'workspaces':
      limit = limits.maxWorkspaces;
      current = mockCurrentUsage.workspaces;
      break;
    case 'goals':
      limit = limits.maxGoals;
      current = mockCurrentUsage.goals;
      break;
    case 'habits':
      limit = limits.maxHabits;
      current = mockCurrentUsage.habits;
      break;
    case 'blocks':
      limit = limits.maxBlocksPerWorkspace;
      current = mockCurrentUsage.blocks;
      break;
    default:
      return { allowed: true, limit: Infinity, current: 0, remaining: Infinity };
  }
  
  const remaining = Math.max(0, limit - current);
  const allowed = remaining > 0;
  
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