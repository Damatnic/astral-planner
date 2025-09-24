export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: EventType;
  category?: string;
  color?: string;
  location?: string;
  attendees: string[];
  isAllDay: boolean;
  isRecurring: boolean;
  recurrenceRule?: RecurrenceRule;
  reminders: Reminder[];
  priority: EventPriority;
  status: EventStatus;
  visibility: EventVisibility;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata: EventMetadata;
  timeBlocks: TimeBlock[];
  linkedTaskId?: string;
  conflicts: ConflictInfo[];
}

export interface TimeBlock {
  id: string;
  startTime: Date;
  endTime: Date;
  type: TimeBlockType;
  title: string;
  description?: string;
  category?: string;
  color?: string;
  isLocked: boolean;
  flexibility: FlexibilityLevel;
  priority: number; // 1-10, higher = more important
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  bufferTime: number; // in minutes
  metadata: TimeBlockMetadata;
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: Date;
  count?: number;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  daysOfMonth?: number[];
  monthsOfYear?: number[];
  exceptions?: Date[];
}

export interface Reminder {
  id: string;
  type: ReminderType;
  timing: number; // minutes before event
  message?: string;
  isEnabled: boolean;
}

export interface ConflictInfo {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  description: string;
  suggestedResolution?: string;
  conflictingEventId?: string;
  conflictingTimeBlockId?: string;
}

export interface EventMetadata {
  source?: 'manual' | 'calendar_import' | 'email' | 'task' | 'ai';
  originalCalendarId?: string;
  importedFrom?: string;
  lastSyncAt?: Date;
  syncStatus?: 'synced' | 'pending' | 'error';
  customFields?: Record<string, any>;
  integrationData?: Record<string, any>;
}

export interface TimeBlockMetadata {
  autoScheduled?: boolean;
  scheduledBy?: 'user' | 'ai' | 'template';
  originalDuration?: number;
  productivity?: ProductivityData;
  energyLevel?: EnergyLevel;
  focusType?: FocusType;
  workType?: WorkType;
}

export interface ProductivityData {
  completionRate?: number; // 0-100
  focusScore?: number; // 1-10
  interruptions?: number;
  actualVsEstimated?: number; // ratio
}

export type EventType = 
  | 'meeting' 
  | 'appointment' 
  | 'deadline' 
  | 'reminder' 
  | 'task' 
  | 'break' 
  | 'personal' 
  | 'work' 
  | 'travel';

export type TimeBlockType = 
  | 'focus' 
  | 'meeting' 
  | 'break' 
  | 'routine' 
  | 'buffer' 
  | 'flexible' 
  | 'commute' 
  | 'meal';

export type EventPriority = 'low' | 'medium' | 'high' | 'urgent';

export type EventStatus = 'tentative' | 'confirmed' | 'cancelled' | 'completed';

export type EventVisibility = 'public' | 'private' | 'confidential';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ReminderType = 'popup' | 'email' | 'sms' | 'notification';

export type ConflictType = 
  | 'overlap' 
  | 'double_booking' 
  | 'travel_time' 
  | 'break_violation' 
  | 'priority_conflict' 
  | 'energy_mismatch';

export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical';

export type FlexibilityLevel = 'fixed' | 'preferred' | 'flexible' | 'very_flexible';

export type EnergyLevel = 'low' | 'medium' | 'high' | 'peak';

export type FocusType = 'deep' | 'shallow' | 'creative' | 'administrative';

export type WorkType = 'individual' | 'collaborative' | 'learning' | 'planning';

export type CalendarView = 'day' | 'week' | 'month' | 'year' | 'agenda' | 'timeline';

export type TimeScale = '15min' | '30min' | '1hour' | '2hour' | '4hour';

export interface CalendarConfig {
  view: CalendarView;
  currentDate: Date;
  timeScale: TimeScale;
  showWeekends: boolean;
  showDeclined: boolean;
  showAllDay: boolean;
  showTimeBlocks: boolean;
  workingHours: WorkingHours;
  timeZone: string;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday
  displayOptions: DisplayOptions;
  filterOptions: CalendarFilter;
}

export interface WorkingHours {
  enabled: boolean;
  start: string; // HH:mm format
  end: string; // HH:mm format
  workingDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  breakTimes: BreakTime[];
}

export interface BreakTime {
  id: string;
  name: string;
  start: string; // HH:mm format
  end: string; // HH:mm format
  days: number[];
  isRecurring: boolean;
}

export interface DisplayOptions {
  showConflicts: boolean;
  showTravelTime: boolean;
  showBufferTime: boolean;
  showProductivityMetrics: boolean;
  showEnergyLevels: boolean;
  eventDensity: 'compact' | 'comfortable' | 'spacious';
  colorBy: 'category' | 'priority' | 'type' | 'calendar';
  groupBy?: 'none' | 'category' | 'attendee' | 'location';
}

export interface CalendarFilter {
  calendars?: string[];
  categories?: string[];
  eventTypes?: EventType[];
  priorities?: EventPriority[];
  statuses?: EventStatus[];
  attendees?: string[];
  search?: string;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

export interface CalendarStats {
  totalEvents: number;
  totalDuration: number; // in minutes
  freeTime: number; // in minutes
  busyTime: number; // in minutes
  meetingTime: number; // in minutes
  focusTime: number; // in minutes
  conflictCount: number;
  utilizationRate: number; // 0-100
  productivityScore: number; // 1-10
  averageEventDuration: number; // in minutes
  eventsByType: Record<EventType, number>;
  eventsByPriority: Record<EventPriority, number>;
}

export interface DragDropResult {
  eventId: string;
  newStartTime: Date;
  newEndTime: Date;
  sourceCalendar?: string;
  targetCalendar?: string;
  conflicts?: ConflictInfo[];
}

export interface ResizeResult {
  eventId: string;
  newStartTime: Date;
  newEndTime: Date;
  resizeType: 'start' | 'end';
  conflicts?: ConflictInfo[];
}

export interface CalendarIntegration {
  id: string;
  name: string;
  type: IntegrationType;
  isEnabled: boolean;
  isConnected: boolean;
  lastSyncAt?: Date;
  syncFrequency: number; // in minutes
  configuration: IntegrationConfig;
  statistics: IntegrationStats;
}

export interface IntegrationConfig {
  readOnly: boolean;
  syncDirection: 'import' | 'export' | 'bidirectional';
  selectedCalendars: string[];
  fieldMapping: Record<string, string>;
  conflictResolution: 'skip' | 'overwrite' | 'merge';
  customSettings?: Record<string, any>;
}

export interface IntegrationStats {
  eventsImported: number;
  eventsExported: number;
  lastSyncDuration: number; // in seconds
  errorCount: number;
  lastError?: string;
  successRate: number; // 0-100
}

export type IntegrationType = 
  | 'google_calendar' 
  | 'outlook' 
  | 'apple_calendar' 
  | 'caldav' 
  | 'ical' 
  | 'exchange';

export interface CalendarTemplate {
  id: string;
  name: string;
  description?: string;
  type: TemplateType;
  category: string;
  events: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[];
  timeBlocks: Omit<TimeBlock, 'id'>[];
  configuration: Partial<CalendarConfig>;
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export type TemplateType = 
  | 'daily_routine' 
  | 'weekly_schedule' 
  | 'project_timeline' 
  | 'meeting_series' 
  | 'work_schedule' 
  | 'study_plan';

export interface QuickEventData {
  title: string;
  description?: string;
  date: Date;
  startTime?: string;
  duration?: number; // in minutes
  type?: EventType;
  priority?: EventPriority;
  category?: string;
  attendees?: string[];
  location?: string;
  reminders?: number[]; // minutes before
}

export interface SmartSchedulingOptions {
  preferredTimes: TimeSlot[];
  avoidTimes: TimeSlot[];
  bufferTime: number; // minutes
  maxDuration: number; // minutes
  allowConflicts: boolean;
  considerEnergyLevels: boolean;
  considerTravelTime: boolean;
  workingHoursOnly: boolean;
  optimizeFor: 'time' | 'energy' | 'productivity' | 'balance';
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string; // HH:mm format
  days: number[]; // 0 = Sunday, 1 = Monday, etc.
  weight: number; // 1-10, higher = more preferred
}

export interface SchedulingSuggestion {
  id: string;
  startTime: Date;
  endTime: Date;
  confidence: number; // 0-100
  reasoning: string;
  conflicts: ConflictInfo[];
  alternativeSlots: TimeSlot[];
  productivityScore: number; // 1-10
  energyMatch: number; // 1-10
}

export interface CalendarNotification {
  id: string;
  type: NotificationType;
  eventId?: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  isRead: boolean;
  actionRequired: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'accept' | 'decline' | 'reschedule' | 'view' | 'dismiss';
  payload?: Record<string, any>;
}

export type NotificationType = 
  | 'reminder' 
  | 'conflict' 
  | 'schedule_change' 
  | 'invitation' 
  | 'cancellation' 
  | 'sync_error' 
  | 'overdue_task';

export interface CalendarSearch {
  query: string;
  filters: CalendarFilter;
  results: CalendarSearchResult[];
  totalResults: number;
  searchTime: number; // in milliseconds
}

export interface CalendarSearchResult {
  type: 'event' | 'time_block' | 'free_time';
  item: CalendarEvent | TimeBlock | FreeTimeSlot;
  relevance: number; // 0-100
  highlights: string[];
  context: string;
}

export interface FreeTimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  type: 'available' | 'break' | 'lunch' | 'commute';
  suitabilityScore: number; // 1-10
  constraints: string[];
}

export interface CalendarAnalytics {
  timeRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    utilizationRate: number;
    productivityScore: number;
    focusTimePercentage: number;
    meetingLoad: number;
    workLifeBalance: number;
    energyAlignment: number;
  };
  trends: {
    dailyPatterns: DailyPattern[];
    weeklyPatterns: WeeklyPattern[];
    monthlyTrends: MonthlyTrend[];
  };
  insights: AnalyticsInsight[];
  recommendations: AnalyticsRecommendation[];
}

export interface DailyPattern {
  hour: number;
  averageUtilization: number;
  averageProductivity: number;
  averageEnergyLevel: number;
  commonActivities: string[];
}

export interface WeeklyPattern {
  dayOfWeek: number;
  averageUtilization: number;
  averageProductivity: number;
  totalMeetings: number;
  totalFocusTime: number;
}

export interface MonthlyTrend {
  month: string;
  utilizationTrend: number; // positive = increasing
  productivityTrend: number;
  meetingTrend: number;
  focusTimeTrend: number;
}

export interface AnalyticsInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  category: InsightCategory;
  data: Record<string, any>;
}

export interface AnalyticsRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  category: RecommendationCategory;
  actions: RecommendationAction[];
  expectedBenefit: string;
}

export interface RecommendationAction {
  id: string;
  label: string;
  type: 'schedule' | 'block' | 'adjust' | 'notify' | 'template';
  payload: Record<string, any>;
}

export type InsightType = 
  | 'peak_productivity' 
  | 'meeting_fatigue' 
  | 'focus_deficit' 
  | 'energy_mismatch' 
  | 'schedule_fragmentation' 
  | 'workload_imbalance';

export type InsightCategory = 
  | 'productivity' 
  | 'wellness' 
  | 'efficiency' 
  | 'balance' 
  | 'focus' 
  | 'energy';

export type RecommendationCategory = 
  | 'time_blocking' 
  | 'meeting_optimization' 
  | 'focus_improvement' 
  | 'energy_management' 
  | 'schedule_optimization' 
  | 'work_life_balance';