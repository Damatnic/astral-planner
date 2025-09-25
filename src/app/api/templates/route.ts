import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withFeature } from '@/lib/auth/middleware';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { templates } from '@/db/schema/templates';
import { users } from '@/db/schema/users';
import { blocks } from '@/db/schema/blocks';
import { workspaces } from '@/db/schema/workspaces';
import { eq, and, desc, ilike, inArray } from 'drizzle-orm';
import Logger from '@/lib/logger';

// Predefined template library with popular productivity templates
const PREDEFINED_TEMPLATES = [
  {
    id: 'daily-productivity',
    name: 'Daily Productivity Planner',
    description: 'A comprehensive daily planning template with time blocking, priorities, and reflection sections.',
    category: 'productivity',
    tags: ['daily', 'productivity', 'time-blocking', 'priorities'],
    isPublic: true,
    isPro: false,
    previewImage: '/templates/daily-productivity.png',
    usageCount: 1247,
    rating: 4.8,
    author: {
      name: 'Astral Team',
      avatar: '/icons/icon-96x96.png'
    },
    createdAt: '2024-01-15',
    content: {
      blocks: [
        { type: 'task', title: 'Morning Review (15 min)', priority: 'high', estimatedHours: 0.25 },
        { type: 'task', title: 'Focus Block 1: Deep Work', priority: 'high', estimatedHours: 2 },
        { type: 'task', title: 'Focus Block 2: Communications', priority: 'medium', estimatedHours: 1 },
        { type: 'task', title: 'Focus Block 3: Admin Tasks', priority: 'medium', estimatedHours: 1 },
        { type: 'task', title: 'Evening Reflection (10 min)', priority: 'low', estimatedHours: 0.17 }
      ],
      goals: [
        { title: 'Complete 3 Priority Tasks', description: 'Focus on high-impact activities' }
      ]
    }
  },
  {
    id: 'weekly-review',
    name: 'Weekly Review & Planning',
    description: 'Weekly reflection and planning template for continuous improvement and goal alignment.',
    category: 'productivity',
    tags: ['weekly', 'review', 'planning', 'goals'],
    isPublic: true,
    isPro: false,
    previewImage: '/templates/weekly-review.png',
    usageCount: 892,
    rating: 4.6,
    author: {
      name: 'Productivity Pro',
      avatar: '/templates/authors/pro.png'
    },
    createdAt: '2024-01-20',
    content: {
      blocks: [
        { type: 'task', title: 'Review Last Week Achievements', priority: 'high', estimatedHours: 0.5 },
        { type: 'task', title: 'Identify Areas for Improvement', priority: 'medium', estimatedHours: 0.5 },
        { type: 'task', title: 'Set 3 Goals for Next Week', priority: 'high', estimatedHours: 0.5 },
        { type: 'task', title: 'Plan Major Tasks & Time Blocks', priority: 'high', estimatedHours: 1 }
      ]
    }
  },
  {
    id: 'project-kickoff',
    name: 'Project Kickoff Template',
    description: 'Complete project initiation template with stakeholder mapping, timeline, and deliverables.',
    category: 'business',
    tags: ['project', 'kickoff', 'planning', 'business'],
    isPublic: true,
    isPro: true,
    previewImage: '/templates/project-kickoff.png',
    usageCount: 634,
    rating: 4.9,
    author: {
      name: 'PM Expert',
      avatar: '/templates/authors/pm.png'
    },
    createdAt: '2024-02-01',
    content: {
      blocks: [
        { type: 'task', title: 'Define Project Scope & Objectives', priority: 'high', estimatedHours: 2 },
        { type: 'task', title: 'Identify Key Stakeholders', priority: 'high', estimatedHours: 1 },
        { type: 'task', title: 'Create Project Timeline', priority: 'high', estimatedHours: 2 },
        { type: 'task', title: 'Set Up Communication Channels', priority: 'medium', estimatedHours: 1 }
      ]
    }
  },
  {
    id: 'study-session',
    name: 'Study Session Planner',
    description: 'Optimized study session with spaced repetition, active recall, and break scheduling.',
    category: 'education',
    tags: ['study', 'education', 'learning', 'focus'],
    isPublic: true,
    isPro: false,
    previewImage: '/templates/study-session.png',
    usageCount: 756,
    rating: 4.7,
    author: {
      name: 'StudyMaster',
      avatar: '/templates/authors/study.png'
    },
    createdAt: '2024-01-25',
    content: {
      blocks: [
        { type: 'task', title: 'Review Previous Material (15 min)', priority: 'medium', estimatedHours: 0.25 },
        { type: 'task', title: 'Study Block 1: New Content', priority: 'high', estimatedHours: 1.5 },
        { type: 'task', title: 'Break (15 min)', priority: 'low', estimatedHours: 0.25 },
        { type: 'task', title: 'Study Block 2: Practice Problems', priority: 'high', estimatedHours: 1.5 },
        { type: 'task', title: 'Review & Note Taking (20 min)', priority: 'medium', estimatedHours: 0.33 }
      ]
    }
  },
  {
    id: 'fitness-routine',
    name: 'Fitness & Wellness Tracker',
    description: 'Comprehensive fitness planning with workout scheduling, nutrition tracking, and progress monitoring.',
    category: 'health',
    tags: ['fitness', 'health', 'wellness', 'tracking'],
    isPublic: true,
    isPro: false,
    previewImage: '/templates/fitness-routine.png',
    usageCount: 543,
    rating: 4.5,
    author: {
      name: 'FitCoach',
      avatar: '/templates/authors/fitness.png'
    },
    createdAt: '2024-02-05',
    content: {
      blocks: [
        { type: 'task', title: 'Morning Workout (45 min)', priority: 'high', estimatedHours: 0.75 },
        { type: 'task', title: 'Track Water Intake', priority: 'medium', estimatedHours: 0.1 },
        { type: 'task', title: 'Log Meals & Nutrition', priority: 'medium', estimatedHours: 0.25 },
        { type: 'task', title: 'Evening Stretch (15 min)', priority: 'low', estimatedHours: 0.25 }
      ]
    }
  }
];

async function handleGET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sortBy = searchParams.get('sortBy') || 'popular'; // popular, recent, rating
    const showPublic = searchParams.get('public') !== 'false';

    // Start with predefined templates
    let templateList = [...PREDEFINED_TEMPLATES];

    // Add user's custom templates
    try {
      const userWorkspaces = await db.select().from(workspaces).where(eq(workspaces.ownerId, user.id)).limit(1);
      if (userWorkspaces.length > 0) {
        const customTemplates = await db.select().from(templates)
          .where(eq(templates.creatorId, user.id));
        
        // Convert custom templates to API format
        customTemplates.forEach(template => {
          templateList.push({
            id: template.id,
            name: template.name,
            description: template.description || '',
            category: template.category as any,
            tags: (template.tags as string[]) || [],
            isPublic: template.status === 'published',
            isPro: template.isPremium || false,
            previewImage: template.thumbnail || '/templates/default.png',
            usageCount: template.useCount || 0,
            rating: parseFloat(template.rating?.toString() || '4.0'),
            author: {
              name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'User',
              avatar: user.imageUrl || '/icons/icon-96x96.png'
            },
            createdAt: template.createdAt?.toISOString() || new Date().toISOString(),
            content: (template.structure as any) || { blocks: [], goals: [] }
          });
        });
      }
    } catch (error) {
      Logger.error('Error fetching custom templates:', error);
    }

    // Apply filters
    if (category && category !== 'all') {
      templateList = templateList.filter(t => t.category === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      templateList = templateList.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (!showPublic) {
      templateList = templateList.filter(t => !t.isPublic);
    }

    // Sort templates
    switch (sortBy) {
      case 'recent':
        templateList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'rating':
        templateList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popular':
      default:
        templateList.sort((a, b) => b.usageCount - a.usageCount);
        break;
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedTemplates = templateList.slice(startIndex, startIndex + limit);

    Logger.info('Templates fetched:', { 
      userId: user.id, 
      count: paginatedTemplates.length,
      total: templateList.length 
    });

    return NextResponse.json({
      templates: paginatedTemplates,
      pagination: {
        page,
        limit,
        total: templateList.length,
        totalPages: Math.ceil(templateList.length / limit),
        hasNext: startIndex + limit < templateList.length,
        hasPrevious: page > 1
      }
    });
  } catch (error) {
    Logger.error('Templates fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export const GET = withFeature('templates', withAuth(handleGET));