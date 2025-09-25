'use client';

import { Search, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShortcutsContext } from '@/providers/shortcuts-provider';
import { cn } from '@/lib/utils';

interface CommandPaletteTriggerProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showIcon?: boolean;
  showShortcut?: boolean;
  children?: React.ReactNode;
}

export function CommandPaletteTrigger({
  variant = 'outline',
  size = 'default',
  className,
  showIcon = true,
  showShortcut = true,
  children,
}: CommandPaletteTriggerProps) {
  const { setShowCommandPalette } = useShortcutsContext();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => setShowCommandPalette(true)}
      className={cn(
        'inline-flex items-center gap-2 text-muted-foreground hover:text-foreground',
        size === 'sm' && 'h-8 px-3 text-sm',
        className
      )}
    >
      {showIcon && <Search className="h-4 w-4" />}
      {children || 'Search commands...'}
      {showShortcut && (
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
          <Command className="h-3 w-3" />
          K
        </kbd>
      )}
    </Button>
  );
}

// Compact version for toolbars
export function CommandPaletteIcon({
  className,
  size = 16,
}: {
  className?: string;
  size?: number;
}) {
  const { setShowCommandPalette } = useShortcutsContext();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setShowCommandPalette(true)}
      className={cn('h-8 w-8 p-0', className)}
      title="Search commands (⌘K)"
    >
      <Search className={`h-${size / 4} w-${size / 4}`} />
    </Button>
  );
}

export default CommandPaletteTrigger;