'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  Check,
  Calendar,
  Target,
  Users,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Trash2,
  Settings,
  Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface Notification {
  id: string;
  type: 'task' | 'goal' | 'reminder' | 'collaboration' | 'achievement' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isArchived: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionLabel?: string;
  icon?: any;
  metadata?: any;
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'task',
    title: 'Task Due Soon',
    message: 'Complete project proposal is due in 2 hours',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    isRead: false,
    isArchived: false,
    priority: 'high',
    actionUrl: '/tasks/1',
    actionLabel: 'View Task',
    icon: Clock
  },
  {
    id: '2',
    type: 'achievement',
    title: 'Streak Achievement!',
    message: 'You have maintained a 7-day productivity streak',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isRead: false,
    isArchived: false,
    priority: 'medium',
    icon: TrendingUp
  },
  {
    id: '3',
    type: 'collaboration',
    title: 'New Team Member',
    message: 'Sarah joined your Marketing workspace',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    isRead: true,
    isArchived: false,
    priority: 'low',
    icon: Users
  },
  {
    id: '4',
    type: 'goal',
    title: 'Weekly Goal Progress',
    message: 'You have completed 80% of your weekly goals',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    isRead: true,
    isArchived: false,
    priority: 'medium',
    actionUrl: '/goals',
    actionLabel: 'View Goals',
    icon: Target
  },
  {
    id: '5',
    type: 'system',
    title: 'System Update',
    message: 'New features available: Voice input and advanced analytics',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    isRead: true,
    isArchived: false,
    priority: 'low',
    icon: Info
  }
];

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const { toast } = useToast();

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;

  // Filter notifications based on current filter
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead && !n.isArchived;
    if (filter === 'archived') return n.isArchived;
    return !n.isArchived;
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = notification.timestamp.toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
    toast({
      title: "All notifications marked as read"
    });
  };

  const archiveNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isArchived: true } : n)
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast({
      title: "Notification deleted"
    });
  };

  const clearAll = () => {
    setNotifications([]);
    toast({
      title: "All notifications cleared"
    });
  };

  const getNotificationIcon = (notification: Notification) => {
    const Icon = notification.icon || Bell;
    const colors = {
      task: 'text-blue-500',
      goal: 'text-green-500',
      reminder: 'text-yellow-500',
      collaboration: 'text-purple-500',
      achievement: 'text-orange-500',
      system: 'text-gray-500'
    };
    return <Icon className={`h-5 w-5 ${colors[notification.type]}`} />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <>
      {/* Notification Button */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-96">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList className="w-full rounded-none">
              <TabsTrigger value="all" className="flex-1">
                All
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex-1">
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex-1">
                Archived
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="m-0">
              <ScrollArea className="h-[400px]">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
                      <div key={date}>
                        <div className="px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                          {date === new Date().toDateString() ? 'Today' :
                           date === new Date(Date.now() - 86400000).toDateString() ? 'Yesterday' :
                           date}
                        </div>
                        {dateNotifications.map((notification) => (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={`p-4 hover:bg-muted/50 cursor-pointer ${
                              !notification.isRead ? 'bg-primary/5' : ''
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex gap-3">
                              <div className="mt-1">
                                {getNotificationIcon(notification)}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-start justify-between">
                                  <p className="font-medium text-sm">
                                    {notification.title}
                                  </p>
                                  <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                                    {notification.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between pt-2">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(notification.timestamp)} ago
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {notification.actionUrl && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs h-7"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // Navigate to action URL
                                        }}
                                      >
                                        {notification.actionLabel || 'View'}
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        archiveNotification(notification.id);
                                      }}
                                    >
                                      <Archive className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <DropdownMenuSeparator />
          
          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setIsOpen(false);
                // Navigate to settings
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Notification Settings
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Push Notifications (floating) */}
      <AnimatePresence>
        {/* This would show push notifications as they arrive */}
      </AnimatePresence>
    </>
  );
}