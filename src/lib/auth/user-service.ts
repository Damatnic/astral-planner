import { db } from '@/db';
import { users, type NewUser, type User } from '@/db/schema/users';
import { eq } from 'drizzle-orm';
import Logger from '../logger';

export class UserService {
  /**
   * Create or update user from Stack Auth data
   */
  static async syncUser(stackAuthUser: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
    username?: string;
  }): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.clerkId, stackAuthUser.id)).limit(1);
      const user = existingUser[0];

      if (user) {
        // Update existing user
        const [updatedUser] = await db
          .update(users)
          .set({
            email: stackAuthUser.email,
            firstName: stackAuthUser.firstName,
            lastName: stackAuthUser.lastName,
            imageUrl: stackAuthUser.imageUrl,
            username: stackAuthUser.username,
            lastActiveAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, stackAuthUser.id))
          .returning();

        Logger.info('User updated:', { userId: updatedUser.id });
        return updatedUser;
      } else {
        // Create new user
        const newUserData: NewUser = {
          clerkId: stackAuthUser.id,
          email: stackAuthUser.email,
          firstName: stackAuthUser.firstName,
          lastName: stackAuthUser.lastName,
          imageUrl: stackAuthUser.imageUrl,
          username: stackAuthUser.username,
          lastActiveAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const [createdUser] = await db
          .insert(users)
          .values(newUserData)
          .returning();

        Logger.info('User created:', { userId: createdUser.id });
        
        // Create default workspace for new user
        await UserService.createDefaultWorkspace(createdUser.id);
        
        return createdUser;
      }
    } catch (error) {
      Logger.error('Error syncing user:', error);
      throw error;
    }
  }

  /**
   * Get user by Stack Auth ID
   */
  static async getUserByClerkId(clerkId: string): Promise<User | null> {
    try {
      const userRecord = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
      return userRecord[0] || null;
    } catch (error) {
      Logger.error('Error fetching user by Clerk ID:', error);
      return null;
    }
  }

  /**
   * Get user by internal ID
   */
  static async getUserById(id: string): Promise<User | null> {
    try {
      const userRecord = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return userRecord[0] || null;
    } catch (error) {
      Logger.error('Error fetching user by ID:', error);
      return null;
    }
  }

  /**
   * Update user subscription
   */
  static async updateSubscription(
    userId: string,
    subscription: {
      plan: 'free' | 'pro' | 'team' | 'admin';
      status: 'active' | 'inactive' | 'cancelled' | 'past_due';
      periodStart?: Date;
      periodEnd?: Date;
      cancelAtPeriodEnd?: boolean;
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
    }
  ): Promise<User | null> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          subscription,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      Logger.info('User subscription updated:', { 
        userId, 
        plan: subscription.plan 
      });
      
      return updatedUser;
    } catch (error) {
      Logger.error('Error updating user subscription:', error);
      return null;
    }
  }

  /**
   * Update user activity
   */
  static async updateLastActive(userId: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          lastActiveAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } catch (error) {
      Logger.error('Error updating last active:', error);
    }
  }

  /**
   * Update user settings
   */
  static async updateSettings(
    userId: string,
    settings: Partial<{
      theme: string;
      weekStart: string;
      timeFormat: string;
      dateFormat: string;
      defaultView: string;
      workingHours: any;
      notifications: any;
      privacy: any;
      integrations: any;
    }>
  ): Promise<User | null> {
    try {
      const user = await UserService.getUserById(userId);
      if (!user) return null;

      const updatedSettings = { ...(user.settings as any), ...settings };

      const [updatedUser] = await db
        .update(users)
        .set({
          settings: updatedSettings,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      return updatedUser;
    } catch (error) {
      Logger.error('Error updating user settings:', error);
      return null;
    }
  }

  /**
   * Update onboarding progress
   */
  static async updateOnboarding(
    userId: string,
    step: number,
    completed: boolean = false
  ): Promise<User | null> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          onboardingStep: step,
          onboardingCompleted: completed,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      return updatedUser;
    } catch (error) {
      Logger.error('Error updating onboarding:', error);
      return null;
    }
  }

  /**
   * Update user analytics/stats
   */
  static async updateStats(
    userId: string,
    updates: {
      totalTasksCreated?: number;
      totalTasksCompleted?: number;
      streakDays?: number;
      longestStreak?: number;
    }
  ): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } catch (error) {
      Logger.error('Error updating user stats:', error);
    }
  }

  /**
   * Update AI settings
   */
  static async updateAISettings(
    userId: string,
    aiSettings: Partial<{
      enabled: boolean;
      autoSuggestions: boolean;
      planningAssistant: boolean;
      naturalLanguage: boolean;
      voiceInput: boolean;
      smartScheduling: boolean;
      insights: boolean;
    }>
  ): Promise<User | null> {
    try {
      const user = await UserService.getUserById(userId);
      if (!user) return null;

      const updatedAISettings = { ...(user.aiSettings as any), ...aiSettings };

      const [updatedUser] = await db
        .update(users)
        .set({
          aiSettings: updatedAISettings,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      return updatedUser;
    } catch (error) {
      Logger.error('Error updating AI settings:', error);
      return null;
    }
  }

  /**
   * Soft delete user
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      Logger.info('User soft deleted:', { userId });
    } catch (error) {
      Logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Create default workspace for new user
   */
  private static async createDefaultWorkspace(userId: string): Promise<void> {
    try {
      const { workspaces } = await import('@/db/schema/workspaces');
      
      await db.insert(workspaces).values({
        ownerId: userId,
        name: 'My Planner',
        slug: 'my-planner',
        description: 'Your personal planning workspace',
        color: '#3b82f6',
        isPersonal: true,
        settings: {
          defaultView: 'day',
          weekStart: 'monday',
          workingHours: {
            start: '09:00',
            end: '17:00',
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      Logger.info('Default workspace created for user:', { userId });
    } catch (error) {
      Logger.error('Error creating default workspace:', error);
    }
  }

  /**
   * Get user with related data
   */
  static async getUserWithRelations(userId: string): Promise<any> {
    try {
      // Note: This would use Drizzle's with() method for complex relations
      // For now, returning basic user data
      const user = await UserService.getUserById(userId);
      
      if (!user) return null;

      // Get additional data - need to import schemas
      const { workspaces } = await import('@/db/schema/workspaces');
      const { goals } = await import('@/db/schema/goals');
      const { habits } = await import('@/db/schema/habits');

      const userWorkspaces = await db.select().from(workspaces).where(eq(workspaces.ownerId, userId));

      // Goals and habits are linked through workspaces
      const userGoals = await db.select().from(goals)
        .innerJoin(workspaces, eq(goals.workspaceId, workspaces.id))
        .where(eq(workspaces.ownerId, userId));

      const userHabits = await db.select().from(habits).where(eq(habits.userId, userId));

      return {
        ...user,
        workspaces: userWorkspaces,
        goals: userGoals.length,
        habits: userHabits.length,
      };
    } catch (error) {
      Logger.error('Error fetching user with relations:', error);
      return null;
    }
  }
}

export default UserService;