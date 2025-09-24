'use client';

import { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Link, 
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { GoogleCalendarIntegration } from '@/components/integrations/GoogleCalendarIntegration';

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  // Settings state
  const [settings, setSettings] = useState({
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      timezone: 'America/New_York',
      language: 'en'
    },
    notifications: {
      email: {
        taskReminders: true,
        dailyDigest: false,
        weeklyReport: true,
        achievements: true
      },
      push: {
        taskReminders: true,
        mentions: true,
        updates: false
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      }
    },
    appearance: {
      theme: 'system',
      accentColor: 'blue',
      fontSize: 'medium',
      reducedMotion: false
    },
    privacy: {
      profileVisibility: 'team',
      activityStatus: true,
      dataSharing: false
    },
    integrations: [
      { id: 'google', name: 'Google Calendar', connected: true, icon: '📅' },
      { id: 'slack', name: 'Slack', connected: false, icon: '💬' },
      { id: 'notion', name: 'Notion', connected: false, icon: '📝' },
      { id: 'github', name: 'GitHub', connected: true, icon: '🐙' }
    ]
  });

  const handleSave = async (section: string) => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings saved",
        description: `Your ${section} settings have been updated successfully.`
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-none">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="/avatar.jpg" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">Change Avatar</Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG or GIF. Max 2MB.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Personal Info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={settings.profile.firstName}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, firstName: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={settings.profile.lastName}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, lastName: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => setSettings({
                      ...settings,
                      profile: { ...settings.profile, email: e.target.value }
                    })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={settings.profile.timezone}
                      onValueChange={(value) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, timezone: value }
                      })}
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={settings.profile.language}
                      onValueChange={(value) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, language: value }
                      })}
                    >
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave('profile')} disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Notifications */}
                <div>
                  <h3 className="font-medium mb-4">Email Notifications</h3>
                  <div className="space-y-4">
                    {Object.entries(settings.notifications.email).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <Label htmlFor={`email-${key}`} className="text-base">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Receive email notifications for this activity
                          </p>
                        </div>
                        <Switch
                          id={`email-${key}`}
                          checked={value}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              email: { ...settings.notifications.email, [key]: checked }
                            }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Push Notifications */}
                <div>
                  <h3 className="font-medium mb-4">Push Notifications</h3>
                  <div className="space-y-4">
                    {Object.entries(settings.notifications.push).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <Label htmlFor={`push-${key}`} className="text-base">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Receive push notifications for this activity
                          </p>
                        </div>
                        <Switch
                          id={`push-${key}`}
                          checked={value}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              push: { ...settings.notifications.push, [key]: checked }
                            }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Quiet Hours */}
                <div>
                  <h3 className="font-medium mb-4">Quiet Hours</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="quiet-hours" className="text-base">
                          Enable Quiet Hours
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Pause notifications during specified hours
                        </p>
                      </div>
                      <Switch
                        id="quiet-hours"
                        checked={settings.notifications.quietHours.enabled}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            quietHours: { ...settings.notifications.quietHours, enabled: checked }
                          }
                        })}
                      />
                    </div>
                    
                    {settings.notifications.quietHours.enabled && (
                      <div className="grid gap-4 sm:grid-cols-2 pl-4">
                        <div className="space-y-2">
                          <Label htmlFor="quiet-start">Start Time</Label>
                          <Input
                            id="quiet-start"
                            type="time"
                            value={settings.notifications.quietHours.start}
                            onChange={(e) => setSettings({
                              ...settings,
                              notifications: {
                                ...settings.notifications,
                                quietHours: { ...settings.notifications.quietHours, start: e.target.value }
                              }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quiet-end">End Time</Label>
                          <Input
                            id="quiet-end"
                            type="time"
                            value={settings.notifications.quietHours.end}
                            onChange={(e) => setSettings({
                              ...settings,
                              notifications: {
                                ...settings.notifications,
                                quietHours: { ...settings.notifications.quietHours, end: e.target.value }
                              }
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave('notifications')} disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of your planner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme */}
                <div>
                  <Label className="text-base mb-4 block">Theme</Label>
                  <RadioGroup
                    value={settings.appearance.theme}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      appearance: { ...settings.appearance, theme: value }
                    })}
                    className="grid grid-cols-3 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="light" id="light" className="peer sr-only" />
                      <Label
                        htmlFor="light"
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted p-4 hover:border-accent hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Sun className="h-6 w-6 mb-2" />
                        Light
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                      <Label
                        htmlFor="dark"
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted p-4 hover:border-accent hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Moon className="h-6 w-6 mb-2" />
                        Dark
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="system" id="system" className="peer sr-only" />
                      <Label
                        htmlFor="system"
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted p-4 hover:border-accent hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Monitor className="h-6 w-6 mb-2" />
                        System
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                {/* Font Size */}
                <div>
                  <Label htmlFor="fontSize">Font Size</Label>
                  <Select
                    value={settings.appearance.fontSize}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      appearance: { ...settings.appearance, fontSize: value }
                    })}
                  >
                    <SelectTrigger id="fontSize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reduced Motion */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="reduced-motion" className="text-base">
                      Reduced Motion
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Minimize animations and transitions
                    </p>
                  </div>
                  <Switch
                    id="reduced-motion"
                    checked={settings.appearance.reducedMotion}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      appearance: { ...settings.appearance, reducedMotion: checked }
                    })}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave('appearance')} disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations">
            <div className="space-y-6">
              <GoogleCalendarIntegration />
              
              <Card>
                <CardHeader>
                  <CardTitle>Other Integrations</CardTitle>
                  <CardDescription>
                    More integrations coming soon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {settings.integrations.filter(i => i.id !== 'google').map((integration) => (
                      <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{integration.icon}</span>
                          <div>
                            <p className="font-medium">{integration.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {integration.connected ? 'Connected' : 'Coming soon'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant={integration.connected ? 'outline' : 'secondary'}
                          size="sm"
                          disabled={!integration.connected}
                        >
                          {integration.connected ? 'Disconnect' : 'Coming Soon'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>
                  Control your privacy settings and data sharing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="visibility">Profile Visibility</Label>
                  <Select
                    value={settings.privacy.profileVisibility}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, profileVisibility: value }
                    })}
                  >
                    <SelectTrigger id="visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="team">Team Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="activity-status" className="text-base">
                        Activity Status
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Show when you're online
                      </p>
                    </div>
                    <Switch
                      id="activity-status"
                      checked={settings.privacy.activityStatus}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, activityStatus: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="data-sharing" className="text-base">
                        Analytics Data Sharing
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Help improve the product with anonymous usage data
                      </p>
                    </div>
                    <Switch
                      id="data-sharing"
                      checked={settings.privacy.dataSharing}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, dataSharing: checked }
                      })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-medium">Danger Zone</h3>
                  <Button variant="outline" className="text-red-600 hover:text-red-600">
                    Export All Data
                  </Button>
                  <Button variant="outline" className="text-red-600 hover:text-red-600 ml-3">
                    Delete Account
                  </Button>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave('privacy')} disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>
                  Manage your subscription and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Plan */}
                <div className="p-4 border rounded-lg bg-primary/5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Current Plan</h3>
                    <Badge>PRO</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    $9.99/month • Renews on Feb 1, 2024
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Unlimited tasks and projects
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Advanced analytics
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Team collaboration
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline">Change Plan</Button>
                  <Button variant="outline" className="text-red-600 hover:text-red-600">
                    Cancel Subscription
                  </Button>
                </div>

                <Separator />

                {/* Payment Method */}
                <div>
                  <h3 className="font-medium mb-4">Payment Method</h3>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5" />
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-sm text-muted-foreground">Expires 12/24</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Update</Button>
                  </div>
                </div>

                {/* Billing History */}
                <div>
                  <h3 className="font-medium mb-4">Billing History</h3>
                  <div className="space-y-2">
                    {[
                      { date: 'Jan 1, 2024', amount: '$9.99', status: 'Paid' },
                      { date: 'Dec 1, 2023', amount: '$9.99', status: 'Paid' },
                      { date: 'Nov 1, 2023', amount: '$9.99', status: 'Paid' }
                    ].map((invoice, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{invoice.date}</p>
                          <p className="text-sm text-muted-foreground">{invoice.amount}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-600">
                            {invoice.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}