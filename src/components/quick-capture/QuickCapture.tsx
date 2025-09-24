'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Command,
  Hash,
  Calendar,
  Target,
  Zap,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Clock,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAIParser } from '@/hooks/useAIParser';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface QuickCaptureProps {
  onSubmit: (input: string, type: string) => Promise<void>;
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
}

const TYPE_SHORTCUTS = {
  '/task': { label: 'Task', icon: Hash, color: 'text-blue-500' },
  '/event': { label: 'Event', icon: Calendar, color: 'text-green-500' },
  '/goal': { label: 'Goal', icon: Target, color: 'text-purple-500' },
  '/note': { label: 'Note', icon: Zap, color: 'text-yellow-500' },
  '/time': { label: 'Time Block', icon: Clock, color: 'text-orange-500' }
};

const AI_EXAMPLES = [
  'Meeting with team tomorrow at 2pm',
  'Workout for 30 mins every morning',
  'Finish project by end of month',
  'Buy groceries milk, eggs, bread',
  'Call mom this weekend'
];

export function QuickCapture({ 
  onSubmit, 
  placeholder = 'Type "/" for commands or use natural language...', 
  className,
  showSuggestions = true 
}: QuickCaptureProps) {
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const { parseInput, isLoading: isParsing } = useAIParser();
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening,
    isSupported: isVoiceSupported 
  } = useVoiceInput();

  // Update input when voice transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Show command palette when "/" is typed
  useEffect(() => {
    if (input.startsWith('/')) {
      setShowCommands(true);
      const command = input.toLowerCase();
      const matchedType = Object.keys(TYPE_SHORTCUTS).find(key => 
        key.startsWith(command)
      );
      if (matchedType && command.length > 1) {
        setSelectedType(matchedType);
      }
    } else {
      setShowCommands(false);
      setSelectedType(null);
    }
  }, [input]);

  // Auto-suggest with AI
  useEffect(() => {
    if (input.length > 5 && !input.startsWith('/') && showSuggestions) {
      const debounceTimer = setTimeout(async () => {
        const suggestion = await parseInput(input, { preview: true });
        if (suggestion) {
          setAiSuggestion(suggestion);
        }
      }, 500);
      return () => clearTimeout(debounceTimer);
    } else {
      setAiSuggestion('');
    }
  }, [input, parseInput, showSuggestions]);

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    // Accept AI suggestion with Tab
    if (e.key === 'Tab' && aiSuggestion) {
      e.preventDefault();
      setInput(aiSuggestion);
      setAiSuggestion('');
      return;
    }

    // Submit with Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await handleSubmit();
      return;
    }

    // Open command palette with "/"
    if (e.key === '/' && input.length === 0) {
      setShowCommands(true);
    }

    // Close command palette with Escape
    if (e.key === 'Escape') {
      if (showCommands) {
        setShowCommands(false);
        setInput('');
      } else {
        setIsOpen(false);
      }
    }

    // Navigate commands with arrow keys
    if (showCommands && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      // Command navigation logic here
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    
    try {
      let type = 'task'; // Default type
      let processedInput = input;

      // Check for command shortcuts
      if (selectedType) {
        type = selectedType.replace('/', '');
        processedInput = input.replace(selectedType, '').trim();
      } else if (!input.startsWith('/')) {
        // Use AI to parse natural language
        const parsed = await parseInput(input);
        if (parsed) {
          type = parsed.type || 'task';
          processedInput = parsed.title || input;
        }
      }

      await onSubmit(processedInput, type);
      
      // Clear input after successful submission
      setInput('');
      setSelectedType(null);
      setShowCommands(false);
      setAiSuggestion('');
    } catch (error) {
      console.error('Failed to process input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleCommandSelect = (command: string) => {
    setInput(command + ' ');
    setSelectedType(command);
    setShowCommands(false);
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      <Card className={cn(
        'transition-all duration-200',
        isOpen && 'shadow-lg ring-2 ring-primary/20'
      )}>
        <div className="flex items-center gap-2 p-2">
          {/* Command indicator */}
          {selectedType && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10"
            >
              {(() => {
                const shortcut = TYPE_SHORTCUTS[selectedType as keyof typeof TYPE_SHORTCUTS];
                const Icon = shortcut.icon;
                return (
                  <>
                    <Icon className={cn('h-3 w-3', shortcut.color)} />
                    <span className="text-xs font-medium">{shortcut.label}</span>
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* Main input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 200)}
              placeholder={placeholder}
              className={cn(
                'w-full bg-transparent outline-none placeholder:text-muted-foreground',
                'text-sm'
              )}
              disabled={isProcessing || isListening}
            />
            
            {/* AI suggestion overlay */}
            {aiSuggestion && !showCommands && (
              <div className="absolute inset-0 pointer-events-none">
                <span className="text-sm text-muted-foreground/50">
                  {input}
                  <span className="text-muted-foreground/30">
                    {aiSuggestion.slice(input.length)}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {/* AI indicator */}
            {isParsing && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-4 w-4 text-primary" />
              </motion.div>
            )}

            {/* Voice input button */}
            {isVoiceSupported && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleVoiceToggle}
                className={cn(
                  'h-8 w-8',
                  isListening && 'text-red-500'
                )}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Submit button */}
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSubmit}
              disabled={!input.trim() || isProcessing}
              className="h-8 w-8"
            >
              {isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Command className="h-4 w-4" />
                </motion.div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>

            {/* Command palette toggle */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowCommands(!showCommands)}
              className="h-8 w-8"
            >
              <ChevronDown className={cn(
                'h-4 w-4 transition-transform',
                showCommands && 'rotate-180'
              )} />
            </Button>
          </div>
        </div>

        {/* Command palette */}
        <AnimatePresence>
          {showCommands && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t"
            >
              <div className="p-2 space-y-1">
                {Object.entries(TYPE_SHORTCUTS).map(([command, config]) => (
                  <button
                    key={command}
                    onClick={() => handleCommandSelect(command)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-md',
                      'hover:bg-muted transition-colors text-left'
                    )}
                  >
                    <config.icon className={cn('h-4 w-4', config.color)} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{config.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {command}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI examples */}
        {isOpen && !showCommands && showSuggestions && input.length === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t p-2"
          >
            <div className="text-xs text-muted-foreground mb-2">
              Try these examples:
            </div>
            <div className="space-y-1">
              {AI_EXAMPLES.slice(0, 3).map((example, i) => (
                <button
                  key={i}
                  onClick={() => setInput(example)}
                  className="w-full text-left text-xs px-2 py-1 rounded hover:bg-muted transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </Card>

      {/* Voice input indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-12 left-0 right-0 flex items-center justify-center"
          >
            <Card className="px-3 py-1 flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scaleY: [1, 1.5, 1],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                    className="w-1 h-4 bg-red-500 rounded-full"
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">Listening...</span>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}