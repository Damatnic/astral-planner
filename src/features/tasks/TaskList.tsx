'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
// import { FixedSizeList } from 'react-window'; // Temporarily disabled for build fix
import { useDrop } from 'react-dnd';
import {
  CheckSquare,
  Square,
  MoreVertical,
  GripVertical,
  Calendar,
  Clock,
  Flag,
  User,
  Tag,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TaskItem } from './TaskItem';
import { Task, TaskViewMode, TaskDropResult } from './types';
import { cn } from '@/lib/utils';

interface TaskListProps {
  tasks: Task[];
  viewMode: TaskViewMode;
  selectedTasks: Set<string>;
  onTaskSelect: (taskId: string, selected: boolean) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskReorder: (taskIds: string[]) => void;
  onSelectAll: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
  enableBulkActions?: boolean;
  className?: string;
}

interface VirtualizedRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    tasks: Task[];
    selectedTasks: Set<string>;
    onTaskSelect: (taskId: string, selected: boolean) => void;
    onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
    onTaskDelete: (taskId: string) => void;
    isUpdating: boolean;
    isDeleting: boolean;
  };
}

const VirtualizedRow: React.FC<VirtualizedRowProps> = ({ index, style, data }) => {
  const { tasks, selectedTasks, onTaskSelect, onTaskUpdate, onTaskDelete, isUpdating, isDeleting } = data;
  const task = tasks[index];

  if (!task) return null;

  return (
    <div style={style}>
      <TaskItem
        task={task}
        isSelected={selectedTasks.has(task.id)}
        onSelect={(selected) => onTaskSelect(task.id, selected)}
        onUpdate={(updates) => onTaskUpdate(task.id, updates)}
        onDelete={() => onTaskDelete(task.id)}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
        className="mx-2 mb-2"
      />
    </div>
  );
};

interface GroupedTasks {
  [key: string]: Task[];
}

export function TaskList({
  tasks,
  viewMode,
  selectedTasks,
  onTaskSelect,
  onTaskUpdate,
  onTaskDelete,
  onTaskReorder,
  onSelectAll,
  isUpdating,
  isDeleting,
  enableBulkActions = true,
  className = '',
}: TaskListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle drop for reordering
  const [{ isOver }, drop] = useDrop({
    accept: 'task',
    drop: (item: { task: Task }, monitor) => {
      if (!monitor.didDrop() && draggedTask) {
        const draggedIndex = tasks.findIndex(t => t.id === draggedTask.id);
        const hoveredIndex = tasks.findIndex(t => t.id === item.task.id);
        
        if (draggedIndex !== hoveredIndex) {
          const newTasks = [...tasks];
          const [removed] = newTasks.splice(draggedIndex, 1);
          newTasks.splice(hoveredIndex, 0, removed);
          onTaskReorder(newTasks.map(t => t.id));
        }
      }
      setDraggedTask(null);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  // Group tasks by status/priority/category if needed
  const groupedTasks = useMemo((): GroupedTasks => {
    if (viewMode === 'board') {
      return tasks.reduce((groups, task) => {
        const key = task.status;
        if (!groups[key]) groups[key] = [];
        groups[key].push(task);
        return groups;
      }, {} as GroupedTasks);
    }
    
    return { 'All Tasks': tasks };
  }, [tasks, viewMode]);

  // Calculate task completion statistics
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const blocked = tasks.filter(t => t.status === 'blocked').length;
    const overdue = tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
    ).length;

    return {
      total,
      completed,
      inProgress,
      blocked,
      overdue,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [tasks]);

  // Toggle group expansion
  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target !== document.body) return;

      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
          event.preventDefault();
          // Handle task navigation
          break;
        case ' ':
          event.preventDefault();
          // Toggle selection of focused task
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-300';
      case 'review': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'done': return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled': return 'bg-gray-100 text-gray-500 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const renderListView = () => {
    const virtualizedData = {
      tasks,
      selectedTasks,
      onTaskSelect,
      onTaskUpdate,
      onTaskDelete,
      isUpdating,
      isDeleting,
    };

    return (
      <div ref={containerRef} className="h-full">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <CheckSquare className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No tasks found</p>
            <p className="text-sm">Create your first task to get started</p>
          </div>
        ) : (
          <div
            ref={listRef}
            className="h-full overflow-y-auto"
            style={{ height: containerRef.current?.clientHeight || 600 }}
          >
            {tasks.map((task, index) => (
              <VirtualizedRow
                key={task.id}
                index={index}
                style={{ height: 80 }}
                data={virtualizedData}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderBoardView = () => {
    const statusColumns = [
      { key: 'todo', title: 'To Do', color: 'border-gray-300' },
      { key: 'in-progress', title: 'In Progress', color: 'border-blue-300' },
      { key: 'review', title: 'Review', color: 'border-yellow-300' },
      { key: 'done', title: 'Done', color: 'border-green-300' },
    ];

    return (
      <div className="flex gap-4 h-full overflow-x-auto p-4">
        {statusColumns.map(column => {
          const columnTasks = groupedTasks[column.key] || [];
          const completionRate = columnTasks.length > 0 
            ? (columnTasks.filter(t => t.status === 'done').length / columnTasks.length) * 100 
            : 0;

          return (
            <div
              key={column.key}
              className={cn(
                'flex flex-col min-w-[300px] max-w-[300px] bg-gray-50 dark:bg-gray-800 rounded-lg border-2',
                column.color
              )}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {column.title}
                  </h3>
                  <Badge variant="secondary">{columnTasks.length}</Badge>
                </div>
                {columnTasks.length > 0 && (
                  <Progress value={completionRate} className="mt-2 h-1" />
                )}
              </div>

              {/* Column Content */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {columnTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    isSelected={selectedTasks.has(task.id)}
                    onSelect={(selected) => onTaskSelect(task.id, selected)}
                    onUpdate={(updates) => onTaskUpdate(task.id, updates)}
                    onDelete={() => onTaskDelete(task.id)}
                    isUpdating={isUpdating}
                    isDeleting={isDeleting}
                    variant="compact"
                  />
                ))}
                
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No tasks in {column.title.toLowerCase()}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCalendarView = () => {
    // Group tasks by date
    const tasksByDate = tasks.reduce((acc, task) => {
      const date = task.dueDate 
        ? new Date(task.dueDate).toISOString().split('T')[0]
        : 'no-date';
      
      if (!acc[date]) acc[date] = [];
      acc[date].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    return (
      <div className="p-4 space-y-4">
        {Object.entries(tasksByDate).map(([date, dateTasks]) => (
          <div key={date} className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {date === 'no-date' 
                    ? 'No Due Date'
                    : new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                  }
                </h3>
                <Badge variant="secondary">{dateTasks.length}</Badge>
              </div>
            </div>
            <div className="p-2 space-y-2">
              {dateTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isSelected={selectedTasks.has(task.id)}
                  onSelect={(selected) => onTaskSelect(task.id, selected)}
                  onUpdate={(updates) => onTaskUpdate(task.id, updates)}
                  onDelete={() => onTaskDelete(task.id)}
                  isUpdating={isUpdating}
                  isDeleting={isDeleting}
                  variant="compact"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTimelineView = () => {
    // Sort tasks by creation date for timeline
    const sortedTasks = [...tasks].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return (
      <div className="p-4">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />
          
          <div className="space-y-4">
            {sortedTasks.map((task, index) => (
              <div key={task.id} className="relative flex items-start gap-4">
                {/* Timeline dot */}
                <div className={cn(
                  'relative z-10 flex items-center justify-center w-4 h-4 rounded-full border-2',
                  getStatusColor(task.status)
                )}>
                  <div className="w-2 h-2 rounded-full bg-current" />
                </div>
                
                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <TaskItem
                    task={task}
                    isSelected={selectedTasks.has(task.id)}
                    onSelect={(selected) => onTaskSelect(task.id, selected)}
                    onUpdate={(updates) => onTaskUpdate(task.id, updates)}
                    onDelete={() => onTaskDelete(task.id)}
                    isUpdating={isUpdating}
                    isDeleting={isDeleting}
                    variant="timeline"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={drop}
      className={cn(
        'h-full bg-white dark:bg-gray-900 transition-colors',
        isOver && 'bg-blue-50 dark:bg-blue-900/20',
        className
      )}
    >
      {/* Task Stats Header */}
      {tasks.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {enableBulkActions && (
                <Checkbox
                  checked={selectedTasks.size === tasks.length && tasks.length > 0}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all tasks"
                />
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{taskStats.total} tasks</span>
                <span>•</span>
                <span>{taskStats.completed} completed</span>
                <span>•</span>
                <span>{Math.round(taskStats.completionRate)}% done</span>
                {taskStats.overdue > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-red-600 dark:text-red-400">
                      {taskStats.overdue} overdue
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <Progress 
              value={taskStats.completionRate} 
              className="w-24 h-2"
            />
          </div>
        </div>
      )}

      {/* Task Content */}
      {viewMode === 'list' && renderListView()}
      {viewMode === 'board' && renderBoardView()}
      {viewMode === 'calendar' && renderCalendarView()}
      {viewMode === 'timeline' && renderTimelineView()}
    </div>
  );
}