# Keyboard Shortcuts & Command Palette

The Ultimate Digital Planner includes a comprehensive keyboard shortcuts system and command palette for power users to navigate and interact with the application efficiently.

## Command Palette

Access the command palette with **⌘K** (Mac) or **Ctrl+K** (Windows/Linux). The command palette provides:

- **Search commands**: Type to search all available commands
- **Navigation**: Quick access to all pages and sections
- **Actions**: Perform common tasks without using the mouse
- **Tools**: Access advanced features and utilities

## Global Shortcuts

### Navigation
- `G` → `D`: Go to Dashboard
- `G` → `T`: Go to Tasks
- `G` → `G`: Go to Goals  
- `G` → `H`: Go to Habits
- `G` → `C`: Go to Calendar
- `G` → `S`: Go to Settings
- `T`: Go to Templates

### Quick Actions
- `N`: New Task/Item (Quick Add dialog)
- `⌘N` / `Ctrl+N`: Quick Add dialog
- `⌘K` / `Ctrl+K`: Command Palette
- `/`: Focus Search
- `?`: Show Shortcuts Help

### Editing
- `⌘Z` / `Ctrl+Z`: Undo
- `⌘⇧Z` / `Ctrl+Shift+Z`: Redo
- `Escape`: Close Dialog/Modal
- `Enter`: Submit Form

## Context-Specific Shortcuts

### Task Lists
- `J` / `↓`: Move down in list
- `K` / `↑`: Move up in list
- `Enter`: Select/Open item
- `Space`: Toggle completion
- `Home`: Go to first item
- `End`: Go to last item

### Task Actions
- `E`: Edit task
- `D`: Duplicate task
- `Backspace` / `Delete`: Delete task
- `⌘Enter` / `Ctrl+Enter`: Mark complete

### Forms
- `⌘Enter` / `Ctrl+Enter`: Submit form
- `⌘S` / `Ctrl+S`: Save changes
- `Escape`: Cancel/Close

### Calendar
- `T`: Go to Today
- `←`: Previous period
- `→`: Next period
- `1`: Day view
- `2`: Week view
- `3`: Month view

## Command Palette Commands

The command palette includes organized command groups:

### Navigation
- Go to Dashboard
- Go to Tasks
- Go to Goals
- Go to Habits
- Go to Calendar
- Go to Templates
- Go to Settings
- Go to Analytics

### Quick Actions
- Create New Task
- Create New Goal
- Create New Habit
- Quick Capture with AI
- New Calendar Event

### Tools
- AI Suggestions
- View Analytics
- Export Data
- Import Data
- Sync Data

### Admin (when applicable)
- Admin Dashboard
- User Management
- System Settings

## Component Integration

### ShortcutsProvider
Global provider that manages keyboard shortcuts state and renders modals:
```tsx
import { ShortcutsProvider } from '@/providers/shortcuts-provider'

// Wrap your app with ShortcutsProvider
<ShortcutsProvider>
  {children}
</ShortcutsProvider>
```

### CommandPaletteTrigger
Reusable trigger component for the command palette:
```tsx
import { CommandPaletteTrigger } from '@/components/shortcuts/CommandPaletteTrigger'

<CommandPaletteTrigger />
<CommandPaletteTrigger variant="ghost" size="sm">
  Search
</CommandPaletteTrigger>
```

### Hooks
- `useKeyboardShortcuts()`: Global shortcuts management
- `useTaskShortcuts()`: Task-specific shortcuts
- `useFormShortcuts()`: Form-specific shortcuts
- `useListNavigation()`: List navigation shortcuts
- `useCalendarShortcuts()`: Calendar-specific shortcuts

## Customization

### Adding New Shortcuts
1. Update `useKeyboardShortcuts.ts` to add the hotkey binding
2. Update the shortcuts array for help documentation
3. Add to appropriate command groups in CommandPalette

### Custom Command Groups
Commands are organized by sections:
- Navigation
- Quick Actions
- Tools
- Admin
- Context-specific

### Accessibility
- All shortcuts work with screen readers
- Visual indicators for keyboard focus
- Escape key support for all modals
- ARIA labels and descriptions

## Performance
- Command palette is lazy-loaded on first use
- Keyboard shortcuts are registered only when needed
- Efficient event handling with cleanup
- Optimized search and filtering

## Browser Support
- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support
- Mobile: Touch-friendly alternatives available

## Tips for Power Users
1. Use `⌘K` frequently for fastest navigation
2. Remember the `G` + letter navigation pattern
3. Use `/` to focus search inputs anywhere
4. `?` shows shortcuts help from any page
5. `N` for quick task creation
6. `Escape` closes any dialog or modal

The shortcuts system is designed to speed up your workflow and make the Ultimate Digital Planner feel like a native desktop application.