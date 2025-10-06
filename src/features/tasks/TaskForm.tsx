'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  X,
  Plus,
  Calendar,
  Clock,
  Flag,
  User,
  Tag,
  FileText,
  Mic,
  MicOff,
  Brain,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { TaskFormData, TaskStatus, TaskPriority } from './types';
import { cn } from '@/lib/utils';

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'blocked', 'review', 'done', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.string().optional(),
  tags: z.array(z.string()),
  dueDate: z.date().optional(),
  estimatedDuration: z.number().min(0).optional(),
  assignedTo: z.string().optional(),
  subtasks: z.array(z.object({
    title: z.string().min(1, 'Subtask title is required'),
    completed: z.boolean().default(false),
  })),
  dependencies: z.array(z.string()),
  metadata: z.object({
    source: z.enum(['manual', 'voice', 'email', 'calendar', 'ai']).optional(),
    originalText: z.string().optional(),
    aiProcessed: z.boolean().optional(),
    location: z.string().optional(),
    participants: z.array(z.string()).optional(),
    resources: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  task?: Partial<TaskFormData>;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  mode?: 'create' | 'edit';
  enableNaturalLanguage?: boolean;
  enableVoiceInput?: boolean;
  enableAIProcessing?: boolean;
}

export function TaskForm({
  task,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = 'create',
  enableNaturalLanguage = true,
  enableVoiceInput = true,
  enableAIProcessing = true,
}: TaskFormProps) {
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const recognition = useRef<any>(null);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema) as any,
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'todo',
      priority: task?.priority || 'medium',
      category: task?.category || '',
      tags: task?.tags || [],
      dueDate: task?.dueDate ? new Date(task.dueDate) : undefined,
      estimatedDuration: task?.estimatedDuration || undefined,
      assignedTo: task?.assignedTo || '',
      subtasks: task?.subtasks || [],
      dependencies: task?.dependencies || [],
      metadata: {
        source: 'manual',
        ...task?.metadata,
      },
    },
  });

  const { fields: subtaskFields, append: appendSubtask, remove: removeSubtask } = useFieldArray({
    control: form.control,
    name: 'subtasks',
  });

  // Initialize speech recognition
  useEffect(() => {
    if (enableVoiceInput && 'webkitSpeechRecognition' in window) {
      recognition.current = new (window as any).webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-US';

      recognition.current.onstart = () => {
        setIsVoiceRecording(true);
      };

      recognition.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setVoiceTranscript(prev => prev + finalTranscript);
        }
      };

      recognition.current.onerror = (event: any) => {
        // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('Speech recognition error:', event.error);
        setIsVoiceRecording(false);
      };

      recognition.current.onend = () => {
        setIsVoiceRecording(false);
      };
    }

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
    };
  }, [enableVoiceInput]);

  // Focus title input when dialog opens
  useEffect(() => {
    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Voice input handlers
  const startVoiceRecording = useCallback(() => {
    if (recognition.current && !isVoiceRecording) {
      setVoiceTranscript('');
      recognition.current.start();
    }
  }, [isVoiceRecording]);

  const stopVoiceRecording = useCallback(() => {
    if (recognition.current && isVoiceRecording) {
      recognition.current.stop();
    }
  }, [isVoiceRecording]);

  // Apply voice transcript to form
  const applyVoiceTranscript = useCallback(() => {
    if (voiceTranscript.trim()) {
      if (enableNaturalLanguage) {
        setNaturalLanguageInput(voiceTranscript);
      } else {
        form.setValue('title', voiceTranscript.trim());
      }
      setVoiceTranscript('');
    }
  }, [voiceTranscript, form, enableNaturalLanguage]);

  // AI processing for natural language
  const processNaturalLanguage = useCallback(async (input: string) => {
    if (!enableAIProcessing || !input.trim()) return;

    setIsProcessingAI(true);
    try {
      // Simulate AI processing - replace with actual AI service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock AI response - replace with actual AI processing
      const mockProcessedData = {
        title: input.split(' ').slice(0, 5).join(' '),
        description: input,
        priority: input.toLowerCase().includes('urgent') ? 'urgent' as TaskPriority :
                  input.toLowerCase().includes('important') ? 'high' as TaskPriority :
                  'medium' as TaskPriority,
        dueDate: input.toLowerCase().includes('today') ? new Date() :
                 input.toLowerCase().includes('tomorrow') ? new Date(Date.now() + 24 * 60 * 60 * 1000) :
                 undefined,
        estimatedDuration: input.includes('hour') ? 60 : input.includes('minute') ? 30 : undefined,
        tags: input.toLowerCase().includes('meeting') ? ['meeting'] :
              input.toLowerCase().includes('research') ? ['research'] :
              [],
      };

      // Apply processed data to form
      if (mockProcessedData.title) form.setValue('title', mockProcessedData.title);
      if (mockProcessedData.description) form.setValue('description', mockProcessedData.description);
      form.setValue('priority', mockProcessedData.priority);
      if (mockProcessedData.dueDate) form.setValue('dueDate', mockProcessedData.dueDate);
      if (mockProcessedData.estimatedDuration) form.setValue('estimatedDuration', mockProcessedData.estimatedDuration);
      form.setValue('tags', [...form.getValues('tags'), ...mockProcessedData.tags]);
      form.setValue('metadata.source', 'ai');
      form.setValue('metadata.originalText', input);
      form.setValue('metadata.aiProcessed', true);

      setNaturalLanguageInput('');
    } catch (error) {
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error('AI processing error:', error);
    } finally {
      setIsProcessingAI(false);
    }
  }, [enableAIProcessing, form]);

  // Tag management
  const addTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !form.getValues('tags').includes(trimmedTag)) {
      form.setValue('tags', [...form.getValues('tags'), trimmedTag]);
    }
    setTagInput('');
  }, [form]);

  const removeTag = useCallback((tagToRemove: string) => {
    form.setValue('tags', form.getValues('tags').filter(tag => tag !== tagToRemove));
  }, [form]);

  const handleTagInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  }, [tagInput, addTag]);

  // Subtask management
  const addSubtask = useCallback(() => {
    appendSubtask({ title: '', completed: false });
  }, [appendSubtask]);

  // Form submission
  const handleSubmit = useCallback((data: TaskFormValues) => {
    onSubmit(data as TaskFormData);
  }, [onSubmit]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'Enter':
            event.preventDefault();
            form.handleSubmit(handleSubmit)();
            break;
          case 's':
            event.preventDefault();
            form.handleSubmit(handleSubmit)();
            break;
        }
      }
      
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [form, handleSubmit, onCancel]);

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'review', label: 'Review' },
    { value: 'done', label: 'Done' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  return (
    <Dialog open onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Task' : 'Edit Task'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Natural Language Input */}
            {enableNaturalLanguage && (
              <div className="space-y-2">
                <Label>Quick Input</Label>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Describe your task in natural language... (e.g., 'Schedule urgent meeting with John tomorrow at 2pm for 1 hour')"
                    value={naturalLanguageInput}
                    onChange={(e) => setNaturalLanguageInput(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <div className="flex flex-col gap-1">
                    {enableVoiceInput && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={isVoiceRecording ? stopVoiceRecording : startVoiceRecording}
                        className={cn(
                          isVoiceRecording && "bg-red-50 border-red-300 text-red-600"
                        )}
                      >
                        {isVoiceRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    )}
                    {enableAIProcessing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => processNaturalLanguage(naturalLanguageInput)}
                        disabled={!naturalLanguageInput.trim() || isProcessingAI}
                      >
                        {isProcessingAI ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Brain className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Voice transcript */}
                {voiceTranscript && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border">
                    <p className="text-sm text-blue-800 dark:text-blue-200">{voiceTranscript}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={applyVoiceTranscript}
                      className="mt-2"
                    >
                      Apply Transcript
                    </Button>
                  </div>
                )}
                
                <Separator />
              </div>
            )}

            {/* Basic Fields */}
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        ref={titleInputRef}
                        placeholder="Enter task title..."
                        className="text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add more details about this task..."
                        className="min-h-[80px] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Flag className={cn(
                                "h-3 w-3",
                                option.value === 'urgent' && "text-red-500",
                                option.value === 'high' && "text-orange-500",
                                option.value === 'medium' && "text-blue-500",
                                option.value === 'low' && "text-gray-400"
                              )} />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Due Date and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        step="15"
                        placeholder="e.g., 60"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Category and Tags */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Work, Personal, Health"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1 min-h-[2rem] p-2 border border-gray-300 dark:border-gray-600 rounded-md">
                  {form.watch('tags').map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-red-100 dark:hover:bg-red-900"
                      onClick={() => removeTag(tag)}
                    >
                      {tag}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    onBlur={() => addTag(tagInput)}
                    placeholder="Add tags..."
                    className="border-0 shadow-none focus-visible:ring-0 px-0 h-6 text-sm flex-1 min-w-[100px]"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Press Enter or comma to add tags
                </p>
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="advanced"
                checked={showAdvanced}
                onCheckedChange={setShowAdvanced}
              />
              <Label htmlFor="advanced">Show Advanced Options</Label>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter assignee name or email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Subtasks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Subtasks</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSubtask}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Subtask
                    </Button>
                  </div>
                  
                  {subtaskFields.length > 0 && (
                    <div className="space-y-2">
                      {subtaskFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                          <Controller
                            control={form.control}
                            name={`subtasks.${index}.title`}
                            render={({ field: subtaskField }) => (
                              <Input
                                {...subtaskField}
                                placeholder="Subtask title"
                                className="flex-1"
                              />
                            )}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeSubtask(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <FormField
                  control={form.control}
                  name="metadata.notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Additional notes or context..."
                          className="min-h-[60px] resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Form Actions */}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
                className="min-w-[100px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === 'create' ? 'Create Task' : 'Update Task'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {/* Keyboard shortcuts help */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 border-t pt-2">
          <p>Keyboard shortcuts: Ctrl+Enter or Ctrl+S to save, Esc to cancel</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}