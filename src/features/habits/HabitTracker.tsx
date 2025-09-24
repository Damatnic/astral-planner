'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, Circle } from 'lucide-react'

interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  status: 'active' | 'paused' | 'completed';
}

export function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits');
      if (response.ok) {
        const data = await response.json();
        setHabits(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load habits',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleHabitCompletion = async (habitId: string) => {
    try {
      const response = await fetch(`/api/habits/${habitId}/complete`, {
        method: 'POST',
      });
      
      if (response.ok) {
        await fetchHabits(); // Refresh the list
        toast({
          title: 'Success',
          description: 'Habit updated!',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update habit',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading habits...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Habit Tracker</h2>
      <div className="grid gap-4">
        {habits.map((habit) => (
          <Card key={habit.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleHabitCompletion(habit.id)}
                  className="p-1"
                >
                  {habit.currentStreak > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </Button>
                {habit.name}
              </CardTitle>
              <CardDescription>{habit.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Current Streak: {habit.currentStreak}</span>
                <span>Longest Streak: {habit.longestStreak}</span>
                <span>Total: {habit.totalCompleted}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default HabitTracker;