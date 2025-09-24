import { pgTable, uuid, text, timestamp, jsonb, boolean, varchar, integer, decimal, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { workspaces } from './workspaces';
import { blocks } from './blocks';

export const userAnalytics = pgTable('user_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Time period
  date: timestamp('date').notNull(),
  period: varchar('period', { length: 10 }).notNull(), // daily, weekly, monthly, yearly
  
  // Productivity metrics
  tasksCreated: integer('tasks_created').default(0),
  tasksCompleted: integer('tasks_completed').default(0),
  tasksOverdue: integer('tasks_overdue').default(0),
  completionRate: decimal('completion_rate', { precision: 5, scale: 2 }).default('0'),
  
  // Time tracking
  totalTimeTracked: integer('total_time_tracked').default(0), // minutes
  focusTime: integer('focus_time').default(0), // minutes of focused work
  breakTime: integer('break_time').default(0), // minutes of breaks
  
  // Activity patterns
  activeHours: jsonb('active_hours').default({}), // { '09': 120, '10': 180, ... } minutes per hour
  peakHours: jsonb('peak_hours').default([]), // ['09', '10', '14'] - most productive hours
  workDays: jsonb('work_days').default([]), // Active days of the week
  
  // Goal and habit tracking
  goalsSet: integer('goals_set').default(0),
  goalsAchieved: integer('goals_achieved').default(0),
  habitsTracked: integer('habits_tracked').default(0),
  habitStreak: integer('habit_streak').default(0),
  
  // Collaboration metrics
  collaborationMinutes: integer('collaboration_minutes').default(0),
  messagesExchanged: integer('messages_exchanged').default(0),
  meetingsAttended: integer('meetings_attended').default(0),
  
  // App usage
  sessionsCount: integer('sessions_count').default(0),
  sessionDuration: integer('session_duration').default(0), // average session in minutes
  featuresUsed: jsonb('features_used').default([]), // Array of feature names
  
  // Stress and wellness indicators
  stressLevel: decimal('stress_level', { precision: 3, scale: 2 }), // 0-10 scale
  wellnessScore: decimal('wellness_score', { precision: 5, scale: 2 }), // 0-100 scale
  workLifeBalance: decimal('work_life_balance', { precision: 3, scale: 2 }), // 0-10 scale
  
  // AI insights
  aiSuggestions: jsonb('ai_suggestions').default({}), // AI-generated insights and recommendations
  automationSavings: integer('automation_savings').default(0), // minutes saved through automation
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('user_analytics_user_id_idx').on(table.userId),
  workspaceIdIdx: index('user_analytics_workspace_id_idx').on(table.workspaceId),
  dateIdx: index('user_analytics_date_idx').on(table.date),
  periodIdx: index('user_analytics_period_idx').on(table.period),
  userDatePeriodIdx: index('user_analytics_user_date_period_idx').on(table.userId, table.date, table.period)
}));

export const workspaceAnalytics = pgTable('workspace_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  
  // Time period
  date: timestamp('date').notNull(),
  period: varchar('period', { length: 10 }).notNull(),
  
  // Team productivity
  totalTasks: integer('total_tasks').default(0),
  completedTasks: integer('completed_tasks').default(0),
  averageCompletionTime: integer('average_completion_time').default(0), // hours
  teamVelocity: decimal('team_velocity', { precision: 5, scale: 2 }).default('0'),
  
  // Collaboration metrics
  activeMembers: integer('active_members').default(0),
  totalCollaborationTime: integer('total_collaboration_time').default(0), // minutes
  commentsExchanged: integer('comments_exchanged').default(0),
  filesShared: integer('files_shared').default(0),
  
  // Project health
  projectsActive: integer('projects_active').default(0),
  projectsCompleted: integer('projects_completed').default(0),
  projectsOverdue: integer('projects_overdue').default(0),
  averageProjectDuration: integer('average_project_duration').default(0), // days
  
  // Resource utilization
  storageUsed: integer('storage_used').default(0), // MB
  apiCallsCount: integer('api_calls_count').default(0),
  integrationUsage: jsonb('integration_usage').default({}), // { 'slack': 150, 'google': 200 }
  
  // Performance metrics
  responseTime: decimal('response_time', { precision: 5, scale: 2 }), // average response time in seconds
  errorRate: decimal('error_rate', { precision: 5, scale: 4 }).default('0'), // error percentage
  uptime: decimal('uptime', { precision: 5, scale: 2 }).default('100'), // uptime percentage
  
  // Growth metrics
  newMembers: integer('new_members').default(0),
  memberRetention: decimal('member_retention', { precision: 5, scale: 2 }).default('100'),
  featureAdoption: jsonb('feature_adoption').default({}), // Feature usage by members
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  workspaceIdIdx: index('workspace_analytics_workspace_id_idx').on(table.workspaceId),
  dateIdx: index('workspace_analytics_date_idx').on(table.date),
  periodIdx: index('workspace_analytics_period_idx').on(table.period),
  workspaceDatePeriodIdx: index('workspace_analytics_workspace_date_period_idx').on(table.workspaceId, table.date, table.period)
}));

export const productivitySessions = pgTable('productivity_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  blockId: uuid('block_id').references(() => blocks.id),
  
  // Session details
  type: varchar('type', { length: 20 }).notNull(), // focus, break, meeting, planning, review
  status: varchar('status', { length: 20 }).default('active'), // active, paused, completed, cancelled
  
  // Timing
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  plannedDuration: integer('planned_duration'), // minutes
  actualDuration: integer('actual_duration'), // minutes
  pausedTime: integer('paused_time').default(0), // minutes
  
  // Context and goals
  goal: text('goal'),
  context: jsonb('context').default({}), // Environment, tools used, etc.
  tags: jsonb('tags').default([]),
  
  // Productivity metrics
  interruptions: integer('interruptions').default(0),
  distractionEvents: jsonb('distraction_events').default([]), // Logged distractions
  energyLevel: integer('energy_level'), // 1-10 scale at start
  endEnergyLevel: integer('end_energy_level'), // 1-10 scale at end
  
  // Outcomes and reflection
  output: text('output'), // What was accomplished
  quality: integer('quality'), // 1-10 self-assessed quality
  satisfaction: integer('satisfaction'), // 1-10 satisfaction rating
  notes: text('notes'), // Session reflection notes
  
  // Environmental factors
  environment: jsonb('environment').default({}), // Location, noise level, etc.
  tools: jsonb('tools').default([]), // Apps/tools used during session
  
  // AI analysis
  aiInsights: jsonb('ai_insights').default({}), // AI-generated insights about the session
  recommendations: jsonb('recommendations').default([]), // Suggestions for improvement
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('productivity_sessions_user_id_idx').on(table.userId),
  workspaceIdIdx: index('productivity_sessions_workspace_id_idx').on(table.workspaceId),
  blockIdIdx: index('productivity_sessions_block_id_idx').on(table.blockId),
  typeIdx: index('productivity_sessions_type_idx').on(table.type),
  startTimeIdx: index('productivity_sessions_start_time_idx').on(table.startTime),
  statusIdx: index('productivity_sessions_status_idx').on(table.status)
}));

export const insights = pgTable('insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Insight details
  type: varchar('type', { length: 30 }).notNull(), // pattern, recommendation, achievement, alert, trend
  category: varchar('category', { length: 50 }), // productivity, wellness, collaboration, time_management
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  
  // Insight data
  data: jsonb('data').notNull(), // Raw data supporting the insight
  metrics: jsonb('metrics').default({}), // Key metrics and calculations
  confidence: decimal('confidence', { precision: 3, scale: 2 }), // 0-1 confidence score
  
  // Insight properties
  severity: varchar('severity', { length: 10 }).default('info'), // info, warning, critical
  priority: integer('priority').default(0), // Higher number = higher priority
  actionable: boolean('actionable').default(false),
  
  // Actions and recommendations
  recommendations: jsonb('recommendations').default([]), // Suggested actions
  automationOpportunities: jsonb('automation_opportunities').default([]),
  
  // Time relevance
  timeframe: jsonb('timeframe').notNull(), // { start: '2024-01-01', end: '2024-01-31' }
  freshUntil: timestamp('fresh_until'), // When this insight becomes stale
  
  // User interaction
  status: varchar('status', { length: 20 }).default('new'), // new, viewed, dismissed, acted_upon
  viewedAt: timestamp('viewed_at'),
  dismissedAt: timestamp('dismissed_at'),
  actionTakenAt: timestamp('action_taken_at'),
  
  // AI generation details
  aiModel: varchar('ai_model', { length: 50 }),
  aiVersion: varchar('ai_version', { length: 20 }),
  generationMetadata: jsonb('generation_metadata').default({}),
  
  // Related entities
  relatedEntities: jsonb('related_entities').default([]), // References to related blocks, goals, habits
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
}, (table) => ({
  userIdIdx: index('insights_user_id_idx').on(table.userId),
  workspaceIdIdx: index('insights_workspace_id_idx').on(table.workspaceId),
  typeIdx: index('insights_type_idx').on(table.type),
  categoryIdx: index('insights_category_idx').on(table.category),
  statusIdx: index('insights_status_idx').on(table.status),
  priorityIdx: index('insights_priority_idx').on(table.priority),
  freshUntilIdx: index('insights_fresh_until_idx').on(table.freshUntil)
}));

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Ownership
  userId: uuid('user_id').references(() => users.id).notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Report configuration
  type: varchar('type', { length: 30 }).notNull(), // productivity, time_tracking, team_performance, custom
  format: varchar('format', { length: 20 }).default('dashboard'), // dashboard, pdf, excel, csv
  
  // Data configuration
  dateRange: jsonb('date_range').notNull(), // { start: '2024-01-01', end: '2024-01-31', type: 'custom' }
  filters: jsonb('filters').default({}), // Report filters and criteria
  metrics: jsonb('metrics').default([]), // Selected metrics to include
  
  // Visualization settings
  chartTypes: jsonb('chart_types').default([]), // Chart configurations
  layout: jsonb('layout').default({}), // Dashboard layout settings
  styling: jsonb('styling').default({}), // Colors, fonts, branding
  
  // Scheduling and automation
  isScheduled: boolean('is_scheduled').default(false),
  schedule: jsonb('schedule').default({}), // Cron-like schedule configuration
  autoSend: boolean('auto_send').default(false),
  recipients: jsonb('recipients').default([]), // Email recipients for scheduled reports
  
  // Report data and cache
  lastGenerated: timestamp('last_generated'),
  generationStatus: varchar('generation_status', { length: 20 }).default('pending'), // pending, generating, completed, failed
  data: jsonb('data'), // Cached report data
  size: integer('size'), // Report size in bytes
  
  // Sharing and permissions
  isPublic: boolean('is_public').default(false),
  shareToken: varchar('share_token', { length: 100 }),
  expiresAt: timestamp('expires_at'),
  
  // Usage tracking
  viewCount: integer('view_count').default(0),
  lastViewedAt: timestamp('last_viewed_at'),
  exportCount: integer('export_count').default(0),
  
  // Status
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
}, (table) => ({
  userIdIdx: index('reports_user_id_idx').on(table.userId),
  workspaceIdIdx: index('reports_workspace_id_idx').on(table.workspaceId),
  typeIdx: index('reports_type_idx').on(table.type),
  isScheduledIdx: index('reports_is_scheduled_idx').on(table.isScheduled),
  shareTokenIdx: index('reports_share_token_idx').on(table.shareToken),
  isActiveIdx: index('reports_is_active_idx').on(table.isActive)
}));

export const events = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Event identification
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }), // user_action, system_event, api_call, error
  
  // Context
  userId: uuid('user_id').references(() => users.id),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  sessionId: varchar('session_id', { length: 100 }),
  
  // Event data
  properties: jsonb('properties').default({}), // Event-specific properties
  context: jsonb('context').default({}), // User agent, IP, device info, etc.
  
  // Timing
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  duration: integer('duration'), // For events with duration
  
  // Technical details
  source: varchar('source', { length: 50 }).default('web'), // web, mobile, api, system
  version: varchar('version', { length: 20 }), // App version
  
  // Metadata
  metadata: jsonb('metadata').default({}), // Additional context data
  
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  nameIdx: index('analytics_events_name_idx').on(table.name),
  categoryIdx: index('analytics_events_category_idx').on(table.category),
  userIdIdx: index('analytics_events_user_id_idx').on(table.userId),
  workspaceIdIdx: index('analytics_events_workspace_id_idx').on(table.workspaceId),
  timestampIdx: index('analytics_events_timestamp_idx').on(table.timestamp),
  sessionIdIdx: index('analytics_events_session_id_idx').on(table.sessionId)
}));

export const userAnalyticsRelations = relations(userAnalytics, ({ one }) => ({
  user: one(users, {
    fields: [userAnalytics.userId],
    references: [users.id]
  }),
  workspace: one(workspaces, {
    fields: [userAnalytics.workspaceId],
    references: [workspaces.id]
  })
}));

export const workspaceAnalyticsRelations = relations(workspaceAnalytics, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceAnalytics.workspaceId],
    references: [workspaces.id]
  })
}));

export const productivitySessionRelations = relations(productivitySessions, ({ one }) => ({
  user: one(users, {
    fields: [productivitySessions.userId],
    references: [users.id]
  }),
  workspace: one(workspaces, {
    fields: [productivitySessions.workspaceId],
    references: [workspaces.id]
  }),
  block: one(blocks, {
    fields: [productivitySessions.blockId],
    references: [blocks.id]
  })
}));

export const insightRelations = relations(insights, ({ one }) => ({
  user: one(users, {
    fields: [insights.userId],
    references: [users.id]
  }),
  workspace: one(workspaces, {
    fields: [insights.workspaceId],
    references: [workspaces.id]
  })
}));

export const reportRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id]
  }),
  workspace: one(workspaces, {
    fields: [reports.workspaceId],
    references: [workspaces.id]
  })
}));

export const eventRelations = relations(events, ({ one }) => ({
  user: one(users, {
    fields: [events.userId],
    references: [users.id]
  }),
  workspace: one(workspaces, {
    fields: [events.workspaceId],
    references: [workspaces.id]
  })
}));

export type UserAnalytics = typeof userAnalytics.$inferSelect;
export type NewUserAnalytics = typeof userAnalytics.$inferInsert;
export type WorkspaceAnalytics = typeof workspaceAnalytics.$inferSelect;
export type NewWorkspaceAnalytics = typeof workspaceAnalytics.$inferInsert;
export type ProductivitySession = typeof productivitySessions.$inferSelect;
export type NewProductivitySession = typeof productivitySessions.$inferInsert;
export type Insight = typeof insights.$inferSelect;
export type NewInsight = typeof insights.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type AnalyticsEvent = typeof events.$inferSelect;
export type NewAnalyticsEvent = typeof events.$inferInsert;

// Alias exports for backwards compatibility
export { events as analyticsEvents };
export { eventRelations as analyticsEventRelations };
export { userAnalytics as analytics };