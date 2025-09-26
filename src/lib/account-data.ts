// Account-specific data for different users

export interface AccountData {
  habits: any[];
  goals: any[];
  tasks: any[];
  preferences: {
    theme: string;
    notifications: boolean;
    autoSave: boolean;
  };
}

const NICKS_PLANNER_DATA: AccountData = {
  habits: [
    {
      id: 'nick-habit-1',
      name: 'Morning Workout',
      description: 'Start the day with a 30-minute workout routine',
      category: 'Fitness',
      frequency: 'daily',
      targetCount: 1,
      targetValue: '30',
      unit: 'minutes',
      timeOfDay: 'morning',
      reminderTime: '06:30',
      currentStreak: 15,
      longestStreak: 28,
      bestStreak: 28,
      totalCompleted: 85,
      totalCompletions: 85,
      isActive: true,
      color: '#10B981',
      icon: '💪',
      createdAt: '2024-01-15T06:30:00Z',
      updatedAt: '2024-01-15T06:30:00Z',
      userId: 'nick-planner',
      sortOrder: 1,
      completedToday: true,
      completedDates: ['2025-09-26', '2025-09-25', '2025-09-24', '2025-09-23', '2025-09-22'],
      skippedDates: [],
      stats: {
        completedDays: 15,
        totalDays: 30,
        completionRate: 85.0,
        completedToday: true,
        currentStreak: 15,
        bestStreak: 28
      },
      entries: [
        { date: '2025-09-26', completed: true, value: 30, notes: 'Great morning session!' },
        { date: '2025-09-25', completed: true, value: 35, notes: 'Added extra cardio' },
        { date: '2025-09-24', completed: true, value: 30, notes: 'Strength training focus' },
        { date: '2025-09-23', completed: true, value: 25, notes: 'Quick workout' }
      ],
      weeklyPattern: {
        '2025-09-22': { total: 7, completed: 7 },
        '2025-09-15': { total: 7, completed: 6 }
      }
    },
    {
      id: 'nick-habit-2',
      name: 'Business Reading',
      description: 'Read business and leadership books for 45 minutes daily',
      category: 'Learning',
      frequency: 'daily',
      targetCount: 45,
      targetValue: '45',
      unit: 'minutes',
      timeOfDay: 'evening',
      reminderTime: '19:00',
      currentStreak: 22,
      longestStreak: 35,
      bestStreak: 35,
      totalCompleted: 120,
      totalCompletions: 120,
      isActive: true,
      color: '#8B5CF6',
      icon: '📚',
      createdAt: '2024-01-15T19:00:00Z',
      updatedAt: '2024-01-15T19:00:00Z',
      userId: 'nick-planner',
      sortOrder: 2,
      completedToday: true,
      completedDates: ['2025-09-26', '2025-09-25', '2025-09-24', '2025-09-23'],
      skippedDates: [],
      stats: {
        completedDays: 22,
        totalDays: 30,
        completionRate: 92.0,
        completedToday: true,
        currentStreak: 22,
        bestStreak: 35
      },
      entries: [
        { date: '2025-09-26', completed: true, value: 50, notes: 'Finished chapter on leadership' },
        { date: '2025-09-25', completed: true, value: 45, notes: 'Great insights on team management' },
        { date: '2025-09-24', completed: true, value: 60, notes: 'Extended reading session' },
        { date: '2025-09-23', completed: true, value: 45, notes: 'Strategic planning concepts' }
      ],
      weeklyPattern: {
        '2025-09-22': { total: 7, completed: 7 },
        '2025-09-15': { total: 7, completed: 7 }
      }
    },
    {
      id: 'nick-habit-3',
      name: 'Team Check-ins',
      description: 'Daily one-on-one check-ins with team members',
      category: 'Productivity',
      frequency: 'daily',
      targetCount: 3,
      targetValue: '3',
      unit: 'check-ins',
      timeOfDay: 'afternoon',
      reminderTime: '14:00',
      currentStreak: 10,
      longestStreak: 18,
      bestStreak: 18,
      totalCompleted: 65,
      totalCompletions: 65,
      isActive: true,
      color: '#3B82F6',
      icon: '👥',
      createdAt: '2024-01-15T14:00:00Z',
      updatedAt: '2024-01-15T14:00:00Z',
      userId: 'nick-planner',
      sortOrder: 3,
      completedToday: false,
      completedDates: ['2025-09-25', '2025-09-24', '2025-09-23'],
      skippedDates: ['2025-09-26'],
      stats: {
        completedDays: 10,
        totalDays: 30,
        completionRate: 75.0,
        completedToday: false,
        currentStreak: 10,
        bestStreak: 18
      },
      entries: [
        { date: '2025-09-26', completed: false, value: 1, notes: 'Busy day, only managed 1' },
        { date: '2025-09-25', completed: true, value: 3, notes: 'All team members checked in' },
        { date: '2025-09-24', completed: true, value: 4, notes: 'Extra session with new hire' },
        { date: '2025-09-23', completed: true, value: 3, notes: 'Regular check-ins completed' }
      ],
      weeklyPattern: {
        '2025-09-22': { total: 7, completed: 5 },
        '2025-09-15': { total: 7, completed: 6 }
      }
    }
  ],
  goals: [
    {
      id: 'nick-goal-1',
      title: 'Expand Team to 15 Members',
      description: 'Hire and onboard 5 new team members for Q1 expansion',
      type: 'quarterly',
      category: 'Career',
      targetValue: 15,
      currentValue: 12,
      targetDate: '2025-03-31',
      status: 'active',
      priority: 'high',
      userId: 'nick-planner',
      progress: 80,
      completionPercentage: 80,
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2025-09-26T10:00:00Z',
      isOverdue: false,
      daysRemaining: 186
    },
    {
      id: 'nick-goal-2',
      title: 'Complete Executive MBA',
      description: 'Finish the Executive MBA program by end of year',
      type: 'yearly',
      category: 'Learning',
      targetValue: 100,
      currentValue: 75,
      targetDate: '2025-12-31',
      status: 'active',
      priority: 'medium',
      userId: 'nick-planner',
      progress: 75,
      completionPercentage: 75,
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2025-09-26T10:00:00Z',
      isOverdue: false,
      daysRemaining: 96
    },
    {
      id: 'nick-goal-3',
      title: 'Launch New Product Line',
      description: 'Successfully launch the new premium product line',
      type: 'quarterly',
      category: 'Career',
      targetValue: 100,
      currentValue: 65,
      targetDate: '2025-12-15',
      status: 'active',
      priority: 'urgent',
      userId: 'nick-planner',
      progress: 65,
      completionPercentage: 65,
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2025-09-26T10:00:00Z',
      isOverdue: false,
      daysRemaining: 80
    }
  ],
  tasks: [
    {
      id: 'nick-task-1',
      title: 'Review Q3 Performance Reports',
      description: 'Analyze team performance and prepare Q4 strategy',
      completed: false,
      priority: 'high',
      dueDate: '2025-09-28',
      category: 'Work',
      userId: 'nick-planner',
      createdAt: '2025-09-26T08:00:00Z'
    },
    {
      id: 'nick-task-2',
      title: 'Schedule Leadership Retreat',
      description: 'Plan and book venue for leadership team retreat',
      completed: false,
      priority: 'medium',
      dueDate: '2025-10-05',
      category: 'Management',
      userId: 'nick-planner',
      createdAt: '2025-09-26T08:00:00Z'
    }
  ],
  preferences: {
    theme: 'blue',
    notifications: true,
    autoSave: true
  }
};

const DEMO_ACCOUNT_DATA: AccountData = {
  habits: [
    {
      id: 'demo-habit-1',
      name: 'Morning Meditation',
      description: 'Start each day with 10 minutes of meditation',
      category: 'Wellness',
      frequency: 'daily',
      targetCount: 1,
      targetValue: '1',
      unit: 'session',
      timeOfDay: 'morning',
      reminderTime: '07:00',
      currentStreak: 7,
      longestStreak: 21,
      bestStreak: 21,
      totalCompleted: 45,
      totalCompletions: 45,
      isActive: true,
      color: '#3B82F6',
      icon: '🧘',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      userId: 'demo-user',
      sortOrder: 1,
      completedToday: true,
      completedDates: ['2025-09-26', '2025-09-25', '2025-09-24'],
      skippedDates: ['2025-09-23'],
      stats: {
        completedDays: 7,
        totalDays: 30,
        completionRate: 23.3,
        completedToday: true,
        currentStreak: 7,
        bestStreak: 21
      },
      entries: [
        { date: '2025-09-26', completed: true, value: 1, notes: '' },
        { date: '2025-09-25', completed: true, value: 1, notes: '' },
        { date: '2025-09-24', completed: true, value: 1, notes: '' },
        { date: '2025-09-23', completed: false, value: 0, notes: '' }
      ],
      weeklyPattern: {
        '2025-09-22': { total: 7, completed: 5 },
        '2025-09-15': { total: 7, completed: 6 }
      }
    },
    {
      id: 'demo-habit-2',
      name: 'Daily Exercise',
      description: 'Get at least 30 minutes of physical activity',
      category: 'Health',
      frequency: 'daily',
      targetCount: 30,
      targetValue: '30',
      unit: 'minutes',
      timeOfDay: 'afternoon',
      reminderTime: '17:00',
      currentStreak: 3,
      longestStreak: 15,
      bestStreak: 15,
      totalCompleted: 28,
      totalCompletions: 28,
      isActive: true,
      color: '#10B981',
      icon: '💪',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      userId: 'demo-user',
      sortOrder: 2,
      completedToday: false,
      completedDates: ['2025-09-25', '2025-09-24', '2025-09-23'],
      skippedDates: ['2025-09-26'],
      stats: {
        completedDays: 5,
        totalDays: 30,
        completionRate: 16.7,
        completedToday: false,
        currentStreak: 3,
        bestStreak: 15
      },
      entries: [
        { date: '2025-09-26', completed: false, value: 0, notes: '' },
        { date: '2025-09-25', completed: true, value: 45, notes: 'Great workout!' },
        { date: '2025-09-24', completed: true, value: 30, notes: '' },
        { date: '2025-09-23', completed: true, value: 35, notes: '' }
      ],
      weeklyPattern: {
        '2025-09-22': { total: 7, completed: 3 },
        '2025-09-15': { total: 7, completed: 4 }
      }
    }
  ],
  goals: [
    {
      id: 'demo-goal-1',
      title: 'Learn Web Development',
      description: 'Complete a full-stack web development course',
      type: 'yearly',
      category: 'Learning',
      targetValue: 100,
      currentValue: 45,
      targetDate: '2025-12-31',
      status: 'active',
      priority: 'medium',
      userId: 'demo-user',
      progress: 45,
      completionPercentage: 45,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2025-09-26T10:00:00Z',
      isOverdue: false,
      daysRemaining: 96
    },
    {
      id: 'demo-goal-2',
      title: 'Save $5,000',
      description: 'Build emergency fund savings',
      type: 'yearly',
      category: 'Finance',
      targetValue: 5000,
      currentValue: 2500,
      targetDate: '2025-12-31',
      status: 'active',
      priority: 'high',
      userId: 'demo-user',
      progress: 50,
      completionPercentage: 50,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2025-09-26T10:00:00Z',
      isOverdue: false,
      daysRemaining: 96
    }
  ],
  tasks: [
    {
      id: 'demo-task-1',
      title: 'Try the Demo Features',
      description: 'Explore habits, goals, and task management',
      completed: false,
      priority: 'low',
      dueDate: '2025-09-27',
      category: 'Demo',
      userId: 'demo-user',
      createdAt: '2025-09-26T08:00:00Z'
    },
    {
      id: 'demo-task-2',
      title: 'Create Your First Habit',
      description: 'Use the + button to create a new habit',
      completed: false,
      priority: 'medium',
      dueDate: '2025-09-27',
      category: 'Demo',
      userId: 'demo-user',
      createdAt: '2025-09-26T08:00:00Z'
    }
  ],
  preferences: {
    theme: 'green',
    notifications: false,
    autoSave: true
  }
};

export function getAccountData(userId: string): AccountData {
  switch (userId) {
    case 'nick-planner':
      return NICKS_PLANNER_DATA;
    case 'demo-user':
      return DEMO_ACCOUNT_DATA;
    default:
      return DEMO_ACCOUNT_DATA; // Fallback to demo data
  }
}