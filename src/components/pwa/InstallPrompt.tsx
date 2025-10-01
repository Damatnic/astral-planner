'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, X, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallPromptProps {
  className?: string
}

export function InstallPrompt({ className }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installSource, setInstallSource] = useState<'browser' | 'standalone' | 'twa'>('browser')

  useEffect(() => {
    // Check if app is already installed
    const checkInstallStatus = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
        setInstallSource('standalone')
        return
      }

      if (window.navigator && 'serviceWorker' in window.navigator) {
        window.navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            setInstallSource('twa')
          }
        })
      }
    }

    checkInstallStatus()

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (event: Event) => {
      const beforeInstallPromptEvent = event as BeforeInstallPromptEvent
      // Prevent the default prompt
      beforeInstallPromptEvent.preventDefault()
      
      // Store the event for later use
      setDeferredPrompt(beforeInstallPromptEvent)
      
      // Show our custom install prompt
      setIsVisible(true)
    }

    // Listen for app install
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsVisible(false)
      setDeferredPrompt(null)
      
      // Track installation
      if (typeof window !== 'undefined' && 'gtag' in window) {
        // @ts-ignore
        window.gtag('event', 'app_installed', {
          method: 'pwa_install_prompt'
        })
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Show install prompt after delay if not installed
    const timer = setTimeout(() => {
      if (!isInstalled && !deferredPrompt) {
        // Check if we should show manual install instructions
        const userAgent = window.navigator.userAgent.toLowerCase()
        const isIOS = /iphone|ipad|ipod/.test(userAgent)
        const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
        
        if (isIOS && isSafari) {
          setIsVisible(true)
        }
      }
    }, 5000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      clearTimeout(timer)
    }
  }, [isInstalled, deferredPrompt])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show manual install instructions
      showManualInstallInstructions()
      return
    }

    // Show the install prompt
    await deferredPrompt.prompt()

    // Wait for user choice
    const choiceResult = await deferredPrompt.userChoice

    if (choiceResult.outcome === 'accepted') {
      logger.info('User accepted the install prompt');
    } else {
      logger.info('User dismissed the install prompt');
    }

    // Clear the stored prompt
    setDeferredPrompt(null)
    setIsVisible(false)
  }

  const showManualInstallInstructions = () => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isChrome = /chrome/.test(userAgent)
    const isFirefox = /firefox/.test(userAgent)
    const isSafari = /safari/.test(userAgent) && !isChrome

    let instructions = ''
    
    if (isIOS && isSafari) {
      instructions = 'Tap the Share button and select "Add to Home Screen"'
    } else if (isChrome) {
      instructions = 'Click the three dots menu and select "Install Ultimate Digital Planner"'
    } else if (isFirefox) {
      instructions = 'Look for the install icon in the address bar'
    } else {
      instructions = 'Look for install options in your browser menu'
    }

    alert(`To install this app:\n\n${instructions}`)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    
    // Remember dismissal for 7 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Don't show if already installed or recently dismissed
  if (isInstalled || !isVisible) {
    return null
  }

  const dismissedTime = localStorage.getItem('pwa-install-dismissed')
  if (dismissedTime && Date.now() - parseInt(dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
    return null
  }

  return (
    <Card className={cn(
      'fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm',
      'mobile:bottom-20 tablet:bottom-4', // Adjust for mobile tab bar
      'animate-slide-in-from-bottom',
      'shadow-lg border-primary/20',
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Smartphone className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-mobile-base">Install App</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-mobile-sm">
          Install Ultimate Digital Planner for faster access and offline use
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Button 
          onClick={handleInstallClick} 
          className="w-full text-mobile-sm"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          {deferredPrompt ? 'Install App' : 'Get Install Instructions'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default InstallPrompt