// User and workspace schemas
export * from './users';
export * from './workspaces';
export * from './blocks';
export * from './goals';
export * from './habits';
export * from './integrations';
export * from './notifications';
export * from './templates';

// Calendar schema with specific exports
export {
  calendars,
  calendarEvents,
  timeBlocks,
  availability,
  calendarRelations,
  calendarEventRelations,
  timeBlockRelations,
  availabilityRelations,
  type Calendar,
  type NewCalendar,
  type Event,
  type NewEvent,
  type TimeBlock,
  type NewTimeBlock,
  type Availability,
  type NewAvailability,
  // Backwards compatibility
  events,
  eventRelations
} from './calendar';

// Analytics schema with specific exports
export {
  userAnalytics,
  workspaceAnalytics,
  productivitySessions,
  insights,
  reports,
  events as analyticsEvents,
  userAnalyticsRelations,
  workspaceAnalyticsRelations,
  productivitySessionRelations,
  insightRelations,
  reportRelations,
  eventRelations as analyticsEventRelations,
  type UserAnalytics,
  type NewUserAnalytics,
  type WorkspaceAnalytics,
  type NewWorkspaceAnalytics,
  type ProductivitySession,
  type NewProductivitySession,
  type Insight,
  type NewInsight,
  type Report,
  type NewReport,
  type AnalyticsEvent,
  type NewAnalyticsEvent,
  // Backwards compatibility
  analytics
} from './analytics';