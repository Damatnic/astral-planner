'use client';

import React, { createContext, useContext, useState } from 'react';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { DynamicCommandPalette } from '@/lib/performance/optimization';
import { ShortcutsDialog } from '@/components/shortcuts/ShortcutsDialog';
import { QuickAdd } from '@/components/quick-add/QuickAdd';

interface ShortcutsContextType {
  showCommandPalette: boolean;
  setShowCommandPalette: (show: boolean) => void;
  showShortcuts: boolean;
  setShowShortcuts: (show: boolean) => void;
  showQuickAdd: boolean;
  setShowQuickAdd: (show: boolean) => void;
}

const ShortcutsContext = createContext<ShortcutsContextType | undefined>(undefined);

export function useShortcutsContext() {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error('useShortcutsContext must be used within ShortcutsProvider');
  }
  return context;
}

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Initialize keyboard shortcuts
  const {
    commandPalette,
    setCommandPalette,
    showShortcuts: hookShowShortcuts,
    setShowShortcuts: hookSetShowShortcuts,
    quickAddOpen,
    setQuickAddOpen,
  } = useKeyboardShortcuts();

  // Sync state with hooks
  React.useEffect(() => {
    setShowCommandPalette(commandPalette);
  }, [commandPalette]);

  React.useEffect(() => {
    setShowShortcuts(hookShowShortcuts);
  }, [hookShowShortcuts]);

  React.useEffect(() => {
    setShowQuickAdd(quickAddOpen);
  }, [quickAddOpen]);

  const contextValue = {
    showCommandPalette,
    setShowCommandPalette: (show: boolean) => {
      setShowCommandPalette(show);
      setCommandPalette(show);
    },
    showShortcuts,
    setShowShortcuts: (show: boolean) => {
      setShowShortcuts(show);
      hookSetShowShortcuts(show);
    },
    showQuickAdd,
    setShowQuickAdd: (show: boolean) => {
      setShowQuickAdd(show);
      setQuickAddOpen(show);
    },
  };

  return (
    <ShortcutsContext.Provider value={contextValue}>
      {children}
      
      {/* Global modals */}
      <DynamicCommandPalette
        open={showCommandPalette}
        onOpenChange={contextValue.setShowCommandPalette}
      />
      
      <ShortcutsDialog
        open={showShortcuts}
        onOpenChange={contextValue.setShowShortcuts}
      />
      
      {showQuickAdd && (
        <QuickAdd
          open={showQuickAdd}
          onOpenChange={contextValue.setShowQuickAdd}
        />
      )}
    </ShortcutsContext.Provider>
  );
}