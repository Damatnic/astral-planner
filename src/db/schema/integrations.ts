import { pgTable, uuid, text, timestamp, jsonb, boolean, varchar, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { workspaces } from './workspaces';

export const integrations = pgTable('integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Association
  userId: uuid('user_id').references(() => users.id).notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Integration details
  provider: varchar('provider', { length: 50 }).notNull(), // google, slack, github, notion, etc.
  type: varchar('type', { length: 30 }).notNull(), // calendar, communication, storage, productivity, automation
  category: varchar('category', { length: 50 }), // calendar, task_management, file_storage, messaging, etc.
  
  // Authentication and connection
  authType: varchar('auth_type', { length: 20 }).notNull(), // oauth2, api_key, webhook, basic_auth
  credentials: jsonb('credentials').notNull(), // Encrypted credentials storage
  externalUserId: varchar('external_user_id', { length: 255 }),
  externalAccountId: varchar('external_account_id', { length: 255 }),
  
  // Configuration and settings
  config: jsonb('config').default({}), // Provider-specific configuration
  permissions: jsonb('permissions').default([]), // Granted permissions/scopes
  webhookUrl: text('webhook_url'),
  webhookSecret: varchar('webhook_secret', { length: 255 }),
  
  // Sync and status
  status: varchar('status', { length: 20 }).default('active'), // active, inactive, error, revoked, expired
  lastSyncAt: timestamp('last_sync_at'),
  nextSyncAt: timestamp('next_sync_at'),
  syncFrequency: integer('sync_frequency').default(300), // seconds
  syncDirection: varchar('sync_direction', { length: 20 }).default('bidirectional'), // import, export, bidirectional
  
  // Error handling and monitoring
  errorCount: integer('error_count').default(0),
  lastError: text('last_error'),
  lastErrorAt: timestamp('last_error_at'),
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),
  
  // Usage and limits
  apiQuota: jsonb('api_quota').default({}), // { daily: 1000, monthly: 30000, used: 150, resetAt: '...' }
  rateLimit: jsonb('rate_limit').default({}), // { requests: 100, window: 3600, current: 25 }
  
  // Features and capabilities
  features: jsonb('features').default([]), // Enabled features for this integration
  dataMapping: jsonb('data_mapping').default({}), // Field mapping for data sync
  
  // Metadata
  version: varchar('version', { length: 20 }).default('1.0'),
  tags: jsonb('tags').default([]),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
}, (table) => ({
  userIdIdx: index('integrations_user_id_idx').on(table.userId),
  workspaceIdIdx: index('integrations_workspace_id_idx').on(table.workspaceId),
  providerIdx: index('integrations_provider_idx').on(table.provider),
  typeIdx: index('integrations_type_idx').on(table.type),
  statusIdx: index('integrations_status_idx').on(table.status)
}));

export const integrationLogs = pgTable('integration_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  integrationId: uuid('integration_id').references(() => integrations.id).notNull(),
  
  // Log details
  type: varchar('type', { length: 20 }).notNull(), // sync, auth, webhook, error, info
  level: varchar('level', { length: 10 }).notNull(), // debug, info, warn, error
  message: text('message').notNull(),
  details: jsonb('details').default({}),
  
  // Request/Response data
  requestData: jsonb('request_data'),
  responseData: jsonb('response_data'),
  statusCode: integer('status_code'),
  
  // Timing and performance
  duration: integer('duration'), // milliseconds
  retryAttempt: integer('retry_attempt').default(0),
  
  // Context
  operation: varchar('operation', { length: 50 }), // sync_calendar, send_message, create_task, etc.
  externalId: varchar('external_id', { length: 255 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  integrationIdIdx: index('integration_logs_integration_id_idx').on(table.integrationId),
  typeIdx: index('integration_logs_type_idx').on(table.type),
  levelIdx: index('integration_logs_level_idx').on(table.level),
  createdAtIdx: index('integration_logs_created_at_idx').on(table.createdAt)
}));

export const webhooks = pgTable('webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  integrationId: uuid('integration_id').references(() => integrations.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Webhook configuration
  url: text('url').notNull(),
  secret: varchar('secret', { length: 255 }),
  events: jsonb('events').notNull(), // Array of event types to listen for
  
  // Security and validation
  signatureHeader: varchar('signature_header', { length: 100 }).default('X-Signature'),
  signatureMethod: varchar('signature_method', { length: 20 }).default('hmac-sha256'),
  verifySSL: boolean('verify_ssl').default(true),
  
  // Delivery settings
  timeout: integer('timeout').default(30), // seconds
  retryPolicy: jsonb('retry_policy').default({
    maxAttempts: 3,
    backoffStrategy: 'exponential',
    initialDelay: 1000
  }),
  
  // Filtering and processing
  filters: jsonb('filters').default({}), // Conditions for when to trigger
  transforms: jsonb('transforms').default({}), // Data transformation rules
  
  // Status and monitoring
  isActive: boolean('is_active').default(true),
  successCount: integer('success_count').default(0),
  failureCount: integer('failure_count').default(0),
  lastTriggeredAt: timestamp('last_triggered_at'),
  lastSuccessAt: timestamp('last_success_at'),
  lastFailureAt: timestamp('last_failure_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  integrationIdIdx: index('webhooks_integration_id_idx').on(table.integrationId),
  userIdIdx: index('webhooks_user_id_idx').on(table.userId),
  isActiveIdx: index('webhooks_is_active_idx').on(table.isActive)
}));

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookId: uuid('webhook_id').references(() => webhooks.id).notNull(),
  
  // Delivery attempt details
  event: varchar('event', { length: 100 }).notNull(),
  payload: jsonb('payload').notNull(),
  headers: jsonb('headers').default({}),
  
  // Response details
  statusCode: integer('status_code'),
  response: text('response'),
  errorMessage: text('error_message'),
  
  // Timing
  deliveredAt: timestamp('delivered_at'),
  duration: integer('duration'), // milliseconds
  attempt: integer('attempt').default(1),
  
  // Status
  status: varchar('status', { length: 20 }).notNull(), // pending, success, failed, retrying
  
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  webhookIdIdx: index('webhook_deliveries_webhook_id_idx').on(table.webhookId),
  statusIdx: index('webhook_deliveries_status_idx').on(table.status),
  createdAtIdx: index('webhook_deliveries_created_at_idx').on(table.createdAt)
}));

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Key details
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  keyHash: varchar('key_hash', { length: 255 }).notNull(), // Hashed API key
  prefix: varchar('prefix', { length: 10 }).notNull(), // First few characters for identification
  
  // Permissions and scope
  permissions: jsonb('permissions').notNull(), // Array of allowed operations
  scopes: jsonb('scopes').default([]), // Resource scopes
  
  // Usage limits
  rateLimit: jsonb('rate_limit').default({
    requests: 1000,
    window: 3600,
    current: 0,
    resetAt: null
  }),
  
  // Access restrictions
  allowedIPs: jsonb('allowed_ips').default([]), // IP whitelist
  allowedDomains: jsonb('allowed_domains').default([]), // Domain whitelist
  
  // Status and expiration
  isActive: boolean('is_active').default(true),
  expiresAt: timestamp('expires_at'),
  lastUsedAt: timestamp('last_used_at'),
  usageCount: integer('usage_count').default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at')
}, (table) => ({
  userIdIdx: index('api_keys_user_id_idx').on(table.userId),
  workspaceIdIdx: index('api_keys_workspace_id_idx').on(table.workspaceId),
  keyHashIdx: index('api_keys_key_hash_idx').on(table.keyHash),
  isActiveIdx: index('api_keys_is_active_idx').on(table.isActive)
}));

export const syncJobs = pgTable('sync_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  integrationId: uuid('integration_id').references(() => integrations.id).notNull(),
  
  // Job details
  type: varchar('type', { length: 30 }).notNull(), // full_sync, incremental, manual, scheduled
  operation: varchar('operation', { length: 50 }).notNull(), // import, export, bidirectional
  resource: varchar('resource', { length: 50 }), // calendar, tasks, contacts, etc.
  
  // Job configuration
  config: jsonb('config').default({}), // Job-specific configuration
  filters: jsonb('filters').default({}), // Data filters
  
  // Status and progress
  status: varchar('status', { length: 20 }).default('pending'), // pending, running, completed, failed, cancelled
  progress: integer('progress').default(0), // 0-100
  
  // Timing
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  estimatedDuration: integer('estimated_duration'), // seconds
  
  // Results and metrics
  recordsProcessed: integer('records_processed').default(0),
  recordsSucceeded: integer('records_succeeded').default(0),
  recordsFailed: integer('records_failed').default(0),
  recordsSkipped: integer('records_skipped').default(0),
  
  // Error handling
  errorMessage: text('error_message'),
  errorDetails: jsonb('error_details'),
  retryCount: integer('retry_count').default(0),
  
  // Metadata
  triggeredBy: varchar('triggered_by', { length: 20 }).default('system'), // system, user, webhook
  priority: integer('priority').default(0), // Higher number = higher priority
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  integrationIdIdx: index('sync_jobs_integration_id_idx').on(table.integrationId),
  statusIdx: index('sync_jobs_status_idx').on(table.status),
  scheduledAtIdx: index('sync_jobs_scheduled_at_idx').on(table.scheduledAt),
  typeIdx: index('sync_jobs_type_idx').on(table.type)
}));

export const integrationRelations = relations(integrations, ({ one, many }) => ({
  user: one(users, {
    fields: [integrations.userId],
    references: [users.id]
  }),
  workspace: one(workspaces, {
    fields: [integrations.workspaceId],
    references: [workspaces.id]
  }),
  logs: many(integrationLogs),
  webhooks: many(webhooks),
  syncJobs: many(syncJobs)
}));

export const integrationLogRelations = relations(integrationLogs, ({ one }) => ({
  integration: one(integrations, {
    fields: [integrationLogs.integrationId],
    references: [integrations.id]
  })
}));

export const webhookRelations = relations(webhooks, ({ one, many }) => ({
  integration: one(integrations, {
    fields: [webhooks.integrationId],
    references: [integrations.id]
  }),
  user: one(users, {
    fields: [webhooks.userId],
    references: [users.id]
  }),
  deliveries: many(webhookDeliveries)
}));

export const webhookDeliveryRelations = relations(webhookDeliveries, ({ one }) => ({
  webhook: one(webhooks, {
    fields: [webhookDeliveries.webhookId],
    references: [webhooks.id]
  })
}));

export const apiKeyRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id]
  }),
  workspace: one(workspaces, {
    fields: [apiKeys.workspaceId],
    references: [workspaces.id]
  })
}));

export const syncJobRelations = relations(syncJobs, ({ one }) => ({
  integration: one(integrations, {
    fields: [syncJobs.integrationId],
    references: [integrations.id]
  })
}));

export type Integration = typeof integrations.$inferSelect;
export type NewIntegration = typeof integrations.$inferInsert;
export type IntegrationLog = typeof integrationLogs.$inferSelect;
export type NewIntegrationLog = typeof integrationLogs.$inferInsert;
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type SyncJob = typeof syncJobs.$inferSelect;
export type NewSyncJob = typeof syncJobs.$inferInsert;