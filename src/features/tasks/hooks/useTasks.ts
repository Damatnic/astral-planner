'use client';

import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Task,
  TaskFormData,
  TaskFilter,
  TaskListConfig,
  TaskStats,
  TaskSortBy,
  TaskSortOrder,
  TaskStatus,
  TaskViewMode,
} from '../types';

interface UseTasksOptions {
  initialConfig?: Partial<TaskListConfig>;
  enableRealtime?: boolean;
  enableOptimisticUpdates?: boolean;
}

interface TasksAPI {
  getTasks: (filter?: TaskFilter) => Promise<Task[]>;
  createTask: (data: TaskFormData) => Promise<Task>;
  updateTask: (id: string, data: Partial<TaskFormData>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  duplicateTask: (id: string) => Promise<Task>;
  bulkUpdateTasks: (updates: { id: string; data: Partial<TaskFormData> }[]) => Promise<Task[]>;
  getTaskStats: (filter?: TaskFilter) => Promise<TaskStats>;
  reorderTasks: (taskIds: string[]) => Promise<void>;
}

// Mock API - Replace with actual API calls
const mockAPI: TasksAPI = {
  getTasks: async (filter) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return [];
  },
  createTask: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      subtasks: data.subtasks.map(st => ({
        ...st,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      timeBlocks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      archived: false,
      metadata: {
        source: 'manual',
        ...data.metadata,
      },
    };
    return newTask;
  },
  updateTask: async (id, data) => {
    await new Promise(resolve => setTimeout(resolve, 150));
    // Return updated task
    return {} as Task;
  },
  deleteTask: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 100));
  },
  duplicateTask: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {} as Task;
  },
  bulkUpdateTasks: async (updates) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [];
  },
  getTaskStats: async (filter) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      blocked: 0,
      overdue: 0,
      completionRate: 0,
      averageCompletionTime: 0,
      productivityScore: 0,
    };
  },
  reorderTasks: async (taskIds) => {
    await new Promise(resolve => setTimeout(resolve, 100));
  },
};

const defaultConfig: TaskListConfig = {
  viewMode: 'list',
  sortBy: 'dueDate',
  sortOrder: 'asc',
  filter: {
    showArchived: false,
  },
};

export function useTasks(options: UseTasksOptions = {}) {
  const { 
    initialConfig = {},
    enableRealtime = true,
    enableOptimisticUpdates = true,
  } = options;

  const queryClient = useQueryClient();
  const [config, setConfig] = useState<TaskListConfig>({
    ...defaultConfig,
    ...initialConfig,
  });

  // Queries
  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    error: tasksError,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ['tasks', config.filter],
    queryFn: () => mockAPI.getTasks(config.filter),
    staleTime: enableRealtime ? 0 : 5 * 60 * 1000, // 5 minutes
    refetchInterval: enableRealtime ? 30000 : false, // 30 seconds
  });

  const {
    data: stats,
    isLoading: isLoadingStats,
  } = useQuery({
    queryKey: ['task-stats', config.filter],
    queryFn: () => mockAPI.getTaskStats(config.filter),
    staleTime: 60 * 1000, // 1 minute
  });

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: mockAPI.createTask,
    onMutate: enableOptimisticUpdates ? async (newTaskData) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', config.filter]);
      
      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        ...newTaskData,
        subtasks: newTaskData.subtasks.map(st => ({
          ...st,
          id: `temp-${Date.now()}-${Math.random()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        timeBlocks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        archived: false,
        metadata: {
          source: 'manual',
          ...newTaskData.metadata,
        },
      };

      queryClient.setQueryData<Task[]>(['tasks', config.filter], (old = []) => [
        optimisticTask,
        ...old,
      ]);

      return { previousTasks };
    } : undefined,
    onError: (error, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', config.filter], context.previousTasks);
      }
      toast.error('Failed to create task');
    },
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
      toast.success('Task created successfully');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskFormData> }) =>
      mockAPI.updateTask(id, data),
    onMutate: enableOptimisticUpdates ? async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', config.filter]);

      queryClient.setQueryData<Task[]>(['tasks', config.filter], (old = []) =>
        old.map(task =>
          task.id === id
            ? {
                ...task,
                ...data,
                updatedAt: new Date(),
              }
            : task
        )
      );

      return { previousTasks };
    } : undefined,
    onError: (error, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', config.filter], context.previousTasks);
      }
      toast.error('Failed to update task');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
      toast.success('Task updated successfully');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: mockAPI.deleteTask,
    onMutate: enableOptimisticUpdates ? async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', config.filter]);

      queryClient.setQueryData<Task[]>(['tasks', config.filter], (old = []) =>
        old.filter(task => task.id !== id)
      );

      return { previousTasks };
    } : undefined,
    onError: (error, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', config.filter], context.previousTasks);
      }
      toast.error('Failed to delete task');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
      toast.success('Task deleted successfully');
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: mockAPI.bulkUpdateTasks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
      toast.success('Tasks updated successfully');
    },
    onError: () => {
      toast.error('Failed to update tasks');
    },
  });

  const reorderTasksMutation = useMutation({
    mutationFn: mockAPI.reorderTasks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => {
      toast.error('Failed to reorder tasks');
    },
  });

  // Computed values
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];

    // Apply search filter
    if (config.filter.search) {
      const search = config.filter.search.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search) ||
        task.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    // Apply status filter
    if (config.filter.status?.length) {
      filtered = filtered.filter(task => config.filter.status!.includes(task.status));
    }

    // Apply priority filter
    if (config.filter.priority?.length) {
      filtered = filtered.filter(task => config.filter.priority!.includes(task.priority));
    }

    // Apply category filter
    if (config.filter.category?.length) {
      filtered = filtered.filter(task => 
        task.category && config.filter.category!.includes(task.category)
      );
    }

    // Apply tags filter
    if (config.filter.tags?.length) {
      filtered = filtered.filter(task =>
        config.filter.tags!.some(tag => task.tags.includes(tag))
      );
    }

    // Apply date range filter
    if (config.filter.dueDateRange?.start || config.filter.dueDateRange?.end) {
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        const start = config.filter.dueDateRange?.start;
        const end = config.filter.dueDateRange?.end;
        
        if (start && dueDate < start) return false;
        if (end && dueDate > end) return false;
        return true;
      });
    }

    // Apply archived filter
    if (!config.filter.showArchived) {
      filtered = filtered.filter(task => !task.archived);
    }

    // Sort tasks
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (config.sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'status':
          const statusOrder = { todo: 1, 'in-progress': 2, review: 3, blocked: 4, done: 5, cancelled: 6 };
          aValue = statusOrder[a.status];
          bValue = statusOrder[b.status];
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return config.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return config.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tasks, config]);

  // Actions
  const createTask = useCallback((data: TaskFormData) => {
    createTaskMutation.mutate(data);
  }, [createTaskMutation]);

  const updateTask = useCallback((id: string, data: Partial<TaskFormData>) => {
    updateTaskMutation.mutate({ id, data });
  }, [updateTaskMutation]);

  const deleteTask = useCallback((id: string) => {
    deleteTaskMutation.mutate(id);
  }, [deleteTaskMutation]);

  const duplicateTask = useCallback(async (id: string) => {
    try {
      const duplicated = await mockAPI.duplicateTask(id);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task duplicated successfully');
      return duplicated;
    } catch (error) {
      toast.error('Failed to duplicate task');
      throw error;
    }
  }, [queryClient]);

  const bulkUpdateTasks = useCallback((updates: { id: string; data: Partial<TaskFormData> }[]) => {
    bulkUpdateMutation.mutate(updates);
  }, [bulkUpdateMutation]);

  const reorderTasks = useCallback((taskIds: string[]) => {
    reorderTasksMutation.mutate(taskIds);
  }, [reorderTasksMutation]);

  const updateConfig = useCallback((newConfig: Partial<TaskListConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const updateFilter = useCallback((newFilter: Partial<TaskFilter>) => {
    setConfig(prev => ({
      ...prev,
      filter: { ...prev.filter, ...newFilter },
    }));
  }, []);

  const updateSort = useCallback((sortBy: TaskSortBy, sortOrder: TaskSortOrder) => {
    setConfig(prev => ({ ...prev, sortBy, sortOrder }));
  }, []);

  const updateViewMode = useCallback((viewMode: TaskViewMode) => {
    setConfig(prev => ({ ...prev, viewMode }));
  }, []);

  const clearFilters = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      filter: { showArchived: false },
    }));
  }, []);

  const getTaskById = useCallback((id: string) => {
    return tasks.find(task => task.id === id);
  }, [tasks]);

  const toggleTaskStatus = useCallback((id: string) => {
    const task = getTaskById(id);
    if (!task) return;

    const statusCycle: TaskStatus[] = ['todo', 'in-progress', 'done'];
    const currentIndex = statusCycle.indexOf(task.status);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

    updateTask(id, { 
      status: nextStatus,
      completedAt: nextStatus === 'done' ? new Date() : undefined,
    });
  }, [getTaskById, updateTask]);

  const archiveTask = useCallback((id: string) => {
    updateTask(id, { archived: true });
  }, [updateTask]);

  const unarchiveTask = useCallback((id: string) => {
    updateTask(id, { archived: false });
  }, [updateTask]);

  return {
    // Data
    tasks: filteredAndSortedTasks,
    allTasks: tasks,
    stats,
    config,
    
    // Loading states
    isLoading: isLoadingTasks || isLoadingStats,
    isLoadingTasks,
    isLoadingStats,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    isBulkUpdating: bulkUpdateMutation.isPending,
    isReordering: reorderTasksMutation.isPending,
    
    // Error states
    error: tasksError,
    
    // Actions
    createTask,
    updateTask,
    deleteTask,
    duplicateTask,
    bulkUpdateTasks,
    reorderTasks,
    
    // Configuration
    updateConfig,
    updateFilter,
    updateSort,
    updateViewMode,
    clearFilters,
    
    // Utilities
    getTaskById,
    toggleTaskStatus,
    archiveTask,
    unarchiveTask,
    refetch: refetchTasks,
  };
}