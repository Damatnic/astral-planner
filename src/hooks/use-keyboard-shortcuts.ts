import { useHotkeys } from 'react-hotkeys-hook'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useState, useCallback } from 'react'

export interface KeyboardShortcut {
  keys: string
  description: string
  action: () => void
  global?: boolean
  preventDefault?: boolean
}

export interface ShortcutGroup {
  title: string
  shortcuts: KeyboardShortcut[]
}

export function useKeyboardShortcuts() {
  const router = useRouter()
  const { toast } = useToast()
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [commandPalette, setCommandPalette] = useState(false)

  // Navigation shortcuts
  useHotkeys('g d', () => router.push('/dashboard'), { preventDefault: true })
  useHotkeys('g t', () => router.push('/tasks'), { preventDefault: true })
  useHotkeys('g g', () => router.push('/goals'), { preventDefault: true })
  useHotkeys('g h', () => router.push('/habits'), { preventDefault: true })
  useHotkeys('g c', () => router.push('/calendar'), { preventDefault: true })
  useHotkeys('g s', () => router.push('/settings'), { preventDefault: true })

  // Quick actions
  useHotkeys('n', () => setQuickAddOpen(true), { preventDefault: true })
  useHotkeys('cmd+k, ctrl+k', () => setCommandPalette(true), { preventDefault: true })
  useHotkeys('/', () => {
    const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
    if (searchInput) {
      searchInput.focus()
    }
  }, { preventDefault: true })

  // Help and shortcuts
  useHotkeys('shift+/', () => setShowShortcuts(true), { preventDefault: true })
  useHotkeys('?', () => setShowShortcuts(true), { preventDefault: true })

  // Global actions
  useHotkeys('cmd+z, ctrl+z', () => {
    toast({ title: 'Undo', description: 'Last action undone' })
  })

  useHotkeys('cmd+shift+z, ctrl+shift+z', () => {
    toast({ title: 'Redo', description: 'Action redone' })
  })

  // Close dialogs with Escape
  useHotkeys('escape', () => {
    setShowShortcuts(false)
    setQuickAddOpen(false)
    setCommandPalette(false)
  })

  const shortcuts: ShortcutGroup[] = [
    {
      title: 'Navigation',
      shortcuts: [
        { keys: 'G → D', description: 'Go to Dashboard', action: () => router.push('/dashboard') },
        { keys: 'G → T', description: 'Go to Tasks', action: () => router.push('/tasks') },
        { keys: 'G → G', description: 'Go to Goals', action: () => router.push('/goals') },
        { keys: 'G → H', description: 'Go to Habits', action: () => router.push('/habits') },
        { keys: 'G → C', description: 'Go to Calendar', action: () => router.push('/calendar') },
        { keys: 'G → S', description: 'Go to Settings', action: () => router.push('/settings') },
      ],
    },
    {
      title: 'Quick Actions',
      shortcuts: [
        { keys: 'N', description: 'New Task/Item', action: () => setQuickAddOpen(true) },
        { keys: '⌘K / Ctrl+K', description: 'Command Palette', action: () => setCommandPalette(true) },
        { keys: '/', description: 'Focus Search', action: () => {} },
        { keys: '?', description: 'Show Shortcuts', action: () => setShowShortcuts(true) },
      ],
    },
    {
      title: 'Editing',
      shortcuts: [
        { keys: '⌘Z / Ctrl+Z', description: 'Undo', action: () => {} },
        { keys: '⌘⇧Z / Ctrl+Shift+Z', description: 'Redo', action: () => {} },
        { keys: 'Escape', description: 'Close Dialog', action: () => {} },
        { keys: 'Enter', description: 'Submit Form', action: () => {} },
      ],
    },
  ]

  return {
    shortcuts,
    showShortcuts,
    setShowShortcuts,
    quickAddOpen,
    setQuickAddOpen,
    commandPalette,
    setCommandPalette,
  }
}

// Hook for task-specific shortcuts
export function useTaskShortcuts(
  onComplete?: () => void,
  onEdit?: () => void,
  onDelete?: () => void,
  onDuplicate?: () => void
) {
  useHotkeys('cmd+enter, ctrl+enter', () => {
    if (onComplete) onComplete()
  }, { enableOnContentEditable: true })

  useHotkeys('e', () => {
    if (onEdit) onEdit()
  })

  useHotkeys('d', () => {
    if (onDuplicate) onDuplicate()
  })

  useHotkeys('backspace, delete', () => {
    if (onDelete) onDelete()
  })
}

// Hook for form shortcuts
export function useFormShortcuts(
  onSubmit?: () => void,
  onCancel?: () => void,
  onSave?: () => void
) {
  useHotkeys('cmd+enter, ctrl+enter', () => {
    if (onSubmit) onSubmit()
  }, { enableOnContentEditable: true })

  useHotkeys('cmd+s, ctrl+s', (e) => {
    e.preventDefault()
    if (onSave) onSave()
  }, { enableOnContentEditable: true })

  useHotkeys('escape', () => {
    if (onCancel) onCancel()
  })
}

// Hook for list navigation
export function useListNavigation(
  items: any[],
  onSelect?: (item: any, index: number) => void,
  onAction?: (item: any, index: number) => void
) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useHotkeys('j, arrowdown', () => {
    setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1))
  })

  useHotkeys('k, arrowup', () => {
    setSelectedIndex((prev) => Math.max(prev - 1, 0))
  })

  useHotkeys('enter', () => {
    if (items[selectedIndex] && onSelect) {
      onSelect(items[selectedIndex], selectedIndex)
    }
  })

  useHotkeys('space', (e) => {
    e.preventDefault()
    if (items[selectedIndex] && onAction) {
      onAction(items[selectedIndex], selectedIndex)
    }
  })

  useHotkeys('home', () => setSelectedIndex(0))
  useHotkeys('end', () => setSelectedIndex(items.length - 1))

  return { selectedIndex, setSelectedIndex }
}

// Hook for calendar shortcuts
export function useCalendarShortcuts(
  onToday?: () => void,
  onPrevious?: () => void,
  onNext?: () => void,
  onViewChange?: (view: string) => void
) {
  useHotkeys('t', () => {
    if (onToday) onToday()
  })

  useHotkeys('left', () => {
    if (onPrevious) onPrevious()
  })

  useHotkeys('right', () => {
    if (onNext) onNext()
  })

  useHotkeys('1', () => {
    if (onViewChange) onViewChange('day')
  })

  useHotkeys('2', () => {
    if (onViewChange) onViewChange('week')
  })

  useHotkeys('3', () => {
    if (onViewChange) onViewChange('month')
  })
}