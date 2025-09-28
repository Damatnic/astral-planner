// Enhanced API types with better type safety
export interface APIError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  status?: number;
}

export interface QueryError {
  status?: number;
  statusText?: string;
  message?: string;
}

export interface AIParseContext {
  userId?: string;
  workspaceId?: string;
  taskContext?: {
    existingTasks: Array<{ id: string; title: string; priority?: string }>;
    recentCompletions: Array<{ title: string; completedAt: Date }>;
  };
  preferences?: {
    defaultPriority: string;
    workingHours: { start: string; end: string };
    timezone: string;
  };
}

export interface AIParseOptions {
  preview?: boolean;
  context?: AIParseContext;
}

export interface TaskData {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  estimatedDuration?: number;
  tags?: string[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultPriority: string;
  workingHours: { start: string; end: string };
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
}

export interface SchedulePreferences {
  workingHours: { start: string; end: string };
  timezone: string;
  breakDuration: number;
  maxTasksPerDay: number;
  prioritizeBy: 'priority' | 'deadline' | 'duration';
}

export interface ListNavigationItem {
  id: string;
  title: string;
  [key: string]: unknown;
}

export interface ProductivityData {
  tasksCompleted: number;
  totalTime: number;
  averageCompletionTime: number;
  productivityScore: number;
  trends: Array<{
    date: string;
    completedTasks: number;
    totalTime: number;
  }>;
}

export interface RealtimeNotification {
  id: string;
  type: 'task_update' | 'task_create' | 'task_delete' | 'user_join' | 'user_leave';
  title: string;
  message: string;
  data: Record<string, unknown>;
  timestamp: Date;
  read: boolean;
}

export interface PresenceUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: Date;
}

export interface AdminUserData {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user' | 'premium';
  status: 'active' | 'inactive' | 'banned';
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface AdminActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface SectionData {
  [key: string]: unknown;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface VoiceInputOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
}