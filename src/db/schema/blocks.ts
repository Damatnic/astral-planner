import { pgTable, uuid, text, timestamp, jsonb, boolean, varchar, integer, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { workspaces } from './workspaces';

export const blocks = pgTable('blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Basic info
  type: varchar('type', { length: 50 }).notNull(), // task, note, event, goal, habit, journal, time_block, project
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  
  // Hierarchy and organization
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  parentId: uuid('parent_id').references(() => blocks.id),
  position: integer('position').notNull().default(0),
  path: text('path'), // materialized path for fast queries
  
  // Content and metadata
  content: jsonb('content').default({}), // flexible content structure
  metadata: jsonb('metadata').default({}), // type-specific metadata
  
  // Task-specific fields
  status: varchar('status', { length: 20 }).default('todo'), // todo, in_progress, completed, cancelled, waiting
  priority: varchar('priority', { length: 10 }).default('medium'), // low, medium, high, urgent
  
  // Time and scheduling
  dueDate: timestamp('due_date'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  estimatedDuration: integer('estimated_duration'), // in minutes
  actualDuration: integer('actual_duration'), // in minutes
  
  // Time blocking specific
  timeBlockStart: timestamp('time_block_start'),
  timeBlockEnd: timestamp('time_block_end'),
  timeBlockColor: varchar('time_block_color', { length: 7 }),
  isAllDay: boolean('is_all_day').default(false),
  
  // Recurrence
  isRecurring: boolean('is_recurring').default(false),
  recurrenceRule: jsonb('recurrence_rule'), // RRULE-like structure
  recurrenceParentId: uuid('recurrence_parent_id').references(() => blocks.id),
  
  // Reminders and notifications
  reminders: jsonb('reminders').default([]), // array of reminder objects
  
  // Collaboration and tracking
  assignedTo: uuid('assigned_to').references(() => users.id),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  lastEditedBy: uuid('last_edited_by').references(() => users.id),
  
  // Progress tracking
  progress: integer('progress').default(0), // 0-100
  completedAt: timestamp('completed_at'),
  
  // Tags and categorization
  tags: jsonb('tags').default([]), // array of tag strings
  category: varchar('category', { length: 100 }),
  
  // AI and automation
  aiGenerated: boolean('ai_generated').default(false),
  aiSuggestions: jsonb('ai_suggestions').default([]),
  autoScheduled: boolean('auto_scheduled').default(false),
  
  // Energy and focus
  energyLevel: varchar('energy_level', { length: 10 }), // low, medium, high
  focusRequired: varchar('focus_required', { length: 10 }), // low, medium, high
  
  // Dependencies
  dependencies: jsonb('dependencies').default([]), // array of block IDs
  dependents: jsonb('dependents').default([]), // array of block IDs
  
  // External integrations
  externalId: varchar('external_id', { length: 255 }),
  externalSource: varchar('external_source', { length: 50 }), // google_calendar, outlook, slack, etc.
  externalUrl: text('external_url'),
  syncStatus: varchar('sync_status', { length: 20 }).default('synced'), // synced, pending, error
  lastSyncAt: timestamp('last_sync_at'),
  
  // Version control and collaboration
  version: integer('version').default(1),
  isLocked: boolean('is_locked').default(false),
  lockedBy: uuid('locked_by').references(() => users.id),
  lockedAt: timestamp('locked_at'),
  
  // Archive and deletion
  isArchived: boolean('is_archived').default(false),
  archivedAt: timestamp('archived_at'),
  archivedBy: uuid('archived_by').references(() => users.id),
  
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by').references(() => users.id),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Comments and discussions
export const blockComments = pgTable('block_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  blockId: uuid('block_id').references(() => blocks.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  parentId: uuid('parent_id').references(() => blockComments.id),
  isResolved: boolean('is_resolved').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
});

// Activity and history
export const blockActivity = pgTable('block_activity', {
  id: uuid('id').primaryKey().defaultRandom(),
  blockId: uuid('block_id').references(() => blocks.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  action: varchar('action', { length: 50 }).notNull(), // created, updated, completed, archived, etc.
  changes: jsonb('changes'), // what changed
  metadata: jsonb('metadata'), // additional context
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// File attachments
export const blockAttachments = pgTable('block_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  blockId: uuid('block_id').references(() => blocks.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  url: text('url').notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  size: integer('size'), // in bytes
  uploadedBy: uuid('uploaded_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Time tracking
export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  blockId: uuid('block_id').references(() => blocks.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  duration: integer('duration'), // in minutes
  description: text('description'),
  isRunning: boolean('is_running').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const blockRelations = relations(blocks, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [blocks.workspaceId],
    references: [workspaces.id]
  }),
  parent: one(blocks, {
    fields: [blocks.parentId],
    references: [blocks.id]
  }),
  children: many(blocks),
  creator: one(users, {
    fields: [blocks.createdBy],
    references: [users.id]
  }),
  assignee: one(users, {
    fields: [blocks.assignedTo],
    references: [users.id]
  }),
  comments: many(blockComments),
  activity: many(blockActivity),
  attachments: many(blockAttachments),
  timeEntries: many(timeEntries)
}));

export const blockCommentRelations = relations(blockComments, ({ one, many }) => ({
  block: one(blocks, {
    fields: [blockComments.blockId],
    references: [blocks.id]
  }),
  user: one(users, {
    fields: [blockComments.userId],
    references: [users.id]
  }),
  parent: one(blockComments, {
    fields: [blockComments.parentId],
    references: [blockComments.id]
  }),
  replies: many(blockComments)
}));

export const blockActivityRelations = relations(blockActivity, ({ one }) => ({
  block: one(blocks, {
    fields: [blockActivity.blockId],
    references: [blocks.id]
  }),
  user: one(users, {
    fields: [blockActivity.userId],
    references: [users.id]
  })
}));

export const blockAttachmentRelations = relations(blockAttachments, ({ one }) => ({
  block: one(blocks, {
    fields: [blockAttachments.blockId],
    references: [blocks.id]
  }),
  uploader: one(users, {
    fields: [blockAttachments.uploadedBy],
    references: [users.id]
  })
}));

export const timeEntryRelations = relations(timeEntries, ({ one }) => ({
  block: one(blocks, {
    fields: [timeEntries.blockId],
    references: [blocks.id]
  }),
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id]
  })
}));

export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;
export type BlockComment = typeof blockComments.$inferSelect;
export type NewBlockComment = typeof blockComments.$inferInsert;
export type BlockActivity = typeof blockActivity.$inferSelect;
export type NewBlockActivity = typeof blockActivity.$inferInsert;
export type BlockAttachment = typeof blockAttachments.$inferSelect;
export type NewBlockAttachment = typeof blockAttachments.$inferInsert;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;