# Quick Capture System

The Ultimate Digital Planner features a powerful quick capture system that allows users to rapidly create tasks, events, goals, habits, and notes using natural language processing and AI.

## Features

### 🤖 AI-Powered Natural Language Processing
- Parse natural language input into structured data
- Extract dates, times, priorities, and durations automatically
- Smart type detection (task, event, goal, habit, note)
- Intelligent suggestions and completions

### 🎙️ Voice Input Support
- Speech-to-text integration using Web Speech API
- Visual feedback with animated recording indicator
- Hands-free capture for better accessibility

### ⚡ Command Shortcuts
- `/task` - Create a task
- `/event` - Schedule an event
- `/goal` - Set a goal
- `/note` - Save a note
- `/time` - Create a time block
- `/habit` - Start tracking a habit

### 🎯 Smart Parsing
- **Time Recognition**: "tomorrow at 2pm", "next week", "in 30 minutes"
- **Priority Detection**: "urgent", "important", "asap" → high/urgent priority
- **Duration Extraction**: "30 mins", "2 hours" → estimated duration
- **Tag Recognition**: "#work #meeting" → automatic tags
- **Category Inference**: Meeting-related terms → "meeting" category

## API Endpoints

### `/api/ai/parse` - Natural Language Parsing
**POST** - Parse natural language input into structured task data

```typescript
interface ParseRequest {
  input: string;
  preview?: boolean; // For autocomplete suggestions
}

interface ParseResponse {
  parsed?: {
    type: 'task' | 'event' | 'goal' | 'habit' | 'note' | 'time';
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
    estimatedDuration?: number;
    tags?: string[];
    category?: string;
  };
  suggestion?: string; // For preview mode
  confidence: number;
}
```

### `/api/ai/suggest` - Autocomplete Suggestions
**POST** - Generate contextual suggestions for partial input

```typescript
interface SuggestRequest {
  input: string; // Partial input text
}

interface SuggestResponse {
  suggestions: string[];
  confidence: number;
}
```

### `/api/ai/schedule` - Smart Scheduling
**POST** - Generate optimal schedule from tasks

```typescript
interface ScheduleRequest {
  tasks: Task[];
  preferences: {
    workingHours?: { start: string; end: string };
    breakDuration?: number;
    focusSessionLength?: number;
  };
}
```

### `/api/ai/analyze` - Productivity Analysis
**POST** - Analyze productivity data and provide insights

### `/api/tasks/quick` - Quick Item Creation
**POST** - Create tasks, events, goals, habits, or notes

```typescript
interface QuickCreateRequest {
  title: string;
  type: 'task' | 'event' | 'goal' | 'habit' | 'note' | 'time';
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  estimatedDuration?: number;
  tags?: string[];
  category?: string;
}
```

## Components

### `QuickCapture` - Main Input Component
Advanced input component with AI parsing, voice input, and command shortcuts.

```tsx
import { QuickCapture } from '@/components/quick-capture/QuickCapture';

<QuickCapture
  onSubmit={async (input, type) => {
    // Handle parsed input
  }}
  placeholder="Type naturally or use /commands..."
  showSuggestions={true}
/>
```

Features:
- Real-time AI suggestions with Tab completion
- Command palette with `/` shortcuts
- Voice input with visual feedback
- Smart auto-completion
- Keyboard navigation

### `QuickAdd` - Dialog Wrapper
Modal dialog that wraps QuickCapture for global access.

```tsx
import { QuickAdd } from '@/components/quick-add/QuickAdd';

<QuickAdd
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

### `QuickCaptureButton` - Trigger Buttons
Various button styles to trigger quick capture:

```tsx
import { 
  QuickCaptureButton, 
  AIQuickCaptureButton,
  VoiceQuickCaptureButton 
} from '@/components/quick-capture/QuickCaptureButton';

// Default button
<QuickCaptureButton />

// Floating action button
<QuickCaptureButton variant="floating" />

// Compact version
<QuickCaptureButton variant="compact" size="sm" />

// AI-focused prompt
<AIQuickCaptureButton />

// Voice-specific button (only shows if supported)
<VoiceQuickCaptureButton />
```

## Hooks

### `useAIParser` - AI Integration
Hook for accessing AI parsing functionality:

```tsx
import { useAIParser } from '@/hooks/useAIParser';

const {
  parseInput,
  getSuggestions,
  generateSchedule,
  analyzeProductivity,
  isLoading,
  isParsing
} = useAIParser();
```

### `useVoiceInput` - Speech Recognition
Hook for voice input functionality:

```tsx
import { useVoiceInput } from '@/hooks/useVoiceInput';

const {
  isListening,
  transcript,
  startListening,
  stopListening,
  isSupported
} = useVoiceInput({
  continuous: false,
  interimResults: true,
  language: 'en-US'
});
```

## Natural Language Examples

### Tasks
- "Review project proposal by Friday"
- "Call client about meeting tomorrow at 2pm"
- "Buy groceries milk eggs bread urgent"
- "Write blog post about AI for 2 hours"

### Events
- "Team meeting tomorrow at 10am for 1 hour"
- "Doctor appointment next Tuesday at 3pm"
- "Conference call with vendors Friday morning"

### Goals
- "Achieve 10,000 steps daily this month"
- "Complete certification course by end of quarter"
- "Save $5000 for vacation by summer"

### Habits
- "Meditate for 10 minutes every morning"
- "Read 30 pages daily before bed"
- "Exercise 3 times per week"

### Notes
- "Remember to backup database before deployment"
- "Ideas for next sprint: user authentication, mobile app"
- "Meeting notes: discussed Q4 budget allocation"

## Keyboard Shortcuts

- `N` - Open Quick Add dialog
- `⌘N` / `Ctrl+N` - Open Quick Add dialog
- `/` - Focus search or open commands
- `Tab` - Accept AI suggestion
- `Enter` - Submit input
- `Escape` - Close dialog
- `⌘K` / `Ctrl+K` - Command palette

## Integration with Shortcuts System

The quick capture system is fully integrated with the global shortcuts system:

```tsx
import { useShortcutsContext } from '@/providers/shortcuts-provider';

const { setShowQuickAdd } = useShortcutsContext();

// Programmatically open quick capture
setShowQuickAdd(true);
```

## Voice Input Support

### Browser Compatibility
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support (iOS 14.5+)
- ❌ Opera: Limited support

### Features
- Continuous listening mode
- Interim results for real-time feedback
- Multiple language support
- Automatic silence detection
- Error handling and recovery

## AI Parsing Intelligence

### Date & Time Recognition
- Relative: "tomorrow", "next week", "in 2 hours"
- Absolute: "January 15th", "3:30 PM", "2024-01-15"
- Natural: "end of month", "early next week"

### Priority Detection
- **Urgent**: "urgent", "asap", "critical", "emergency", "now"
- **High**: "important", "priority", "high", "soon"
- **Low**: "low", "later", "someday", "when possible"

### Duration Extraction
- "30 minutes", "2 hours", "1.5 hrs"
- "half an hour", "quarter hour"
- "all day", "quick task"

### Type Classification
- **Event**: "meeting", "appointment", "call", "demo"
- **Goal**: "achieve", "target", "reach", "accomplish"
- **Habit**: "daily", "everyday", "routine", "regularly"
- **Note**: "note", "remember", "idea", "memo"

## Error Handling

### Fallback Parsing
If AI parsing fails, the system falls back to:
1. Regular expression-based parsing
2. Basic keyword detection
3. Default values with user input as title

### Error Recovery
- Network errors: Graceful degradation to basic parsing
- API timeouts: Local processing fallback
- Invalid responses: User-friendly error messages

## Performance Optimizations

### Lazy Loading
- AI parsing only when needed
- Voice recognition on-demand initialization
- Debounced suggestion requests

### Caching
- Recent suggestions cached locally
- Parsed patterns remembered per session
- Voice recognition models cached

### Offline Support
- Basic parsing works offline
- Voice input continues to function
- Queued requests sync when online

## Accessibility

### Screen Reader Support
- Proper ARIA labels and descriptions
- Announced state changes
- Keyboard navigation support

### Keyboard Only Usage
- Full functionality via keyboard
- Visual focus indicators
- Logical tab order

### Voice Input Alternative
- Alternative to typing for users with mobility issues
- Visual feedback for hearing-impaired users
- Configurable voice commands

## Security & Privacy

### Data Handling
- Voice data processed client-side when possible
- No persistent storage of voice recordings
- AI parsing requests use secure HTTPS

### Privacy Considerations
- Optional voice input (can be disabled)
- Local processing preferred over cloud
- No personal data stored in AI requests

The Quick Capture system provides a seamless, intelligent way to capture ideas and tasks, making the Ultimate Digital Planner feel like a natural extension of the user's thought process.