'use client';

import { Plus, Zap, Mic, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShortcutsContext } from '@/providers/shortcuts-provider';
import { cn } from '@/lib/utils';

interface QuickCaptureButtonProps {
  variant?: 'default' | 'floating' | 'compact' | 'icon';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function QuickCaptureButton({
  variant = 'default',
  size = 'default',
  className,
  showIcon = true,
  children,
}: QuickCaptureButtonProps) {
  const { setShowQuickAdd } = useShortcutsContext();

  if (variant === 'floating') {
    return (
      <Button
        onClick={() => setShowQuickAdd(true)}
        size="lg"
        className={cn(
          'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200',
          'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
          'border-0 text-white',
          className
        )}
        title="Quick Capture (N)"
      >
        <Plus className="h-6 w-6" />
      </Button>
    );
  }

  if (variant === 'compact') {
    return (
      <Button
        onClick={() => setShowQuickAdd(true)}
        variant="outline"
        size={size}
        className={cn(
          'inline-flex items-center gap-2 text-muted-foreground hover:text-foreground',
          className
        )}
        title="Quick Capture (N)"
      >
        {showIcon && <Plus className="h-4 w-4" />}
        {children || 'Add'}
      </Button>
    );
  }

  if (variant === 'icon') {
    return (
      <Button
        onClick={() => setShowQuickAdd(true)}
        variant="ghost"
        size="sm"
        className={cn('h-8 w-8 p-0', className)}
        title="Quick Capture (N)"
      >
        <Plus className="h-4 w-4" />
      </Button>
    );
  }

  // Default variant
  return (
    <Button
      onClick={() => setShowQuickAdd(true)}
      size={size}
      className={cn(
        'inline-flex items-center gap-2',
        className
      )}
    >
      {showIcon && <Zap className="h-4 w-4" />}
      {children || 'Quick Capture'}
    </Button>
  );
}

// AI-powered quick capture button
export function AIQuickCaptureButton({
  className,
  size = 'default',
}: {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}) {
  const { setShowQuickAdd } = useShortcutsContext();

  return (
    <Button
      onClick={() => setShowQuickAdd(true)}
      variant="outline"
      size={size}
      className={cn(
        'inline-flex items-center gap-2 border-dashed',
        'hover:border-solid hover:border-primary/50 transition-all',
        className
      )}
      title="AI Quick Capture - Type naturally (⌘N)"
    >
      <Brain className="h-4 w-4 text-blue-500" />
      <span className="text-muted-foreground">Tell me what to do...</span>
      <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
        <span className="text-xs">⌘</span>N
      </kbd>
    </Button>
  );
}

// Voice input quick capture button
export function VoiceQuickCaptureButton({
  className,
  size = 'default',
}: {
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}) {
  const { setShowQuickAdd } = useShortcutsContext();

  // Check if speech recognition is supported
  const isVoiceSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  if (!isVoiceSupported) {
    return null;
  }

  return (
    <Button
      onClick={() => setShowQuickAdd(true)}
      variant="outline"
      size={size}
      className={cn(
        'inline-flex items-center gap-2',
        className
      )}
      title="Voice Quick Capture"
    >
      <Mic className="h-4 w-4 text-red-500" />
      <span className="hidden sm:inline">Voice</span>
    </Button>
  );
}

export default QuickCaptureButton;