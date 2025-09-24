import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { templates, templateLikes, templateUsage } from '@/db/schema';
import { eq, and, desc, sql, like, or } from 'drizzle-orm';
import { z } from 'zod';

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  category: z.enum(['productivity', 'business', 'education', 'health', 'creative', 'development', 'personal']),
  content: z.object({
    workspaces: z.array(z.any()).optional(),
    blocks: z.array(z.any()).optional(),
    goals: z.array(z.any()).optional(),
    habits: z.array(z.any()).optional(),
    settings: z.record(z.any()).optional()
  }),
  tags: z.array(z.string()).max(10),
  isPublic: z.boolean().default(false),
  isPro: z.boolean().default(false),
  previewImage: z.string().optional()
});

// GET /api/templates - List templates
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    const searchParams = req.nextUrl.searchParams;
    
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'popular';
    const userTemplates = searchParams.get('userTemplates') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query conditions
    const conditions = [];
    
    if (userTemplates && userId) {
      // Get user from database
      const userRecord = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.clerkId, userId)
      });
      
      if (userRecord) {
        conditions.push(eq(templates.createdBy, userRecord.id));
      }
    } else {
      // Only show public templates
      conditions.push(eq(templates.isPublic, true));
    }

    if (category && category !== 'all') {
      conditions.push(eq(templates.category, category));
    }

    if (search) {
      conditions.push(
        or(
          like(templates.name, `%${search}%`),
          like(templates.description, `%${search}%`),
          sql`${templates.tags}::text LIKE ${'%' + search + '%'}`
        )
      );
    }

    // Build order by clause
    let orderBy = [];
    switch (sortBy) {
      case 'popular':
        orderBy = [desc(templates.usageCount), desc(templates.likeCount)];
        break;
      case 'rating':
        orderBy = [desc(templates.rating), desc(templates.likeCount)];
        break;
      case 'recent':
        orderBy = [desc(templates.createdAt)];
        break;
      default:
        orderBy = [desc(templates.usageCount)];
    }

    // Query templates
    const allTemplates = await db.query.templates.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy,
      limit,
      offset,
      with: {
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true
          }
        }
      }
    });

    // Get user's liked templates if authenticated
    let likedTemplateIds: string[] = [];
    if (userId) {
      const userRecord = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.clerkId, userId)
      });
      
      if (userRecord) {
        const likes = await db.query.templateLikes.findMany({
          where: eq(templateLikes.userId, userRecord.id),
          columns: {
            templateId: true
          }
        });
        likedTemplateIds = likes.map(l => l.templateId);
      }
    }

    // Format response
    const formattedTemplates = allTemplates.map(template => ({
      ...template,
      isLiked: likedTemplateIds.includes(template.id),
      author: template.creator ? 
        `${template.creator.firstName} ${template.creator.lastName}` : 
        'Anonymous'
    }));

    // Get total count for pagination
    const totalCount = await db.$count(
      templates,
      conditions.length > 0 ? and(...conditions) : undefined
    );

    return NextResponse.json({
      templates: formattedTemplates,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create template
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = CreateTemplateSchema.parse(body);

    // Get user from database
    const userRecord = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.clerkId, userId)
    });

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create the template
    const [newTemplate] = await db.insert(templates).values({
      ...validated,
      createdBy: userRecord.id,
      usageCount: 0,
      likeCount: 0,
      rating: 0,
      metadata: {
        version: 1,
        created: new Date().toISOString()
      }
    }).returning();

    return NextResponse.json(newTemplate);
  } catch (error) {
    console.error('Failed to create template:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}