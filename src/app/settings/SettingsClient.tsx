'use client';

import { useState, useEffect } from 'react';
import { Logger as logger } from '@/lib/logger/edge';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Link, 
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Check,
  X,
  Loader2,
  Upload,
  Camera,
  Trash2,
  Save,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  MapPin,
  Smartphone,
  Languages,
  Clock,
  MessageSquare,
  Award,
  Users,
  Zap,
  Volume2,
  VolumeX,
  TestTube,
  Type,
  Layout,
  Brush,
  Contrast,
  EyeIcon,
  Paintbrush,
  Layers,
  Filter,
  Download,
  Trash,
  Database,
  Lock
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
  const [isLoading, setIsLoading] = useState(false); // Start with false to remove loading spinner
  const { toast } = useToast();
  
  // Settings state
  const [settings, setSettings] = useState({
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      username: 'johndoe',
      bio: '',
      phone: '',
      company: '',
      avatarUrl: '',
      timezone: 'America/New_York',
      language: 'en'
    },
    notifications: {
      email: {
        taskReminders: true,
        taskDeadlines: true,
        dailyDigest: false,
        weeklyReport: true,
        monthlyReport: false,
        achievements: true,
        teamUpdates: true,
        securityAlerts: true,
        marketingEmails: false
      },
      push: {
        taskReminders: true,
        taskDeadlines: true,
        mentions: true,
        comments: true,
        updates: false,
        teamActivity: true,
        systemMaintenance: true
      },
      inApp: {
        taskCompletions: true,
        teamInvites: true,
        mentions: true,
        systemMessages: true,
        tips: true
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
        timezone: 'local',
        weekendsOnly: false
      },
      frequency: {
        digest: 'daily',
        reminders: '15min',
        summaries: 'weekly'
      }
    },
    appearance: {
      theme: 'system',
      accentColor: 'blue',
      primaryColor: '#3b82f6',
      backgroundColor: 'default',
      fontSize: 'medium',
      fontFamily: 'system',
      borderRadius: 'medium',
      density: 'comfortable',
      reducedMotion: false,
      animations: true,
      highContrast: false,
      colorBlindFriendly: false
    },
    privacy: {
      profileVisibility: 'team',
      activityStatus: true,
      dataSharing: false,
      searchEngineIndexing: false,
      showEmail: false,
      showPhoneNumber: false,
      allowDirectMessages: true,
      shareProgressPublicly: false,
      dataRetention: '2years',
      downloadableData: true,
      accountDeletion: {
        canDelete: true,
        deleteAfterDays: 30
      },
      twoFactorAuth: false,
      sessionTimeout: 30,
      loginNotifications: true
    },
    integrations: [
      { id: 'google', name: 'Google Calendar', connected: true, icon: '📅', description: 'Sync your calendar events and deadlines', category: 'productivity' },
      { id: 'slack', name: 'Slack', connected: false, icon: '💬', description: 'Get task notifications in Slack channels', category: 'communication' },
      { id: 'notion', name: 'Notion', connected: false, icon: '📝', description: 'Sync notes and documentation', category: 'productivity' },
      { id: 'github', name: 'GitHub', connected: true, icon: '🐙', description: 'Track commits and pull requests', category: 'development' },
      { id: 'trello', name: 'Trello', connected: false, icon: '📋', description: 'Import boards and cards as tasks', category: 'productivity' },
      { id: 'asana', name: 'Asana', connected: false, icon: '🎯', description: 'Sync projects and tasks', category: 'productivity' },
      { id: 'zoom', name: 'Zoom', connected: false, icon: '🎥', description: 'Schedule and track meetings', category: 'communication' },
      { id: 'outlook', name: 'Outlook', connected: false, icon: '📧', description: 'Sync emails and calendar', category: 'communication' },
      { id: 'dropbox', name: 'Dropbox', connected: false, icon: '📦', description: 'Attach files to tasks', category: 'storage' },
      { id: 'zapier', name: 'Zapier', connected: false, icon: '⚡', description: 'Connect to 5000+ apps', category: 'automation' }
    ]
  });

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Helper function to get authentication headers from localStorage
  const getAuthHeaders = (): Record<string, string> => {
    try {
      const currentUser = localStorage.getItem('current-user');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-user-data': JSON.stringify(userData)
        };
        
        // Only add x-pin if we have a valid PIN
        const pin = userData.id === 'demo-user' ? '0000' : userData.id === 'nick-planner' ? '7347' : '';
        if (pin) {
          headers['x-pin'] = pin;
        }
        
        return headers;
      }
    } catch (error) {
      // Enhanced error logging with security considerations
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Auth headers retrieval failed', {
        timestamp: new Date().toISOString(),
        component: 'SettingsClient',
        action: 'getAuthHeaders'
      });
    }
    return { 'Content-Type': 'application/json' };
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/settings', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        // Map API response to local settings structure
        setSettings(prevSettings => ({
          ...prevSettings,
          appearance: {
            ...prevSettings.appearance,
            theme: data.settings?.theme || prevSettings.appearance.theme,
            accentColor: data.settings?.accentColor || prevSettings.appearance.accentColor,
            fontSize: data.settings?.fontSize || prevSettings.appearance.fontSize,
            reducedMotion: data.settings?.reducedMotion || prevSettings.appearance.reducedMotion
          },
          notifications: {
            ...prevSettings.notifications,
            ...data.settings?.notifications
          },
          privacy: {
            ...prevSettings.privacy,
            ...data.settings?.privacy
          }
        }));
      }
    } catch (error) {
      toast({
        title: "Error loading settings",
        description: "Failed to load your settings. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (section: string, sectionData: any) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          settings: {
            [section]: sectionData
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
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

  // Remove loading state - let content render immediately
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
  //       <div className="text-center">
  //         <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
  //         <p className="text-muted-foreground">Loading settings...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 relative overflow-hidden">
      {/* Animated cosmic orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse [animation-delay:0.5s]"></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Settings</h1>
          <p className="text-purple-300/70 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-none">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
              <CardHeader>
                <CardTitle className="text-purple-200">Profile Information</CardTitle>
                <CardDescription className="text-purple-300/70">
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enhanced Avatar Section */}
                <div className="flex items-start gap-6">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-4 border-purple-700/30 shadow-lg shadow-purple-900/50">
                      <AvatarImage src={settings.profile.avatarUrl || "/avatar.jpg"} alt="Profile picture" />
                      <AvatarFallback className="text-lg font-semibold bg-purple-950/50 text-purple-200">
                        {settings.profile.firstName?.charAt(0) || 'U'}{settings.profile.lastName?.charAt(0) || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        className="border-purple-700/50 text-purple-200 hover:bg-purple-950/50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New Photo
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300 border-red-700/50 hover:bg-red-950/30">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                    <div className="text-sm text-purple-300/70 space-y-1">
                      <p>• Upload JPG, PNG or GIF. Max 5MB</p>
                      <p>• Recommended size: 400x400 pixels</p>
                      <p>• Square images work best</p>
                    </div>
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            alert('File size must be less than 5MB');
                            return;
                          }
                          // Handle file upload logic here
                          logger.debug('File selected', { fileName: file.name, fileSize: file.size });
                        }
                      }}
                    />
                  </div>
                </div>

                <Separator />

                {/* Enhanced Personal Information */}
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="flex items-center gap-2 text-purple-200">
                        <User className="h-4 w-4" />
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        value={settings.profile.firstName}
                        placeholder="Enter your first name"
                        onChange={(e) => setSettings({
                          ...settings,
                          profile: { ...settings.profile, firstName: e.target.value }
                        })}
                        className={!settings.profile.firstName ? 'bg-purple-950/50 border-red-500/50 text-slate-200 placeholder:text-purple-400/50' : 'bg-purple-950/50 border-purple-800/30 text-slate-200 placeholder:text-purple-400/50'}
                      />
                      {!settings.profile.firstName && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          First name is required
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="flex items-center gap-2 text-purple-200">
                        <User className="h-4 w-4" />
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        value={settings.profile.lastName}
                        placeholder="Enter your last name"
                        onChange={(e) => setSettings({
                          ...settings,
                          profile: { ...settings.profile, lastName: e.target.value }
                        })}
                        className={!settings.profile.lastName ? 'bg-purple-950/50 border-red-500/50 text-slate-200 placeholder:text-purple-400/50' : 'bg-purple-950/50 border-purple-800/30 text-slate-200 placeholder:text-purple-400/50'}
                      />
                      {!settings.profile.lastName && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Last name is required
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-purple-200">
                      <Mail className="h-4 w-4" />
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.profile.email}
                      placeholder="Enter your email address"
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, email: e.target.value }
                      })}
                      className={!settings.profile.email || !settings.profile.email.includes('@') ? 'bg-purple-950/50 border-red-500/50 text-slate-200 placeholder:text-purple-400/50' : 'bg-purple-950/50 border-purple-800/30 text-slate-200 placeholder:text-purple-400/50'}
                    />
                    {(!settings.profile.email || !settings.profile.email.includes('@')) && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Valid email address is required
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center gap-2 text-purple-200">
                      <User className="h-4 w-4" />
                      Username
                    </Label>
                    <Input
                      id="username"
                      value={settings.profile.username || ''}
                      placeholder="Choose a unique username"
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, username: e.target.value }
                      })}
                      className="bg-purple-950/50 border-purple-800/30 text-slate-200 placeholder:text-purple-400/50"
                    />
                    <p className="text-xs text-purple-300/70">
                      Your username will be visible to other users in shared workspaces
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="flex items-center gap-2 text-purple-200">
                      <User className="h-4 w-4" />
                      Bio
                    </Label>
                    <textarea
                      id="bio"
                      value={settings.profile.bio || ''}
                      placeholder="Tell others about yourself..."
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, bio: e.target.value }
                      })}
                      className="min-h-[80px] w-full rounded-md border border-purple-800/30 bg-purple-950/50 px-3 py-2 text-sm text-slate-200 ring-offset-background placeholder:text-purple-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-purple-300/70 text-right">
                      {(settings.profile.bio || '').length}/500 characters
                    </p>
                  </div>
                </div>

                {/* Location and Preferences */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="flex items-center gap-2 text-purple-200">
                      <MapPin className="h-4 w-4" />
                      Timezone *
                    </Label>
                    <Select
                      value={settings.profile.timezone}
                      onValueChange={(value) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, timezone: value }
                      })}
                    >
                      <SelectTrigger id="timezone" className="bg-purple-950/50 border-purple-800/30 text-slate-200">
                        <SelectValue placeholder="Select your timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">🇺🇸 Eastern Time (UTC-5)</SelectItem>
                        <SelectItem value="America/Chicago">🇺🇸 Central Time (UTC-6)</SelectItem>
                        <SelectItem value="America/Denver">🇺🇸 Mountain Time (UTC-7)</SelectItem>
                        <SelectItem value="America/Los_Angeles">🇺🇸 Pacific Time (UTC-8)</SelectItem>
                        <SelectItem value="Europe/London">🇬🇧 GMT (UTC+0)</SelectItem>
                        <SelectItem value="Europe/Paris">🇫🇷 CET (UTC+1)</SelectItem>
                        <SelectItem value="Europe/Berlin">🇩🇪 CET (UTC+1)</SelectItem>
                        <SelectItem value="Asia/Tokyo">🇯🇵 JST (UTC+9)</SelectItem>
                        <SelectItem value="Asia/Shanghai">🇨🇳 CST (UTC+8)</SelectItem>
                        <SelectItem value="Australia/Sydney">🇦🇺 AEDT (UTC+11)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language" className="flex items-center gap-2 text-purple-200">
                      <Languages className="h-4 w-4" />
                      Language
                    </Label>
                    <Select
                      value={settings.profile.language}
                      onValueChange={(value) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, language: value }
                      })}
                    >
                      <SelectTrigger id="language" className="bg-purple-950/50 border-purple-800/30 text-slate-200">
                        <SelectValue placeholder="Select your language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">🇺🇸 English</SelectItem>
                        <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                        <SelectItem value="fr">🇫🇷 French</SelectItem>
                        <SelectItem value="de">🇩🇪 German</SelectItem>
                        <SelectItem value="it">🇮🇹 Italian</SelectItem>
                        <SelectItem value="pt">🇵🇹 Portuguese</SelectItem>
                        <SelectItem value="zh">🇨🇳 Chinese</SelectItem>
                        <SelectItem value="ja">🇯🇵 Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-purple-200">Contact Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2 text-purple-200">
                        <Smartphone className="h-4 w-4" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={settings.profile.phone || ''}
                        placeholder="+1 (555) 123-4567"
                        className="bg-purple-950/50 border-purple-800/30 text-slate-200 placeholder:text-purple-400/50"
                        onChange={(e) => setSettings({
                          ...settings,
                          profile: { ...settings.profile, phone: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company" className="flex items-center gap-2 text-purple-200">
                        <Globe className="h-4 w-4" />
                        Company/Organization
                      </Label>
                      <Input
                        id="company"
                        value={settings.profile.company || ''}
                        placeholder="Your company name"
                        className="bg-purple-950/50 border-purple-800/30 text-slate-200 placeholder:text-purple-400/50"
                        onChange={(e) => setSettings({
                          ...settings,
                          profile: { ...settings.profile, company: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Enhanced Save Section */}
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center pt-4 border-t border-purple-800/30">
                  <div className="text-sm text-purple-300/70">
                    <p>* Required fields</p>
                    <p>Changes are saved automatically when you click Save Changes</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="border-purple-700/50 text-purple-200 hover:bg-purple-950/50"
                      onClick={() => {
                        // Reset to default values
                        setSettings({
                          ...settings,
                          profile: {
                            firstName: 'John',
                            lastName: 'Doe',
                            email: 'john.doe@example.com',
                            username: 'johndoe',
                            bio: '',
                            phone: '',
                            company: '',
                            avatarUrl: '',
                            timezone: 'America/New_York',
                            language: 'en'
                          }
                        });
                      }}
                    >
                      Reset
                    </Button>
                    <Button 
                      onClick={() => handleSave('profile', settings.profile)} 
                      disabled={isSaving || !settings.profile.firstName || !settings.profile.lastName || !settings.profile.email}
                      className="min-w-[120px]"
                    >
                      {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {!isSaving && <Save className="h-4 w-4 mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Notification Settings */}
          <TabsContent value="notifications">
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-200">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription className="text-purple-300/70">
                    Customize how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-purple-700/50 text-purple-200 hover:bg-purple-950/50"
                      onClick={() => {
                        // Enable all notifications
                        const allEnabled = { ...settings.notifications };
                        Object.keys(allEnabled.email).forEach(key => (allEnabled.email as any)[key] = true);
                        Object.keys(allEnabled.push).forEach(key => (allEnabled.push as any)[key] = true);
                        Object.keys(allEnabled.inApp).forEach(key => (allEnabled.inApp as any)[key] = true);
                        setSettings({ ...settings, notifications: allEnabled });
                      }}
                    >
                      <Volume2 className="h-4 w-4 mr-2" />
                      Enable All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-purple-700/50 text-purple-200 hover:bg-purple-950/50"
                      onClick={() => {
                        // Disable all notifications
                        const allDisabled = { ...settings.notifications };
                        Object.keys(allDisabled.email).forEach(key => (allDisabled.email as any)[key] = false);
                        Object.keys(allDisabled.push).forEach(key => (allDisabled.push as any)[key] = false);
                        Object.keys(allDisabled.inApp).forEach(key => (allDisabled.inApp as any)[key] = false);
                        setSettings({ ...settings, notifications: allDisabled });
                      }}
                    >
                      <VolumeX className="h-4 w-4 mr-2" />
                      Disable All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-purple-700/50 text-purple-200 hover:bg-purple-950/50"
                      onClick={() => {
                        alert('Sending test notification...');
                      }}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Send Test Notification
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Email Notifications */}
              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-200">
                    <Mail className="h-5 w-5" />
                    Email Notifications
                  </CardTitle>
                  <CardDescription className="text-purple-300/70">
                    Control what email notifications you receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'taskReminders', label: 'Task Reminders', desc: 'Get reminded about upcoming task deadlines', icon: Clock },
                    { key: 'taskDeadlines', label: 'Task Deadlines', desc: 'Critical alerts for overdue tasks', icon: AlertCircle },
                    { key: 'dailyDigest', label: 'Daily Digest', desc: 'Summary of your daily activities and progress', icon: Mail },
                    { key: 'weeklyReport', label: 'Weekly Report', desc: 'Comprehensive weekly performance report', icon: Award },
                    { key: 'monthlyReport', label: 'Monthly Report', desc: 'Monthly insights and goal tracking', icon: Award },
                    { key: 'achievements', label: 'Achievements', desc: 'Celebrate milestones and completed goals', icon: Award },
                    { key: 'teamUpdates', label: 'Team Updates', desc: 'Stay informed about team activities', icon: Users },
                    { key: 'securityAlerts', label: 'Security Alerts', desc: 'Important security and account notifications', icon: Shield },
                    { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Product updates and feature announcements', icon: Zap }
                  ].map(({ key, label, desc, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-purple-800/30 bg-purple-950/30">
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 mt-0.5 text-purple-400" />
                        <div>
                          <Label htmlFor={`email-${key}`} className="text-base font-medium text-purple-200">
                            {label}
                          </Label>
                          <p className="text-sm text-purple-300/70">
                            {desc}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id={`email-${key}`}
                        checked={(settings.notifications.email as any)[key]}
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
                </CardContent>
              </Card>

              {/* Push Notifications */}
              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-200">
                    <Smartphone className="h-5 w-5" />
                    Push Notifications
                  </CardTitle>
                  <CardDescription className="text-purple-300/70">
                    Instant notifications on your device
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'taskReminders', label: 'Task Reminders', desc: 'Push notifications for upcoming tasks', icon: Clock },
                    { key: 'taskDeadlines', label: 'Task Deadlines', desc: 'Urgent alerts for overdue items', icon: AlertCircle },
                    { key: 'mentions', label: 'Mentions', desc: 'When someone mentions you in comments', icon: MessageSquare },
                    { key: 'comments', label: 'Comments', desc: 'New comments on your tasks or projects', icon: MessageSquare },
                    { key: 'updates', label: 'General Updates', desc: 'App updates and new features', icon: Zap },
                    { key: 'teamActivity', label: 'Team Activity', desc: 'Real-time team collaboration updates', icon: Users },
                    { key: 'systemMaintenance', label: 'System Maintenance', desc: 'Important system announcements', icon: Shield }
                  ].map(({ key, label, desc, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-purple-800/30 bg-purple-950/30">
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 mt-0.5 text-purple-400" />
                        <div>
                          <Label htmlFor={`push-${key}`} className="text-base font-medium text-purple-200">
                            {label}
                          </Label>
                          <p className="text-sm text-purple-300/70">
                            {desc}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id={`push-${key}`}
                        checked={(settings.notifications.push as any)[key]}
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
                </CardContent>
              </Card>

              {/* In-App Notifications */}
              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-200">
                    <Bell className="h-5 w-5" />
                    In-App Notifications
                  </CardTitle>
                  <CardDescription className="text-purple-300/70">
                    Notifications within the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'taskCompletions', label: 'Task Completions', desc: 'Celebrate when you complete tasks', icon: Check },
                    { key: 'teamInvites', label: 'Team Invites', desc: 'Invitations to join teams or projects', icon: Users },
                    { key: 'mentions', label: 'Mentions', desc: 'When you\'re mentioned in discussions', icon: MessageSquare },
                    { key: 'systemMessages', label: 'System Messages', desc: 'Important app messages and updates', icon: Shield },
                    { key: 'tips', label: 'Tips & Suggestions', desc: 'Helpful tips to improve productivity', icon: Zap }
                  ].map(({ key, label, desc, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-purple-800/30 bg-purple-950/30">
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 mt-0.5 text-purple-400" />
                        <div>
                          <Label htmlFor={`inapp-${key}`} className="text-base font-medium text-purple-200">
                            {label}
                          </Label>
                          <p className="text-sm text-purple-300/70">
                            {desc}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id={`inapp-${key}`}
                        checked={(settings.notifications.inApp as any)[key]}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            inApp: { ...settings.notifications.inApp, [key]: checked }
                          }
                        })}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Enhanced Quiet Hours */}
              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-200">
                    <Moon className="h-5 w-5" />
                    Quiet Hours
                  </CardTitle>
                  <CardDescription className="text-purple-300/70">
                    Pause notifications during specific hours
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="quiet-hours" className="text-base font-medium text-purple-200">
                        Enable Quiet Hours
                      </Label>
                      <p className="text-sm text-purple-300/70">
                        Automatically pause all notifications during specified times
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
                    <div className="space-y-4 p-4 bg-purple-950/30 rounded-lg border border-purple-800/30">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="quiet-start" className="text-purple-200">Start Time</Label>
                          <Input
                            id="quiet-start"
                            type="time"
                            value={settings.notifications.quietHours.start}
                            className="bg-purple-950/50 border-purple-800/30 text-slate-200"
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
                          <Label htmlFor="quiet-end" className="text-purple-200">End Time</Label>
                          <Input
                            id="quiet-end"
                            type="time"
                            value={settings.notifications.quietHours.end}
                            className="bg-purple-950/50 border-purple-800/30 text-slate-200"
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
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="weekends-only" className="text-base text-purple-200">
                            Weekends Only
                          </Label>
                          <p className="text-sm text-purple-300/70">
                            Apply quiet hours only on weekends
                          </p>
                        </div>
                        <Switch
                          id="weekends-only"
                          checked={settings.notifications.quietHours.weekendsOnly}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              quietHours: { ...settings.notifications.quietHours, weekendsOnly: checked }
                            }
                          })}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notification Frequency */}
              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-200">
                    <Clock className="h-5 w-5" />
                    Notification Frequency
                  </CardTitle>
                  <CardDescription className="text-purple-300/70">
                    Control how often you receive different types of notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="digest-frequency" className="text-purple-200">Digest Frequency</Label>
                      <Select
                        value={settings.notifications.frequency.digest}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            frequency: { ...settings.notifications.frequency, digest: value }
                          }
                        })}
                      >
                        <SelectTrigger id="digest-frequency" className="bg-purple-950/50 border-purple-800/30 text-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reminder-timing" className="text-purple-200">Reminder Timing</Label>
                      <Select
                        value={settings.notifications.frequency.reminders}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            frequency: { ...settings.notifications.frequency, reminders: value }
                          }
                        })}
                      >
                        <SelectTrigger id="reminder-timing" className="bg-purple-950/50 border-purple-800/30 text-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5min">5 minutes before</SelectItem>
                          <SelectItem value="15min">15 minutes before</SelectItem>
                          <SelectItem value="30min">30 minutes before</SelectItem>
                          <SelectItem value="1hour">1 hour before</SelectItem>
                          <SelectItem value="1day">1 day before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="summary-frequency" className="text-purple-200">Summary Reports</Label>
                      <Select
                        value={settings.notifications.frequency.summaries}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            frequency: { ...settings.notifications.frequency, summaries: value }
                          }
                        })}
                      >
                        <SelectTrigger id="summary-frequency" className="bg-purple-950/50 border-purple-800/30 text-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSave('notifications', settings.notifications)} 
                  disabled={isSaving}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {!isSaving && <Save className="h-4 w-4 mr-2" />}
                  Save Notification Preferences
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Enhanced Appearance Settings */}
          <TabsContent value="appearance">
            <div className="space-y-6">
              {/* Theme Selection */}
              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-200">
                    <Palette className="h-5 w-5" />
                    Theme & Colors
                  </CardTitle>
                  <CardDescription className="text-purple-300/70">
                    Customize the overall look and color scheme
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Theme Selection */}
                  <div>
                    <Label className="text-base mb-4 block text-purple-200">Color Theme</Label>
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
                          className="flex flex-col items-center justify-center rounded-lg border-2 border-muted p-6 hover:border-accent hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                        >
                          <Sun className="h-8 w-8 mb-3 text-yellow-500" />
                          <span className="font-medium">Light</span>
                          <span className="text-xs text-muted-foreground mt-1">Bright & clean</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                        <Label
                          htmlFor="dark"
                          className="flex flex-col items-center justify-center rounded-lg border-2 border-muted p-6 hover:border-accent hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                        >
                          <Moon className="h-8 w-8 mb-3 text-blue-400" />
                          <span className="font-medium">Dark</span>
                          <span className="text-xs text-muted-foreground mt-1">Easy on eyes</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="system" id="system" className="peer sr-only" />
                        <Label
                          htmlFor="system"
                          className="flex flex-col items-center justify-center rounded-lg border-2 border-muted p-6 hover:border-accent hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                        >
                          <Monitor className="h-8 w-8 mb-3 text-gray-500" />
                          <span className="font-medium">System</span>
                          <span className="text-xs text-muted-foreground mt-1">Follows OS</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <Label className="text-base mb-4 block text-purple-200">Accent Color</Label>
                    <div className="grid grid-cols-6 gap-3">
                      {[
                        { name: 'blue', color: '#3b82f6', label: 'Blue' },
                        { name: 'green', color: '#10b981', label: 'Green' },
                        { name: 'purple', color: '#8b5cf6', label: 'Purple' },
                        { name: 'pink', color: '#ec4899', label: 'Pink' },
                        { name: 'orange', color: '#f97316', label: 'Orange' },
                        { name: 'red', color: '#ef4444', label: 'Red' }
                      ].map(({ name, color, label }) => (
                        <button
                          key={name}
                          onClick={() => setSettings({
                            ...settings,
                            appearance: { ...settings.appearance, accentColor: name, primaryColor: color }
                          })}
                          className={`group relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                            settings.appearance.accentColor === name
                              ? 'border-primary bg-primary/5'
                              : 'border-muted hover:border-accent'
                          }`}
                        >
                          <div
                            className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs font-medium">{label}</span>
                          {settings.appearance.accentColor === name && (
                            <Check className="absolute top-1 right-1 h-4 w-4 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Primary Color */}
                  <div>
                    <Label htmlFor="custom-color" className="text-base mb-2 block text-purple-200">Custom Primary Color</Label>
                    <div className="flex gap-3 items-center">
                      <Input
                        id="custom-color"
                        type="color"
                        value={settings.appearance.primaryColor}
                        onChange={(e) => setSettings({
                          ...settings,
                          appearance: { ...settings.appearance, primaryColor: e.target.value }
                        })}
                        className="w-16 h-10 rounded-md cursor-pointer bg-purple-950/50 border-purple-800/30"
                      />
                      <Input
                        value={settings.appearance.primaryColor}
                        onChange={(e) => setSettings({
                          ...settings,
                          appearance: { ...settings.appearance, primaryColor: e.target.value }
                        })}
                        placeholder="#3b82f6"
                        className="font-mono bg-purple-950/50 border-purple-800/30 text-slate-200 placeholder:text-purple-400/50"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Typography */}
              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-200">
                    <Type className="h-5 w-5" />
                    Typography
                  </CardTitle>
                  <CardDescription className="text-purple-300/70">
                    Customize fonts and text appearance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="fontFamily" className="text-purple-200">Font Family</Label>
                      <Select
                        value={settings.appearance.fontFamily}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          appearance: { ...settings.appearance, fontFamily: value }
                        })}
                      >
                        <SelectTrigger id="fontFamily" className="bg-purple-950/50 border-purple-800/30 text-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">System Default</SelectItem>
                          <SelectItem value="inter">Inter</SelectItem>
                          <SelectItem value="roboto">Roboto</SelectItem>
                          <SelectItem value="open-sans">Open Sans</SelectItem>
                          <SelectItem value="poppins">Poppins</SelectItem>
                          <SelectItem value="nunito">Nunito</SelectItem>
                          <SelectItem value="source-sans">Source Sans Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="fontSize" className="text-purple-200">Font Size</Label>
                      <Select
                        value={settings.appearance.fontSize}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          appearance: { ...settings.appearance, fontSize: value }
                        })}
                      >
                        <SelectTrigger id="fontSize" className="bg-purple-950/50 border-purple-800/30 text-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small (14px)</SelectItem>
                          <SelectItem value="medium">Medium (16px)</SelectItem>
                          <SelectItem value="large">Large (18px)</SelectItem>
                          <SelectItem value="extra-large">Extra Large (20px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Layout & Spacing */}
              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-200">
                    <Layout className="h-5 w-5" />
                    Layout & Spacing
                  </CardTitle>
                  <CardDescription className="text-purple-300/70">
                    Control interface density and spacing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="density" className="text-purple-200">Interface Density</Label>
                      <Select
                        value={settings.appearance.density}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          appearance: { ...settings.appearance, density: value }
                        })}
                      >
                        <SelectTrigger id="density" className="bg-purple-950/50 border-purple-800/30 text-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact">Compact</SelectItem>
                          <SelectItem value="comfortable">Comfortable</SelectItem>
                          <SelectItem value="spacious">Spacious</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-purple-300/70 mt-1">
                        Controls padding and spacing throughout the app
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="borderRadius" className="text-purple-200">Border Radius</Label>
                      <Select
                        value={settings.appearance.borderRadius}
                        onValueChange={(value) => setSettings({
                          ...settings,
                          appearance: { ...settings.appearance, borderRadius: value }
                        })}
                      >
                        <SelectTrigger id="borderRadius" className="bg-purple-950/50 border-purple-800/30 text-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (0px)</SelectItem>
                          <SelectItem value="small">Small (4px)</SelectItem>
                          <SelectItem value="medium">Medium (8px)</SelectItem>
                          <SelectItem value="large">Large (12px)</SelectItem>
                          <SelectItem value="extra-large">Extra Large (16px)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-purple-300/70 mt-1">
                        Roundness of buttons, cards, and other elements
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Animation & Motion */}
              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-200">
                    <Zap className="h-5 w-5" />
                    Animation & Motion
                  </CardTitle>
                  <CardDescription className="text-purple-300/70">
                    Control animations and visual effects
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-purple-800/30 bg-purple-950/30">
                    <div>
                      <Label htmlFor="animations" className="text-base font-medium text-purple-200">
                        Enable Animations
                      </Label>
                      <p className="text-sm text-purple-300/70">
                        Smooth transitions and micro-interactions
                      </p>
                    </div>
                    <Switch
                      id="animations"
                      checked={settings.appearance.animations}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        appearance: { ...settings.appearance, animations: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-purple-800/30 bg-purple-950/30">
                    <div>
                      <Label htmlFor="reduced-motion" className="text-base font-medium text-purple-200">
                        Reduced Motion
                      </Label>
                      <p className="text-sm text-purple-300/70">
                        Minimize animations for better accessibility
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
                </CardContent>
              </Card>

              {/* Accessibility */}
              <Card className="backdrop-blur-xl bg-slate-900/80 border-purple-800/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-200">
                    <EyeIcon className="h-5 w-5" />
                    Accessibility
                  </CardTitle>
                  <CardDescription className="text-purple-300/70">
                    Visual accessibility and readability options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-purple-800/30 bg-purple-950/30">
                    <div>
                      <Label htmlFor="high-contrast" className="text-base font-medium text-purple-200">
                        High Contrast Mode
                      </Label>
                      <p className="text-sm text-purple-300/70">
                        Increase contrast for better readability
                      </p>
                    </div>
                    <Switch
                      id="high-contrast"
                      checked={settings.appearance.highContrast}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        appearance: { ...settings.appearance, highContrast: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-purple-800/30 bg-purple-950/30">
                    <div>
                      <Label htmlFor="colorblind-friendly" className="text-base font-medium text-purple-200">
                        Color Blind Friendly
                      </Label>
                      <p className="text-sm text-purple-300/70">
                        Adjust colors for color vision deficiency
                      </p>
                    </div>
                    <Switch
                      id="colorblind-friendly"
                      checked={settings.appearance.colorBlindFriendly}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        appearance: { ...settings.appearance, colorBlindFriendly: checked }
                      })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Preview and Reset */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Preview & Reset
                  </CardTitle>
                  <CardDescription>
                    Preview changes and reset to defaults
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg border bg-muted/50">
                    <h4 className="font-medium mb-2">Preview</h4>
                    <div className="space-y-2 text-sm">
                      <p>Theme: <span className="font-mono">{settings.appearance.theme}</span></p>
                      <p>Font: <span className="font-mono">{settings.appearance.fontFamily}</span> - {settings.appearance.fontSize}</p>
                      <p>Density: <span className="font-mono">{settings.appearance.density}</span></p>
                      <p>Accent: <span className="font-mono">{settings.appearance.accentColor}</span></p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSettings({
                          ...settings,
                          appearance: {
                            theme: 'system',
                            accentColor: 'blue',
                            primaryColor: '#3b82f6',
                            backgroundColor: 'default',
                            fontSize: 'medium',
                            fontFamily: 'system',
                            borderRadius: 'medium',
                            density: 'comfortable',
                            reducedMotion: false,
                            animations: true,
                            highContrast: false,
                            colorBlindFriendly: false
                          }
                        });
                      }}
                    >
                      Reset to Defaults
                    </Button>
                    <Button 
                      onClick={() => handleSave('appearance', settings.appearance)} 
                      disabled={isSaving}
                      className="flex-1"
                    >
                      {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {!isSaving && <Save className="h-4 w-4 mr-2" />}
                      Save Appearance Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Enhanced Integrations */}
          <TabsContent value="integrations">
            <div className="space-y-6">
              {/* Google Calendar Integration */}
              <GoogleCalendarIntegration />
              
              {/* Integration Categories */}
              {['productivity', 'communication', 'development', 'storage', 'automation'].map(category => {
                const categoryIntegrations = settings.integrations.filter(i => i.category === category && i.id !== 'google');
                if (categoryIntegrations.length === 0) return null;
                
                return (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 capitalize">
                        <Link className="h-5 w-5" />
                        {category} Integrations
                      </CardTitle>
                      <CardDescription>
                        Connect with your favorite {category} tools
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {categoryIntegrations.map((integration) => (
                          <div key={integration.id} className="p-4 border rounded-lg hover:border-accent transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{integration.icon}</span>
                                <div>
                                  <h4 className="font-medium">{integration.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {integration.description}
                                  </p>
                                </div>
                              </div>
                              {integration.connected && (
                                <Badge variant="default" className="text-xs">
                                  Connected
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant={integration.connected ? 'outline' : 'default'}
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  if (integration.connected) {
                                    // Disconnect logic
                                    setSettings({
                                      ...settings,
                                      integrations: settings.integrations.map(i => 
                                        i.id === integration.id ? { ...i, connected: false } : i
                                      )
                                    });
                                    toast({
                                      title: "Integration disconnected",
                                      description: `${integration.name} has been disconnected successfully.`
                                    });
                                  } else {
                                    // Connect logic
                                    setSettings({
                                      ...settings,
                                      integrations: settings.integrations.map(i => 
                                        i.id === integration.id ? { ...i, connected: true } : i
                                      )
                                    });
                                    toast({
                                      title: "Integration connected",
                                      description: `${integration.name} has been connected successfully.`
                                    });
                                  }
                                }}
                              >
                                {integration.connected ? 'Disconnect' : 'Connect'}
                              </Button>
                              {integration.connected && (
                                <Button variant="outline" size="sm">
                                  <X className="h-4 w-4" />
                                  Settings
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Integration Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Integration Management
                  </CardTitle>
                  <CardDescription>
                    Manage your connected services and data sync
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Auto-Sync
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Automatically sync data every 15 minutes
                      </p>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Data Privacy
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Encrypt all integration data
                      </p>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Integration Data
                    </Button>
                    <Button variant="outline" size="sm">
                      <Zap className="h-4 w-4 mr-2" />
                      Force Sync All
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-600">
                      <X className="h-4 w-4 mr-2" />
                      Disconnect All
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* API Keys and Webhooks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    API & Webhooks
                  </CardTitle>
                  <CardDescription>
                    Manage API access and webhook configurations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">API Key</h4>
                    <div className="flex gap-2">
                      <Input 
                        type="password" 
                        value="ap1_xxxxx...xxxxx" 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button variant="outline" size="sm">
                        Copy
                      </Button>
                      <Button variant="outline" size="sm">
                        Regenerate
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Use this API key to access your data programmatically
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Webhook Endpoints</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-mono text-sm">https://your-app.com/webhook/tasks</p>
                          <p className="text-xs text-muted-foreground">Task completion events</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Add Webhook
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Enhanced Privacy & Security Settings */}
          <TabsContent value="privacy">
            <div className="space-y-6">
              {/* Profile Privacy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Profile Privacy
                  </CardTitle>
                  <CardDescription>
                    Control who can see your profile and personal information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="visibility" className="text-base mb-2 block">Profile Visibility</Label>
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
                        <SelectItem value="public">
                          <div className="flex flex-col items-start">
                            <span>Public</span>
                            <span className="text-xs text-muted-foreground">Visible to everyone</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="team">
                          <div className="flex flex-col items-start">
                            <span>Team Only</span>
                            <span className="text-xs text-muted-foreground">Visible to team members</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex flex-col items-start">
                            <span>Private</span>
                            <span className="text-xs text-muted-foreground">Only visible to you</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    {[
                      { key: 'showEmail', label: 'Show Email Address', desc: 'Display your email in your public profile' },
                      { key: 'showPhoneNumber', label: 'Show Phone Number', desc: 'Display your phone number in team directory' },
                      { key: 'activityStatus', label: 'Activity Status', desc: 'Show when you\'re online or last active' },
                      { key: 'shareProgressPublicly', label: 'Public Progress Sharing', desc: 'Allow others to see your task completion stats' },
                      { key: 'allowDirectMessages', label: 'Allow Direct Messages', desc: 'Let team members send you direct messages' }
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <Label htmlFor={key} className="text-base font-medium">
                            {label}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {desc}
                          </p>
                        </div>
                        <Switch
                          id={key}
                          checked={(settings.privacy as any)[key]}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            privacy: { ...settings.privacy, [key]: checked }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Data & Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data & Analytics
                  </CardTitle>
                  <CardDescription>
                    Manage how your data is used and shared
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'dataSharing', label: 'Analytics Data Sharing', desc: 'Help improve the product with anonymous usage data' },
                    { key: 'searchEngineIndexing', label: 'Search Engine Indexing', desc: 'Allow search engines to index your public profile' },
                    { key: 'downloadableData', label: 'Data Export', desc: 'Allow downloading your data in standard formats' }
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <Label htmlFor={key} className="text-base font-medium">
                          {label}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {desc}
                        </p>
                      </div>
                      <Switch
                        id={key}
                        checked={(settings.privacy as any)[key]}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          privacy: { ...settings.privacy, [key]: checked }
                        })}
                      />
                    </div>
                  ))}

                  <div className="space-y-2">
                    <Label htmlFor="data-retention" className="text-base">Data Retention Period</Label>
                    <Select
                      value={settings.privacy.dataRetention}
                      onValueChange={(value) => setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, dataRetention: value }
                      })}
                    >
                      <SelectTrigger id="data-retention">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1year">1 Year</SelectItem>
                        <SelectItem value="2years">2 Years</SelectItem>
                        <SelectItem value="5years">5 Years</SelectItem>
                        <SelectItem value="forever">Forever</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How long to keep your inactive data before automatic deletion
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Enhance your account security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <Label htmlFor="two-factor" className="text-base font-medium">
                          Two-Factor Authentication
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="two-factor"
                          checked={settings.privacy.twoFactorAuth}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            privacy: { ...settings.privacy, twoFactorAuth: checked }
                          })}
                        />
                        {settings.privacy.twoFactorAuth && (
                          <Button variant="outline" size="sm">
                            Setup
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <Label htmlFor="login-notifications" className="text-base font-medium">
                          Login Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified of new login attempts
                        </p>
                      </div>
                      <Switch
                        id="login-notifications"
                        checked={settings.privacy.loginNotifications}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          privacy: { ...settings.privacy, loginNotifications: checked }
                        })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session-timeout" className="text-base">Session Timeout</Label>
                    <Select
                      value={settings.privacy.sessionTimeout.toString()}
                      onValueChange={(value) => setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, sessionTimeout: parseInt(value) }
                      })}
                    >
                      <SelectTrigger id="session-timeout">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                        <SelectItem value="1440">24 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Automatically log out after this period of inactivity
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Account Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account Management
                  </CardTitle>
                  <CardDescription>
                    Export your data and manage account deletion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Data Export
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Download all your data in JSON format
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        Export All Data
                      </Button>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Privacy Report
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        See what data we collect about you
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        Generate Report
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium text-red-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Danger Zone
                    </h4>
                    <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950">
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-red-800 dark:text-red-200">Account Deletion</h5>
                          <p className="text-sm text-red-600 dark:text-red-300">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete Account
                          </Button>
                          <div className="text-xs text-red-600 dark:text-red-300">
                            {settings.privacy.accountDeletion.deleteAfterDays} day grace period
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={() => handleSave('privacy', settings.privacy)} 
                      disabled={isSaving}
                      size="lg"
                    >
                      {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {!isSaving && <Save className="h-4 w-4 mr-2" />}
                      Save Privacy Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}