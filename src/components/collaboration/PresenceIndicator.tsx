'use client';

import React from 'react';
import { Users, Wifi, WifiOff, Activity } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useCollaboration } from './CollaborationProvider';

export function PresenceIndicator({ className }: { className?: string }) {
  const { isConnected, collaborators, onlineCount, connectionError } = useCollaboration();

  if (!isConnected && !connectionError) {
    return (
      <div className={cn("flex items-center space-x-2 text-muted-foreground", className)}>
        <Activity className="h-4 w-4 animate-pulse" />
        <span className="text-sm">Connecting...</span>
      </div>
    );
  }

  if (connectionError) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className={cn("flex items-center space-x-2 text-red-600", className)}>
              <WifiOff className="h-4 w-4" />
              <span className="text-sm">Offline</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Connection error: {connectionError}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("flex items-center space-x-2", className)}>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center space-x-1">
              <Wifi className="h-4 w-4 text-green-600" />
              <Badge variant="secondary" className="text-xs">
                {onlineCount}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{onlineCount} {onlineCount === 1 ? 'person' : 'people'} online</p>
          </TooltipContent>
        </Tooltip>
        
        {collaborators.length > 0 && (
          <div className="flex -space-x-2">
            {collaborators.slice(0, 3).map((user) => (
              <Tooltip key={user.id}>
                <TooltipTrigger>
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback 
                      className="text-xs text-white"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    {user.isTyping && (
                      <p className="text-xs text-green-600 mt-1">Currently typing...</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
            
            {collaborators.length > 3 && (
              <Tooltip>
                <TooltipTrigger>
                  <Avatar className="h-6 w-6 border-2 border-background bg-muted">
                    <AvatarFallback className="text-xs">
                      +{collaborators.length - 3}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <p className="font-medium">
                      {collaborators.length - 3} more {collaborators.length - 3 === 1 ? 'person' : 'people'}
                    </p>
                    <div className="mt-2 space-y-1">
                      {collaborators.slice(3).map((user) => (
                        <p key={user.id} className="text-xs">
                          {user.name}
                        </p>
                      ))}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export function CollaboratorList() {
  const { collaborators } = useCollaboration();

  if (collaborators.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-center">
        <div className="text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">No one else is currently online</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm text-muted-foreground mb-3">
        Online ({collaborators.length})
      </h3>
      {collaborators.map((user) => (
        <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback 
                className="text-white text-sm"
                style={{ backgroundColor: user.color }}
              >
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 border-2 border-background rounded-full" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user.name}</p>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              {user.isTyping && (
                <Badge variant="secondary" className="text-xs">
                  Typing...
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}