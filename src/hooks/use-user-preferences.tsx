'use client';

import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { toast } from 'sonner';

export interface UserPreferences {
  appearance: {
    theme: 'light' | 'dark' | 'system';
    accentColor: string;
    fontSize: 'small' | 'medium' | 'large';
    reducedMotion: boolean;
    compactMode: boolean;
  };
  notifications: {
    email: {
      taskReminders: boolean;
      dailyDigest: boolean;
      weeklyReport: boolean;
      achievements: boolean;
      mentions: boolean;
    };
    push: {
      taskReminders: boolean;
      mentions: boolean;
      updates: boolean;
      breakReminders: boolean;
    };
    inApp: {
      sounds: boolean;
      badges: boolean;
      popups: boolean;
    };
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
      days: string[];
    };
  };
  productivity: {
    pomodoroLength: number;
    shortBreakLength: number;
    longBreakLength: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    dailyGoal: number;
    workingHours: {
      enabled: boolean;
      start: string;
      end: string;
      days: string[];
    };
  };
  privacy: {
    profileVisibility: 'public' | 'team' | 'private';
    activityStatus: boolean;
    dataSharing: boolean;
    analyticsTracking: boolean;
    showOnlineStatus: boolean;
  };
  calendar: {
    defaultView: 'month' | 'week' | 'day' | 'agenda';
    weekStart: 'sunday' | 'monday';
    timeFormat: '12h' | '24h';
    showWeekends: boolean;
    showDeclinedEvents: boolean;
    timeZone: string;
  };
  ai: {
    enabled: boolean;
    autoSuggestions: boolean;
    smartScheduling: boolean;
    naturalLanguageInput: boolean;
    learningFromBehavior: boolean;
    personalizedInsights: boolean;
  };
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  loading: boolean;
  updatePreference: <K extends keyof UserPreferences>(
    section: K,
    updates: Partial<UserPreferences[K]>
  ) => Promise<boolean>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<boolean>;
  resetToDefaults: () => Promise<boolean>;
  exportPreferences: () => UserPreferences;
  importPreferences: (prefs: Partial<UserPreferences>) => Promise<boolean>;
}

const defaultPreferences: UserPreferences = {
  appearance: {
    theme: 'system',
    accentColor: 'blue',
    fontSize: 'medium',
    reducedMotion: false,
    compactMode: false,
  },
  notifications: {
    email: {
      taskReminders: true,
      dailyDigest: false,
      weeklyReport: true,
      achievements: true,
      mentions: true,
    },
    push: {
      taskReminders: true,
      mentions: true,
      updates: false,
      breakReminders: true,
    },
    inApp: {
      sounds: true,
      badges: true,
      popups: true,
    },
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    },
  },
  productivity: {
    pomodoroLength: 25,
    shortBreakLength: 5,
    longBreakLength: 15,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    dailyGoal: 8,
    workingHours: {
      enabled: true,
      start: '09:00',
      end: '17:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    },
  },
  privacy: {
    profileVisibility: 'team',
    activityStatus: true,
    dataSharing: false,
    analyticsTracking: true,
    showOnlineStatus: true,
  },
  calendar: {
    defaultView: 'month',
    weekStart: 'monday',
    timeFormat: '12h',
    showWeekends: true,
    showDeclinedEvents: false,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  ai: {
    enabled: true,
    autoSuggestions: true,
    smartScheduling: true,
    naturalLanguageInput: true,
    learningFromBehavior: true,
    personalizedInsights: true,
  },
};

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/settings');
      
      if (response.ok) {
        const data = await response.json();
        
        // Merge API data with defaults to ensure all fields exist
        const mergedPreferences = {
          appearance: { ...defaultPreferences.appearance, ...data.settings?.appearance },
          notifications: { 
            ...defaultPreferences.notifications, 
            ...data.settings?.notifications,
            email: { ...defaultPreferences.notifications.email, ...data.settings?.notifications?.email },
            push: { ...defaultPreferences.notifications.push, ...data.settings?.notifications?.push },
            inApp: { ...defaultPreferences.notifications.inApp, ...data.settings?.notifications?.inApp },
            quietHours: { ...defaultPreferences.notifications.quietHours, ...data.settings?.notifications?.quietHours },
          },
          productivity: { 
            ...defaultPreferences.productivity, 
            ...data.settings?.productivity,
            workingHours: { ...defaultPreferences.productivity.workingHours, ...data.settings?.productivity?.workingHours },
          },
          privacy: { ...defaultPreferences.privacy, ...data.settings?.privacy },
          calendar: { ...defaultPreferences.calendar, ...data.settings?.calendar },
          ai: { ...defaultPreferences.ai, ...data.aiSettings },
        };
        
        setPreferences(mergedPreferences);
        
        // Apply theme immediately
        applyTheme(mergedPreferences.appearance.theme);
      } else if (response.status === 401) {
        // Authentication required - use defaults and skip error message
        console.log('Authentication required for preferences, using defaults');
        setPreferences(defaultPreferences);
        applyTheme(defaultPreferences.appearance.theme);
      } else {
        // Other errors
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      // Only show error toast for non-auth errors
      if (error instanceof Error && !error.message.includes('401')) {
        toast.error('Failed to load user preferences');
      }
      // Always fall back to defaults
      setPreferences(defaultPreferences);
      applyTheme(defaultPreferences.appearance.theme);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, []);

  const updatePreference = useCallback(async <K extends keyof UserPreferences>(
    section: K,
    updates: Partial<UserPreferences[K]>
  ): Promise<boolean> => {
    try {
      const updatedSection = { ...preferences[section], ...updates };
      const updatedPreferences = { ...preferences, [section]: updatedSection };
      
      // Optimistic update
      setPreferences(updatedPreferences);
      
      // Apply theme changes immediately
      if (section === 'appearance' && 'theme' in updates) {
        applyTheme((updates as any).theme);
      }
      
      // Send to API
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: { [section]: updatedSection },
          ...(section === 'ai' && { aiSettings: updatedSection })
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }
      
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} preferences saved`);
      return true;
      
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error('Failed to save preferences');
      
      // Revert optimistic update
      await loadPreferences();
      return false;
    }
  }, [preferences, applyTheme, loadPreferences]);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>): Promise<boolean> => {
    try {
      const updatedPreferences = { ...preferences, ...updates };
      
      // Optimistic update
      setPreferences(updatedPreferences);
      
      // Apply theme changes immediately
      if (updates.appearance?.theme) {
        applyTheme(updates.appearance.theme);
      }
      
      // Prepare API payload
      const { ai, ...settings } = updates;
      const payload: any = {};
      
      if (Object.keys(settings).length > 0) {
        payload.settings = settings;
      }
      
      if (ai) {
        payload.aiSettings = ai;
      }
      
      // Send to API
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }
      
      toast.success('Preferences saved successfully');
      return true;
      
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error('Failed to save preferences');
      
      // Revert optimistic update
      await loadPreferences();
      return false;
    }
  }, [preferences, applyTheme, loadPreferences]);

  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    return await updatePreferences(defaultPreferences);
  }, [updatePreferences]);

  const exportPreferences = useCallback((): UserPreferences => {
    return JSON.parse(JSON.stringify(preferences));
  }, [preferences]);

  const importPreferences = useCallback(async (prefs: Partial<UserPreferences>): Promise<boolean> => {
    return await updatePreferences(prefs);
  }, [updatePreferences]);

  const value: UserPreferencesContextType = {
    preferences,
    loading,
    updatePreference,
    updatePreferences,
    resetToDefaults,
    exportPreferences,
    importPreferences,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}

// Convenience hooks for specific preference sections
export function useTheme() {
  const { preferences, updatePreference } = useUserPreferences();
  return {
    theme: preferences.appearance.theme,
    accentColor: preferences.appearance.accentColor,
    fontSize: preferences.appearance.fontSize,
    reducedMotion: preferences.appearance.reducedMotion,
    compactMode: preferences.appearance.compactMode,
    setTheme: (theme: 'light' | 'dark' | 'system') => 
      updatePreference('appearance', { theme }),
    setAccentColor: (color: string) => 
      updatePreference('appearance', { accentColor: color }),
    setFontSize: (size: 'small' | 'medium' | 'large') => 
      updatePreference('appearance', { fontSize: size }),
    toggleReducedMotion: () => 
      updatePreference('appearance', { reducedMotion: !preferences.appearance.reducedMotion }),
    toggleCompactMode: () => 
      updatePreference('appearance', { compactMode: !preferences.appearance.compactMode }),
  };
}

export function useNotificationPreferences() {
  const { preferences, updatePreference } = useUserPreferences();
  return {
    notifications: preferences.notifications,
    updateNotifications: (updates: Partial<UserPreferences['notifications']>) =>
      updatePreference('notifications', updates),
  };
}

export function useProductivityPreferences() {
  const { preferences, updatePreference } = useUserPreferences();
  return {
    productivity: preferences.productivity,
    updateProductivity: (updates: Partial<UserPreferences['productivity']>) =>
      updatePreference('productivity', updates),
  };
}

export function usePrivacyPreferences() {
  const { preferences, updatePreference } = useUserPreferences();
  return {
    privacy: preferences.privacy,
    updatePrivacy: (updates: Partial<UserPreferences['privacy']>) =>
      updatePreference('privacy', updates),
  };
}

export function useCalendarPreferences() {
  const { preferences, updatePreference } = useUserPreferences();
  return {
    calendar: preferences.calendar,
    updateCalendar: (updates: Partial<UserPreferences['calendar']>) =>
      updatePreference('calendar', updates),
  };
}

export function useAIPreferences() {
  const { preferences, updatePreference } = useUserPreferences();
  return {
    ai: preferences.ai,
    updateAI: (updates: Partial<UserPreferences['ai']>) =>
      updatePreference('ai', updates),
  };
}