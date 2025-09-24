'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { MultiBackend, getBackendOptions } from '@minoru/react-dnd-treeview';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  RefreshCw,
  Download,
  Upload,
  Settings,
  BarChart3,
  Calendar,
  Grid3X3,
  List,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTasks } from './hooks/useTasks';
import { TaskList } from './TaskList';
import { TaskForm } from './TaskForm';
import { TaskFilters } from './TaskFilters';
import { Task, TaskViewMode, TaskFormData } from './types';

interface TaskManagerProps {
  className?: string;
  initialViewMode?: TaskViewMode;
  enableQuickActions?: boolean;
  enableBulkActions?: boolean;
  enableExport?: boolean;
  enableStats?: boolean;
  showHeader?: boolean;
  showFilters?: boolean;
  maxHeight?: string;
}

const backendOptions = getBackendOptions({
  html5: HTML5Backend,
  touch: TouchBackend,
});

export function TaskManager({
  className = '',
  initialViewMode = 'list',
  enableQuickActions = true,
  enableBulkActions = true,
  enableExport = true,
  enableStats = true,
  showHeader = true,
  showFilters = true,
  maxHeight = '100vh',
}: TaskManagerProps) {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    tasks,
    stats,
    config,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isBulkUpdating,
    error,
    createTask,
    updateTask,
    deleteTask,
    bulkUpdateTasks,
    reorderTasks,
    updateFilter,
    updateViewMode,
    clearFilters,
    refetch,
  } = useTasks({
    initialConfig: {
      viewMode: initialViewMode,
    },
    enableRealtime: true,
    enableOptimisticUpdates: true,
  });

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    updateFilter({ search: query || undefined });
  }, [updateFilter]);

  // Handle task creation
  const handleCreateTask = useCallback((data: TaskFormData) => {
    createTask(data);
    setIsCreateFormOpen(false);
  }, [createTask]);

  // Handle task selection
  const handleTaskSelect = useCallback((taskId: string, selected: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(taskId);
      } else {
        newSet.delete(taskId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map(task => task.id)));
    }
  }, [tasks, selectedTasks.size]);

  // Handle bulk actions
  const handleBulkDelete = useCallback(async () => {
    if (selectedTasks.size === 0) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedTasks.size} task(s)?`
    );
    
    if (confirmDelete) {
      for (const taskId of selectedTasks) {
        await deleteTask(taskId);
      }
      setSelectedTasks(new Set());
    }
  }, [selectedTasks, deleteTask]);

  const handleBulkStatusUpdate = useCallback((status: Task['status']) => {
    if (selectedTasks.size === 0) return;
    
    const updates = Array.from(selectedTasks).map(id => ({
      id,
      data: { status },
    }));
    
    bulkUpdateTasks(updates);
    setSelectedTasks(new Set());
  }, [selectedTasks, bulkUpdateTasks]);

  const handleBulkPriorityUpdate = useCallback((priority: Task['priority']) => {
    if (selectedTasks.size === 0) return;
    
    const updates = Array.from(selectedTasks).map(id => ({
      id,
      data: { priority },
    }));
    
    bulkUpdateTasks(updates);
    setSelectedTasks(new Set());
  }, [selectedTasks, bulkUpdateTasks]);

  // Handle export/import
  const handleExport = useCallback(() => {
    const tasksToExport = tasks.filter(task => 
      selectedTasks.size > 0 ? selectedTasks.has(task.id) : true
    );
    
    const dataStr = JSON.stringify(tasksToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [tasks, selectedTasks]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTasks = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedTasks)) {
          importedTasks.forEach((taskData: TaskFormData) => {
            createTask(taskData);
          });
        }
      } catch (error) {
        console.error('Failed to import tasks:', error);
        alert('Failed to import tasks. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  }, [createTask]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'n':
            event.preventDefault();
            setIsCreateFormOpen(true);
            break;
          case 'f':
            event.preventDefault();
            searchInputRef.current?.focus();
            break;
          case 'a':
            if (event.shiftKey) {
              event.preventDefault();
              handleSelectAll();
            }
            break;
          case 'r':
            event.preventDefault();
            refetch();
            break;
        }
      }
      
      if (event.key === 'Escape') {
        setSelectedTasks(new Set());
        setIsFiltersOpen(false);
        setIsCreateFormOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectAll, refetch]);

  const viewModeIcons = {
    list: List,
    board: Grid3X3,
    calendar: Calendar,
    timeline: Clock,
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (config.filter.status?.length) count++;
    if (config.filter.priority?.length) count++;
    if (config.filter.category?.length) count++;
    if (config.filter.tags?.length) count++;
    if (config.filter.assignedTo?.length) count++;
    if (config.filter.dueDateRange?.start || config.filter.dueDateRange?.end) count++;
    if (config.filter.search) count++;
    return count;
  }, [config.filter]);

  if (error) {
    return (
      <Alert className="m-4">
        <AlertDescription>
          Failed to load tasks. Please try again.
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            className="ml-2"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <DndProvider backend={MultiBackend} options={backendOptions}>
      <div 
        className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}
        style={{ maxHeight }}
      >
        {/* Header */}
        {showHeader && (
          <div className="flex flex-col gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
            {/* Top Row - Title and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Tasks
                </h1>
                {enableStats && stats && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {stats.completed}/{stats.total}
                    </Badge>
                    <Badge 
                      variant={stats.completionRate >= 80 ? 'default' : 'destructive'}
                    >
                      {Math.round(stats.completionRate)}%
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Selector */}
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                  {(Object.entries(viewModeIcons) as [TaskViewMode, any][]).map(([mode, Icon]) => (
                    <Button
                      key={mode}
                      variant={config.viewMode === mode ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => updateViewMode(mode)}
                      className="rounded-none first:rounded-l-lg last:rounded-r-lg"
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>

                {/* Quick Actions */}
                {enableQuickActions && (
                  <>
                    <Button
                      onClick={() => setIsCreateFormOpen(true)}
                      disabled={isCreating}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      New Task
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => refetch()}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </DropdownMenuItem>
                        {enableExport && (
                          <>
                            <DropdownMenuItem onClick={handleExport}>
                              <Download className="h-4 w-4 mr-2" />
                              Export Tasks
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <label className="cursor-pointer">
                                <Upload className="h-4 w-4 mr-2" />
                                Import Tasks
                                <input
                                  type="file"
                                  accept=".json"
                                  onChange={handleImport}
                                  className="hidden"
                                />
                              </label>
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={clearFilters}>
                          Clear Filters
                        </DropdownMenuItem>
                        {enableStats && (
                          <DropdownMenuItem>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Analytics
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search tasks... (Ctrl+F)"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {showFilters && (
                <Button
                  variant="outline"
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              )}

              {/* Bulk Actions */}
              {enableBulkActions && selectedTasks.size > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedTasks.size} selected
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Bulk Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate('todo')}>
                        Mark as To Do
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate('in-progress')}>
                        Mark as In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusUpdate('done')}>
                        Mark as Done
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleBulkPriorityUpdate('high')}>
                        Set High Priority
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkPriorityUpdate('medium')}>
                        Set Medium Priority
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkPriorityUpdate('low')}>
                        Set Low Priority
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleBulkDelete}
                        className="text-red-600 dark:text-red-400"
                      >
                        Delete Selected
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            {/* Filters Panel */}
            {showFilters && isFiltersOpen && (
              <TaskFilters
                filter={config.filter}
                onFilterChange={updateFilter}
                onClose={() => setIsFiltersOpen(false)}
              />
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              viewMode={config.viewMode}
              selectedTasks={selectedTasks}
              onTaskSelect={handleTaskSelect}
              onTaskUpdate={updateTask}
              onTaskDelete={deleteTask}
              onTaskReorder={reorderTasks}
              onSelectAll={handleSelectAll}
              isUpdating={isUpdating}
              isDeleting={isDeleting}
              enableBulkActions={enableBulkActions}
            />
          )}
        </div>

        {/* Create Task Form */}
        {isCreateFormOpen && (
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setIsCreateFormOpen(false)}
            isSubmitting={isCreating}
          />
        )}

        {/* Loading Overlay */}
        {(isBulkUpdating || isDeleting) && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>
                  {isBulkUpdating ? 'Updating tasks...' : 'Deleting tasks...'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}