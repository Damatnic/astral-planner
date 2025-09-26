// Base types
export type ID = string;
export type Timestamp = Date | string;

// User types
export interface User {
  id: ID;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  notifications: {
    email: boolean;
    push: boolean;
    reminders: boolean;
  };
  privacy: {
    shareAnalytics: boolean;
    publicProfile: boolean;
  };
}

// Goal types
export type GoalPriority = 'low' | 'medium' | 'high' | 'urgent';
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';

export interface Goal {
  id: ID;
  userId: ID;
  title: string;
  description?: string;
  priority: GoalPriority;
  status: GoalStatus;
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  parentId?: ID;
  children?: Goal[];
  tags: string[];
  isPublic: boolean;
  progress: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GoalWithStats extends Goal {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  isOverdue?: boolean;
  daysRemaining?: number | null;
  milestoneProgress?: number;
  totalMilestones?: number;
}

// Task types
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id: ID;
  userId: ID;
  goalId?: ID;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  estimatedMinutes?: number;
  actualMinutes?: number;
  tags: string[];
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Habit types
export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

export interface Habit {
  id: ID;
  userId: ID;
  name: string;
  description?: string;
  frequency: HabitFrequency;
  target: number;
  color: string;
  icon: string;
  isActive: boolean;
  reminderTime?: string;
  category?: string;
  streakCount: number;
  longestStreak: number;
  totalCompleted: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface HabitCompletion {
  id: ID;
  habitId: ID;
  userId: ID;
  completedAt: Timestamp;
  value: number;
  notes?: string;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  completionRate: number;
  weeklyStats: Array<{
    week: string;
    completed: number;
    target: number;
  }>;
}

// Template types
export interface Template {
  id: ID;
  userId?: ID;
  name: string;
  description?: string;
  category: string;
  content: {
    goals: Array<Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
    tasks: Array<Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
    habits: Array<Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'streakCount' | 'longestStreak' | 'totalCompleted'>>;
  };
  isPublic: boolean;
  tags: string[];
  usageCount: number;
  rating: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Analytics types
export interface Analytics {
  userId: ID;
  period: 'day' | 'week' | 'month' | 'year';
  startDate: Timestamp;
  endDate: Timestamp;
  metrics: {
    goals: {
      total: number;
      completed: number;
      inProgress: number;
      completionRate: number;
    };
    tasks: {
      total: number;
      completed: number;
      overdue: number;
      completionRate: number;
      averageCompletionTime: number;
    };
    habits: {
      total: number;
      averageStreak: number;
      completionRate: number;
      mostConsistent: string[];
    };
    productivity: {
      score: number;
      trend: 'up' | 'down' | 'stable';
      peakHours: number[];
      focusTime: number;
    };
  };
}

// API types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Query types
export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filter?: Record<string, unknown>;
}

export interface FilterParams {
  status?: string;
  priority?: string;
  category?: string;
  tags?: string[];
  dateRange?: {
    start: Timestamp;
    end: Timestamp;
  };
}

// Notification types
export interface Notification {
  id: ID;
  userId: ID;
  type: 'reminder' | 'achievement' | 'system' | 'social';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Timestamp;
}

// Integration types
export interface Integration {
  id: ID;
  userId: ID;
  provider: 'google' | 'outlook' | 'slack' | 'trello';
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Timestamp;
  settings: Record<string, unknown>;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Calendar types
export interface CalendarEvent {
  id: ID;
  userId: ID;
  title: string;
  description?: string;
  startTime: Timestamp;
  endTime: Timestamp;
  location?: string;
  attendees?: string[];
  reminders?: Array<{
    method: 'email' | 'popup';
    minutes: number;
  }>;
  source: 'internal' | 'google' | 'outlook';
  externalId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Time blocking types
export interface TimeBlock {
  id: ID;
  userId: ID;
  title: string;
  description?: string;
  startTime: Timestamp;
  endTime: Timestamp;
  taskId?: ID;
  goalId?: ID;
  color: string;
  type: 'work' | 'break' | 'personal' | 'meeting';
  isFlexible: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Workspace types
export interface Workspace {
  id: ID;
  name: string;
  description?: string;
  ownerId: ID;
  members: Array<{
    userId: ID;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    joinedAt: Timestamp;
  }>;
  settings: {
    isPublic: boolean;
    allowInvites: boolean;
    theme: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// AI types
export interface AIInsight {
  id: ID;
  userId: ID;
  type: 'productivity' | 'suggestion' | 'trend' | 'warning';
  title: string;
  message: string;
  confidence: number;
  data: Record<string, unknown>;
  actionable: boolean;
  actions?: Array<{
    type: string;
    label: string;
    payload: Record<string, unknown>;
  }>;
  createdAt: Timestamp;
}

// Health check types
export interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: Record<string, unknown>;
  timestamp: Timestamp;
}

// Export utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type CreateInput<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Component prop types
export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps extends BaseProps {
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface ErrorProps extends BaseProps {
  error?: Error | string | null;
  onRetry?: () => void;
}

// Enhanced TypeScript interfaces for enterprise-grade type safety

// Admin and Management Types
export interface AdminUser {
  id: ID;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  lastActiveAt: Timestamp;
  totalTasksCompleted: number;
  streakDays: number;
  onboardingCompleted: boolean;
  subscription: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'inactive';
  permissions: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AdminActivity {
  id: ID;
  userId: ID;
  action: string;
  entityType: 'task' | 'goal' | 'habit' | 'user' | 'workspace';
  entityId: ID;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Timestamp;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalTasks: number;
  completedTasks: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  performanceMetrics: {
    averageResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
}

// Real-time collaboration types
export interface RealtimeMessage {
  id: ID;
  type: 'user_join' | 'user_leave' | 'task_update' | 'task_create' | 'task_delete' | 'notification';
  userId: ID;
  workspaceId?: ID;
  data: Record<string, unknown>;
  timestamp: Timestamp;
}

export interface PresenceUser {
  id: ID;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  cursor?: { x: number; y: number };
  isTyping?: boolean;
  lastSeen: Timestamp;
}

export interface RealtimeNotification {
  id: ID;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  icon?: string;
  metadata?: Record<string, unknown>;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
  timestamp: Timestamp;
}

// Form and Validation Types
export interface TaskFormData {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  estimatedDuration?: number;
  category?: string;
  tags: string[];
  assignedTo?: string;
  subtasks: Array<{
    title: string;
    completed: boolean;
  }>;
  notes?: string;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface VoiceCommandResult {
  command: string;
  intent: string;
  entities: Record<string, unknown>;
  confidence: number;
}

// Template and Workspace Types
export interface TemplateData {
  name: string;
  description?: string;
  category: string;
  workspaces?: Workspace[];
  blocks?: Block[];
  goals?: Goal[];
  habits?: Habit[];
  settings?: Record<string, unknown>;
}

export interface WorkspaceMember {
  userId: ID;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'suspended';
  joinedAt: Timestamp;
  lastActiveAt?: Timestamp;
  permissions: string[];
}

export interface Block {
  id: ID;
  workspaceId: ID;
  type: 'task' | 'project' | 'note' | 'event';
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  progress: number;
  tags: string[];
  assignedTo?: ID;
  lastEditedBy?: ID;
  version: number;
  timeBlockStart?: Timestamp;
  timeBlockEnd?: Timestamp;
  actualDuration?: number;
  estimatedDuration?: number;
  isDeleted: boolean;
  isArchived: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Performance and Analytics Types
export interface PerformanceMetrics {
  timing: {
    domContentLoaded: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
  };
  navigation: {
    type: 'navigate' | 'reload' | 'back_forward' | 'prerender';
    redirectCount: number;
  };
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  connection?: {
    effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
    downlink: number;
    rtt: number;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  startOfWeek: 0 | 1 | 6; // Sunday, Monday, Saturday
  shortcuts: Record<string, string>;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    sound: boolean;
    reminders: boolean;
    marketing: boolean;
  };
  privacy: {
    shareAnalytics: boolean;
    publicProfile: boolean;
    allowTracking: boolean;
  };
  dashboard: {
    layout: 'grid' | 'list' | 'kanban';
    widgets: string[];
    autoRefresh: boolean;
    refreshInterval: number;
  };
  calendar: {
    defaultView: 'month' | 'week' | 'day' | 'agenda';
    weekends: boolean;
    businessHours: {
      start: string;
      end: string;
    };
  };
}

// Export and Import Types
export interface ExportData {
  format: 'json' | 'csv' | 'excel' | 'pdf';
  type: 'tasks' | 'goals' | 'habits' | 'all';
  dateRange?: {
    start: Timestamp;
    end: Timestamp;
  };
  includeCompleted?: boolean;
  includeArchived?: boolean;
  filters?: FilterParams;
}

export interface ImportResult {
  success: boolean;
  totalRecords: number;
  importedRecords: number;
  skippedRecords: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  data?: Record<string, unknown>[];
}

// Security and Authentication Types
export interface SecurityHeaders {
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Strict-Transport-Security': string;
  'Content-Security-Policy': string;
}

export interface RateLimitResult {
  success: boolean;
  error?: string;
  headers?: Record<string, string>;
}

export interface JWTPayload {
  userId: ID;
  email: string;
  role?: string;
  permissions?: string[];
  iat: number;
  exp: number;
}

export interface AuthenticationResult {
  success: boolean;
  user?: AdminUser;
  session?: {
    id: string;
    token: string;
    expiresAt: Timestamp;
  };
  requiresMFA?: boolean;
  error?: string;
}

// Command Palette and Shortcuts Types
export interface Command {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
  shortcut?: string;
  action: () => void | Promise<void>;
  category: 'navigation' | 'actions' | 'tools' | 'settings';
  permission?: string;
}

export interface ShortcutGroup {
  category: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
    action?: () => void;
  }>;
}

// AI and Machine Learning Types
export interface AISchedulingSuggestion {
  id: ID;
  type: 'time_optimization' | 'task_scheduling' | 'break_suggestion' | 'priority_adjustment';
  title: string;
  description: string;
  confidence: number;
  estimatedImpact: 'low' | 'medium' | 'high';
  data: {
    originalTask?: Task;
    suggestedTime?: Timestamp;
    reasoning: string;
    expectedBenefits: string[];
  };
  actions: Array<{
    type: 'accept' | 'modify' | 'reject';
    label: string;
    callback: () => void;
  }>;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

export interface AIParsingResult {
  intent: 'create_task' | 'create_event' | 'create_goal' | 'set_reminder' | 'unknown';
  confidence: number;
  entities: {
    title?: string;
    description?: string;
    dueDate?: Date;
    priority?: TaskPriority;
    tags?: string[];
    duration?: number;
    location?: string;
  };
  rawText: string;
  suggestions?: string[];
}

// Event and Calendar Types
export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda';
  startDate: Date;
  endDate: Date;
  timezone: string;
}

export interface CalendarSettings {
  defaultView: CalendarView['type'];
  businessHours: {
    start: string;
    end: string;
    days: number[]; // 0-6, Sunday-Saturday
  };
  timeSlotDuration: number; // in minutes
  showWeekends: boolean;
  firstDayOfWeek: 0 | 1 | 6;
  timeZone: string;
}

// Database and Query Types
export interface DatabaseOptimization {
  indexName: string;
  tableName: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  performance: {
    estimatedImprovement: number;
    queryTime: number;
    scanCost: number;
  };
  recommendation: 'create' | 'drop' | 'rebuild' | 'analyze';
}

export interface QueryPerformance {
  queryId: string;
  query: string;
  executionTime: number;
  scanType: 'seq_scan' | 'index_scan' | 'bitmap_scan';
  rowsReturned: number;
  bufferHits: number;
  bufferReads: number;
  cacheHitRatio: number;
  recommendation?: string;
}