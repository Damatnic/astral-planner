'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { CollaborationProvider } from './CollaborationProvider';
import { PresenceIndicator, CollaboratorList } from './PresenceIndicator';
import { RealtimeToast } from './RealtimeToast';
import { CursorOverlay, TypingIndicator } from './CursorOverlay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface CollaborativeWorkspaceProps {
  workspaceId: string;
  children: ReactNode;
  showPresenceInHeader?: boolean;
  showCollaboratorSidebar?: boolean;
  showRealtimeToasts?: boolean;
  showCursors?: boolean;
  enableTypingIndicators?: boolean;
}

export function CollaborativeWorkspace({
  workspaceId,
  children,
  showPresenceInHeader = true,
  showCollaboratorSidebar = true,
  showRealtimeToasts = true,
  showCursors = true,
  enableTypingIndicators = true,
}: CollaborativeWorkspaceProps) {
  return (
    <CollaborationProvider workspaceId={workspaceId}>
      <div className="relative min-h-screen">
        {/* Header with presence indicator */}
        {showPresenceInHeader && (
          <motion.div 
            className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold">Collaborative Workspace</h1>
              <PresenceIndicator />
            </div>
            
            {showCollaboratorSidebar && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Collaborators
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Active Collaborators</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <CollaboratorList />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </motion.div>
        )}

        {/* Main content */}
        <div className="relative">
          {children}
          
          {/* Typing indicator at bottom */}
          {enableTypingIndicators && (
            <div className="fixed bottom-4 left-4 z-30">
              <TypingIndicator />
            </div>
          )}
        </div>

        {/* Collaborative overlays */}
        {showCursors && <CursorOverlay />}
        {showRealtimeToasts && <RealtimeToast />}
      </div>
    </CollaborationProvider>
  );
}

// Helper component for individual collaborative elements
export function CollaborativeElement({ 
  children, 
  documentId, 
  className,
  onCursorMove,
  onSelectionChange,
  onTypingStart,
  onTypingStop,
}: {
  children: ReactNode;
  documentId?: string;
  className?: string;
  onCursorMove?: (x: number, y: number) => void;
  onSelectionChange?: (start: number, end: number) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}) {
  return (
    <div 
      className={className}
      onMouseMove={(e) => {
        if (onCursorMove) {
          const rect = e.currentTarget.getBoundingClientRect();
          onCursorMove(e.clientX - rect.left, e.clientY - rect.top);
        }
      }}
      onMouseDown={(e) => {
        if (onSelectionChange) {
          // Simple selection tracking - in a real app you'd use more sophisticated text selection
          const start = e.nativeEvent.offsetX;
          const end = start;
          onSelectionChange(start, end);
        }
      }}
      onKeyDown={(e) => {
        if (onTypingStart && !e.repeat) {
          onTypingStart();
        }
      }}
      onKeyUp={() => {
        if (onTypingStop) {
          // Debounce typing stop
          setTimeout(onTypingStop, 1000);
        }
      }}
    >
      {children}
    </div>
  );
}

// Status card showing collaboration health
export function CollaborationStatus() {
  return (
    <CollaborationProvider workspaceId="demo">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Real-time Status</CardTitle>
        </CardHeader>
        <CardContent>
          <PresenceIndicator className="mb-4" />
          <div className="space-y-3">
            <CollaboratorList />
          </div>
        </CardContent>
      </Card>
    </CollaborationProvider>
  );
}