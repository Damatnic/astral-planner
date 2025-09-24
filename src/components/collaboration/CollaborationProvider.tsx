'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useRealtime, RealtimeOptions } from '@/features/collaboration/hooks/useRealtime';

interface CollaborationContextType extends ReturnType<typeof useRealtime> {
  workspaceId: string;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

interface CollaborationProviderProps {
  children: ReactNode;
  workspaceId: string;
  options?: Partial<RealtimeOptions>;
}

export function CollaborationProvider({ 
  children, 
  workspaceId, 
  options = {} 
}: CollaborationProviderProps) {
  const realtimeData = useRealtime({
    workspaceId,
    enablePresence: true,
    enableNotifications: true,
    enableCollaboration: true,
    ...options,
  });

  const contextValue: CollaborationContextType = {
    ...realtimeData,
    workspaceId,
  };

  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
}