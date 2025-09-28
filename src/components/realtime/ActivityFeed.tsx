'use client';

import { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  Target,
  Calendar,
  User,
  MessageCircle,
  Zap,
  Clock,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollaboration } from '@/components/collaboration/CollaborationProvider';
import { formatDistanceToNow, format } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'task_created' | 'task_completed' | 'goal_updated' | 'habit_completed' | 'workspace_joined' | 'comment_added' | 'calendar_event_created';
  userId: string;
  userName: string;
  userAvatar?: string;
  description: string;
  entityId?: string;
  entityType?: 'task' | 'goal' | 'habit' | 'workspace' | 'event';
  entityTitle?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  className?: string;
  workspaceId: string;
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export function ActivityFeed({
  className,
  workspaceId,
  limit = 50,
  showHeader = true,
  compact = false
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useCollaboration();

  // Load initial activities
  useEffect(() => {
    loadActivities();
  }, [workspaceId]);

  // Listen for real-time activity updates
  useEffect(() => {
    if (!isConnected) return;

    const handleActivityCreated = (data: any) => {
      const activity: ActivityItem = {
        id: data.id || Math.random().toString(36).substr(2, 9),
        type: data.type,
        userId: data.userId,
        userName: data.userName || 'Unknown User',
        userAvatar: data.userAvatar,
        description: data.description,
        entityId: data.entityId,
        entityType: data.entityType,
        entityTitle: data.entityTitle,
        timestamp: data.timestamp || Date.now(),
        metadata: data.metadata,
      };

      setActivities(prev => [activity, ...prev.slice(0, limit - 1)]);
    };

    // In a real implementation, you'd listen to the collaboration context
    // For now, we'll simulate with a custom event listener
    const handleCustomActivity = (event: CustomEvent) => {
      handleActivityCreated(event.detail);
    };

    window.addEventListener('realtimeActivity', handleCustomActivity as EventListener);

    return () => {
      window.removeEventListener('realtimeActivity', handleCustomActivity as EventListener);
    };
  }, [isConnected, limit]);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from your API
      // For now, we'll use mock data
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'task_completed',
          userId: 'user1',
          userName: 'John Doe',
          userAvatar: undefined,
          description: 'completed the task',
          entityId: 'task1',
          entityType: 'task',
          entityTitle: 'Review quarterly reports',
          timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes ago
        },
        {
          id: '2',
          type: 'goal_updated',
          userId: 'user2',
          userName: 'Jane Smith',
          userAvatar: undefined,
          description: 'updated progress on',
          entityId: 'goal1',
          entityType: 'goal',
          entityTitle: 'Complete certification course',
          timestamp: Date.now() - 15 * 60 * 1000, // 15 minutes ago
          metadata: { progress: 75 },
        },
        {
          id: '3',
          type: 'habit_completed',
          userId: 'user1',
          userName: 'John Doe',
          userAvatar: undefined,
          description: 'completed daily habit',
          entityId: 'habit1',
          entityType: 'habit',
          entityTitle: 'Morning meditation',
          timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        },
      ];

      setActivities(mockActivities);
    } catch (error) {
      // TODO: Replace with proper logging - console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'task_created':
      case 'task_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'goal_updated':
        return <Target className="h-4 w-4 text-blue-500" />;
      case 'habit_completed':
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
      case 'calendar_event_created':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'workspace_joined':
        return <User className="h-4 w-4 text-indigo-500" />;
      case 'comment_added':
        return <MessageCircle className="h-4 w-4 text-pink-500" />;
      default:
        return <Zap className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'task_created':
      case 'task_completed':
        return 'border-l-green-500';
      case 'goal_updated':
        return 'border-l-blue-500';
      case 'habit_completed':
        return 'border-l-purple-500';
      case 'calendar_event_created':
        return 'border-l-orange-500';
      case 'workspace_joined':
        return 'border-l-indigo-500';
      case 'comment_added':
        return 'border-l-pink-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatActivityDescription = (activity: ActivityItem) => {
    const parts = [
      activity.description,
      activity.entityTitle && (
        <span key="entity" className="font-medium text-foreground">
          "{activity.entityTitle}"
        </span>
      ),
      activity.metadata?.progress && (
        <Badge key="progress" variant="secondary" className="ml-2">
          {activity.metadata.progress}%
        </Badge>
      )
    ].filter(Boolean);

    return parts;
  };

  if (loading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Activity Feed
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Activity Feed
              {!isConnected && (
                <Badge variant="outline" className="ml-2">
                  Offline
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadActivities}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={cn('p-0', showHeader && 'pt-0')}>
        <ScrollArea className="h-96">
          <div className="p-4 space-y-1">
            {activities.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs">Activity will appear here as team members work</p>
              </div>
            ) : (
              activities.map((activity, index) => (
                <div key={activity.id}>
                  <div className={cn(
                    'flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border-l-2',
                    getActivityColor(activity.type),
                    compact && 'p-2 gap-2'
                  )}>
                    <div className="flex-shrink-0">
                      <Avatar className={cn('h-8 w-8', compact && 'h-6 w-6')}>
                        <AvatarImage src={activity.userAvatar} alt={activity.userName} />
                        <AvatarFallback className="text-xs">
                          {activity.userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        {getActivityIcon(activity.type)}
                        <div className={cn('text-sm', compact && 'text-xs')}>
                          <span className="font-medium">{activity.userName}</span>
                          <span className="text-muted-foreground ml-1">
                            {formatActivityDescription(activity)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </span>
                        <span className="text-xs opacity-70">
                          {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {index < activities.length - 1 && (
                    <Separator className="ml-11 mr-3" />
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}