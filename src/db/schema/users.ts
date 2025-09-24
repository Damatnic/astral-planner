import { pgTable, uuid, text, timestamp, jsonb, boolean, varchar, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { workspaces } from './workspaces';
import { blocks } from './blocks';
import { habits } from './habits';
import { notifications } from './notifications';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  imageUrl: text('image_url'),
  username: varchar('username', { length: 50 }).unique(),
  
  // User preferences and settings
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  locale: varchar('locale', { length: 10 }).default('en-US'),
  
  settings: jsonb('settings').default({
    theme: 'system',
    weekStart: 'monday',
    timeFormat: '24h',
    dateFormat: 'MM/dd/yyyy',
    defaultView: 'day',
    workingHours: {
      start: '09:00',
      end: '17:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    notifications: {
      email: true,
      push: true,
      desktop: true,
      reminders: true,
      digest: 'daily'
    },
    privacy: {
      showOnlineStatus: true,
      allowDataCollection: true
    },
    integrations: {
      calendar: [],
      communication: [],
      productivity: []
    }
  }),
  
  // Onboarding and subscription
  onboardingCompleted: boolean('onboarding_completed').default(false),
  onboardingStep: integer('onboarding_step').default(0),
  
  subscription: jsonb('subscription').default({
    plan: 'free',
    status: 'active',
    periodStart: null,
    periodEnd: null,
    cancelAtPeriodEnd: false,
    stripeCustomerId: null,
    stripeSubscriptionId: null
  }),
  
  // Analytics and usage
  lastActiveAt: timestamp('last_active_at').defaultNow(),
  totalTasksCreated: integer('total_tasks_created').default(0),
  totalTasksCompleted: integer('total_tasks_completed').default(0),
  streakDays: integer('streak_days').default(0),
  longestStreak: integer('longest_streak').default(0),
  
  // AI preferences
  aiSettings: jsonb('ai_settings').default({
    enabled: true,
    autoSuggestions: true,
    planningAssistant: true,
    naturalLanguage: true,
    voiceInput: false,
    smartScheduling: true,
    insights: true
  }),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
});

export const userRelations = relations(users, ({ many, one }) => ({
  workspaces: many(workspaces),
  blocks: many(blocks),
  habits: many(habits),
  notifications: many(notifications),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;