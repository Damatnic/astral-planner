'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import {
  CheckSquare,
  Square,
  Clock,
  Calendar,
  Flag,
  User,
  Tag,
  MoreVertical,
  GripVertical,
  Edit3,
  Trash2,
  Copy,
  Archive,
  Link,
  Play,
  Pause,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow, format, isAfter, isBefore, startOfDay } from 'date-fns';
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
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Task, TaskDragItem } from './types';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onUpdate?: (updates: Partial<Task>) => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
  variant?: 'default' | 'compact' | 'timeline';
  enableDrag?: boolean;
  enableSelection?: boolean;
  className?: string;
}

export function TaskItem({
  task,
  isSelected = false,
  onSelect,
  onUpdate,
  onDelete,
  onEdit,
  onDuplicate,
  isUpdating = false,
  isDeleting = false,
  variant = 'default',
  enableDrag = true,
  enableSelection = true,
  className = '',
}: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Drag and Drop
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'task',
    item: (): TaskDragItem => ({ id: task.id, type: 'task', task }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: enableDrag && !isUpdating && !isDeleting,
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'task',
    drop: (item: TaskDragItem) => {
      if (item.id !== task.id) {
        // Handle reordering logic here
        return { targetId: task.id, position: 'after' };
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Combine drag and drop refs
  if (enableDrag) {
    drag(dragRef);
    drop(dropRef);
    preview(dropRef);
  }

  // Task status handlers
  const handleStatusToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const updates: Partial<Task> = {
      status: newStatus,
      completedAt: newStatus === 'done' ? new Date() : undefined,
    };
    onUpdate?.(updates);
  }, [task.status, onUpdate]);

  const handleSelection = useCallback((checked: boolean) => {
    onSelect?.(checked);
  }, [onSelect]);

  const handlePriorityChange = useCallback((priority: Task['priority']) => {
    onUpdate?.({ priority });
  }, [onUpdate]);

  const handleStatusChange = useCallback((status: Task['status']) => {
    onUpdate?.({ 
      status,
      completedAt: status === 'done' ? new Date() : undefined,
    });
  }, [onUpdate]);

  // Time calculations
  const isOverdue = task.dueDate && isAfter(new Date(), new Date(task.dueDate)) && task.status !== 'done';
  const isDueToday = task.dueDate && 
    format(new Date(task.dueDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isDueSoon = task.dueDate && 
    isAfter(new Date(task.dueDate), new Date()) && 
    isBefore(new Date(task.dueDate), new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));

  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  const totalSubtasks = task.subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const getPriorityIcon = (priority: Task['priority']) => {
    const baseClasses = "h-3 w-3";
    switch (priority) {
      case 'urgent': return <Flag className={cn(baseClasses, "text-red-500")} />;
      case 'high': return <Flag className={cn(baseClasses, "text-orange-500")} />;
      case 'medium': return <Flag className={cn(baseClasses, "text-blue-500")} />;
      case 'low': return <Flag className={cn(baseClasses, "text-gray-400")} />;
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    const baseClasses = "h-4 w-4";
    switch (status) {
      case 'todo': return <Square className={baseClasses} />;
      case 'in-progress': return <Play className={cn(baseClasses, "text-blue-500")} />;
      case 'blocked': return <AlertCircle className={cn(baseClasses, "text-red-500")} />;
      case 'review': return <Pause className={cn(baseClasses, "text-yellow-500")} />;
      case 'done': return <CheckSquare className={cn(baseClasses, "text-green-500")} />;
      case 'cancelled': return <Square className={cn(baseClasses, "text-gray-400")} />;
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'blocked': return 'bg-red-100 text-red-700 border-red-300';
      case 'review': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'done': return 'bg-green-100 text-green-700 border-green-300';
      case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const formatDueDate = (date: Date) => {
    const now = new Date();
    const dueDate = new Date(date);
    
    if (isOverdue) {
      return `Overdue by ${formatDistanceToNow(dueDate)}`;
    } else if (isDueToday) {
      return 'Due today';
    } else if (isDueSoon) {
      return `Due ${formatDistanceToNow(dueDate, { addSuffix: true })}`;
    } else {
      return format(dueDate, 'MMM d, yyyy');
    }
  };

  const baseClasses = cn(
    'group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-200',
    'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600',
    isSelected && 'ring-2 ring-blue-500 border-blue-300',
    isDragging && 'opacity-50 transform rotate-2',
    isOver && canDrop && 'ring-2 ring-green-500',
    isOverdue && 'border-red-300 bg-red-50 dark:bg-red-900/10',
    task.status === 'done' && 'opacity-60',
    className
  );

  const renderCompactView = () => (
    <div
      ref={dropRef}
      className={cn(baseClasses, 'p-3')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        {enableDrag && isHovered && (
          <div ref={dragRef} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        )}

        {/* Selection Checkbox */}
        {enableSelection && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleSelection}
            className="mt-0.5"
          />
        )}

        {/* Status Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStatusToggle}
          className="p-0 h-auto hover:bg-transparent"
          disabled={isUpdating}
        >
          {getStatusIcon(task.status)}
        </Button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "font-medium text-sm text-gray-900 dark:text-gray-100 truncate",
                task.status === 'done' && "line-through text-gray-500"
              )}>
                {task.title}
              </h4>
              
              {/* Metadata */}
              <div className="flex items-center gap-2 mt-1">
                {task.priority !== 'medium' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        {getPriorityIcon(task.priority)}
                      </TooltipTrigger>
                      <TooltipContent>
                        {task.priority} priority
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {task.dueDate && (
                  <span className={cn(
                    "text-xs flex items-center gap-1",
                    isOverdue ? "text-red-600 dark:text-red-400" :
                    isDueToday ? "text-orange-600 dark:text-orange-400" :
                    isDueSoon ? "text-yellow-600 dark:text-yellow-400" :
                    "text-gray-500 dark:text-gray-400"
                  )}>
                    <Calendar className="h-3 w-3" />
                    {formatDueDate(task.dueDate)}
                  </span>
                )}

                {task.estimatedDuration && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.round(task.estimatedDuration / 60)}h
                  </span>
                )}

                {totalSubtasks > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {completedSubtasks}/{totalSubtasks}
                  </Badge>
                )}
              </div>

              {/* Tags */}
              {task.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {task.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {task.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{task.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                
                {/* Status submenu */}
                <DropdownMenuItem onClick={() => handleStatusChange('todo')}>
                  Mark as To Do
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('in-progress')}>
                  Mark as In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('done')}>
                  Mark as Done
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Priority submenu */}
                <DropdownMenuItem onClick={() => handlePriorityChange('high')}>
                  Set High Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePriorityChange('medium')}>
                  Set Medium Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePriorityChange('low')}>
                  Set Low Priority
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDefaultView = () => (
    <div
      ref={dropRef}
      className={cn(baseClasses, 'p-4')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        {enableDrag && isHovered && (
          <div ref={dragRef} className="cursor-grab active:cursor-grabbing mt-1">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        )}

        {/* Selection Checkbox */}
        {enableSelection && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleSelection}
            className="mt-1"
          />
        )}

        {/* Status Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStatusToggle}
          className="p-0 h-auto hover:bg-transparent mt-0.5"
          disabled={isUpdating}
        >
          {getStatusIcon(task.status)}
        </Button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  "font-semibold text-gray-900 dark:text-gray-100",
                  task.status === 'done' && "line-through text-gray-500"
                )}>
                  {task.title}
                </h3>
                
                <Badge className={cn("text-xs", getStatusColor(task.status))}>
                  {task.status.replace('-', ' ')}
                </Badge>

                {task.priority !== 'medium' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        {getPriorityIcon(task.priority)}
                      </TooltipTrigger>
                      <TooltipContent>
                        {task.priority} priority
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {task.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Metadata Row */}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                {task.dueDate && (
                  <div className={cn(
                    "flex items-center gap-1",
                    isOverdue ? "text-red-600 dark:text-red-400" :
                    isDueToday ? "text-orange-600 dark:text-orange-400" :
                    isDueSoon ? "text-yellow-600 dark:text-yellow-400" : ""
                  )}>
                    <Calendar className="h-4 w-4" />
                    <span>{formatDueDate(task.dueDate)}</span>
                  </div>
                )}

                {task.estimatedDuration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{Math.round(task.estimatedDuration / 60)}h estimated</span>
                  </div>
                )}

                {task.assignedTo && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{task.assignedTo}</span>
                  </div>
                )}

                {task.category && (
                  <Badge variant="outline" className="text-xs">
                    {task.category}
                  </Badge>
                )}
              </div>

              {/* Tags */}
              {task.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <Tag className="h-3 w-3 text-gray-400" />
                  {task.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Subtasks */}
              {totalSubtasks > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-0 h-auto text-xs text-gray-600 dark:text-gray-400"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 mr-1" />
                      ) : (
                        <ChevronRight className="h-3 w-3 mr-1" />
                      )}
                      {completedSubtasks}/{totalSubtasks} subtasks
                    </Button>
                    <Progress value={subtaskProgress} className="w-20 h-1" />
                  </div>

                  {isExpanded && (
                    <div className="space-y-1 ml-4">
                      {task.subtasks.map(subtask => (
                        <div key={subtask.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={subtask.completed}
                            onCheckedChange={(checked) => {
                              const updatedSubtasks = task.subtasks.map(st =>
                                st.id === subtask.id ? { ...st, completed: !!checked } : st
                              );
                              onUpdate?.({ subtasks: updatedSubtasks });
                            }}
                            className="h-3 w-3"
                          />
                          <span className={cn(
                            "text-xs text-gray-600 dark:text-gray-400",
                            subtask.completed && "line-through"
                          )}>
                            {subtask.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link className="h-4 w-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Status submenu */}
                <DropdownMenuItem onClick={() => handleStatusChange('todo')}>
                  Mark as To Do
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('in-progress')}>
                  Mark as In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('review')}>
                  Mark as Review
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('blocked')}>
                  Mark as Blocked
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('done')}>
                  Mark as Done
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Priority submenu */}
                <DropdownMenuItem onClick={() => handlePriorityChange('urgent')}>
                  Set Urgent Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePriorityChange('high')}>
                  Set High Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePriorityChange('medium')}>
                  Set Medium Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePriorityChange('low')}>
                  Set Low Priority
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Loading States */}
      {(isUpdating || isDeleting) && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {isUpdating ? 'Updating...' : 'Deleting...'}
          </div>
        </div>
      )}
    </div>
  );

  const renderTimelineView = () => (
    <div className={cn(baseClasses, 'p-3')}>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStatusToggle}
          className="p-0 h-auto hover:bg-transparent"
          disabled={isUpdating}
        >
          {getStatusIcon(task.status)}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={cn(
              "font-medium text-sm text-gray-900 dark:text-gray-100",
              task.status === 'done' && "line-through text-gray-500"
            )}>
              {task.title}
            </h4>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {format(task.createdAt, 'MMM d')}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Badge className={cn("text-xs", getStatusColor(task.status))}>
              {task.status.replace('-', ' ')}
            </Badge>
            
            {task.dueDate && (
              <span className={cn(
                "text-xs",
                isOverdue ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
              )}>
                Due: {format(task.dueDate, 'MMM d')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (variant === 'compact') return renderCompactView();
  if (variant === 'timeline') return renderTimelineView();
  return renderDefaultView();
}