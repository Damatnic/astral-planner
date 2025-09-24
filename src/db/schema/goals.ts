import { pgTable, uuid, text, timestamp, jsonb, boolean, varchar, integer, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { workspaces } from './workspaces';
import { blocks } from './blocks';

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Basic information
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  
  // Goal hierarchy and type
  type: varchar('type', { length: 20 }).notNull(), // lifetime, decade, 5year, yearly, quarterly, monthly, weekly, daily
  parentGoalId: uuid('parent_goal_id'),
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  
  // Goal details
  category: varchar('category', { length: 100 }), // health, career, finance, relationships, personal, etc.
  priority: varchar('priority', { length: 10 }).default('medium'), // low, medium, high, critical
  
  // Progress tracking
  status: varchar('status', { length: 20 }).default('not_started'), // not_started, in_progress, completed, paused, cancelled
  progress: integer('progress').default(0), // 0-100
  targetValue: decimal('target_value', { precision: 10, scale: 2 }),
  currentValue: decimal('current_value', { precision: 10, scale: 2 }).default('0'),
  unit: varchar('unit', { length: 50 }), // hours, dollars, pounds, etc.
  
  // Dates and timeline
  startDate: timestamp('start_date'),
  targetDate: timestamp('target_date'),
  completedAt: timestamp('completed_at'),
  
  // Motivation and context
  why: text('why'), // why is this goal important
  vision: text('vision'), // what success looks like
  rewards: jsonb('rewards').default([]), // rewards for completing milestones
  
  // Metrics and measurement
  metrics: jsonb('metrics').default([]), // how to measure progress
  milestones: jsonb('milestones').default([]), // key milestones
  
  // AI and insights
  aiSuggestions: jsonb('ai_suggestions').default([]),
  predictedCompletionDate: timestamp('predicted_completion_date'),
  successProbability: integer('success_probability'), // 0-100
  
  // Relationships
  relatedGoals: jsonb('related_goals').default([]), // array of goal IDs
  linkedBlocks: jsonb('linked_blocks').default([]), // array of block IDs
  
  // Tracking and accountability
  accountability: jsonb('accountability').default({}), // accountability partners, check-ins
  reviews: jsonb('reviews').default([]), // periodic reviews
  
  // User and collaboration
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  assignedTo: uuid('assigned_to').references(() => users.id),
  collaborators: jsonb('collaborators').default([]),
  
  // Visibility and sharing
  isPublic: boolean('is_public').default(false),
  isTemplate: boolean('is_template').default(false),
  
  // Archive and deletion
  isArchived: boolean('is_archived').default(false),
  archivedAt: timestamp('archived_at'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Goal milestones (separate table for better querying)
export const goalMilestones = pgTable('goal_milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  goalId: uuid('goal_id').references(() => goals.id).notNull(),
  
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  targetDate: timestamp('target_date'),
  completedAt: timestamp('completed_at'),
  
  targetValue: decimal('target_value', { precision: 10, scale: 2 }),
  isCompleted: boolean('is_completed').default(false),
  
  position: integer('position').notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Goal progress tracking
export const goalProgress = pgTable('goal_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  goalId: uuid('goal_id').references(() => goals.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  value: decimal('value', { precision: 10, scale: 2 }).notNull(),
  note: text('note'),
  progressDate: timestamp('progress_date').notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Goal reviews and reflections
export const goalReviews = pgTable('goal_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  goalId: uuid('goal_id').references(() => goals.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  reviewType: varchar('review_type', { length: 20 }).notNull(), // weekly, monthly, quarterly, yearly
  
  reflection: text('reflection'),
  achievements: jsonb('achievements').default([]),
  challenges: jsonb('challenges').default([]),
  learnings: text('learnings'),
  adjustments: text('adjustments'),
  
  rating: integer('rating'), // 1-10 satisfaction rating
  confidence: integer('confidence'), // 1-10 confidence in achieving goal
  
  reviewDate: timestamp('review_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const goalRelations = relations(goals, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [goals.workspaceId],
    references: [workspaces.id]
  }),
  creator: one(users, {
    fields: [goals.createdBy],
    references: [users.id]
  }),
  assignee: one(users, {
    fields: [goals.assignedTo],
    references: [users.id]
  }),
  parentGoal: one(goals, {
    fields: [goals.parentGoalId],
    references: [goals.id]
  }),
  childGoals: many(goals),
  milestones: many(goalMilestones),
  progressEntries: many(goalProgress),
  reviews: many(goalReviews)
}));

export const goalMilestoneRelations = relations(goalMilestones, ({ one }) => ({
  goal: one(goals, {
    fields: [goalMilestones.goalId],
    references: [goals.id]
  })
}));

export const goalProgressRelations = relations(goalProgress, ({ one }) => ({
  goal: one(goals, {
    fields: [goalProgress.goalId],
    references: [goals.id]
  }),
  user: one(users, {
    fields: [goalProgress.userId],
    references: [users.id]
  })
}));

export const goalReviewRelations = relations(goalReviews, ({ one }) => ({
  goal: one(goals, {
    fields: [goalReviews.goalId],
    references: [goals.id]
  }),
  user: one(users, {
    fields: [goalReviews.userId],
    references: [users.id]
  })
}));

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type GoalMilestone = typeof goalMilestones.$inferSelect;
export type NewGoalMilestone = typeof goalMilestones.$inferInsert;
export type GoalProgress = typeof goalProgress.$inferSelect;
export type NewGoalProgress = typeof goalProgress.$inferInsert;
export type GoalReview = typeof goalReviews.$inferSelect;
export type NewGoalReview = typeof goalReviews.$inferInsert;