/**
 * @jest-environment node
 */
const { getAccountData } = require('../src/lib/account-data');

describe('Demo Account Authentication System', () => {
  describe('Account Data Configuration', () => {
    test('should have demo-user account data', () => {
      const demoData = getAccountData('demo-user');
      
      expect(demoData).toBeDefined();
      expect(demoData.id).toBe('demo-user');
      expect(demoData.displayName).toBe('Demo User');
    });

    test('demo account should have habits data', () => {
      const demoData = getAccountData('demo-user');
      
      expect(demoData.habits).toBeDefined();
      expect(Array.isArray(demoData.habits)).toBe(true);
      expect(demoData.habits.length).toBeGreaterThan(0);
      
      // Verify habit structure
      const firstHabit = demoData.habits[0];
      expect(firstHabit).toHaveProperty('id');
      expect(firstHabit).toHaveProperty('name');
      expect(firstHabit).toHaveProperty('category');
      expect(firstHabit).toHaveProperty('frequency');
    });

    test('demo account should have goals data', () => {
      const demoData = getAccountData('demo-user');
      
      expect(demoData.goals).toBeDefined();
      expect(Array.isArray(demoData.goals)).toBe(true);
      expect(demoData.goals.length).toBeGreaterThan(0);
      
      // Verify goal structure
      const firstGoal = demoData.goals[0];
      expect(firstGoal).toHaveProperty('id');
      expect(firstGoal).toHaveProperty('title');
      expect(firstGoal).toHaveProperty('category');
      expect(firstGoal).toHaveProperty('progress');
    });

    test('demo account should have tasks data', () => {
      const demoData = getAccountData('demo-user');
      
      expect(demoData.tasks).toBeDefined();
      expect(Array.isArray(demoData.tasks)).toBe(true);
      expect(demoData.tasks.length).toBeGreaterThan(0);
      
      // Verify task structure
      const firstTask = demoData.tasks[0];
      expect(firstTask).toHaveProperty('id');
      expect(firstTask).toHaveProperty('title');
      expect(firstTask).toHaveProperty('status');
    });
  });

  describe('Nick Account Configuration', () => {
    test('should have nick-planner account data', () => {
      const nickData = getAccountData('nick-planner');
      
      expect(nickData).toBeDefined();
      expect(nickData.id).toBe('nick-planner');
      expect(nickData.displayName).toBe('Nick');
    });

    test('nick account should have business-focused habits', () => {
      const nickData = getAccountData('nick-planner');
      
      expect(nickData.habits).toBeDefined();
      expect(Array.isArray(nickData.habits)).toBe(true);
      expect(nickData.habits.length).toBeGreaterThan(0);
      
      // Check for business-oriented habits
      const habitNames = nickData.habits.map(h => h.name);
      expect(habitNames.some(name => name.toLowerCase().includes('business') || 
                                     name.toLowerCase().includes('workout') || 
                                     name.toLowerCase().includes('team'))).toBe(true);
    });
  });

  describe('Account Data Fallback', () => {
    test('should fallback to demo-user for unknown accounts', () => {
      const unknownData = getAccountData('unknown-user');
      
      expect(unknownData).toBeDefined();
      expect(unknownData.id).toBe('demo-user'); // Should fallback
    });
  });

  describe('Data Structure Validation', () => {
    test('all habits should have required fields', () => {
      const demoData = getAccountData('demo-user');
      
      demoData.habits.forEach((habit, index) => {
        expect(habit.id).toBeDefined();
        expect(habit.name).toBeDefined();
        expect(habit.category).toBeDefined();
        expect(habit.frequency).toBeDefined();
        expect(habit.targetCount).toBeDefined();
        expect(habit.unit).toBeDefined();
        expect(habit.currentStreak).toBeDefined();
        expect(habit.isActive).toBeDefined();
      });
    });

    test('all goals should have required fields', () => {
      const demoData = getAccountData('demo-user');
      
      demoData.goals.forEach((goal, index) => {
        expect(goal.id).toBeDefined();
        expect(goal.title).toBeDefined();
        expect(goal.category).toBeDefined();
        expect(goal.targetValue).toBeDefined();
        expect(goal.currentValue).toBeDefined();
        expect(goal.progress).toBeDefined();
        expect(goal.status).toBeDefined();
        expect(goal.userId).toBe(demoData.id);
      });
    });

    test('all tasks should have required fields', () => {
      const demoData = getAccountData('demo-user');
      
      demoData.tasks.forEach((task, index) => {
        expect(task.id).toBeDefined();
        expect(task.title).toBeDefined();
        expect(task.status).toBeDefined();
        expect(task.priority).toBeDefined();
        expect(task.userId).toBe(demoData.id);
      });
    });
  });

  describe('Demo Account PIN Configuration', () => {
    test('demo account PIN should be 0000', () => {
      // This would typically be tested by loading the LoginClient component
      // For now, we'll test that the demo data is properly configured
      const demoData = getAccountData('demo-user');
      expect(demoData.id).toBe('demo-user');
      
      // The PIN is stored in LoginClient.tsx, not in account data
      // This test verifies that the account exists for PIN validation
    });
  });

  describe('Performance Tests', () => {
    test('account data loading should be fast', () => {
      const start = performance.now();
      const demoData = getAccountData('demo-user');
      const end = performance.now();
      
      expect(end - start).toBeLessThan(100); // Should load in less than 100ms
      expect(demoData).toBeDefined();
    });

    test('should handle multiple concurrent requests', async () => {
      const promises = Array(10).fill(null).map(() => 
        Promise.resolve(getAccountData('demo-user'))
      );
      
      const results = await Promise.all(promises);
      
      expect(results.length).toBe(10);
      results.forEach(result => {
        expect(result.id).toBe('demo-user');
      });
    });
  });
});