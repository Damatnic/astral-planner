'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Wifi, WifiOff, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollaboration } from '@/components/collaboration/CollaborationProvider';

interface PresenceIndicatorProps {
  className?: string;
  showCount?: boolean;
  maxAvatars?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PresenceIndicator({
  className,
  showCount = true,
  maxAvatars = 5,
  size = 'md',
}: PresenceIndicatorProps) {
  const { 
    isConnected, 
    connectionError,
    collaborators, 
    onlineCount 
  } = useCollaboration();
  
  const [showAll, setShowAll] = useState(false);

  const avatarSize = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-10 w-10'
  }[size];

  const displayCollaborators = showAll ? collaborators : collaborators.slice(0, maxAvatars);
  const hiddenCount = Math.max(0, collaborators.length - maxAvatars);

  if (!isConnected && !connectionError) {
    return null; // Don't show anything while connecting
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Connection Status */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isConnected ? 'Connected to real-time sync' : connectionError || 'Disconnected'}
        </TooltipContent>
      </Tooltip>

      {/* Collaborators */}
      {collaborators.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-auto p-1 hover:bg-muted/50">
              <div className="flex items-center gap-1">
                {/* Avatar Stack */}
                <div className="flex -space-x-2">
                  {displayCollaborators.map((collaborator) => (
                    <Tooltip key={collaborator.id}>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <Avatar className={cn(avatarSize, 'border-2 border-background')}>
                            <AvatarImage 
                              src={collaborator.avatar} 
                              alt={collaborator.name}
                            />
                            <AvatarFallback 
                              className="text-xs font-medium"
                              style={{ backgroundColor: collaborator.color }}
                            >
                              {collaborator.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          {/* Online indicator */}
                          <div className="absolute -bottom-0.5 -right-0.5">
                            <div className="h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                          </div>
                          
                          {/* Typing indicator */}
                          {collaborator.isTyping && (
                            <div className="absolute -top-1 -right-1">
                              <div className="animate-pulse">
                                <Circle className="h-2 w-2 fill-blue-500 text-blue-500" />
                              </div>
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <div className="font-medium">{collaborator.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {collaborator.email}
                          </div>
                          {collaborator.isTyping && (
                            <div className="text-xs text-blue-500">Currently typing...</div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Active {formatLastSeen(collaborator.lastSeen)} ago
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>

                {/* Hidden count indicator */}
                {hiddenCount > 0 && (
                  <div className={cn(
                    avatarSize,
                    'flex items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground'
                  )}>
                    +{hiddenCount}
                  </div>
                )}

                {/* Count badge */}
                {showCount && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {onlineCount}
                  </Badge>
                )}
              </div>
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-80 p-3" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Online Now ({onlineCount})</h4>
                <Badge 
                  variant={isConnected ? "default" : "destructive"} 
                  className="text-xs"
                >
                  {isConnected ? "Connected" : "Offline"}
                </Badge>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-auto">
                {collaborators.map((collaborator) => (
                  <div 
                    key={collaborator.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={collaborator.avatar} 
                          alt={collaborator.name}
                        />
                        <AvatarFallback 
                          className="text-xs"
                          style={{ backgroundColor: collaborator.color }}
                        >
                          {collaborator.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {collaborator.name}
                        </p>
                        {collaborator.isTyping && (
                          <div className="flex items-center gap-1 text-blue-500">
                            <div className="flex gap-1">
                              <div className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-xs">typing</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {collaborator.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Active {formatLastSeen(collaborator.lastSeen)} ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {collaborators.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No one else is online</p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

function formatLastSeen(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  
  return 'a while';
}