'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CalendarEvent,
  CalendarConfig,
  CalendarView,
  TimeBlock,
  CalendarFilter,
  CalendarStats,
  DragDropResult,
  ResizeResult,
  QuickEventData,
  SmartSchedulingOptions,
  SchedulingSuggestion,
  ConflictInfo,
  CalendarNotification,
  CalendarAnalytics,
} from '../types';
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, addMinutes } from 'date-fns';

interface UseCalendarOptions {
  initialView?: CalendarView;
  initialDate?: Date;
  enableRealtime?: boolean;
  enableConflictDetection?: boolean;
  enableSmartScheduling?: boolean;
  autoSave?: boolean;
}

interface CalendarAPI {
  getEvents: (filter?: CalendarFilter) => Promise<CalendarEvent[]>;
  createEvent: (data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<CalendarEvent>;
  updateEvent: (id: string, data: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  deleteEvent: (id: string) => Promise<void>;
  moveEvent: (id: string, newStartTime: Date, newEndTime: Date) => Promise<CalendarEvent>;
  resizeEvent: (id: string, newStartTime: Date, newEndTime: Date) => Promise<CalendarEvent>;
  getTimeBlocks: (dateRange: { start: Date; end: Date }) => Promise<TimeBlock[]>;
  createTimeBlock: (data: Omit<TimeBlock, 'id'>) => Promise<TimeBlock>;
  updateTimeBlock: (id: string, data: Partial<TimeBlock>) => Promise<TimeBlock>;
  deleteTimeBlock: (id: string) => Promise<void>;
  getConflicts: (dateRange: { start: Date; end: Date }) => Promise<ConflictInfo[]>;
  suggestScheduling: (eventData: QuickEventData, options: SmartSchedulingOptions) => Promise<SchedulingSuggestion[]>;
  getStats: (dateRange: { start: Date; end: Date }) => Promise<CalendarStats>;
  getAnalytics: (dateRange: { start: Date; end: Date }) => Promise<CalendarAnalytics>;
  getNotifications: () => Promise<CalendarNotification[]>;
  markNotificationRead: (id: string) => Promise<void>;
}

// Mock API implementation
const mockAPI: CalendarAPI = {
  getEvents: async (filter) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return [];
  },
  createEvent: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user',
    } as CalendarEvent;
  },
  updateEvent: async (id, data) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {} as CalendarEvent;
  },
  deleteEvent: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 150));
  },
  moveEvent: async (id, newStartTime, newEndTime) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {} as CalendarEvent;
  },
  resizeEvent: async (id, newStartTime, newEndTime) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {} as CalendarEvent;
  },
  getTimeBlocks: async (dateRange) => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return [];
  },
  createTimeBlock: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
    } as TimeBlock;
  },
  updateTimeBlock: async (id, data) => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return {} as TimeBlock;
  },
  deleteTimeBlock: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 100));
  },
  getConflicts: async (dateRange) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [];
  },
  suggestScheduling: async (eventData, options) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [];
  },
  getStats: async (dateRange) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      totalEvents: 0,
      totalDuration: 0,
      freeTime: 0,
      busyTime: 0,
      meetingTime: 0,
      focusTime: 0,
      conflictCount: 0,
      utilizationRate: 0,
      productivityScore: 0,
      averageEventDuration: 0,
      eventsByType: {} as any,
      eventsByPriority: {} as any,
    };
  },
  getAnalytics: async (dateRange) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {} as CalendarAnalytics;
  },
  getNotifications: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [];
  },
  markNotificationRead: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 50));
  },
};

const defaultConfig: CalendarConfig = {
  view: 'week',
  currentDate: new Date(),
  timeScale: '30min',
  showWeekends: true,
  showDeclined: false,
  showAllDay: true,
  showTimeBlocks: true,
  workingHours: {
    enabled: true,
    start: '09:00',
    end: '17:00',
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    breakTimes: [],
  },
  timeZone: 'UTC', // Will be updated on client mount to avoid hydration mismatch
  firstDayOfWeek: 1, // Monday
  displayOptions: {
    showConflicts: true,
    showTravelTime: true,
    showBufferTime: true,
    showProductivityMetrics: false,
    showEnergyLevels: false,
    eventDensity: 'comfortable',
    colorBy: 'category',
  },
  filterOptions: {},
};

export function useCalendar(options: UseCalendarOptions = {}) {
  const {
    initialView = 'week',
    initialDate = new Date(),
    enableRealtime = true,
    enableConflictDetection = true,
    enableSmartScheduling = true,
    autoSave = true,
  } = options;

  const queryClient = useQueryClient();
  const [config, setConfig] = useState<CalendarConfig>({
    ...defaultConfig,
    view: initialView,
    currentDate: initialDate,
  });

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    eventId?: string;
    startTime?: Date;
  }>({ isDragging: false });

  // Calculate date range based on current view
  const dateRange = useMemo(() => {
    const { currentDate, view } = config;
    
    switch (view) {
      case 'day':
        return {
          start: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
          end: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1),
        };
      case 'week':
        return {
          start: startOfWeek(currentDate, { weekStartsOn: config.firstDayOfWeek as 0 | 1 }),
          end: endOfWeek(currentDate, { weekStartsOn: config.firstDayOfWeek as 0 | 1 }),
        };
      case 'month':
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        };
      case 'year':
        return {
          start: new Date(currentDate.getFullYear(), 0, 1),
          end: new Date(currentDate.getFullYear() + 1, 0, 1),
        };
      default:
        return {
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate),
        };
    }
  }, [config.currentDate, config.view, config.firstDayOfWeek]);

  // Queries
  const {
    data: events = [],
    isLoading: isLoadingEvents,
    error: eventsError,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ['calendar-events', dateRange, config.filterOptions],
    queryFn: () => mockAPI.getEvents(config.filterOptions),
    staleTime: enableRealtime ? 0 : 5 * 60 * 1000,
    refetchInterval: enableRealtime ? 30000 : false,
  });

  const {
    data: timeBlocks = [],
    isLoading: isLoadingTimeBlocks,
  } = useQuery({
    queryKey: ['time-blocks', dateRange],
    queryFn: () => mockAPI.getTimeBlocks(dateRange),
    enabled: config.showTimeBlocks,
    staleTime: 60 * 1000,
  });

  const {
    data: conflicts = [],
    isLoading: isLoadingConflicts,
  } = useQuery({
    queryKey: ['calendar-conflicts', dateRange],
    queryFn: () => mockAPI.getConflicts(dateRange),
    enabled: enableConflictDetection && config.displayOptions.showConflicts,
    staleTime: 30 * 1000,
  });

  const {
    data: stats,
    isLoading: isLoadingStats,
  } = useQuery({
    queryKey: ['calendar-stats', dateRange],
    queryFn: () => mockAPI.getStats(dateRange),
    staleTime: 2 * 60 * 1000,
  });

  const {
    data: notifications = [],
    isLoading: isLoadingNotifications,
  } = useQuery({
    queryKey: ['calendar-notifications'],
    queryFn: () => mockAPI.getNotifications(),
    refetchInterval: 60 * 1000, // Check every minute
  });

  // Mutations
  const createEventMutation = useMutation({
    mutationFn: mockAPI.createEvent,
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-stats'] });
      if (enableConflictDetection) {
        queryClient.invalidateQueries({ queryKey: ['calendar-conflicts'] });
      }
      toast.success('Event created successfully');
    },
    onError: () => {
      toast.error('Failed to create event');
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CalendarEvent> }) =>
      mockAPI.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-stats'] });
      if (enableConflictDetection) {
        queryClient.invalidateQueries({ queryKey: ['calendar-conflicts'] });
      }
      toast.success('Event updated successfully');
    },
    onError: () => {
      toast.error('Failed to update event');
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: mockAPI.deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-stats'] });
      if (enableConflictDetection) {
        queryClient.invalidateQueries({ queryKey: ['calendar-conflicts'] });
      }
      toast.success('Event deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete event');
    },
  });

  const moveEventMutation = useMutation({
    mutationFn: ({ id, startTime, endTime }: { id: string; startTime: Date; endTime: Date }) =>
      mockAPI.moveEvent(id, startTime, endTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      if (enableConflictDetection) {
        queryClient.invalidateQueries({ queryKey: ['calendar-conflicts'] });
      }
    },
    onError: () => {
      toast.error('Failed to move event');
    },
  });

  const resizeEventMutation = useMutation({
    mutationFn: ({ id, startTime, endTime }: { id: string; startTime: Date; endTime: Date }) =>
      mockAPI.resizeEvent(id, startTime, endTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      if (enableConflictDetection) {
        queryClient.invalidateQueries({ queryKey: ['calendar-conflicts'] });
      }
    },
    onError: () => {
      toast.error('Failed to resize event');
    },
  });

  const createTimeBlockMutation = useMutation({
    mutationFn: mockAPI.createTimeBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
      toast.success('Time block created successfully');
    },
    onError: () => {
      toast.error('Failed to create time block');
    },
  });

  const smartSchedulingMutation = useMutation({
    mutationFn: ({ eventData, options }: { eventData: QuickEventData; options: SmartSchedulingOptions }) =>
      mockAPI.suggestScheduling(eventData, options),
    onError: () => {
      toast.error('Failed to generate scheduling suggestions');
    },
  });

  // Navigation functions
  const navigateToDate = useCallback((date: Date) => {
    setConfig(prev => ({ ...prev, currentDate: date }));
  }, []);

  const navigateNext = useCallback(() => {
    setConfig(prev => {
      const { currentDate, view } = prev;
      let newDate: Date;

      switch (view) {
        case 'day':
          newDate = addDays(currentDate, 1);
          break;
        case 'week':
          newDate = addDays(currentDate, 7);
          break;
        case 'month':
          newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
          break;
        case 'year':
          newDate = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate());
          break;
        default:
          newDate = addDays(currentDate, 7);
      }

      return { ...prev, currentDate: newDate };
    });
  }, []);

  const navigatePrevious = useCallback(() => {
    setConfig(prev => {
      const { currentDate, view } = prev;
      let newDate: Date;

      switch (view) {
        case 'day':
          newDate = addDays(currentDate, -1);
          break;
        case 'week':
          newDate = addDays(currentDate, -7);
          break;
        case 'month':
          newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
          break;
        case 'year':
          newDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate());
          break;
        default:
          newDate = addDays(currentDate, -7);
      }

      return { ...prev, currentDate: newDate };
    });
  }, []);

  const navigateToToday = useCallback(() => {
    setConfig(prev => ({ ...prev, currentDate: new Date() }));
  }, []);

  // View functions
  const changeView = useCallback((view: CalendarView) => {
    setConfig(prev => ({ ...prev, view }));
  }, []);

  const updateConfig = useCallback((updates: Partial<CalendarConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const updateFilter = useCallback((filter: Partial<CalendarFilter>) => {
    setConfig(prev => ({
      ...prev,
      filterOptions: { ...prev.filterOptions, ...filter },
    }));
  }, []);

  // Event functions
  const createEvent = useCallback((eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    createEventMutation.mutate(eventData);
  }, [createEventMutation]);

  const updateEvent = useCallback((id: string, data: Partial<CalendarEvent>) => {
    updateEventMutation.mutate({ id, data });
  }, [updateEventMutation]);

  const deleteEvent = useCallback((id: string) => {
    deleteEventMutation.mutate(id);
  }, [deleteEventMutation]);

  const selectEvent = useCallback((eventId: string | null) => {
    setSelectedEventId(eventId);
  }, []);

  const getEventById = useCallback((id: string) => {
    return events.find(event => event.id === id);
  }, [events]);

  // Drag and drop functions
  const handleEventDrop = useCallback((result: DragDropResult) => {
    const { eventId, newStartTime, newEndTime } = result;
    moveEventMutation.mutate({
      id: eventId,
      startTime: newStartTime,
      endTime: newEndTime,
    });
  }, [moveEventMutation]);

  const handleEventResize = useCallback((result: ResizeResult) => {
    const { eventId, newStartTime, newEndTime } = result;
    resizeEventMutation.mutate({
      id: eventId,
      startTime: newStartTime,
      endTime: newEndTime,
    });
  }, [resizeEventMutation]);

  const startDrag = useCallback((eventId: string, startTime: Date) => {
    setDragState({
      isDragging: true,
      eventId,
      startTime,
    });
  }, []);

  const endDrag = useCallback(() => {
    setDragState({ isDragging: false });
  }, []);

  // Time block functions
  const createTimeBlock = useCallback((timeBlockData: Omit<TimeBlock, 'id'>) => {
    createTimeBlockMutation.mutate(timeBlockData);
  }, [createTimeBlockMutation]);

  // Quick scheduling
  const createQuickEvent = useCallback((eventData: QuickEventData) => {
    const { title, description, date, startTime, duration = 60, type = 'meeting', priority = 'medium' } = eventData;
    
    let startDateTime: Date;
    let endDateTime: Date;
    
    if (startTime) {
      const [hours, minutes] = startTime.split(':').map(Number);
      startDateTime = new Date(date);
      startDateTime.setHours(hours, minutes, 0, 0);
    } else {
      startDateTime = new Date(date);
      startDateTime.setHours(9, 0, 0, 0); // Default to 9 AM
    }
    
    endDateTime = addMinutes(startDateTime, duration);

    const event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
      title,
      description,
      startTime: startDateTime,
      endTime: endDateTime,
      type,
      priority,
      status: 'tentative',
      visibility: 'public',
      isAllDay: false,
      isRecurring: false,
      attendees: eventData.attendees || [],
      location: eventData.location,
      reminders: (eventData.reminders || [15]).map((minutes, index) => ({
        id: `reminder-${index}`,
        type: 'popup' as const,
        timing: minutes,
        isEnabled: true,
      })),
      category: eventData.category,
      metadata: {
        source: 'manual',
      },
      timeBlocks: [],
      conflicts: [],
    };

    createEvent(event);
  }, [createEvent]);

  const suggestScheduling = useCallback((eventData: QuickEventData, options: SmartSchedulingOptions) => {
    return smartSchedulingMutation.mutateAsync({ eventData, options });
  }, [smartSchedulingMutation]);

  // Notification functions
  const markNotificationRead = useCallback((notificationId: string) => {
    queryClient.setQueryData<CalendarNotification[]>(['calendar-notifications'], (old = []) =>
      old.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
    
    mockAPI.markNotificationRead(notificationId);
  }, [queryClient]);

  const getUnreadNotificationCount = useCallback(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Utility functions
  const isTimeSlotAvailable = useCallback((startTime: Date, endTime: Date) => {
    return !events.some(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      return (
        (startTime >= eventStart && startTime < eventEnd) ||
        (endTime > eventStart && endTime <= eventEnd) ||
        (startTime <= eventStart && endTime >= eventEnd)
      );
    });
  }, [events]);

  const findNextAvailableSlot = useCallback((duration: number, preferredTime?: Date) => {
    const searchStart = preferredTime || new Date();
    const searchEnd = addDays(searchStart, 7); // Search up to 7 days ahead
    
    // Simple implementation - find first available slot
    for (let date = new Date(searchStart); date < searchEnd; date = addMinutes(date, 30)) {
      const slotEnd = addMinutes(date, duration);
      if (isTimeSlotAvailable(date, slotEnd)) {
        return { start: date, end: slotEnd };
      }
    }
    
    return null;
  }, [isTimeSlotAvailable]);

  // Analytics and insights
  const getProductivityInsights = useCallback(() => {
    if (!stats) return null;
    
    const insights = [];
    
    if (stats.utilizationRate > 90) {
      insights.push({
        type: 'overbooked',
        message: 'Your schedule is very packed. Consider blocking time for breaks.',
        severity: 'warning' as const,
      });
    }
    
    if (stats.focusTime < stats.meetingTime * 0.5) {
      insights.push({
        type: 'focus_deficit',
        message: 'You have more meeting time than focus time. Try blocking dedicated focus periods.',
        severity: 'info' as const,
      });
    }
    
    return insights;
  }, [stats]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave) return;
    
    const saveConfig = () => {
      try {
        localStorage.setItem('calendar-config', JSON.stringify(config));
      } catch (error) {
        // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.warn('Failed to save calendar config:', error);
      }
    };
    
    const timeoutId = setTimeout(saveConfig, 1000);
    return () => clearTimeout(timeoutId);
  }, [config, autoSave]);

  // Load saved config on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('calendar-config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({
          ...prev,
          ...parsed,
          currentDate: initialDate, // Always use provided initial date
        }));
      }
    } catch (error) {
      // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.warn('Failed to load saved calendar config:', error);
    }
  }, [initialDate]);

  return {
    // Data
    events,
    timeBlocks,
    conflicts,
    stats,
    notifications,
    config,
    dateRange,
    selectedEventId,
    dragState,

    // Loading states
    isLoading: isLoadingEvents || isLoadingTimeBlocks,
    isLoadingEvents,
    isLoadingTimeBlocks,
    isLoadingConflicts,
    isLoadingStats,
    isLoadingNotifications,
    isCreatingEvent: createEventMutation.isPending,
    isUpdatingEvent: updateEventMutation.isPending,
    isDeletingEvent: deleteEventMutation.isPending,
    isMovingEvent: moveEventMutation.isPending,
    isResizingEvent: resizeEventMutation.isPending,
    isGeneratingSuggestions: smartSchedulingMutation.isPending,

    // Error states
    error: eventsError,

    // Navigation
    navigateToDate,
    navigateNext,
    navigatePrevious,
    navigateToToday,

    // View management
    changeView,
    updateConfig,
    updateFilter,

    // Event management
    createEvent,
    updateEvent,
    deleteEvent,
    selectEvent,
    getEventById,
    createQuickEvent,

    // Drag and drop
    handleEventDrop,
    handleEventResize,
    startDrag,
    endDrag,

    // Time blocks
    createTimeBlock,

    // Smart scheduling
    suggestScheduling,

    // Notifications
    markNotificationRead,
    getUnreadNotificationCount,

    // Utilities
    isTimeSlotAvailable,
    findNextAvailableSlot,
    getProductivityInsights,

    // Refetch
    refetch: refetchEvents,
  };
}