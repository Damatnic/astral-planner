import { z } from 'zod';
import { AppError } from './logger';

// Base schemas
export const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateUserSchema = createUserSchema.partial();

// Goal schemas
export const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled']).default('not_started'),
  dueDate: z.string().datetime().optional(),
  parentId: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
});

export const updateGoalSchema = createGoalSchema.partial();

// Habit schemas  
export const createHabitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  target: z.number().int().positive('Target must be positive'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  icon: z.string().min(1, 'Icon is required'),
  isActive: z.boolean().default(true),
  reminderTime: z.string().optional(),
  category: z.string().optional(),
});

export const updateHabitSchema = createHabitSchema.partial();

// Task schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']).default('todo'),
  dueDate: z.string().datetime().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  goalId: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const updateTaskSchema = createTaskSchema.partial();

// Template schemas
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  content: z.object({
    goals: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      priority: z.string().optional(),
    })).default([]),
    tasks: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      priority: z.string().optional(),
    })).default([]),
    habits: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
      frequency: z.string().optional(),
    })).default([]),
  }),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export const updateTemplateSchema = createTemplateSchema.partial();

// API validation middleware
export function validateRequest(schema: z.ZodSchema) {
  return (req: any) => {
    try {
      const validated = schema.parse(req.body);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        throw new AppError(`Validation error: ${errorMessage}`, 400);
      }
      throw new AppError('Invalid request data', 400);
    }
  };
}

// Query parameter validation
export const paginationSchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  sort: z.string().optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const filterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional().transform(val => val ? val.split(',') : []),
});

// Sanitization utilities
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
};

export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return sanitizeHtml(input);
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
};

// Request data sanitization
export const sanitizeRequestData = (data: any): any => {
  return sanitizeInput(data);
};