import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/tasks/route';
import { db } from '@/db';
import { auth } from '@clerk/nextjs/server';

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn()
}));

// Mock database
jest.mock('@/db', () => ({
  db: {
    query: {
      users: {
        findFirst: jest.fn()
      },
      blocks: {
        findMany: jest.fn()
      },
      workspaces: {
        findFirst: jest.fn()
      },
      workspaceMembers: {
        findFirst: jest.fn()
      }
    },
    insert: jest.fn(),
    update: jest.fn(),
    $count: jest.fn()
  }
}));

describe('/api/tasks', () => {
  const mockUserId = 'user_123';
  const mockUser = {
    id: 'db_user_123',
    clerkId: mockUserId,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User'
  };

  beforeAll(() => {
    // Set up default auth mock
    (auth as jest.Mock).mockReturnValue({ userId: mockUserId });
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tasks', () => {
    it('should return 401 when not authenticated', async () => {
      (auth as jest.Mock).mockReturnValueOnce({ userId: null });
      
      const req = new NextRequest('http://localhost:3000/api/tasks');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return tasks for authenticated user', async () => {
      const mockTasks = [
        {
          id: 'task_1',
          title: 'Test Task 1',
          type: 'task',
          status: 'todo',
          priority: 'medium',
          createdBy: mockUser.id
        },
        {
          id: 'task_2',
          title: 'Test Task 2',
          type: 'task',
          status: 'in_progress',
          priority: 'high',
          createdBy: mockUser.id
        }
      ];

      (db.query.users.findFirst as jest.Mock).mockResolvedValueOnce(mockUser);
      (db.query.blocks.findMany as jest.Mock).mockResolvedValueOnce(mockTasks);
      (db.$count as jest.Mock).mockResolvedValueOnce(2);

      const req = new NextRequest('http://localhost:3000/api/tasks');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });

    it('should filter tasks by status', async () => {
      const mockFilteredTasks = [
        {
          id: 'task_1',
          title: 'Completed Task',
          type: 'task',
          status: 'completed',
          priority: 'low',
          createdBy: mockUser.id
        }
      ];

      (db.query.users.findFirst as jest.Mock).mockResolvedValueOnce(mockUser);
      (db.query.blocks.findMany as jest.Mock).mockResolvedValueOnce(mockFilteredTasks);
      (db.$count as jest.Mock).mockResolvedValueOnce(1);

      const req = new NextRequest('http://localhost:3000/api/tasks?status=completed');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0].status).toBe('completed');
    });

    it('should handle database errors gracefully', async () => {
      (db.query.users.findFirst as jest.Mock).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const req = new NextRequest('http://localhost:3000/api/tasks');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch tasks');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const newTaskData = {
        title: 'New Task',
        description: 'Task description',
        type: 'task',
        workspaceId: 'workspace_123',
        status: 'todo',
        priority: 'medium'
      };

      const createdTask = {
        id: 'task_new',
        ...newTaskData,
        createdBy: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (db.query.users.findFirst as jest.Mock).mockResolvedValueOnce(mockUser);
      (db.query.workspaces.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'workspace_123',
        ownerId: mockUser.id
      });
      (db.query.blocks.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (db.insert as jest.Mock).mockReturnValueOnce({
        values: jest.fn().mockReturnValueOnce({
          returning: jest.fn().mockResolvedValueOnce([createdTask])
        })
      });
      (db.update as jest.Mock).mockReturnValueOnce({
        set: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockResolvedValueOnce([])
        })
      });

      const req = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(newTaskData)
      });

      // Mock req.json()
      req.json = jest.fn().mockResolvedValueOnce(newTaskData);

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('task_new');
      expect(data.title).toBe('New Task');
    });

    it('should validate input data', async () => {
      const invalidData = {
        title: '', // Empty title should fail validation
        workspaceId: 'not-a-uuid'
      };

      const req = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });

      req.json = jest.fn().mockResolvedValueOnce(invalidData);

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
      expect(data.details).toBeDefined();
    });

    it('should check workspace access permissions', async () => {
      const taskData = {
        title: 'New Task',
        type: 'task',
        workspaceId: 'workspace_456',
        status: 'todo'
      };

      (db.query.users.findFirst as jest.Mock).mockResolvedValueOnce(mockUser);
      (db.query.workspaces.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (db.query.workspaceMembers.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const req = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });

      req.json = jest.fn().mockResolvedValueOnce(taskData);

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Access denied to workspace');
    });
  });
});