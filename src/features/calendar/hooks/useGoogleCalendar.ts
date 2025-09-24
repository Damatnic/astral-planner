'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{ email: string; displayName?: string; }>;
  htmlLink?: string;
  status?: string;
}

interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole?: string;
  backgroundColor?: string;
}

interface GoogleCalendarAPI {
  getAuthUrl: () => Promise<{ authUrl: string }>;
  listCalendars: () => Promise<{ calendars: GoogleCalendar[] }>;
  syncCalendar: (calendarId?: string) => Promise<void>;
  createEvent: (event: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    location?: string;
    attendees?: string[];
    calendarId?: string;
  }) => Promise<GoogleCalendarEvent>;
  updateEvent: (eventId: string, updates: Partial<GoogleCalendarEvent>, calendarId?: string) => Promise<GoogleCalendarEvent>;
  deleteEvent: (eventId: string, calendarId?: string) => Promise<void>;
}

const googleCalendarAPI: GoogleCalendarAPI = {
  getAuthUrl: async () => {
    const response = await fetch('/api/integrations/google/calendar/auth');
    if (!response.ok) {
      throw new Error('Failed to get auth URL');
    }
    return response.json();
  },

  listCalendars: async () => {
    const response = await fetch('/api/integrations/google/calendar/sync');
    if (!response.ok) {
      throw new Error('Failed to list calendars');
    }
    return response.json();
  },

  syncCalendar: async (calendarId = 'primary') => {
    const response = await fetch('/api/integrations/google/calendar/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ calendarId }),
    });
    if (!response.ok) {
      throw new Error('Failed to sync calendar');
    }
  },

  createEvent: async (event) => {
    const response = await fetch('/api/integrations/google/calendar/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    if (!response.ok) {
      throw new Error('Failed to create event');
    }
    const data = await response.json();
    return data.event;
  },

  updateEvent: async (eventId, updates, calendarId = 'primary') => {
    const response = await fetch('/api/integrations/google/calendar/events', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventId, updates, calendarId }),
    });
    if (!response.ok) {
      throw new Error('Failed to update event');
    }
    const data = await response.json();
    return data.event;
  },

  deleteEvent: async (eventId, calendarId = 'primary') => {
    const response = await fetch(`/api/integrations/google/calendar/events?eventId=${eventId}&calendarId=${calendarId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete event');
    }
  },
};

export function useGoogleCalendar() {
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary');

  // Queries
  const {
    data: calendars = [],
    isLoading: isLoadingCalendars,
    error: calendarsError,
    refetch: refetchCalendars,
  } = useQuery({
    queryKey: ['google-calendars'],
    queryFn: googleCalendarAPI.listCalendars,
    retry: false, // Don't retry if not authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutations
  const connectMutation = useMutation({
    mutationFn: googleCalendarAPI.getAuthUrl,
    onMutate: () => {
      setIsConnecting(true);
    },
    onSuccess: ({ authUrl }) => {
      // Redirect to Google OAuth
      window.location.href = authUrl;
    },
    onError: (error) => {
      setIsConnecting(false);
      console.error('Failed to initiate Google Calendar connection:', error);
      toast.error('Failed to connect to Google Calendar');
    },
  });

  const syncMutation = useMutation({
    mutationFn: (calendarId?: string) => googleCalendarAPI.syncCalendar(calendarId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendars'] });
      toast.success('Calendar synced successfully');
    },
    onError: (error) => {
      console.error('Failed to sync calendar:', error);
      toast.error('Failed to sync calendar');
    },
  });

  const createEventMutation = useMutation({
    mutationFn: googleCalendarAPI.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Event created in Google Calendar');
    },
    onError: (error) => {
      console.error('Failed to create Google Calendar event:', error);
      toast.error('Failed to create event in Google Calendar');
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ eventId, updates, calendarId }: { 
      eventId: string; 
      updates: Partial<GoogleCalendarEvent>; 
      calendarId?: string; 
    }) => googleCalendarAPI.updateEvent(eventId, updates, calendarId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Event updated in Google Calendar');
    },
    onError: (error) => {
      console.error('Failed to update Google Calendar event:', error);
      toast.error('Failed to update event in Google Calendar');
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: ({ eventId, calendarId }: { eventId: string; calendarId?: string }) =>
      googleCalendarAPI.deleteEvent(eventId, calendarId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Event deleted from Google Calendar');
    },
    onError: (error) => {
      console.error('Failed to delete Google Calendar event:', error);
      toast.error('Failed to delete event from Google Calendar');
    },
  });

  // Helper functions
  const connectToGoogle = useCallback(() => {
    connectMutation.mutate();
  }, [connectMutation]);

  const syncCalendar = useCallback((calendarId?: string) => {
    syncMutation.mutate(calendarId || selectedCalendarId);
  }, [syncMutation, selectedCalendarId]);

  const createEvent = useCallback((eventData: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    attendees?: string[];
  }) => {
    createEventMutation.mutate({
      title: eventData.title,
      description: eventData.description,
      startTime: eventData.startTime.toISOString(),
      endTime: eventData.endTime.toISOString(),
      location: eventData.location,
      attendees: eventData.attendees,
      calendarId: selectedCalendarId,
    });
  }, [createEventMutation, selectedCalendarId]);

  const updateEvent = useCallback((eventId: string, updates: Partial<GoogleCalendarEvent>) => {
    updateEventMutation.mutate({ eventId, updates, calendarId: selectedCalendarId });
  }, [updateEventMutation, selectedCalendarId]);

  const deleteEvent = useCallback((eventId: string) => {
    deleteEventMutation.mutate({ eventId, calendarId: selectedCalendarId });
  }, [deleteEventMutation, selectedCalendarId]);

  const isConnected = useCallback(() => {
    return calendars.length > 0;
  }, [calendars]);

  const getConnectionStatus = useCallback(() => {
    if (isLoadingCalendars || isConnecting) return 'connecting';
    if (calendarsError) return 'error';
    if (calendars.length > 0) return 'connected';
    return 'disconnected';
  }, [isLoadingCalendars, isConnecting, calendarsError, calendars]);

  const selectCalendar = useCallback((calendarId: string) => {
    setSelectedCalendarId(calendarId);
  }, []);

  const getSelectedCalendar = useCallback(() => {
    return calendars.find(cal => cal.id === selectedCalendarId) || calendars.find(cal => cal.primary) || calendars[0];
  }, [calendars, selectedCalendarId]);

  return {
    // Data
    calendars,
    selectedCalendarId,
    selectedCalendar: getSelectedCalendar(),

    // Status
    isConnected: isConnected(),
    connectionStatus: getConnectionStatus(),
    isConnecting,
    
    // Loading states
    isLoadingCalendars,
    isSyncing: syncMutation.isPending,
    isCreatingEvent: createEventMutation.isPending,
    isUpdatingEvent: updateEventMutation.isPending,
    isDeletingEvent: deleteEventMutation.isPending,

    // Error states
    error: calendarsError,

    // Actions
    connectToGoogle,
    syncCalendar,
    createEvent,
    updateEvent,
    deleteEvent,
    selectCalendar,

    // Utilities
    refetch: refetchCalendars,
  };
}