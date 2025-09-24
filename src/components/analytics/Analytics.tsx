'use client'

import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { useEffect } from 'react'
import { reportWebVitals, monitorLongTasks } from '@/lib/monitoring/performance'

export function Analytics() {
  useEffect(() => {
    // Report web vitals
    reportWebVitals()
    
    // Monitor long tasks
    const cleanup = monitorLongTasks()
    
    return () => {
      cleanup?.()
    }
  }, [])

  return (
    <>
      <VercelAnalytics />
      <SpeedInsights />
    </>
  )
}