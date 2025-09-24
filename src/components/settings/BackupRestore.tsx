'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function BackupRestore() {
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreResult, setRestoreResult] = useState<any>(null)
  const { toast } = useToast()

  const handleBackup = async () => {
    setIsBackingUp(true)
    
    try {
      const response = await fetch('/api/backup')
      
      if (!response.ok) {
        throw new Error('Failed to create backup')
      }
      
      // Download the backup file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `astral-planner-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: 'Backup created',
        description: 'Your data has been exported successfully',
      })
    } catch (error) {
      console.error('Backup error:', error)
      toast({
        title: 'Backup failed',
        description: 'Failed to create backup. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    
    if (!file) return
    
    setIsRestoring(true)
    setRestoreResult(null)
    
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to restore backup')
      }
      
      setRestoreResult(result)
      
      toast({
        title: 'Restore successful',
        description: 'Your data has been restored successfully',
      })
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('Restore error:', error)
      toast({
        title: 'Restore failed',
        description: error instanceof Error ? error.message : 'Failed to restore backup',
        variant: 'destructive',
      })
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup & Restore</CardTitle>
        <CardDescription>
          Export your data for safekeeping or import from a previous backup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Create Backup</h3>
          <p className="text-sm text-muted-foreground">
            Download all your data including tasks, goals, habits, and templates
          </p>
          <Button
            onClick={handleBackup}
            disabled={isBackingUp}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            {isBackingUp ? 'Creating backup...' : 'Download Backup'}
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Restore from Backup</h3>
          <p className="text-sm text-muted-foreground">
            Import data from a previous backup file
          </p>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Restoring will not delete existing data. Only new items will be added.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".json"
              onChange={handleRestore}
              disabled={isRestoring}
              className="hidden"
              id="restore-file"
            />
            <label htmlFor="restore-file">
              <Button
                asChild
                disabled={isRestoring}
                variant="outline"
                className="cursor-pointer"
              >
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  {isRestoring ? 'Restoring...' : 'Choose Backup File'}
                </span>
              </Button>
            </label>
          </div>

          {restoreResult && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                <strong>Restore complete!</strong>
                <ul className="mt-2 text-sm">
                  <li>Workspaces: {restoreResult.restored?.workspaces || 0}</li>
                  <li>Tasks: {restoreResult.restored?.blocks || 0}</li>
                  <li>Goals: {restoreResult.restored?.goals || 0}</li>
                  <li>Habits: {restoreResult.restored?.habits || 0}</li>
                  <li>Templates: {restoreResult.restored?.templates || 0}</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="rounded-lg bg-muted p-4">
          <h3 className="text-sm font-medium mb-2">Automatic Backups</h3>
          <p className="text-sm text-muted-foreground">
            Your data is automatically backed up to the cloud every day. 
            Manual backups provide an additional layer of security.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}