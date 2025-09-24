import { pgTable, uuid, text, timestamp, jsonb, boolean, varchar, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { workspaces } from './workspaces';
import { blocks } from './blocks';

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  
  // Recipient and context
  userId: uuid('user_id').references(() => users.id).notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Notification type and category
  type: varchar('type', { length: 30 }).notNull(), // reminder, deadline, mention, system, update, invitation
  category: varchar('category', { length: 50 }), // task, event, collaboration, system, security, marketing
  priority: varchar('priority', { length: 10 }).default('normal'), // low, normal, high, urgent
  
  // Content and context
  data: jsonb('data').default({}), // Additional context data
  actionUrl: text('action_url'), // Deep link to relevant content
  imageUrl: text('image_url'),
  icon: varchar('icon', { length: 50 }),
  
  // Related entities
  relatedType: varchar('related_type', { length: 30 }), // block, event, workspace, user, etc.
  relatedId: uuid('related_id'),
  blockId: uuid('block_id').references(() => blocks.id),
  
  // Delivery and channels
  channels: jsonb('channels').default(['in_app']), // in_app, email, push, sms, slack, webhook
  deliveryStatus: jsonb('delivery_status').default({}), // { email: 'sent', push: 'failed', ... }
  
  // Status and interaction
  status: varchar('status', { length: 20 }).default('unread'), // unread, read, dismissed, archived
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  dismissedAt: timestamp('dismissed_at'),
  
  // Scheduling and timing
  scheduledFor: timestamp('scheduled_for'),
  sentAt: timestamp('sent_at'),
  expiresAt: timestamp('expires_at'),
  
  // Grouping and threading
  groupKey: varchar('group_key', { length: 100 }), // For grouping related notifications
  threadId: uuid('thread_id'), // For conversation-style notifications
  
  // Actions and responses
  actions: jsonb('actions').default([]), // [{ label: 'Accept', action: 'accept_invite', url: '...' }]
  response: jsonb('response'), // User's response to actionable notifications
  respondedAt: timestamp('responded_at'),
  
  // Sender information
  senderId: uuid('sender_id').references(() => users.id),
  senderType: varchar('sender_type', { length: 20 }).default('user'), // user, system, integration
  
  // Metadata
  tags: jsonb('tags').default([]),
  source: varchar('source', { length: 50 }).default('system'), // system, integration, api, user
  version: integer('version').default(1),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
}, (table) => ({
  userIdIdx: index('notifications_user_id_idx').on(table.userId),
  workspaceIdIdx: index('notifications_workspace_id_idx').on(table.workspaceId),
  typeIdx: index('notifications_type_idx').on(table.type),
  statusIdx: index('notifications_status_idx').on(table.status),
  scheduledForIdx: index('notifications_scheduled_for_idx').on(table.scheduledFor),
  groupKeyIdx: index('notifications_group_key_idx').on(table.groupKey),
  threadIdIdx: index('notifications_thread_id_idx').on(table.threadId),
  blockIdIdx: index('notifications_block_id_idx').on(table.blockId),
  createdAtIdx: index('notifications_created_at_idx').on(table.createdAt)
}));

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Global settings
  globalSettings: jsonb('global_settings').default({
    enabled: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00',
      timezone: 'UTC'
    },
    doNotDisturb: {
      enabled: false,
      until: null,
      exceptions: []
    }
  }),
  
  // Channel preferences
  channels: jsonb('channels').default({
    in_app: {
      enabled: true,
      types: ['all']
    },
    email: {
      enabled: true,
      types: ['deadline', 'mention', 'invitation'],
      digest: {
        enabled: true,
        frequency: 'daily',
        time: '09:00'
      }
    },
    push: {
      enabled: true,
      types: ['reminder', 'deadline', 'mention'],
      sound: true,
      badge: true
    },
    sms: {
      enabled: false,
      types: ['urgent'],
      phoneNumber: null
    },
    slack: {
      enabled: false,
      webhookUrl: null,
      types: ['mention', 'deadline']
    }
  }),
  
  // Type-specific preferences
  typePreferences: jsonb('type_preferences').default({
    reminder: {
      enabled: true,
      advance: [15, 60], // minutes before
      channels: ['in_app', 'push']
    },
    deadline: {
      enabled: true,
      advance: [60, 1440], // 1 hour, 1 day
      channels: ['in_app', 'email', 'push']
    },
    mention: {
      enabled: true,
      immediate: true,
      channels: ['in_app', 'email', 'push']
    },
    system: {
      enabled: true,
      channels: ['in_app', 'email']
    },
    update: {
      enabled: true,
      channels: ['in_app']
    },
    invitation: {
      enabled: true,
      channels: ['in_app', 'email']
    }
  }),
  
  // Context-based preferences
  contextPreferences: jsonb('context_preferences').default({
    workspace: {}, // Workspace-specific overrides
    project: {}, // Project-specific overrides
    collaboration: {
      mentions: true,
      comments: true,
      shares: true,
      updates: false
    }
  }),
  
  // Digest and batching settings
  digestSettings: jsonb('digest_settings').default({
    email: {
      enabled: true,
      frequency: 'daily', // immediate, hourly, daily, weekly
      time: '09:00',
      timezone: 'UTC',
      includeRead: false,
      maxItems: 20
    },
    push: {
      grouping: true,
      delay: 300 // seconds to wait before sending grouped notifications
    }
  }),
  
  // Block and filter settings
  blockedSenders: jsonb('blocked_senders').default([]),
  keywordFilters: jsonb('keyword_filters').default([]),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('notification_preferences_user_id_idx').on(table.userId),
  workspaceIdIdx: index('notification_preferences_workspace_id_idx').on(table.workspaceId)
}));

export const notificationDeliveries = pgTable('notification_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  notificationId: uuid('notification_id').references(() => notifications.id).notNull(),
  
  // Delivery details
  channel: varchar('channel', { length: 20 }).notNull(), // email, push, sms, slack, webhook
  recipientAddress: varchar('recipient_address', { length: 255 }), // email address, phone number, etc.
  
  // Status and timing
  status: varchar('status', { length: 20 }).notNull(), // pending, sent, delivered, failed, bounced
  attemptCount: integer('attempt_count').default(1),
  maxAttempts: integer('max_attempts').default(3),
  
  // Timing
  scheduledAt: timestamp('scheduled_at'),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  failedAt: timestamp('failed_at'),
  nextRetryAt: timestamp('next_retry_at'),
  
  // Provider details
  provider: varchar('provider', { length: 50 }), // sendgrid, twilio, slack, etc.
  externalId: varchar('external_id', { length: 255 }), // Provider's message ID
  
  // Response and tracking
  responseData: jsonb('response_data'), // Provider response
  errorMessage: text('error_message'),
  errorCode: varchar('error_code', { length: 50 }),
  
  // Engagement tracking
  opened: boolean('opened').default(false),
  openedAt: timestamp('opened_at'),
  clicked: boolean('clicked').default(false),
  clickedAt: timestamp('clicked_at'),
  clickUrl: text('click_url'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  notificationIdIdx: index('notification_deliveries_notification_id_idx').on(table.notificationId),
  channelIdx: index('notification_deliveries_channel_idx').on(table.channel),
  statusIdx: index('notification_deliveries_status_idx').on(table.status),
  scheduledAtIdx: index('notification_deliveries_scheduled_at_idx').on(table.scheduledAt),
  externalIdIdx: index('notification_deliveries_external_id_idx').on(table.externalId)
}));

export const notificationTemplates = pgTable('notification_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Template details
  type: varchar('type', { length: 30 }).notNull(),
  category: varchar('category', { length: 50 }),
  channel: varchar('channel', { length: 20 }).notNull(),
  
  // Content templates
  subject: varchar('subject', { length: 500 }), // For email templates
  title: varchar('title', { length: 255 }),
  body: text('body').notNull(),
  htmlBody: text('html_body'), // HTML version for emails
  
  // Variables and personalization
  variables: jsonb('variables').default([]), // Available template variables
  defaultValues: jsonb('default_values').default({}),
  
  // Localization
  locale: varchar('locale', { length: 10 }).default('en-US'),
  translations: jsonb('translations').default({}), // { 'es-ES': { title: '...', body: '...' } }
  
  // Design and branding
  design: jsonb('design').default({}), // Colors, fonts, layout settings
  attachments: jsonb('attachments').default([]),
  
  // Status and versioning
  isActive: boolean('is_active').default(true),
  version: integer('version').default(1),
  isSystem: boolean('is_system').default(false), // System vs custom templates
  
  // Usage and analytics
  usageCount: integer('usage_count').default(0),
  lastUsedAt: timestamp('last_used_at'),
  
  // Metadata
  createdBy: uuid('created_by').references(() => users.id),
  tags: jsonb('tags').default([]),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
}, (table) => ({
  typeIdx: index('notification_templates_type_idx').on(table.type),
  channelIdx: index('notification_templates_channel_idx').on(table.channel),
  isActiveIdx: index('notification_templates_is_active_idx').on(table.isActive),
  createdByIdx: index('notification_templates_created_by_idx').on(table.createdBy)
}));

export const notificationQueues = pgTable('notification_queues', {
  id: uuid('id').primaryKey().defaultRandom(),
  notificationId: uuid('notification_id').references(() => notifications.id).notNull(),
  
  // Queue details
  priority: integer('priority').default(0), // Higher number = higher priority
  queue: varchar('queue', { length: 50 }).default('default'),
  
  // Processing status
  status: varchar('status', { length: 20 }).default('pending'), // pending, processing, completed, failed
  processedAt: timestamp('processed_at'),
  processingStartedAt: timestamp('processing_started_at'),
  
  // Retry logic
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),
  nextRetryAt: timestamp('next_retry_at'),
  
  // Worker information
  workerId: varchar('worker_id', { length: 100 }),
  processingHost: varchar('processing_host', { length: 100 }),
  
  // Error handling
  errorMessage: text('error_message'),
  errorStack: text('error_stack'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  notificationIdIdx: index('notification_queues_notification_id_idx').on(table.notificationId),
  statusIdx: index('notification_queues_status_idx').on(table.status),
  priorityIdx: index('notification_queues_priority_idx').on(table.priority),
  queueIdx: index('notification_queues_queue_idx').on(table.queue),
  nextRetryAtIdx: index('notification_queues_next_retry_at_idx').on(table.nextRetryAt)
}));

export const notificationRelations = relations(notifications, ({ one, many }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  }),
  workspace: one(workspaces, {
    fields: [notifications.workspaceId],
    references: [workspaces.id]
  }),
  block: one(blocks, {
    fields: [notifications.blockId],
    references: [blocks.id]
  }),
  sender: one(users, {
    fields: [notifications.senderId],
    references: [users.id]
  }),
  deliveries: many(notificationDeliveries),
  queueEntries: many(notificationQueues)
}));

export const notificationPreferenceRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id]
  }),
  workspace: one(workspaces, {
    fields: [notificationPreferences.workspaceId],
    references: [workspaces.id]
  })
}));

export const notificationDeliveryRelations = relations(notificationDeliveries, ({ one }) => ({
  notification: one(notifications, {
    fields: [notificationDeliveries.notificationId],
    references: [notifications.id]
  })
}));

export const notificationTemplateRelations = relations(notificationTemplates, ({ one }) => ({
  createdByUser: one(users, {
    fields: [notificationTemplates.createdBy],
    references: [users.id]
  })
}));

export const notificationQueueRelations = relations(notificationQueues, ({ one }) => ({
  notification: one(notifications, {
    fields: [notificationQueues.notificationId],
    references: [notifications.id]
  })
}));

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreferences = typeof notificationPreferences.$inferInsert;
export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;
export type NewNotificationDelivery = typeof notificationDeliveries.$inferInsert;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type NewNotificationTemplate = typeof notificationTemplates.$inferInsert;
export type NotificationQueue = typeof notificationQueues.$inferSelect;
export type NewNotificationQueue = typeof notificationQueues.$inferInsert;