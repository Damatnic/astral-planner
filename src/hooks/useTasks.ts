'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { Block, NewBlock } from '@/db/schema';
import { toast } from 'sonner';

interface UseTasksOptions {
  workspaceId?: string;
  status?: string;
  priority?: string;
}

export function useTasks(options: UseTasksOptions = {}) {
  const queryClient = useQueryClient();
  const { workspaceId = 'default' } = options;

  // Fetch tasks
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', workspaceId, options],
    queryFn: async () => {
      const params = new URLSearchParams({
        workspaceId,
        ...(options.status && { status: options.status }),
        ...(options.priority && { priority: options.priority })
      });

      const response = await fetch(`/api/tasks?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    }
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: Partial<NewBlock>) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, workspaceId })
      });
      if (!response.ok) throw new Error('Failed to create task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create task');
      console.error(error);
    }
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Block> }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update task');
      console.error(error);
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete task');
      console.error(error);
    }
  });

  // Reorder tasks mutation
  const reorderTasksMutation = useMutation({
    mutationFn: async (tasks: Block[]) => {
      const response = await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks })
      });
      if (!response.ok) throw new Error('Failed to reorder tasks');
      return response.json();
    },
    onMutate: async (newTasks) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks', workspaceId, options]);
      queryClient.setQueryData(['tasks', workspaceId, options], newTasks);
      return { previousTasks };
    },
    onError: (err, newTasks, context) => {
      queryClient.setQueryData(['tasks', workspaceId, options], context?.previousTasks);
      toast.error('Failed to reorder tasks');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  // Bulk update tasks mutation
  const bulkUpdateTasksMutation = useMutation({
    mutationFn: async (updates: { id: string; data: Partial<Block> }[]) => {
      const response = await fetch('/api/tasks/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
      if (!response.ok) throw new Error('Failed to update tasks');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tasks updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update tasks');
      console.error(error);
    }
  });

  // Utility functions
  const createTask = useCallback(
    (data: Partial<NewBlock>) => createTaskMutation.mutate(data),
    [createTaskMutation]
  );

  const updateTask = useCallback(
    (id: string, data: Partial<Block>) => updateTaskMutation.mutate({ id, data }),
    [updateTaskMutation]
  );

  const deleteTask = useCallback(
    (id: string) => deleteTaskMutation.mutate(id),
    [deleteTaskMutation]
  );

  const reorderTasks = useCallback(
    (tasks: Block[]) => reorderTasksMutation.mutate(tasks),
    [reorderTasksMutation]
  );

  const bulkUpdateTasks = useCallback(
    (updates: { id: string; data: Partial<Block> }[]) => bulkUpdateTasksMutation.mutate(updates),
    [bulkUpdateTasksMutation]
  );

  const toggleTaskComplete = useCallback(
    (task: Block) => {
      const newStatus = task.status === 'completed' ? 'todo' : 'completed';
      updateTask(task.id, { 
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date() : null
      });
    },
    [updateTask]
  );

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    bulkUpdateTasks,
    toggleTaskComplete,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
    isReordering: reorderTasksMutation.isPending
  };
}