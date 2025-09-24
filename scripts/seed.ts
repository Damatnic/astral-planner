import { db } from '../src/db'
import { users, workspaces, workspaceMembers, blocks, goals, habits, templates } from '../src/db/schema'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

const DEMO_USER_ID = 'demo-user-id'
const DEMO_CLERK_ID = 'user_demo_123456789'

async function seed() {
  console.log('🌱 Starting database seeding...')

  try {
    // Clear existing demo data
    console.log('🧹 Clearing existing demo data...')
    await db.delete(blocks).where(eq(blocks.createdBy, DEMO_USER_ID))
    await db.delete(goals).where(eq(goals.userId, DEMO_USER_ID))
    await db.delete(habits).where(eq(habits.userId, DEMO_USER_ID))
    await db.delete(workspaceMembers).where(eq(workspaceMembers.userId, DEMO_USER_ID))
    await db.delete(workspaces).where(eq(workspaces.ownerId, DEMO_USER_ID))
    await db.delete(users).where(eq(users.id, DEMO_USER_ID))

    // Create demo user
    console.log('👤 Creating demo user...')
    await db.insert(users).values({
      id: DEMO_USER_ID,
      clerkId: DEMO_CLERK_ID,
      email: 'demo@astralplanner.com',
      firstName: 'Demo',
      lastName: 'User',
      imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        theme: 'system',
        notifications: true,
        timezone: 'America/New_York',
      }
    })

    // Create demo workspace
    console.log('🏢 Creating demo workspace...')
    const workspaceId = uuidv4()
    await db.insert(workspaces).values({
      id: workspaceId,
      name: 'Personal Workspace',
      description: 'My personal productivity space',
      ownerId: DEMO_USER_ID,
      settings: {
        features: {
          ai: true,
          calendar: true,
          templates: true,
        }
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Add user as workspace member
    await db.insert(workspaceMembers).values({
      id: uuidv4(),
      workspaceId,
      userId: DEMO_USER_ID,
      role: 'owner',
      joinedAt: new Date(),
    })

    // Create demo tasks
    console.log('📝 Creating demo tasks...')
    const tasksData = [
      {
        id: uuidv4(),
        workspaceId,
        title: 'Complete project documentation',
        content: 'Write comprehensive documentation for the new API endpoints',
        type: 'task' as const,
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        estimatedHours: 4,
        tags: ['documentation', 'api'],
        createdBy: DEMO_USER_ID,
      },
      {
        id: uuidv4(),
        workspaceId,
        title: 'Review pull requests',
        content: 'Review and merge pending pull requests from the team',
        type: 'task' as const,
        status: 'todo',
        priority: 'medium',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        estimatedHours: 2,
        tags: ['review', 'development'],
        createdBy: DEMO_USER_ID,
      },
      {
        id: uuidv4(),
        workspaceId,
        title: 'Prepare presentation for client meeting',
        content: 'Create slides and demo for the upcoming client presentation',
        type: 'task' as const,
        status: 'todo',
        priority: 'high',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        estimatedHours: 6,
        tags: ['presentation', 'client'],
        createdBy: DEMO_USER_ID,
      },
      {
        id: uuidv4(),
        workspaceId,
        title: 'Optimize database queries',
        content: 'Improve performance by optimizing slow database queries',
        type: 'task' as const,
        status: 'completed',
        priority: 'medium',
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
        estimatedHours: 3,
        actualHours: 4,
        tags: ['optimization', 'database'],
        createdBy: DEMO_USER_ID,
      },
      {
        id: uuidv4(),
        workspaceId,
        title: 'Write unit tests for new features',
        content: 'Achieve 80% test coverage for the authentication module',
        type: 'task' as const,
        status: 'in_progress',
        priority: 'medium',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        estimatedHours: 8,
        tags: ['testing', 'quality'],
        createdBy: DEMO_USER_ID,
      },
    ]

    for (const task of tasksData) {
      await db.insert(blocks).values({
        ...task,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Create demo goals
    console.log('🎯 Creating demo goals...')
    const goalsData = [
      {
        id: uuidv4(),
        userId: DEMO_USER_ID,
        title: 'Launch MVP',
        description: 'Successfully launch the minimum viable product to early adopters',
        targetValue: 100,
        currentValue: 75,
        unit: '%',
        category: 'business',
        status: 'active' as const,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        milestones: [
          { title: 'Complete core features', completed: true },
          { title: 'Beta testing', completed: true },
          { title: 'Fix critical bugs', completed: false },
          { title: 'Deploy to production', completed: false },
        ],
      },
      {
        id: uuidv4(),
        userId: DEMO_USER_ID,
        title: 'Learn TypeScript',
        description: 'Master TypeScript for better type safety in projects',
        targetValue: 100,
        currentValue: 60,
        unit: '%',
        category: 'learning',
        status: 'active' as const,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        milestones: [
          { title: 'Complete basics course', completed: true },
          { title: 'Build sample project', completed: true },
          { title: 'Advanced patterns', completed: false },
          { title: 'Contribute to open source', completed: false },
        ],
      },
      {
        id: uuidv4(),
        userId: DEMO_USER_ID,
        title: 'Fitness Goal',
        description: 'Run 100km this month',
        targetValue: 100,
        currentValue: 45,
        unit: 'km',
        category: 'health',
        status: 'active' as const,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      },
    ]

    for (const goal of goalsData) {
      await db.insert(goals).values({
        ...goal,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Create demo habits
    console.log('💪 Creating demo habits...')
    const habitsData = [
      {
        id: uuidv4(),
        userId: DEMO_USER_ID,
        name: 'Morning Meditation',
        description: 'Start the day with 10 minutes of mindfulness',
        frequency: 'daily' as const,
        targetCount: 1,
        currentStreak: 12,
        longestStreak: 21,
        color: '#3B82F6',
        icon: '🧘',
        reminderTime: '07:00',
        isActive: true,
      },
      {
        id: uuidv4(),
        userId: DEMO_USER_ID,
        name: 'Read for 30 minutes',
        description: 'Read books or articles to expand knowledge',
        frequency: 'daily' as const,
        targetCount: 1,
        currentStreak: 5,
        longestStreak: 15,
        color: '#10B981',
        icon: '📚',
        reminderTime: '20:00',
        isActive: true,
      },
      {
        id: uuidv4(),
        userId: DEMO_USER_ID,
        name: 'Exercise',
        description: 'Physical activity for at least 30 minutes',
        frequency: 'weekly' as const,
        targetCount: 4,
        currentStreak: 3,
        longestStreak: 8,
        color: '#F59E0B',
        icon: '💪',
        weekDays: ['monday', 'wednesday', 'friday', 'sunday'],
        isActive: true,
      },
      {
        id: uuidv4(),
        userId: DEMO_USER_ID,
        name: 'Practice coding',
        description: 'Solve at least one coding challenge',
        frequency: 'daily' as const,
        targetCount: 1,
        currentStreak: 8,
        longestStreak: 30,
        color: '#8B5CF6',
        icon: '💻',
        reminderTime: '18:00',
        isActive: true,
      },
      {
        id: uuidv4(),
        userId: DEMO_USER_ID,
        name: 'Drink 8 glasses of water',
        description: 'Stay hydrated throughout the day',
        frequency: 'daily' as const,
        targetCount: 8,
        currentStreak: 15,
        longestStreak: 45,
        color: '#06B6D4',
        icon: '💧',
        isActive: true,
      },
    ]

    for (const habit of habitsData) {
      await db.insert(habits).values({
        ...habit,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Create demo templates
    console.log('📋 Creating demo templates...')
    const templatesData = [
      {
        id: uuidv4(),
        name: 'GTD Weekly Review',
        description: 'Getting Things Done weekly review template',
        category: 'productivity',
        content: {
          tasks: [
            'Clear inbox to zero',
            'Review calendar for next week',
            'Update project lists',
            'Review someday/maybe list',
            'Clear desktop and downloads folder',
          ],
          structure: 'checklist',
        },
        tags: ['gtd', 'weekly', 'review'],
        isPublic: true,
        isPremium: false,
        createdBy: DEMO_USER_ID,
        usageCount: 0,
        rating: 4.5,
      },
      {
        id: uuidv4(),
        name: 'Daily Standup',
        description: 'Scrum daily standup meeting template',
        category: 'business',
        content: {
          sections: [
            { title: 'Yesterday', items: [] },
            { title: 'Today', items: [] },
            { title: 'Blockers', items: [] },
          ],
          structure: 'sections',
        },
        tags: ['scrum', 'agile', 'daily'],
        isPublic: true,
        isPremium: false,
        createdBy: DEMO_USER_ID,
        usageCount: 0,
        rating: 4.2,
      },
      {
        id: uuidv4(),
        name: 'SMART Goal Planner',
        description: 'Create goals using the SMART framework',
        category: 'productivity',
        content: {
          prompts: [
            'Specific: What exactly do you want to achieve?',
            'Measurable: How will you measure progress?',
            'Achievable: Is this goal realistic?',
            'Relevant: Why is this goal important?',
            'Time-bound: What is the deadline?',
          ],
          structure: 'prompts',
        },
        tags: ['goals', 'smart', 'planning'],
        isPublic: true,
        isPremium: false,
        createdBy: DEMO_USER_ID,
        usageCount: 0,
        rating: 4.8,
      },
    ]

    for (const template of templatesData) {
      await db.insert(templates).values({
        ...template,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    console.log('✅ Database seeding completed successfully!')
    console.log('📊 Summary:')
    console.log(`   - 1 demo user created`)
    console.log(`   - 1 workspace created`)
    console.log(`   - ${tasksData.length} tasks created`)
    console.log(`   - ${goalsData.length} goals created`)
    console.log(`   - ${habitsData.length} habits created`)
    console.log(`   - ${templatesData.length} templates created`)

    // Create analytics data (optional)
    console.log('📈 Creating analytics data...')
    const analyticsData = {
      userId: DEMO_USER_ID,
      stats: {
        totalTasks: tasksData.length,
        completedTasks: tasksData.filter(t => t.status === 'completed').length,
        totalGoals: goalsData.length,
        activeHabits: habitsData.filter(h => h.isActive).length,
        currentStreaks: habitsData.map(h => h.currentStreak),
        productivityScore: 78,
      },
      lastCalculated: new Date(),
    }

    console.log('🎉 Demo data seeding complete!')
    console.log('📝 Demo credentials:')
    console.log('   Email: demo@astralplanner.com')
    console.log('   Password: DemoUser123!')
    console.log('')
    console.log('🚀 You can now log in with the demo account!')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Add helper function for importing from eq
import { eq } from 'drizzle-orm'

// Run the seeder
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })