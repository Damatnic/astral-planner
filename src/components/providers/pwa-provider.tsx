"use client"

import * as React from "react"
import { InstallPrompt } from "@/components/pwa/InstallPrompt"
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator"

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope)
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, prompt user to refresh
                  if (confirm('A new version is available! Refresh to update?')) {
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error)
        })
    }

    // Handle app install banner
    let deferredPrompt: any
    
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later
      deferredPrompt = e
      
      // Track that the prompt was shown
      if (typeof window !== 'undefined' && 'gtag' in window) {
        // @ts-ignore
        window.gtag('event', 'pwa_install_prompt_shown')
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  if (!isClient) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      
      {/* PWA Components - only render on client */}
      <InstallPrompt />
      <OfflineIndicator />
      
      {/* PWA Enhancements */}
      <div className="pwa-enhancements">
        {/* iOS-specific meta tags for better PWA experience */}
        <style jsx global>{`
          /* PWA-specific styles */
          @media (display-mode: standalone) {
            body {
              -webkit-user-select: none;
              -webkit-tap-highlight-color: transparent;
            }
            
            /* Hide scrollbars in standalone mode */
            ::-webkit-scrollbar {
              display: none;
            }
          }

          /* iOS Safari specific fixes */
          @supports (-webkit-touch-callout: none) {
            .ios-safe-area-top {
              padding-top: env(safe-area-inset-top);
            }
            
            .ios-safe-area-bottom {
              padding-bottom: env(safe-area-inset-bottom);
            }
          }

          /* Splash screen styles */
          @media (display-mode: standalone) {
            html {
              background: #ffffff;
            }
            
            body::before {
              content: '';
              position: fixed;
              top: 50%;
              left: 50%;
              width: 64px;
              height: 64px;
              margin: -32px 0 0 -32px;
              background: url('/icons/icon-192x192.png') center/contain no-repeat;
              z-index: 9999;
              opacity: 0;
              animation: splash-fade-out 0.5s ease-in-out 2s forwards;
            }
          }

          @keyframes splash-fade-out {
            to {
              opacity: 0;
              visibility: hidden;
            }
          }
        `}</style>
      </div>
    </>
  )
}