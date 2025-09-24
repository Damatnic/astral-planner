'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Keyboard, Command } from 'lucide-react'
import { useKeyboardShortcuts, ShortcutGroup } from '@/hooks/use-keyboard-shortcuts'

interface ShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const { shortcuts } = useKeyboardShortcuts()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {shortcuts.map((group: ShortcutGroup, index: number) => (
              <div key={index}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  {group.title}
                </h3>
                <div className="grid gap-2">
                  {group.shortcuts.map((shortcut, shortcutIndex) => (
                    <div
                      key={shortcutIndex}
                      className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <span className="text-sm font-medium">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.split(' ').map((key, keyIndex) => {
                          // Handle special characters and combinations
                          const isArrow = key.includes('→')
                          const isModifier = key.includes('⌘') || key.includes('Ctrl') || key.includes('⇧')
                          
                          if (isArrow) {
                            return (
                              <div key={keyIndex} className="flex items-center gap-1">
                                {key.split('→').map((part, partIndex) => (
                                  <>
                                    {partIndex > 0 && (
                                      <span className="text-muted-foreground mx-1">then</span>
                                    )}
                                    <Badge
                                      key={partIndex}
                                      variant="outline"
                                      className="font-mono text-xs px-2 py-1"
                                    >
                                      {part.trim()}
                                    </Badge>
                                  </>
                                ))}
                              </div>
                            )
                          }
                          
                          if (key.includes('/')) {
                            // Handle alternatives like "⌘K / Ctrl+K"
                            return (
                              <div key={keyIndex} className="flex items-center gap-1">
                                {key.split(' / ').map((alt, altIndex) => (
                                  <>
                                    {altIndex > 0 && (
                                      <span className="text-muted-foreground mx-1">or</span>
                                    )}
                                    <Badge
                                      key={altIndex}
                                      variant="outline"
                                      className="font-mono text-xs px-2 py-1"
                                    >
                                      {alt.trim()}
                                    </Badge>
                                  </>
                                ))}
                              </div>
                            )
                          }
                          
                          return (
                            <Badge
                              key={keyIndex}
                              variant="outline"
                              className="font-mono text-xs px-2 py-1"
                            >
                              {key}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Context-specific shortcuts */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Context-Specific</h3>
              <div className="grid gap-2">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">In Task Lists</span>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="font-mono text-xs px-2 py-1">J</Badge>
                    <Badge variant="outline" className="font-mono text-xs px-2 py-1">K</Badge>
                    <span className="text-muted-foreground text-xs">Navigate</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">In Forms</span>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="font-mono text-xs px-2 py-1">⌘↵</Badge>
                    <span className="text-muted-foreground text-xs">Submit</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">In Calendar</span>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="font-mono text-xs px-2 py-1">T</Badge>
                    <span className="text-muted-foreground text-xs">Today</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Command className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Pro Tips</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Most shortcuts work globally across the app</li>
                    <li>• Use the Command Palette (⌘K) for quick navigation</li>
                    <li>• Press ? anywhere to show shortcuts</li>
                    <li>• Combine G with letters for quick navigation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}