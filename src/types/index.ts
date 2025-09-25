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
export interface APIResponse<T = any> {
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
  filter?: Record<string, any>;
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
  data?: Record<string, any>;
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
  settings: Record<string, any>;
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
  data: Record<string, any>;
  actionable: boolean;
  actions?: Array<{
    type: string;
    label: string;
    payload: Record<string, any>;
  }>;
  createdAt: Timestamp;
}

// Health check types
export interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: Record<string, any>;
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