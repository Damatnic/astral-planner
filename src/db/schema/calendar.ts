import { pgTable, uuid, text, timestamp, jsonb, boolean, varchar, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { workspaces } from './workspaces';
import { blocks } from './blocks';

export const calendars = pgTable('calendars', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Ownership and access
  userId: uuid('user_id').references(() => users.id).notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Visual customization
  color: varchar('color', { length: 7 }).default('#3b82f6'),
  icon: varchar('icon', { length: 50 }).default('calendar'),
  
  // Calendar type and source
  type: varchar('type', { length: 20 }).notNull().default('personal'), // personal, work, shared, imported
  source: varchar('source', { length: 50 }).default('native'), // native, google, outlook, apple, ical
  externalId: varchar('external_id', { length: 255 }),
  syncToken: text('sync_token'),
  
  // Settings and preferences
  settings: jsonb('settings').default({
    timezone: 'UTC',
    defaultDuration: 60,
    defaultReminder: 15,
    allowOverlap: false,
    showWeekends: true,
    workingHours: {
      enabled: true,
      start: '09:00',
      end: '17:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    visibility: {
      public: false,
      shareLink: null,
      allowBooking: false
    },
    notifications: {
      newEvents: true,
      changes: true,
      reminders: true
    }
  }),
  
  // Sync and integration
  isDefault: boolean('is_default').default(false),
  isReadOnly: boolean('is_read_only').default(false),
  lastSyncAt: timestamp('last_sync_at'),
  syncStatus: varchar('sync_status', { length: 20 }).default('active'), // active, error, paused
  syncError: text('sync_error'),
  
  // Status and metadata
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
}, (table) => ({
  userIdIdx: index('calendars_user_id_idx').on(table.userId),
  workspaceIdIdx: index('calendars_workspace_id_idx').on(table.workspaceId),
  typeIdx: index('calendars_type_idx').on(table.type),
  sourceIdx: index('calendars_source_idx').on(table.source)
}));

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  // Calendar association
  calendarId: uuid('calendar_id').references(() => calendars.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  blockId: uuid('block_id').references(() => blocks.id), // Link to task/project blocks
  
  // Event timing
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  isAllDay: boolean('is_all_day').default(false),
  
  // Recurrence
  recurrence: jsonb('recurrence').default(null), // null for non-recurring events
  recurrenceId: uuid('recurrence_id'), // Reference to master event for recurring series
  
  // Event properties
  type: varchar('type', { length: 20 }).default('event'), // event, meeting, task, reminder, focus_time
  status: varchar('status', { length: 20 }).default('confirmed'), // confirmed, tentative, cancelled
  priority: varchar('priority', { length: 10 }).default('normal'), // low, normal, high, urgent
  
  // Location and meeting details
  location: jsonb('location').default({}), // { type: 'physical|virtual|hybrid', address: '', coordinates: {}, meetingUrl: '', roomId: '' }
  meetingDetails: jsonb('meeting_details').default({}), // { platform: 'zoom|teams|meet', url: '', id: '', password: '', phone: '' }
  
  // Attendees and collaboration
  attendees: jsonb('attendees').default([]), // [{ email: '', name: '', status: 'pending|accepted|declined', role: 'organizer|attendee' }]
  organizer: jsonb('organizer').default({}), // { email: '', name: '', isExternal: false }
  
  // Reminders and notifications
  reminders: jsonb('reminders').default([]), // [{ type: 'popup|email|sms', minutes: 15 }]
  
  // Visual and categorization
  color: varchar('color', { length: 7 }),
  tags: jsonb('tags').default([]),
  category: varchar('category', { length: 50 }),
  
  // AI and automation
  aiSuggestions: jsonb('ai_suggestions').default({}), // { suggestedTime: '', conflicts: [], recommendations: [] }
  autoScheduled: boolean('auto_scheduled').default(false),
  
  // External integration
  externalId: varchar('external_id', { length: 255 }),
  externalUrl: text('external_url'),
  syncStatus: varchar('sync_status', { length: 20 }).default('synced'), // synced, pending, error
  
  // Metadata and tracking
  source: varchar('source', { length: 50 }).default('manual'), // manual, imported, ai_suggested, recurring
  lastModifiedBy: uuid('last_modified_by').references(() => users.id),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
}, (table) => ({
  calendarIdIdx: index('events_calendar_id_idx').on(table.calendarId),
  userIdIdx: index('events_user_id_idx').on(table.userId),
  startTimeIdx: index('events_start_time_idx').on(table.startTime),
  endTimeIdx: index('events_end_time_idx').on(table.endTime),
  typeIdx: index('events_type_idx').on(table.type),
  statusIdx: index('events_status_idx').on(table.status),
  recurrenceIdIdx: index('events_recurrence_id_idx').on(table.recurrenceId),
  blockIdIdx: index('events_block_id_idx').on(table.blockId)
}));

export const timeBlocks = pgTable('time_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  // Association
  userId: uuid('user_id').references(() => users.id).notNull(),
  calendarId: uuid('calendar_id').references(() => calendars.id),
  blockId: uuid('block_id').references(() => blocks.id), // Associated task/project
  
  // Time allocation
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  duration: integer('duration').notNull(), // in minutes
  
  // Block type and purpose
  type: varchar('type', { length: 20 }).notNull(), // focus, break, meeting, travel, buffer
  category: varchar('category', { length: 50 }),
  energy: varchar('energy', { length: 10 }).default('medium'), // low, medium, high
  
  // Scheduling properties
  isFlexible: boolean('is_flexible').default(false),
  minDuration: integer('min_duration'),
  maxDuration: integer('max_duration'),
  preferredTimes: jsonb('preferred_times').default([]), // [{ day: 'monday', start: '09:00', end: '11:00' }]
  
  // Status and progress
  status: varchar('status', { length: 20 }).default('scheduled'), // scheduled, in_progress, completed, cancelled
  progress: integer('progress').default(0), // 0-100
  actualStartTime: timestamp('actual_start_time'),
  actualEndTime: timestamp('actual_end_time'),
  
  // AI and optimization
  aiGenerated: boolean('ai_generated').default(false),
  optimizationScore: integer('optimization_score'), // 0-100
  suggestions: jsonb('suggestions').default({}),
  
  // Metadata
  color: varchar('color', { length: 7 }),
  tags: jsonb('tags').default([]),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
}, (table) => ({
  userIdIdx: index('time_blocks_user_id_idx').on(table.userId),
  startTimeIdx: index('time_blocks_start_time_idx').on(table.startTime),
  endTimeIdx: index('time_blocks_end_time_idx').on(table.endTime),
  typeIdx: index('time_blocks_type_idx').on(table.type),
  statusIdx: index('time_blocks_status_idx').on(table.status),
  blockIdIdx: index('time_blocks_block_id_idx').on(table.blockId)
}));

export const availability = pgTable('availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Availability patterns
  pattern: jsonb('pattern').notNull(), // { type: 'weekly|custom', schedule: {...} }
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  
  // Date range
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  
  // Override settings
  overrides: jsonb('overrides').default([]), // [{ date: '2024-01-01', available: false, reason: 'holiday' }]
  
  // Booking settings
  bufferTime: integer('buffer_time').default(0), // minutes between bookings
  maxBookingsPerDay: integer('max_bookings_per_day'),
  advanceNotice: integer('advance_notice').default(60), // minutes
  
  // Status
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('availability_user_id_idx').on(table.userId)
}));

export const calendarRelations = relations(calendars, ({ one, many }) => ({
  user: one(users, {
    fields: [calendars.userId],
    references: [users.id]
  }),
  workspace: one(workspaces, {
    fields: [calendars.workspaceId],
    references: [workspaces.id]
  }),
  events: many(events),
  timeBlocks: many(timeBlocks)
}));

export const eventRelations = relations(events, ({ one, many }) => ({
  calendar: one(calendars, {
    fields: [events.calendarId],
    references: [calendars.id]
  }),
  user: one(users, {
    fields: [events.userId],
    references: [users.id]
  }),
  block: one(blocks, {
    fields: [events.blockId],
    references: [blocks.id]
  }),
  lastModifiedByUser: one(users, {
    fields: [events.lastModifiedBy],
    references: [users.id]
  }),
  masterEvent: one(events, {
    fields: [events.recurrenceId],
    references: [events.id]
  }),
  recurringEvents: many(events)
}));

export const timeBlockRelations = relations(timeBlocks, ({ one }) => ({
  user: one(users, {
    fields: [timeBlocks.userId],
    references: [users.id]
  }),
  calendar: one(calendars, {
    fields: [timeBlocks.calendarId],
    references: [calendars.id]
  }),
  block: one(blocks, {
    fields: [timeBlocks.blockId],
    references: [blocks.id]
  })
}));

export const availabilityRelations = relations(availability, ({ one }) => ({
  user: one(users, {
    fields: [availability.userId],
    references: [users.id]
  })
}));

export type Calendar = typeof calendars.$inferSelect;
export type NewCalendar = typeof calendars.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type TimeBlock = typeof timeBlocks.$inferSelect;
export type NewTimeBlock = typeof timeBlocks.$inferInsert;
export type Availability = typeof availability.$inferSelect;
export type NewAvailability = typeof availability.$inferInsert;