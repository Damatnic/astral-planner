'use client'

import { useState, useEffect } from 'react'
import { WifiOff, Wifi, AlertCircle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OfflineIndicatorProps {
  className?: string
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineAlert, setShowOfflineAlert] = useState(false)
  const [lastOnlineTime, setLastOnlineTime] = useState<Date>(new Date())

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)
      
      if (!online) {
        setShowOfflineAlert(true)
      } else {
        setLastOnlineTime(new Date())
        // Hide alert after coming back online
        setTimeout(() => setShowOfflineAlert(false), 3000)
      }
    }

    // Initial check
    updateOnlineStatus()

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Periodic connectivity check (more reliable than navigator.onLine)
    const checkConnectivity = async () => {
      try {
        const response = await fetch('/api/health', {
          method: 'HEAD',
          cache: 'no-cache'
        })
        
        const online = response.ok
        if (online !== isOnline) {
          setIsOnline(online)
          if (!online) {
            setShowOfflineAlert(true)
          } else {
            setLastOnlineTime(new Date())
            setTimeout(() => setShowOfflineAlert(false), 3000)
          }
        }
      } catch {
        // If fetch fails, we're likely offline
        if (isOnline) {
          setIsOnline(false)
          setShowOfflineAlert(true)
        }
      }
    }

    const connectivityInterval = setInterval(checkConnectivity, 30000) // Check every 30s

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      clearInterval(connectivityInterval)
    }
  }, [isOnline])

  const handleRetry = async () => {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      })
      
      if (response.ok) {
        setIsOnline(true)
        setLastOnlineTime(new Date())
        setShowOfflineAlert(false)
      }
    } catch {
      // Still offline
    }
  }

  const formatLastOnlineTime = () => {
    const now = new Date()
    const diff = now.getTime() - lastOnlineTime.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  return (
    <>
      {/* Status Indicator in Navigation */}
      <div className={cn(
        'fixed top-4 right-4 z-40 flex items-center gap-2 px-2 py-1 rounded-full text-xs',
        'mobile:top-16 tablet:top-4', // Adjust for mobile header
        isOnline 
          ? 'bg-success/10 text-success border border-success/20' 
          : 'bg-destructive/10 text-destructive border border-destructive/20',
        'transition-all duration-200',
        className
      )}>
        {isOnline ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        <span className="hidden mobile:inline">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Offline Alert */}
      {showOfflineAlert && !isOnline && (
        <Alert className={cn(
          'fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md',
          'mobile:bottom-20 tablet:bottom-4', // Adjust for mobile tab bar
          'animate-slide-in-from-bottom',
          'border-destructive/50 text-destructive',
          className
        )}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex-1 pr-2">
              <p className="font-medium text-mobile-sm">You're offline</p>
              <p className="text-mobile-xs opacity-90">
                Last online: {formatLastOnlineTime()}
              </p>
              <p className="text-mobile-xs opacity-75 mt-1">
                Some features may be limited. Your work is saved locally.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              className="ml-2 text-mobile-xs h-8"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Back Online Notification */}
      {showOfflineAlert && isOnline && (
        <Alert className={cn(
          'fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md',
          'mobile:bottom-20 tablet:bottom-4',
          'animate-slide-in-from-bottom',
          'border-success/50 text-success bg-success/5',
          className
        )}>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium text-mobile-sm">You're back online!</p>
            <p className="text-mobile-xs opacity-90">
              Syncing your changes...
            </p>
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}

export default OfflineIndicator