import { pgTable, uuid, text, timestamp, jsonb, boolean, varchar, integer, decimal, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { workspaces } from './workspaces';

export const habits = pgTable('habits', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Basic information
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }).default('target'),
  color: varchar('color', { length: 7 }).default('#3b82f6'),
  
  // Habit configuration
  category: varchar('category', { length: 100 }), // health, productivity, personal, social, etc.
  type: varchar('type', { length: 20 }).default('boolean'), // boolean, numeric, duration, checklist
  
  // Target and measurement
  targetValue: decimal('target_value', { precision: 10, scale: 2 }),
  unit: varchar('unit', { length: 50 }), // times, minutes, hours, pages, etc.
  frequency: varchar('frequency', { length: 20 }).default('daily'), // daily, weekly, monthly
  
  // Scheduling
  scheduledDays: jsonb('scheduled_days').default([1,2,3,4,5,6,7]), // 1=Monday, 7=Sunday
  scheduledTime: varchar('scheduled_time', { length: 5 }), // HH:MM format
  duration: integer('duration'), // in minutes
  
  // Habit formation
  difficulty: varchar('difficulty', { length: 10 }).default('medium'), // easy, medium, hard
  motivation: text('motivation'), // why this habit matters
  cue: text('cue'), // trigger or reminder
  reward: text('reward'), // what you get for doing it
  
  // Tracking and streaks
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  totalCompleted: integer('total_completed').default(0),
  completionRate: decimal('completion_rate', { precision: 5, scale: 2 }).default('0'),
  
  // Dates
  startDate: date('start_date').notNull(),
  endDate: date('end_date'), // for temporary habits
  lastCompletedAt: timestamp('last_completed_at'),
  
  // Reminders and notifications
  reminders: jsonb('reminders').default([]), // reminder times and settings
  reminderEnabled: boolean('reminder_enabled').default(true),
  
  // AI and insights
  aiSuggestions: jsonb('ai_suggestions').default([]),
  optimalTime: varchar('optimal_time', { length: 5 }), // AI-suggested best time
  successPrediction: integer('success_prediction'), // 0-100
  
  // Status and lifecycle
  status: varchar('status', { length: 20 }).default('active'), // active, paused, completed, abandoned
  isTemplate: boolean('is_template').default(false),
  
  // User and workspace
  userId: uuid('user_id').references(() => users.id).notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  
  // Archive and deletion
  isArchived: boolean('is_archived').default(false),
  archivedAt: timestamp('archived_at'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Daily habit tracking
export const habitEntries = pgTable('habit_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id').references(() => habits.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Entry data
  date: date('date').notNull(),
  completed: boolean('completed').default(false),
  value: decimal('value', { precision: 10, scale: 2 }), // for numeric habits
  duration: integer('duration'), // in minutes for duration habits
  
  // Additional tracking
  note: text('note'),
  mood: varchar('mood', { length: 20 }), // terrible, bad, okay, good, great
  energy: varchar('energy', { length: 20 }), // very_low, low, medium, high, very_high
  context: jsonb('context'), // location, weather, circumstances
  
  // Quality and intensity
  quality: integer('quality'), // 1-10 rating
  intensity: integer('intensity'), // 1-10 rating
  effort: integer('effort'), // 1-10 rating
  
  // Time tracking
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  
  // Streaks (computed at entry time for performance)
  streakCount: integer('streak_count').default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Habit streaks history
export const habitStreaks = pgTable('habit_streaks', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id').references(() => habits.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  length: integer('length').notNull(),
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Habit insights and analytics
export const habitInsights = pgTable('habit_insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id').references(() => habits.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  insightType: varchar('insight_type', { length: 50 }).notNull(), // pattern, suggestion, achievement, warning
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  data: jsonb('data'), // supporting data for the insight
  actionSuggestion: text('action_suggestion'),
  
  isRead: boolean('is_read').default(false),
  isDismissed: boolean('is_dismissed').default(false),
  
  validUntil: timestamp('valid_until'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Habit buddy/accountability system
export const habitBuddies = pgTable('habit_buddies', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id').references(() => habits.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  buddyId: uuid('buddy_id').references(() => users.id).notNull(),
  
  status: varchar('status', { length: 20 }).default('pending'), // pending, active, paused
  permissions: jsonb('permissions').default({
    viewProgress: true,
    sendReminders: true,
    viewDetails: false
  }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at')
});

// Relations
export const habitRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id]
  }),
  workspace: one(workspaces, {
    fields: [habits.workspaceId],
    references: [workspaces.id]
  }),
  entries: many(habitEntries),
  streaks: many(habitStreaks),
  insights: many(habitInsights),
  buddies: many(habitBuddies)
}));

export const habitEntryRelations = relations(habitEntries, ({ one }) => ({
  habit: one(habits, {
    fields: [habitEntries.habitId],
    references: [habits.id]
  }),
  user: one(users, {
    fields: [habitEntries.userId],
    references: [users.id]
  })
}));

export const habitStreakRelations = relations(habitStreaks, ({ one }) => ({
  habit: one(habits, {
    fields: [habitStreaks.habitId],
    references: [habits.id]
  }),
  user: one(users, {
    fields: [habitStreaks.userId],
    references: [users.id]
  })
}));

export const habitInsightRelations = relations(habitInsights, ({ one }) => ({
  habit: one(habits, {
    fields: [habitInsights.habitId],
    references: [habits.id]
  }),
  user: one(users, {
    fields: [habitInsights.userId],
    references: [users.id]
  })
}));

export const habitBuddyRelations = relations(habitBuddies, ({ one }) => ({
  habit: one(habits, {
    fields: [habitBuddies.habitId],
    references: [habits.id]
  }),
  user: one(users, {
    fields: [habitBuddies.userId],
    references: [users.id]
  }),
  buddy: one(users, {
    fields: [habitBuddies.buddyId],
    references: [users.id]
  })
}));

export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
export type HabitEntry = typeof habitEntries.$inferSelect;
export type NewHabitEntry = typeof habitEntries.$inferInsert;
export type HabitStreak = typeof habitStreaks.$inferSelect;
export type NewHabitStreak = typeof habitStreaks.$inferInsert;
export type HabitInsight = typeof habitInsights.$inferSelect;
export type NewHabitInsight = typeof habitInsights.$inferInsert;
export type HabitBuddy = typeof habitBuddies.$inferSelect;
export type NewHabitBuddy = typeof habitBuddies.$inferInsert;

// Alias exports for backwards compatibility
export { habitEntries as habitLogs };