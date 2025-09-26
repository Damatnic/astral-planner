'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MobileNavigation } from './MobileNavigation'
import { cn } from '@/lib/utils'

interface ResponsiveLayoutProps {
  children: ReactNode
  className?: string
  showMobileNav?: boolean
}

export function ResponsiveLayout({ 
  children, 
  className,
  showMobileNav = true 
}: ResponsiveLayoutProps) {
  const pathname = usePathname()
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | null>(null)
  const [isStandalone, setIsStandalone] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if app is installed as PWA
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    // Handle orientation changes
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    handleOrientationChange()
    window.addEventListener('resize', handleOrientationChange)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', handleOrientationChange)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  // Don't show mobile nav on auth pages
  const hideNavigation = pathname.includes('/sign-') || pathname === '/' || !showMobileNav

  return (
    <div className={cn(
      'min-h-screen-safe flex flex-col',
      isStandalone && 'pt-safe-top',
      className
    )}>
      {/* Mobile Navigation */}
      {!hideNavigation && (
        <MobileNavigation className="mobile:flex desktop:hidden" />
      )}

      {/* Main Content Area */}
      <main className={cn(
        'flex-1 flex flex-col',
        // Add top padding for mobile header
        !hideNavigation && 'mobile:pt-[64px] tablet:pt-[68px]',
        // Add bottom padding for mobile tab bar
        !hideNavigation && 'mobile:pb-[76px]',
        // Responsive padding
        'px-4 mobile:px-4 tablet:px-6 desktop:px-8',
        'py-4 mobile:py-4 tablet:py-6 desktop:py-8',
        // Safe area adjustments
        'pt-safe-top pb-safe-bottom pl-safe-left pr-safe-right'
      )}>
        {/* Content with responsive constraints */}
        <div className={cn(
          'w-full max-w-7xl mx-auto',
          'mobile:max-w-full tablet:max-w-4xl desktop:max-w-7xl'
        )}>
          {children}
        </div>
      </main>

      {/* Touch-friendly scrollable indicators */}
      <style jsx global>{`
        /* Improve scrolling on touch devices */
        * {
          -webkit-overflow-scrolling: touch;
        }

        /* Hide scrollbars on mobile but keep functionality */
        @media (max-width: 768px) {
          ::-webkit-scrollbar {
            width: 2px;
            height: 2px;
          }
          
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          
          ::-webkit-scrollbar-thumb {
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 1px;
          }
        }

        /* Larger touch targets for mobile */
        @media (hover: none) and (pointer: coarse) {
          button, a, input, select, textarea {
            min-height: 44px;
            min-width: 44px;
          }
          
          /* Ensure buttons are touch-friendly */
          button:not(.no-touch-target) {
            padding: 12px 16px;
          }
        }

        /* Prevent zoom on double-tap for inputs */
        input, select, textarea {
          font-size: 16px !important;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Improve focus visibility on touch devices */
        @media (hover: none) and (pointer: coarse) {
          *:focus-visible {
            outline: 2px solid hsl(var(--primary));
            outline-offset: 2px;
          }
        }
      `}</style>
    </div>
  )
}

export default ResponsiveLayout