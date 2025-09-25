'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Timer, 
  Coffee, 
  Target, 
  Calendar, 
  Clock,
  Play,
  Pause,
  RotateCcw,
  Settings,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { useProductivityPreferences } from '@/hooks/use-user-preferences';
import { toast } from 'sonner';

export function ProductivitySettings() {
  const { productivity, updateProductivity } = useProductivityPreferences();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // The hook handles the API call automatically
      await new Promise(resolve => setTimeout(resolve, 500)); // Just for UX
      toast.success('Productivity settings saved successfully');
    } catch (error) {
      toast.error('Failed to save productivity settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof typeof productivity, value: any) => {
    updateProductivity({ [key]: value });
  };

  const updateWorkingHours = (updates: Partial<typeof productivity.workingHours>) => {
    updateProductivity({
      workingHours: { ...productivity.workingHours, ...updates }
    });
  };

  const toggleWorkingDay = (day: string) => {
    const days = productivity.workingHours.days.includes(day)
      ? productivity.workingHours.days.filter(d => d !== day)
      : [...productivity.workingHours.days, day];
    
    updateWorkingHours({ days });
  };

  const workingDays = [
    { id: 'monday', label: 'Mon' },
    { id: 'tuesday', label: 'Tue' },
    { id: 'wednesday', label: 'Wed' },
    { id: 'thursday', label: 'Thu' },
    { id: 'friday', label: 'Fri' },
    { id: 'saturday', label: 'Sat' },
    { id: 'sunday', label: 'Sun' }
  ];

  return (
    <div className="space-y-6">
      {/* Pomodoro Timer Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-red-500" />
            <CardTitle>Pomodoro Timer</CardTitle>
          </div>
          <CardDescription>
            Configure your focus and break intervals for maximum productivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Focus Length (minutes)</Label>
              <div className="space-y-2">
                <Slider
                  value={[productivity.pomodoroLength]}
                  onValueChange={([value]) => updateSetting('pomodoroLength', value)}
                  min={15}
                  max={60}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>15m</span>
                  <span className="font-medium">{productivity.pomodoroLength}m</span>
                  <span>60m</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Short Break (minutes)</Label>
              <div className="space-y-2">
                <Slider
                  value={[productivity.shortBreakLength]}
                  onValueChange={([value]) => updateSetting('shortBreakLength', value)}
                  min={3}
                  max={15}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>3m</span>
                  <span className="font-medium">{productivity.shortBreakLength}m</span>
                  <span>15m</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Long Break (minutes)</Label>
              <div className="space-y-2">
                <Slider
                  value={[productivity.longBreakLength]}
                  onValueChange={([value]) => updateSetting('longBreakLength', value)}
                  min={15}
                  max={45}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>15m</span>
                  <span className="font-medium">{productivity.longBreakLength}m</span>
                  <span>45m</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto-start breaks</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically start break timers after focus sessions
                </p>
              </div>
              <Switch
                checked={productivity.autoStartBreaks}
                onCheckedChange={(checked) => updateSetting('autoStartBreaks', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto-start pomodoros</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically start next focus session after breaks
                </p>
              </div>
              <Switch
                checked={productivity.autoStartPomodoros}
                onCheckedChange={(checked) => updateSetting('autoStartPomodoros', checked)}
              />
            </div>
          </div>

          {/* Pomodoro Preview */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Timer Preview</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm">Focus: {productivity.pomodoroLength}m</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">Short: {productivity.shortBreakLength}m</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm">Long: {productivity.longBreakLength}m</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Goals */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            <CardTitle>Daily Goals</CardTitle>
          </div>
          <CardDescription>
            Set your daily productivity targets and focus hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Daily Focus Hours Target</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[productivity.dailyGoal]}
                onValueChange={([value]) => updateSetting('dailyGoal', value)}
                min={1}
                max={16}
                step={0.5}
                className="flex-1"
              />
              <Badge variant="secondary" className="min-w-fit">
                {productivity.dailyGoal} hours
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Recommended: 6-8 hours for optimal productivity without burnout
            </p>
          </div>

          {/* Goal Visualization */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Daily Target Breakdown</span>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Focus sessions needed:</span>
                <span className="font-medium">
                  {Math.ceil((productivity.dailyGoal * 60) / productivity.pomodoroLength)} sessions
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total break time:</span>
                <span className="font-medium">
                  {Math.round(
                    (Math.ceil((productivity.dailyGoal * 60) / productivity.pomodoroLength) - 1) *
                    productivity.shortBreakLength +
                    Math.floor(Math.ceil((productivity.dailyGoal * 60) / productivity.pomodoroLength) / 4) *
                    (productivity.longBreakLength - productivity.shortBreakLength)
                  )} minutes
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            <CardTitle>Working Hours</CardTitle>
          </div>
          <CardDescription>
            Define your work schedule for better time management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable working hours</Label>
              <p className="text-sm text-muted-foreground">
                Restrict scheduling and notifications to work hours
              </p>
            </div>
            <Switch
              checked={productivity.workingHours.enabled}
              onCheckedChange={(checked) => updateWorkingHours({ enabled: checked })}
            />
          </div>

          {productivity.workingHours.enabled && (
            <>
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={productivity.workingHours.start}
                    onChange={(e) => updateWorkingHours({ start: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={productivity.workingHours.end}
                    onChange={(e) => updateWorkingHours({ end: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Working Days</Label>
                <div className="flex flex-wrap gap-2">
                  {workingDays.map((day) => (
                    <div key={day.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.id}
                        checked={productivity.workingHours.days.includes(day.id)}
                        onCheckedChange={() => toggleWorkingDay(day.id)}
                      />
                      <Label htmlFor={day.id} className="text-sm">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Working Hours Summary */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Schedule Summary</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>
                    Working {productivity.workingHours.days.length} days per week,{' '}
                    {productivity.workingHours.start} - {productivity.workingHours.end}
                  </p>
                  <p className="mt-1">
                    Total: {Math.round(
                      productivity.workingHours.days.length * 
                      ((parseInt(productivity.workingHours.end.split(':')[0]) * 60 + 
                        parseInt(productivity.workingHours.end.split(':')[1])) -
                       (parseInt(productivity.workingHours.start.split(':')[0]) * 60 + 
                        parseInt(productivity.workingHours.start.split(':')[1]))) / 60
                    )} hours per week
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <CardTitle>Productivity Insights</CardTitle>
          </div>
          <CardDescription>
            Based on your current settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 rounded-lg">
              <Timer className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">{productivity.pomodoroLength}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Focus Minutes
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg">
              <Target className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{productivity.dailyGoal}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Daily Hours Goal
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg">
              <Coffee className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{productivity.shortBreakLength}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Break Minutes
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}