# Settings & User Preferences System

## Overview

The Ultimate Digital Planner includes a comprehensive settings and user preferences system that allows users to customize their experience across all aspects of the application. The system is built with React Context, custom hooks, and real-time synchronization.

## Architecture

### Core Components

#### User Preferences Hook (`@/hooks/use-user-preferences.tsx`)
- **Centralized State Management**: Global context provider for all user preferences
- **Type-Safe Configuration**: Comprehensive TypeScript interfaces for all settings
- **Real-time Sync**: Automatic synchronization with backend API
- **Optimistic Updates**: Immediate UI updates with fallback on errors
- **Specialized Hooks**: Convenience hooks for specific preference sections

#### Settings Pages
- **Main Settings (`@/app/settings/SettingsClient.tsx`)**: Comprehensive settings interface
- **Productivity Settings (`@/components/settings/ProductivitySettings.tsx`)**: Advanced productivity configuration

#### API Endpoints
- **`/api/user/settings`**: GET/PUT endpoints for user settings management
- **Database Integration**: Stores settings in user table with JSON fields
- **User Service**: Service layer for settings management (`@/lib/auth/user-service.ts`)

## Feature Categories

### 1. Appearance Settings
```typescript
appearance: {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  compactMode: boolean;
}
```

**Features:**
- **Theme Management**: Light, dark, and system preference detection
- **Accent Colors**: Customizable brand colors throughout the app
- **Accessibility**: Font size control and reduced motion options
- **Layout Options**: Compact mode for information density

### 2. Notification Settings
```typescript
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
}
```

**Features:**
- **Multi-Channel Notifications**: Email, push, and in-app preferences
- **Granular Control**: Individual toggles for different notification types
- **Quiet Hours**: Time-based notification suppression
- **Smart Scheduling**: Respects user working hours and preferences

### 3. Productivity Settings
```typescript
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
}
```

**Features:**
- **Pomodoro Timer Configuration**: Customizable focus and break intervals
- **Automatic Timer Management**: Auto-start options for seamless workflow
- **Daily Goals**: Focus hour targets with progress tracking
- **Working Hours**: Configurable work schedule for better time management
- **Visual Insights**: Real-time calculations and productivity metrics

### 4. Privacy Settings
```typescript
privacy: {
  profileVisibility: 'public' | 'team' | 'private';
  activityStatus: boolean;
  dataSharing: boolean;
  analyticsTracking: boolean;
  showOnlineStatus: boolean;
}
```

**Features:**
- **Profile Visibility Control**: Granular privacy levels
- **Activity Tracking**: Control over online status and activity visibility
- **Data Management**: Opt-in/out of data sharing and analytics
- **Team Collaboration**: Balance privacy with collaboration needs

### 5. Calendar Settings
```typescript
calendar: {
  defaultView: 'month' | 'week' | 'day' | 'agenda';
  weekStart: 'sunday' | 'monday';
  timeFormat: '12h' | '24h';
  showWeekends: boolean;
  showDeclinedEvents: boolean;
  timeZone: string;
}
```

**Features:**
- **View Preferences**: Default calendar views and layouts
- **Localization**: Week start, time format, and timezone settings
- **Event Filtering**: Control over event visibility
- **Cultural Adaptation**: Automatic timezone detection and formatting

### 6. AI Settings
```typescript
ai: {
  enabled: boolean;
  autoSuggestions: boolean;
  smartScheduling: boolean;
  naturalLanguageInput: boolean;
  learningFromBehavior: boolean;
  personalizedInsights: boolean;
}
```

**Features:**
- **AI Feature Toggle**: Master switch for AI functionality
- **Smart Automation**: Auto-suggestions and intelligent scheduling
- **Natural Language**: Voice and text input processing
- **Learning Preferences**: Control over behavioral learning and insights
- **Personalization**: Custom AI recommendations

## Usage Examples

### Basic Settings Management
```typescript
import { useUserPreferences } from '@/hooks/use-user-preferences';

function MyComponent() {
  const { preferences, updatePreference } = useUserPreferences();

  const toggleDarkMode = async () => {
    await updatePreference('appearance', {
      theme: preferences.appearance.theme === 'dark' ? 'light' : 'dark'
    });
  };

  return (
    <button onClick={toggleDarkMode}>
      {preferences.appearance.theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

### Specialized Hooks
```typescript
import { useTheme, useNotificationPreferences } from '@/hooks/use-user-preferences';

function ThemeSelector() {
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  
  return (
    <div>
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
      
      <input
        type="color"
        value={accentColor}
        onChange={(e) => setAccentColor(e.target.value)}
      />
    </div>
  );
}

function NotificationSettings() {
  const { notifications, updateNotifications } = useNotificationPreferences();
  
  const toggleEmailReminders = () => {
    updateNotifications({
      email: {
        ...notifications.email,
        taskReminders: !notifications.email.taskReminders
      }
    });
  };
  
  return (
    <label>
      <input
        type="checkbox"
        checked={notifications.email.taskReminders}
        onChange={toggleEmailReminders}
      />
      Email Task Reminders
    </label>
  );
}
```

### Advanced Productivity Configuration
```typescript
import { ProductivitySettings } from '@/components/settings/ProductivitySettings';

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <ProductivitySettings />
    </div>
  );
}
```

## Integration Points

### Theme System Integration
The preferences system automatically applies theme changes to the DOM:

```typescript
const applyTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
  const root = document.documentElement;
  
  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.classList.toggle('dark', systemTheme === 'dark');
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}, []);
```

### Real-time Notifications
Settings changes trigger real-time updates via the collaboration system:

```typescript
// When notification preferences change, update real-time subscriptions
useEffect(() => {
  if (preferences.notifications.inApp.sounds) {
    enableNotificationSounds();
  } else {
    disableNotificationSounds();
  }
}, [preferences.notifications.inApp.sounds]);
```

### Calendar Integration
Calendar preferences automatically affect calendar views:

```typescript
// Calendar component respects user preferences
const { calendar } = useCalendarPreferences();

<Calendar
  defaultView={calendar.defaultView}
  weekStartsOn={calendar.weekStart === 'sunday' ? 0 : 1}
  timeFormat={calendar.timeFormat}
  showWeekends={calendar.showWeekends}
/>
```

## Productivity Features

### Pomodoro Timer Integration
The productivity settings directly control the Pomodoro timer behavior:

```typescript
const { productivity } = useProductivityPreferences();

// Timer configuration from settings
const pomodoroTimer = new PomodoroTimer({
  focusLength: productivity.pomodoroLength,
  shortBreak: productivity.shortBreakLength,
  longBreak: productivity.longBreakLength,
  autoStartBreaks: productivity.autoStartBreaks,
  autoStartPomodoros: productivity.autoStartPomodoros
});
```

### Working Hours Enforcement
The system respects working hours across the application:

```typescript
const { productivity } = useProductivityPreferences();

const isWorkingHours = () => {
  if (!productivity.workingHours.enabled) return true;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const startTime = parseTimeString(productivity.workingHours.start);
  const endTime = parseTimeString(productivity.workingHours.end);
  
  return currentTime >= startTime && currentTime <= endTime;
};

// Use in scheduling and notifications
if (isWorkingHours() && shouldShowNotification) {
  showNotification();
}
```

### Daily Goal Tracking
The productivity system tracks progress against daily goals:

```typescript
const { productivity } = useProductivityPreferences();

const dailyProgress = {
  target: productivity.dailyGoal,
  actual: getTodaysFocusHours(),
  sessionsNeeded: Math.ceil((productivity.dailyGoal * 60) / productivity.pomodoroLength),
  sessionsCompleted: getTodaysCompletedSessions()
};
```

## Data Persistence

### Database Schema
Settings are stored in the users table:

```sql
users {
  id: uuid
  settings: jsonb  -- General application settings
  aiSettings: jsonb  -- AI-specific settings
  timezone: string
  locale: string
  updatedAt: timestamp
}
```

### API Integration
Settings sync with the backend through RESTful endpoints:

```typescript
// GET /api/user/settings
{
  settings: {
    appearance: { theme: 'dark', accentColor: '#3b82f6' },
    notifications: { email: { taskReminders: true } },
    // ... other settings
  },
  aiSettings: {
    enabled: true,
    autoSuggestions: true,
    // ... AI-specific settings
  },
  timezone: 'America/New_York',
  locale: 'en-US'
}

// PUT /api/user/settings
{
  settings: {
    appearance: { theme: 'light' }
  }
}
```

## Performance Optimizations

### Optimistic Updates
Settings changes are applied immediately to the UI before API confirmation:

```typescript
const updatePreference = async (section, updates) => {
  // Apply change immediately
  setPreferences(prev => ({ ...prev, [section]: { ...prev[section], ...updates } }));
  
  try {
    await saveToAPI(section, updates);
    toast.success('Settings saved');
  } catch (error) {
    // Revert on failure
    await loadPreferences();
    toast.error('Failed to save settings');
  }
};
```

### Selective Loading
Only necessary settings sections are loaded and updated:

```typescript
// Load only what's needed
const { appearance } = useTheme();  // Only loads appearance settings
const { notifications } = useNotificationPreferences();  // Only notifications
```

### Caching Strategy
Settings are cached in memory and localStorage for quick access:

```typescript
// Cache settings for offline access
useEffect(() => {
  if (preferences) {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  }
}, [preferences]);

// Load from cache on startup
useEffect(() => {
  const cached = localStorage.getItem('userPreferences');
  if (cached) {
    setPreferences(JSON.parse(cached));
  }
  loadFromAPI(); // Then sync with server
}, []);
```

## Accessibility Features

### High Contrast Mode
Appearance settings include accessibility options:

```typescript
const { reducedMotion, fontSize } = useTheme();

<div className={cn(
  'transition-all',
  reducedMotion && 'transition-none',
  fontSize === 'large' && 'text-lg',
  fontSize === 'small' && 'text-sm'
)}>
  Content
</div>
```

### Keyboard Navigation
Settings pages are fully keyboard accessible:

```typescript
<Button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      toggleSetting();
    }
  }}
  role="switch"
  aria-checked={isEnabled}
>
  Toggle Setting
</Button>
```

### Screen Reader Support
All settings include proper ARIA labels and descriptions:

```typescript
<Switch
  id="notifications"
  checked={enabled}
  onCheckedChange={setEnabled}
  aria-labelledby="notifications-label"
  aria-describedby="notifications-description"
/>
<Label id="notifications-label">Email Notifications</Label>
<p id="notifications-description">
  Receive email notifications for important updates
</p>
```

## Security Considerations

### Data Validation
All settings are validated on both client and server:

```typescript
const settingsSchema = {
  appearance: {
    theme: ['light', 'dark', 'system'],
    fontSize: ['small', 'medium', 'large']
  },
  productivity: {
    pomodoroLength: { min: 15, max: 60 },
    dailyGoal: { min: 1, max: 16 }
  }
};

const validateSettings = (settings) => {
  // Validate against schema
  return isValid;
};
```

### Privacy Protection
Sensitive settings are handled carefully:

```typescript
// Never log or expose sensitive preferences
const sanitizeForLogging = (preferences) => {
  const { privacy, ...safe } = preferences;
  return safe;
};

Logger.info('Settings updated', sanitizeForLogging(preferences));
```

### Permission Checks
Some settings require specific permissions:

```typescript
const updateAISettings = async (settings) => {
  const user = await getCurrentUser();
  if (!user.subscription.features.includes('ai')) {
    throw new Error('AI features not available in current plan');
  }
  
  await saveSettings({ aiSettings: settings });
};
```

## Testing

### Unit Tests
```typescript
describe('useUserPreferences', () => {
  it('should update appearance settings', async () => {
    const { result } = renderHook(() => useUserPreferences());
    
    await act(async () => {
      await result.current.updatePreference('appearance', { theme: 'dark' });
    });
    
    expect(result.current.preferences.appearance.theme).toBe('dark');
  });
});
```

### Integration Tests
```typescript
describe('Settings API', () => {
  it('should save and retrieve user settings', async () => {
    const settings = { appearance: { theme: 'dark' } };
    
    await request(app)
      .put('/api/user/settings')
      .send({ settings })
      .expect(200);
    
    const response = await request(app)
      .get('/api/user/settings')
      .expect(200);
    
    expect(response.body.settings.appearance.theme).toBe('dark');
  });
});
```

## Future Enhancements

### Planned Features
1. **Settings Import/Export**: Backup and restore settings
2. **Team Settings**: Shared workspace preferences
3. **Advanced Scheduling**: Complex working hour patterns
4. **Wellness Integration**: Break reminders and health metrics
5. **Custom Themes**: User-created color schemes
6. **Settings Sync**: Cross-device synchronization
7. **Conditional Settings**: Context-aware preferences

### Extensibility
The settings system is designed for easy extension:

```typescript
// Add new setting category
interface ExtendedPreferences extends UserPreferences {
  wellness: {
    breakReminders: boolean;
    stretchAlerts: boolean;
    hydrationReminders: boolean;
  };
}

// Extend the hook
const useWellnessPreferences = () => {
  const { preferences, updatePreference } = useUserPreferences();
  return {
    wellness: preferences.wellness,
    updateWellness: (updates) => updatePreference('wellness', updates)
  };
};
```

The settings and user preferences system provides a comprehensive, flexible, and user-friendly way to customize the Ultimate Digital Planner experience while maintaining performance, accessibility, and security standards.