'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  Calendar,
  User,
  Tag,
  Flag,
  CheckSquare,
  Folder,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { TaskFilter, TaskStatus, TaskPriority } from './types';
import { cn } from '@/lib/utils';

interface TaskFiltersProps {
  filter: TaskFilter;
  onFilterChange: (filter: Partial<TaskFilter>) => void;
  onClose?: () => void;
  availableCategories?: string[];
  availableTags?: string[];
  availableAssignees?: string[];
  className?: string;
}

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-700' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-100 text-red-700' },
  { value: 'review', label: 'Review', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'done', label: 'Done', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-500' },
];

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-600' },
];

const dateRangePresets = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'thisWeek' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'No Due Date', value: 'noDueDate' },
  { label: 'Custom Range', value: 'custom' },
];

export function TaskFilters({
  filter,
  onFilterChange,
  onClose,
  availableCategories = [],
  availableTags = [],
  availableAssignees = [],
  className = '',
}: TaskFiltersProps) {
  const [searchInput, setSearchInput] = useState(filter.search || '');
  const [tagInput, setTagInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [assigneeInput, setAssigneeInput] = useState('');
  const [dateRangePreset, setDateRangePreset] = useState<string>('');
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);

  // Handle search input with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    // Debounced search update
    const timeoutId = setTimeout(() => {
      onFilterChange({ search: value || undefined });
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [onFilterChange]);

  // Status filter handlers
  const handleStatusToggle = useCallback((status: TaskStatus, checked: boolean) => {
    const currentStatuses = filter.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status);
    
    onFilterChange({ 
      status: newStatuses.length > 0 ? newStatuses : undefined 
    });
  }, [filter.status, onFilterChange]);

  const handleAllStatusesToggle = useCallback((checked: boolean) => {
    onFilterChange({ 
      status: checked ? statusOptions.map(s => s.value) : undefined 
    });
  }, [onFilterChange]);

  // Priority filter handlers
  const handlePriorityToggle = useCallback((priority: TaskPriority, checked: boolean) => {
    const currentPriorities = filter.priority || [];
    const newPriorities = checked
      ? [...currentPriorities, priority]
      : currentPriorities.filter(p => p !== priority);
    
    onFilterChange({ 
      priority: newPriorities.length > 0 ? newPriorities : undefined 
    });
  }, [filter.priority, onFilterChange]);

  // Category filter handlers
  const handleCategoryAdd = useCallback((category: string) => {
    const trimmedCategory = category.trim();
    if (!trimmedCategory) return;
    
    const currentCategories = filter.category || [];
    if (!currentCategories.includes(trimmedCategory)) {
      onFilterChange({ 
        category: [...currentCategories, trimmedCategory] 
      });
    }
    setCategoryInput('');
  }, [filter.category, onFilterChange]);

  const handleCategoryRemove = useCallback((category: string) => {
    const currentCategories = filter.category || [];
    const newCategories = currentCategories.filter(c => c !== category);
    onFilterChange({ 
      category: newCategories.length > 0 ? newCategories : undefined 
    });
  }, [filter.category, onFilterChange]);

  // Tag filter handlers
  const handleTagAdd = useCallback((tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (!trimmedTag) return;
    
    const currentTags = filter.tags || [];
    if (!currentTags.includes(trimmedTag)) {
      onFilterChange({ 
        tags: [...currentTags, trimmedTag] 
      });
    }
    setTagInput('');
  }, [filter.tags, onFilterChange]);

  const handleTagRemove = useCallback((tag: string) => {
    const currentTags = filter.tags || [];
    const newTags = currentTags.filter(t => t !== tag);
    onFilterChange({ 
      tags: newTags.length > 0 ? newTags : undefined 
    });
  }, [filter.tags, onFilterChange]);

  // Assignee filter handlers
  const handleAssigneeAdd = useCallback((assignee: string) => {
    const trimmedAssignee = assignee.trim();
    if (!trimmedAssignee) return;
    
    const currentAssignees = filter.assignedTo || [];
    if (!currentAssignees.includes(trimmedAssignee)) {
      onFilterChange({ 
        assignedTo: [...currentAssignees, trimmedAssignee] 
      });
    }
    setAssigneeInput('');
  }, [filter.assignedTo, onFilterChange]);

  const handleAssigneeRemove = useCallback((assignee: string) => {
    const currentAssignees = filter.assignedTo || [];
    const newAssignees = currentAssignees.filter(a => a !== assignee);
    onFilterChange({ 
      assignedTo: newAssignees.length > 0 ? newAssignees : undefined 
    });
  }, [filter.assignedTo, onFilterChange]);

  // Date range handlers
  const handleDateRangePresetChange = useCallback((preset: string) => {
    setDateRangePreset(preset);
    const today = new Date();
    
    switch (preset) {
      case 'today':
        onFilterChange({
          dueDateRange: {
            start: new Date(today.setHours(0, 0, 0, 0)),
            end: new Date(today.setHours(23, 59, 59, 999)),
          },
        });
        setIsCustomDateRange(false);
        break;
      case 'thisWeek':
        onFilterChange({
          dueDateRange: {
            start: startOfWeek(today),
            end: endOfWeek(today),
          },
        });
        setIsCustomDateRange(false);
        break;
      case 'thisMonth':
        onFilterChange({
          dueDateRange: {
            start: startOfMonth(today),
            end: endOfMonth(today),
          },
        });
        setIsCustomDateRange(false);
        break;
      case 'overdue':
        onFilterChange({
          dueDateRange: {
            end: new Date(today.getTime() - 1),
          },
        });
        setIsCustomDateRange(false);
        break;
      case 'noDueDate':
        onFilterChange({
          dueDateRange: undefined,
        });
        setIsCustomDateRange(false);
        break;
      case 'custom':
        setIsCustomDateRange(true);
        break;
      default:
        onFilterChange({ dueDateRange: undefined });
        setIsCustomDateRange(false);
    }
  }, [onFilterChange]);

  const handleCustomDateChange = useCallback((type: 'start' | 'end', date: Date | undefined) => {
    const currentRange = filter.dueDateRange || {};
    onFilterChange({
      dueDateRange: {
        ...currentRange,
        [type]: date,
      },
    });
  }, [filter.dueDateRange, onFilterChange]);

  // Clear all filters
  const handleClearAll = useCallback(() => {
    onFilterChange({
      status: undefined,
      priority: undefined,
      category: undefined,
      tags: undefined,
      assignedTo: undefined,
      dueDateRange: undefined,
      search: undefined,
      showArchived: false,
    });
    setSearchInput('');
    setTagInput('');
    setCategoryInput('');
    setAssigneeInput('');
    setDateRangePreset('');
    setIsCustomDateRange(false);
  }, [onFilterChange]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter.search) count++;
    if (filter.status?.length) count++;
    if (filter.priority?.length) count++;
    if (filter.category?.length) count++;
    if (filter.tags?.length) count++;
    if (filter.assignedTo?.length) count++;
    if (filter.dueDateRange?.start || filter.dueDateRange?.end) count++;
    if (filter.showArchived) count++;
    return count;
  }, [filter]);

  const allStatusesSelected = statusOptions.length === (filter.status?.length || 0);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} active</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={activeFilterCount === 0}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear All
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Filter tasks to find exactly what you're looking for
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </Label>
          <Input
            placeholder="Search in title, description, and tags..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Status
            </Label>
            <Checkbox
              checked={allStatusesSelected}
              onCheckedChange={handleAllStatusesToggle}
              className="h-4 w-4"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {statusOptions.map(status => (
              <div key={status.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status.value}`}
                  checked={filter.status?.includes(status.value) || false}
                  onCheckedChange={(checked) => 
                    handleStatusToggle(status.value, !!checked)
                  }
                />
                <Label
                  htmlFor={`status-${status.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  <Badge className={cn('text-xs', status.color)}>
                    {status.label}
                  </Badge>
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Priority */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Priority
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {priorityOptions.map(priority => (
              <div key={priority.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`priority-${priority.value}`}
                  checked={filter.priority?.includes(priority.value) || false}
                  onCheckedChange={(checked) => 
                    handlePriorityToggle(priority.value, !!checked)
                  }
                />
                <Label
                  htmlFor={`priority-${priority.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  <Badge className={cn('text-xs', priority.color)}>
                    {priority.label}
                  </Badge>
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Due Date */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Due Date
          </Label>
          <Select value={dateRangePreset} onValueChange={handleDateRangePresetChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              {dateRangePresets.map(preset => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isCustomDateRange && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      {filter.dueDateRange?.start ? (
                        format(filter.dueDateRange.start, 'MMM d, yyyy')
                      ) : (
                        'Start date'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filter.dueDateRange?.start}
                      onSelect={(date) => handleCustomDateChange('start', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      {filter.dueDateRange?.end ? (
                        format(filter.dueDateRange.end, 'MMM d, yyyy')
                      ) : (
                        'End date'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filter.dueDateRange?.end}
                      onSelect={(date) => handleCustomDateChange('end', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Active date range display */}
          {filter.dueDateRange && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filter.dueDateRange.start && filter.dueDateRange.end ? (
                <>Range: {format(filter.dueDateRange.start, 'MMM d')} - {format(filter.dueDateRange.end, 'MMM d, yyyy')}</>
              ) : filter.dueDateRange.start ? (
                <>After: {format(filter.dueDateRange.start, 'MMM d, yyyy')}</>
              ) : filter.dueDateRange.end ? (
                <>Before: {format(filter.dueDateRange.end, 'MMM d, yyyy')}</>
              ) : null}
            </div>
          )}
        </div>

        <Separator />

        {/* Categories */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Categories
          </Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Add category..."
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCategoryAdd(categoryInput);
                  }
                }}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => handleCategoryAdd(categoryInput)}
                disabled={!categoryInput.trim()}
              >
                Add
              </Button>
            </div>
            
            {/* Available categories */}
            {availableCategories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {availableCategories
                  .filter(cat => !filter.category?.includes(cat))
                  .map(category => (
                    <Button
                      key={category}
                      variant="outline"
                      size="sm"
                      onClick={() => handleCategoryAdd(category)}
                      className="h-7 text-xs"
                    >
                      {category}
                    </Button>
                  ))}
              </div>
            )}
            
            {/* Selected categories */}
            {filter.category && filter.category.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filter.category.map(category => (
                  <Badge
                    key={category}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900"
                    onClick={() => handleCategoryRemove(category)}
                  >
                    {category}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Tags */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags
          </Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTagAdd(tagInput);
                  }
                }}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => handleTagAdd(tagInput)}
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </div>
            
            {/* Available tags */}
            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {availableTags
                  .filter(tag => !filter.tags?.includes(tag))
                  .slice(0, 10)
                  .map(tag => (
                    <Button
                      key={tag}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTagAdd(tag)}
                      className="h-7 text-xs"
                    >
                      {tag}
                    </Button>
                  ))}
              </div>
            )}
            
            {/* Selected tags */}
            {filter.tags && filter.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filter.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900"
                    onClick={() => handleTagRemove(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Assignees */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Assigned To
          </Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Add assignee..."
                value={assigneeInput}
                onChange={(e) => setAssigneeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAssigneeAdd(assigneeInput);
                  }
                }}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => handleAssigneeAdd(assigneeInput)}
                disabled={!assigneeInput.trim()}
              >
                Add
              </Button>
            </div>
            
            {/* Available assignees */}
            {availableAssignees.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {availableAssignees
                  .filter(assignee => !filter.assignedTo?.includes(assignee))
                  .map(assignee => (
                    <Button
                      key={assignee}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssigneeAdd(assignee)}
                      className="h-7 text-xs"
                    >
                      {assignee}
                    </Button>
                  ))}
              </div>
            )}
            
            {/* Selected assignees */}
            {filter.assignedTo && filter.assignedTo.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filter.assignedTo.map(assignee => (
                  <Badge
                    key={assignee}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100 dark:hover:bg-red-900"
                    onClick={() => handleAssigneeRemove(assignee)}
                  >
                    {assignee}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Other Options */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Other Options
          </Label>
          <div className="flex items-center justify-between">
            <Label htmlFor="show-archived" className="text-sm font-normal">
              Show Archived Tasks
            </Label>
            <Switch
              id="show-archived"
              checked={filter.showArchived || false}
              onCheckedChange={(checked) => 
                onFilterChange({ showArchived: checked })
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}