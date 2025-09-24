'use client'

import { Task } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Clock, Flag } from 'lucide-react'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onComplete?: (taskId: string) => void
}

export function TaskCard({ task, onEdit, onDelete, onComplete }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'in_progress':
        return 'secondary'
      case 'todo':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-medium">
            {task.title}
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant={getPriorityColor(task.priority || 'medium')}>
              <Flag className="w-3 h-3 mr-1" />
              {task.priority || 'medium'}
            </Badge>
            <Badge variant={getStatusColor(task.status || 'todo')}>
              {task.status || 'todo'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {task.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}
            {task.estimatedHours && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {task.estimatedHours}h
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {task.status !== 'completed' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onComplete?.(task.id)}
                aria-label="Mark as complete"
              >
                Complete
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit?.(task)}
              aria-label="Edit task"
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete?.(task.id)}
              aria-label="Delete task"
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}