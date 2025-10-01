'use client';

import React, { useEffect, useState } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useCollaboration } from './CollaborationProvider';

interface NotificationToastProps {
  className?: string;
  maxNotifications?: number;
}

export function RealtimeToast({ className, maxNotifications = 3 }: NotificationToastProps) {
  const { notifications, clearNotifications } = useCollaboration();
  const [visibleNotifications, setVisibleNotifications] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const recent = notifications
      .filter(n => !dismissed.has(n.id))
      .slice(0, maxNotifications);
    
    setVisibleNotifications(recent);
  }, [notifications, dismissed, maxNotifications]);

  const handleDismiss = (notificationId: string) => {
    setDismissed(prev => new Set(prev).add(notificationId));
  };

  const handleClearAll = () => {
    clearNotifications();
    setDismissed(new Set());
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className={cn("fixed top-4 right-4 z-50 space-y-2", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Bell className="h-4 w-4" />
          <span className="text-sm font-medium">Live Updates</span>
          <Badge variant="secondary">{visibleNotifications.length}</Badge>
        </div>
        {visibleNotifications.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-xs"
          >
            Clear All
          </Button>
        )}
      </div>
      
      {visibleNotifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onDismiss={() => handleDismiss(notification.id)}
        />
      ))}
    </div>
  );
}

interface NotificationCardProps {
  notification: any;
  onDismiss: () => void;
}

function NotificationCard({ notification, onDismiss }: NotificationCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-dismiss after 5 seconds for non-error notifications
    if (notification.type !== 'error') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [notification.type, onDismiss]);

  const getTypeStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-900';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-900';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-900';
      default:
        return 'border-blue-200 bg-blue-50 text-blue-900';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <Bell className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <Card
      className={cn(
        "w-80 transition-all duration-300 shadow-lg",
        getTypeStyles(),
        isVisible 
          ? "transform translate-x-0 opacity-100" 
          : "transform translate-x-full opacity-0"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {getIcon()}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{notification.title}</p>
              {notification.message && (
                <p className="text-sm opacity-90 mt-1">{notification.message}</p>
              )}
              <p className="text-xs opacity-70 mt-2">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-1 ml-2">
            {notification.actionUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  window.open(notification.actionUrl, '_blank');
                  onDismiss();
                }}
                className="text-xs h-auto p-1"
              >
                View
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300);
              }}
              className="h-auto p-1"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}