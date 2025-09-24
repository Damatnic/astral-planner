'use client';

import { useState } from 'react';
import { Calendar, Check, ExternalLink, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useGoogleCalendar } from '@/features/calendar/hooks/useGoogleCalendar';

export function GoogleCalendarIntegration() {
  const {
    calendars,
    selectedCalendarId,
    selectedCalendar,
    isConnected,
    connectionStatus,
    isConnecting,
    isLoadingCalendars,
    isSyncing,
    error,
    connectToGoogle,
    syncCalendar,
    selectCalendar,
  } = useGoogleCalendar();

  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    syncInterval: '15', // minutes
    syncEvents: true,
    createEvents: true,
    updateEvents: true,
    deleteEvents: false, // More conservative default
  });

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'connecting':
        return <Badge variant="secondary">Connecting...</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Not Connected</Badge>;
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleConnect = () => {
    connectToGoogle();
  };

  const handleSync = () => {
    syncCalendar();
  };

  const handleSyncSettingChange = (key: string, value: boolean | string) => {
    setSyncSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">Google Calendar</CardTitle>
            {getStatusBadge()}
          </div>
          <div className="flex items-center space-x-2">
            {isConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center space-x-1"
              >
                {isSyncing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
              </Button>
            )}
            {!isConnected && (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex items-center space-x-1"
              >
                {isConnecting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ExternalLink className="h-3 w-3" />
                )}
                <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          {isConnected
            ? 'Your Google Calendar is connected and syncing with your planner.'
            : 'Connect your Google Calendar to sync events automatically.'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <div className="text-sm text-red-700">
              {error.message || 'Failed to connect to Google Calendar. Please try again.'}
            </div>
          </div>
        )}

        {isConnected && (
          <>
            {/* Calendar Selection */}
            <div className="space-y-2">
              <Label htmlFor="calendar-select">Primary Calendar</Label>
              <Select
                value={selectedCalendarId}
                onValueChange={selectCalendar}
                disabled={isLoadingCalendars}
              >
                <SelectTrigger id="calendar-select">
                  <SelectValue placeholder="Select a calendar" />
                </SelectTrigger>
                <SelectContent>
                  {calendars.map((calendar) => (
                    <SelectItem key={calendar.id} value={calendar.id}>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: calendar.backgroundColor || '#4285F4' }}
                        />
                        <span>{calendar.summary}</span>
                        {calendar.primary && <Badge variant="secondary">Primary</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCalendar && (
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedCalendar.summary}
                  {selectedCalendar.description && ` • ${selectedCalendar.description}`}
                </p>
              )}
            </div>

            {/* Sync Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Sync Settings</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-sync">Auto Sync</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically sync events between Google Calendar and your planner
                    </p>
                  </div>
                  <Switch
                    id="auto-sync"
                    checked={syncSettings.autoSync}
                    onCheckedChange={(checked) => handleSyncSettingChange('autoSync', checked)}
                  />
                </div>

                {syncSettings.autoSync && (
                  <div className="space-y-2">
                    <Label htmlFor="sync-interval">Sync Interval</Label>
                    <Select
                      value={syncSettings.syncInterval}
                      onValueChange={(value) => handleSyncSettingChange('syncInterval', value)}
                    >
                      <SelectTrigger id="sync-interval">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">Every 5 minutes</SelectItem>
                        <SelectItem value="15">Every 15 minutes</SelectItem>
                        <SelectItem value="30">Every 30 minutes</SelectItem>
                        <SelectItem value="60">Every hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sync-events">Import Events</Label>
                    <p className="text-xs text-muted-foreground">
                      Import events from Google Calendar to your planner
                    </p>
                  </div>
                  <Switch
                    id="sync-events"
                    checked={syncSettings.syncEvents}
                    onCheckedChange={(checked) => handleSyncSettingChange('syncEvents', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="create-events">Create Events</Label>
                    <p className="text-xs text-muted-foreground">
                      Create new events in Google Calendar from your planner
                    </p>
                  </div>
                  <Switch
                    id="create-events"
                    checked={syncSettings.createEvents}
                    onCheckedChange={(checked) => handleSyncSettingChange('createEvents', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="update-events">Update Events</Label>
                    <p className="text-xs text-muted-foreground">
                      Update existing events in Google Calendar when modified in your planner
                    </p>
                  </div>
                  <Switch
                    id="update-events"
                    checked={syncSettings.updateEvents}
                    onCheckedChange={(checked) => handleSyncSettingChange('updateEvents', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="delete-events">Delete Events</Label>
                    <p className="text-xs text-muted-foreground">
                      Delete events from Google Calendar when removed from your planner
                    </p>
                  </div>
                  <Switch
                    id="delete-events"
                    checked={syncSettings.deleteEvents}
                    onCheckedChange={(checked) => handleSyncSettingChange('deleteEvents', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Connection Info */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Connected calendars:</span>
                <span className="font-medium">{calendars.length}</span>
              </div>
              {selectedCalendar && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Access level:</span>
                  <span className="font-medium capitalize">
                    {selectedCalendar.accessRole || 'reader'}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {!isConnected && (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">Connect Google Calendar</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your Google Calendar to automatically sync events and stay organized.
            </p>
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect Google Calendar
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}