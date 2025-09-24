'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/lib/hooks/use-toast'
import {
  Search, Home, CheckSquare, Target, Activity,
  Calendar, Settings, Plus, FileText, Users,
  BarChart3, Download, Upload, Zap, Brain
} from 'lucide-react'

interface Command {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action: () => void
  keywords: string[]
  section: string
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const { toast } = useToast()

  const commands: Command[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      description: 'View your productivity overview',
      icon: <Home className="h-4 w-4" />,
      action: () => router.push('/dashboard'),
      keywords: ['dashboard', 'home', 'overview'],
      section: 'Navigation',
    },
    {
      id: 'nav-tasks',
      title: 'Go to Tasks',
      description: 'Manage your tasks and projects',
      icon: <CheckSquare className="h-4 w-4" />,
      action: () => router.push('/tasks'),
      keywords: ['tasks', 'todo', 'projects'],
      section: 'Navigation',
    },
    {
      id: 'nav-goals',
      title: 'Go to Goals',
      description: 'Track your goals and progress',
      icon: <Target className="h-4 w-4" />,
      action: () => router.push('/goals'),
      keywords: ['goals', 'objectives', 'targets'],
      section: 'Navigation',
    },
    {
      id: 'nav-habits',
      title: 'Go to Habits',
      description: 'Monitor your daily habits',
      icon: <Activity className="h-4 w-4" />,
      action: () => router.push('/habits'),
      keywords: ['habits', 'routines', 'daily'],
      section: 'Navigation',
    },
    {
      id: 'nav-calendar',
      title: 'Go to Calendar',
      description: 'View your schedule and appointments',
      icon: <Calendar className="h-4 w-4" />,
      action: () => router.push('/calendar'),
      keywords: ['calendar', 'schedule', 'appointments'],
      section: 'Navigation',
    },
    {
      id: 'nav-settings',
      title: 'Go to Settings',
      description: 'Configure your preferences',
      icon: <Settings className="h-4 w-4" />,
      action: () => router.push('/settings'),
      keywords: ['settings', 'preferences', 'configuration'],
      section: 'Navigation',
    },

    // Quick Actions
    {
      id: 'action-new-task',
      title: 'Create New Task',
      description: 'Add a new task to your list',
      icon: <Plus className="h-4 w-4" />,
      action: () => {
        router.push('/tasks?new=true')
        toast({ title: 'New Task', description: 'Creating a new task' })
      },
      keywords: ['new', 'create', 'task', 'add'],
      section: 'Quick Actions',
    },
    {
      id: 'action-new-goal',
      title: 'Create New Goal',
      description: 'Set a new goal to achieve',
      icon: <Target className="h-4 w-4" />,
      action: () => {
        router.push('/goals?new=true')
        toast({ title: 'New Goal', description: 'Creating a new goal' })
      },
      keywords: ['new', 'create', 'goal', 'objective'],
      section: 'Quick Actions',
    },
    {
      id: 'action-new-habit',
      title: 'Create New Habit',
      description: 'Start tracking a new habit',
      icon: <Activity className="h-4 w-4" />,
      action: () => {
        router.push('/habits?new=true')
        toast({ title: 'New Habit', description: 'Creating a new habit' })
      },
      keywords: ['new', 'create', 'habit', 'routine'],
      section: 'Quick Actions',
    },

    // Tools
    {
      id: 'tool-ai-suggestions',
      title: 'AI Suggestions',
      description: 'Get AI-powered task recommendations',
      icon: <Brain className="h-4 w-4" />,
      action: () => router.push('/ai'),
      keywords: ['ai', 'suggestions', 'recommendations', 'assistant'],
      section: 'Tools',
    },
    {
      id: 'tool-analytics',
      title: 'View Analytics',
      description: 'See your productivity insights',
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => router.push('/analytics'),
      keywords: ['analytics', 'insights', 'reports', 'statistics'],
      section: 'Tools',
    },
    {
      id: 'tool-export',
      title: 'Export Data',
      description: 'Download your data as CSV or PDF',
      icon: <Download className="h-4 w-4" />,
      action: () => {
        toast({ title: 'Export', description: 'Opening export dialog' })
        // This would trigger an export dialog
      },
      keywords: ['export', 'download', 'backup', 'csv', 'pdf'],
      section: 'Tools',
    },
    {
      id: 'tool-import',
      title: 'Import Data',
      description: 'Import tasks or data from files',
      icon: <Upload className="h-4 w-4" />,
      action: () => {
        toast({ title: 'Import', description: 'Opening import dialog' })
        // This would trigger an import dialog
      },
      keywords: ['import', 'upload', 'restore', 'data'],
      section: 'Tools',
    },

    // Admin (if applicable)
    {
      id: 'admin-dashboard',
      title: 'Admin Dashboard',
      description: 'Access admin controls',
      icon: <Users className="h-4 w-4" />,
      action: () => router.push('/admin'),
      keywords: ['admin', 'administration', 'management'],
      section: 'Admin',
    },
  ]

  // Filter commands based on query
  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(query.toLowerCase()) ||
    command.description.toLowerCase().includes(query.toLowerCase()) ||
    command.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
  )

  // Group commands by section
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.section]) {
      acc[command.section] = []
    }
    acc[command.section].push(command)
    return acc
  }, {} as Record<string, Command[]>)

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action()
            onOpenChange(false)
            setQuery('')
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, filteredCommands, selectedIndex, onOpenChange])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground mr-3" />
          <Input
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 text-base"
            autoFocus
          />
          <Badge variant="outline" className="ml-2">
            ⌘K
          </Badge>
        </div>

        <ScrollArea className="max-h-[400px]">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2" />
              <p>No commands found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(groupedCommands).map(([section, sectionCommands], sectionIndex) => (
                <div key={section} className={sectionIndex > 0 ? 'mt-4' : ''}>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {section}
                  </div>
                  <div className="space-y-1">
                    {sectionCommands.map((command, commandIndex) => {
                      const globalIndex = filteredCommands.indexOf(command)
                      const isSelected = globalIndex === selectedIndex

                      return (
                        <div
                          key={command.id}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => {
                            command.action()
                            onOpenChange(false)
                            setQuery('')
                          }}
                        >
                          <div className={`flex-shrink-0 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                            {command.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium truncate ${isSelected ? 'text-primary-foreground' : ''}`}>
                              {command.title}
                            </div>
                            <div className={`text-sm truncate ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                              {command.description}
                            </div>
                          </div>
                          {isSelected && (
                            <Badge variant="secondary" className="text-xs">
                              ⏎
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          Navigate with ↑↓ • Select with ⏎ • Close with Esc
        </div>
      </DialogContent>
    </Dialog>
  )
}