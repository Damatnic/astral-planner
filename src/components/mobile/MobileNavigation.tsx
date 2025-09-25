'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  CheckSquare, 
  Calendar, 
  Target, 
  TrendingUp, 
  Settings, 
  Plus,
  Menu,
  X,
  BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Planner', href: '/planner', icon: BookOpen },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface MobileNavigationProps {
  className?: string
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Top Mobile Header */}
      <div className={cn(
        'mobile:flex desktop:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b transition-all duration-200',
        isScrolled && 'shadow-sm',
        'pt-safe-top',
        className
      )}>
        <div className="flex items-center justify-between px-4 py-3 w-full">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="touch:h-10 touch:w-10 no-touch:h-8 no-touch:w-8"
                aria-label="Open navigation menu"
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="text-left">Navigation</SheetTitle>
              </SheetHeader>
              
              <nav className="flex flex-col p-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 text-mobile-base font-medium rounded-lg transition-colors',
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>

              <div className="mt-auto p-4">
                <Button 
                  className="w-full" 
                  onClick={() => setIsOpen(false)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Quick Add
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <h1 className="font-semibold text-mobile-lg tracking-tight">
            {navigation.find(item => item.href === pathname)?.name || 'Planner'}
          </h1>

          <Button 
            variant="ghost" 
            size="sm" 
            className="touch:h-10 touch:w-10 no-touch:h-8 no-touch:w-8"
            aria-label="Quick actions"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Mobile Tab Bar */}
      <div className={cn(
        'mobile:flex desktop:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t',
        'pb-safe-bottom',
        className
      )}>
        <nav className="flex w-full">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-[60px] transition-colors touch:min-h-[64px]',
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className={cn(
                  'h-5 w-5 mb-1',
                  isActive && 'scale-110'
                )} />
                <span className="text-mobile-xs font-medium leading-none">
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Spacer for bottom tab bar */}
      <div className="mobile:h-[76px] desktop:hidden pb-safe-bottom" />
    </>
  )
}

export default MobileNavigation