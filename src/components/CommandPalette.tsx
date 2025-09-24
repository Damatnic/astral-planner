'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  CalendarDays,
  CheckSquare,
  FileText,
  Home,
  Inbox,
  LineChart,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Target,
  User,
  Zap,
  Clock,
  Hash,
  Star,
  Archive,
  Trash2,
  Copy,
  Link,
  Share2,
  Download,
  Upload,
  RefreshCw,
  HelpCircle,
  MessageSquare,
  Bell,
  Palette,
  Globe,
  Shield,
  CreditCard
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from '@/components/ui/use-toast';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: any;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  // Command items organized by groups
  const quickActions: CommandItem[] = [
    {
      id: 'new-task',
      title: 'New Task',
      description: 'Create a new task',
      icon: Plus,
      shortcut: 'T',
      action: () => {
        setOpen(false);
        // Open new task dialog
        toast({ title: 'Opening new task dialog...' });
      },
      keywords: ['create', 'add', 'todo']
    },
    {
      id: 'new-note',
      title: 'New Note',
      description: 'Create a quick note',
      icon: FileText,
      shortcut: 'N',
      action: () => {
        setOpen(false);
        toast({ title: 'Opening new note...' });
      },
      keywords: ['create', 'add', 'memo']
    },
    {
      id: 'new-event',
      title: 'New Event',
      description: 'Schedule an event',
      icon: CalendarDays,
      shortcut: 'E',
      action: () => {
        setOpen(false);
        toast({ title: 'Opening calendar event...' });
      },
      keywords: ['schedule', 'calendar', 'meeting']
    },
    {
      id: 'quick-capture',
      title: 'Quick Capture',
      description: 'Capture thoughts with AI',
      icon: Zap,
      shortcut: 'Space',
      action: () => {
        setOpen(false);
        toast({ title: 'Opening quick capture...' });
      },
      keywords: ['ai', 'natural', 'language']
    }
  ];

  const navigation: CommandItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: Home,
      shortcut: 'D',
      action: () => {
        setOpen(false);
        router.push('/dashboard');
      },
      keywords: ['home', 'overview']
    },
    {
      id: 'tasks',
      title: 'Tasks',
      icon: CheckSquare,
      action: () => {
        setOpen(false);
        router.push('/tasks');
      },
      keywords: ['todo', 'work']
    },
    {
      id: 'calendar',
      title: 'Calendar',
      icon: CalendarDays,
      shortcut: 'C',
      action: () => {
        setOpen(false);
        router.push('/calendar');
      },
      keywords: ['schedule', 'events']
    },
    {
      id: 'goals',
      title: 'Goals',
      icon: Target,
      shortcut: 'G',
      action: () => {
        setOpen(false);
        router.push('/goals');
      },
      keywords: ['objectives', 'targets']
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: LineChart,
      shortcut: 'A',
      action: () => {
        setOpen(false);
        router.push('/analytics');
      },
      keywords: ['stats', 'metrics', 'insights']
    },
    {
      id: 'inbox',
      title: 'Inbox',
      icon: Inbox,
      shortcut: 'I',
      action: () => {
        setOpen(false);
        router.push('/inbox');
      },
      keywords: ['messages', 'notifications']
    }
  ];

  const taskActions: CommandItem[] = [
    {
      id: 'mark-complete',
      title: 'Mark as Complete',
      icon: CheckSquare,
      action: () => {
        setOpen(false);
        toast({ title: 'Task marked as complete' });
      },
      keywords: ['done', 'finish']
    },
    {
      id: 'set-priority',
      title: 'Set Priority',
      icon: Star,
      action: () => {
        setOpen(false);
        toast({ title: 'Opening priority selector...' });
      },
      keywords: ['urgent', 'important']
    },
    {
      id: 'add-due-date',
      title: 'Add Due Date',
      icon: Clock,
      action: () => {
        setOpen(false);
        toast({ title: 'Opening date picker...' });
      },
      keywords: ['deadline', 'schedule']
    },
    {
      id: 'add-tags',
      title: 'Add Tags',
      icon: Hash,
      action: () => {
        setOpen(false);
        toast({ title: 'Opening tag selector...' });
      },
      keywords: ['label', 'category']
    },
    {
      id: 'archive-task',
      title: 'Archive Task',
      icon: Archive,
      action: () => {
        setOpen(false);
        toast({ title: 'Task archived' });
      },
      keywords: ['hide', 'store']
    }
  ];

  const settings: CommandItem[] = [
    {
      id: 'preferences',
      title: 'Preferences',
      icon: Settings,
      shortcut: ',',
      action: () => {
        setOpen(false);
        router.push('/settings');
      },
      keywords: ['settings', 'config']
    },
    {
      id: 'theme-toggle',
      title: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => {
        setOpen(false);
        setTheme(theme === 'dark' ? 'light' : 'dark');
      },
      keywords: ['theme', 'appearance']
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      icon: Bell,
      action: () => {
        setOpen(false);
        router.push('/settings?tab=notifications');
      },
      keywords: ['alerts', 'reminders']
    },
    {
      id: 'integrations',
      title: 'Integrations',
      icon: Link,
      action: () => {
        setOpen(false);
        router.push('/settings?tab=integrations');
      },
      keywords: ['connect', 'sync']
    },
    {
      id: 'billing',
      title: 'Billing',
      icon: CreditCard,
      action: () => {
        setOpen(false);
        router.push('/settings?tab=billing');
      },
      keywords: ['payment', 'subscription']
    }
  ];

  const dataActions: CommandItem[] = [
    {
      id: 'export-data',
      title: 'Export Data',
      icon: Download,
      action: () => {
        setOpen(false);
        toast({ title: 'Preparing data export...' });
      },
      keywords: ['backup', 'download']
    },
    {
      id: 'import-data',
      title: 'Import Data',
      icon: Upload,
      action: () => {
        setOpen(false);
        toast({ title: 'Opening import dialog...' });
      },
      keywords: ['upload', 'restore']
    },
    {
      id: 'sync-data',
      title: 'Sync Data',
      icon: RefreshCw,
      action: () => {
        setOpen(false);
        toast({ title: 'Syncing data...' });
      },
      keywords: ['refresh', 'update']
    },
    {
      id: 'share',
      title: 'Share',
      icon: Share2,
      action: () => {
        setOpen(false);
        toast({ title: 'Opening share dialog...' });
      },
      keywords: ['collaborate', 'send']
    }
  ];

  const help: CommandItem[] = [
    {
      id: 'help-center',
      title: 'Help Center',
      icon: HelpCircle,
      shortcut: '?',
      action: () => {
        setOpen(false);
        window.open('/help', '_blank');
      },
      keywords: ['docs', 'documentation']
    },
    {
      id: 'feedback',
      title: 'Send Feedback',
      icon: MessageSquare,
      action: () => {
        setOpen(false);
        toast({ title: 'Opening feedback form...' });
      },
      keywords: ['suggest', 'report']
    },
    {
      id: 'logout',
      title: 'Log Out',
      icon: LogOut,
      action: () => {
        setOpen(false);
        toast({ title: 'Logging out...' });
      },
      keywords: ['signout', 'exit']
    }
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      
      // Quick actions with Alt key
      if (e.altKey && !open) {
        switch(e.key.toLowerCase()) {
          case 't':
            e.preventDefault();
            quickActions[0].action();
            break;
          case 'n':
            e.preventDefault();
            quickActions[1].action();
            break;
          case 'e':
            e.preventDefault();
            quickActions[2].action();
            break;
        }
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open]);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-between rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full max-w-sm text-muted-foreground"
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search commands...
        </span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Type a command or search..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Quick Actions">
            {quickActions.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => runCommand(item.action)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <div className="flex-1">
                  <div>{item.title}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  )}
                </div>
                {item.shortcut && (
                  <CommandShortcut>Alt+{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Navigation">
            {navigation.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => runCommand(item.action)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
                {item.shortcut && (
                  <CommandShortcut>⌘{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Task Actions">
            {taskActions.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => runCommand(item.action)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Settings">
            {settings.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => runCommand(item.action)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
                {item.shortcut && (
                  <CommandShortcut>⌘{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Data">
            {dataActions.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => runCommand(item.action)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Help">
            {help.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => runCommand(item.action)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
                {item.shortcut && (
                  <CommandShortcut>{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}