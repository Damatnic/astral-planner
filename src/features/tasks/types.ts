export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
  tags: string[];
  dueDate?: Date;
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
  timeBlocks: TaskTimeBlock[];
  subtasks: SubTask[];
  dependencies: string[]; // task IDs
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  archived: boolean;
  metadata: TaskMetadata;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskTimeBlock {
  id: string;
  startTime: Date;
  endTime: Date;
  type: 'scheduled' | 'actual';
  description?: string;
}

export interface TaskMetadata {
  source?: 'manual' | 'voice' | 'email' | 'calendar' | 'ai';
  originalText?: string;
  aiProcessed?: boolean;
  location?: string;
  participants?: string[];
  resources?: string[];
  notes?: string;
}

export type TaskStatus = 
  | 'todo' 
  | 'in-progress' 
  | 'blocked' 
  | 'review' 
  | 'done' 
  | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskViewMode = 'list' | 'board' | 'calendar' | 'timeline';

export type TaskSortBy = 
  | 'dueDate' 
  | 'priority' 
  | 'status' 
  | 'title' 
  | 'createdAt' 
  | 'updatedAt';

export type TaskSortOrder = 'asc' | 'desc';

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  category?: string[];
  tags?: string[];
  assignedTo?: string[];
  dueDateRange?: {
    start?: Date;
    end?: Date;
  };
  search?: string;
  showArchived?: boolean;
}

export interface TaskListConfig {
  viewMode: TaskViewMode;
  sortBy: TaskSortBy;
  sortOrder: TaskSortOrder;
  filter: TaskFilter;
  groupBy?: 'status' | 'priority' | 'category' | 'assignedTo' | 'dueDate';
}

export interface TaskFormData {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
  tags: string[];
  dueDate?: Date;
  estimatedDuration?: number;
  assignedTo?: string;
  subtasks: Omit<SubTask, 'id' | 'createdAt' | 'updatedAt'>[];
  dependencies: string[];
  metadata: Partial<TaskMetadata>;
}

export interface TaskDragItem {
  id: string;
  type: 'task';
  task: Task;
}

export interface TaskDropResult {
  droppedId: string;
  targetId?: string;
  position: 'before' | 'after' | 'inside';
  newStatus?: TaskStatus;
  newCategory?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  overdue: number;
  completionRate: number;
  averageCompletionTime: number; // in hours
  productivityScore: number;
}

export interface TaskNotification {
  id: string;
  taskId: string;
  type: 'due_soon' | 'overdue' | 'blocked' | 'completed' | 'assigned';
  message: string;
  createdAt: Date;
  read: boolean;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  tasks: Omit<TaskFormData, 'dependencies'>[];
  tags: string[];
  category?: string;
  estimatedTotalDuration?: number;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}