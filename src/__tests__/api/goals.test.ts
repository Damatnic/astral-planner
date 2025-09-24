import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/goals/route'
import { auth } from '@clerk/nextjs/server'

// Mock auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}))

// Mock database
const mockDb = {
  query: {
    users: {
      findFirst: jest.fn(),
    },
    goals: {
      findMany: jest.fn(),
    },
  },
  insert: jest.fn().mockReturnValue({
    values: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([{ id: 'new-goal-id' }]),
    }),
  }),
}

jest.mock('@/db', () => ({
  db: mockDb,
}))

jest.mock('@/db/schema', () => ({
  goals: {},
  users: {},
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>

describe('/api/goals', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null })
      
      const request = new NextRequest('http://localhost:3000/api/goals')
      const response = await GET(request)
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return goals for authenticated user', async () => {
      const mockUserId = 'test-user-id'
      const mockGoals = [
        {
          id: 'goal-1',
          title: 'Test Goal',
          description: 'Test description',
          targetValue: 100,
          currentValue: 50,
          status: 'active',
        },
      ]

      mockAuth.mockReturnValue({ userId: mockUserId })
      mockDb.query.users.findFirst.mockResolvedValue({
        id: 'db-user-id',
        clerkId: mockUserId,
      })
      mockDb.query.goals.findMany.mockResolvedValue(mockGoals)

      const request = new NextRequest('http://localhost:3000/api/goals')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.goals).toEqual(mockGoals)
      expect(data.success).toBe(true)
    })

    it('should filter goals by category when provided', async () => {
      const mockUserId = 'test-user-id'
      mockAuth.mockReturnValue({ userId: mockUserId })
      mockDb.query.users.findFirst.mockResolvedValue({
        id: 'db-user-id',
        clerkId: mockUserId,
      })
      mockDb.query.goals.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/goals?category=health')
      await GET(request)

      expect(mockDb.query.goals.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Function),
        })
      )
    })

    it('should filter goals by status when provided', async () => {
      const mockUserId = 'test-user-id'
      mockAuth.mockReturnValue({ userId: mockUserId })
      mockDb.query.users.findFirst.mockResolvedValue({
        id: 'db-user-id',
        clerkId: mockUserId,
      })
      mockDb.query.goals.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/goals?status=completed')
      await GET(request)

      expect(mockDb.query.goals.findMany).toHaveBeenCalled()
    })
  })

  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null })
      
      const request = new NextRequest('http://localhost:3000/api/goals', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Goal' }),
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(401)
    })

    it('should create a new goal for authenticated user', async () => {
      const mockUserId = 'test-user-id'
      const mockGoalData = {
        title: 'New Goal',
        description: 'Goal description',
        category: 'health',
        targetValue: 100,
        deadline: '2024-12-31T00:00:00.000Z',
      }

      mockAuth.mockReturnValue({ userId: mockUserId })
      mockDb.query.users.findFirst.mockResolvedValue({
        id: 'db-user-id',
        clerkId: mockUserId,
      })
      
      const mockInsert = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{
          id: 'new-goal-id',
          ...mockGoalData,
        }]),
      })
      mockDb.insert.mockReturnValue({
        values: mockInsert,
      })

      const request = new NextRequest('http://localhost:3000/api/goals', {
        method: 'POST',
        body: JSON.stringify(mockGoalData),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.goal).toBeDefined()
    })

    it('should return 400 for invalid goal data', async () => {
      const mockUserId = 'test-user-id'
      mockAuth.mockReturnValue({ userId: mockUserId })
      mockDb.query.users.findFirst.mockResolvedValue({
        id: 'db-user-id',
        clerkId: mockUserId,
      })

      const request = new NextRequest('http://localhost:3000/api/goals', {
        method: 'POST',
        body: JSON.stringify({ title: '' }), // Invalid: empty title
      })

      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid request')
    })

    it('should handle database errors gracefully', async () => {
      const mockUserId = 'test-user-id'
      mockAuth.mockReturnValue({ userId: mockUserId })
      mockDb.query.users.findFirst.mockResolvedValue({
        id: 'db-user-id',
        clerkId: mockUserId,
      })
      mockDb.insert.mockImplementation(() => {
        throw new Error('Database error')
      })

      const request = new NextRequest('http://localhost:3000/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Goal',
          category: 'health',
          targetValue: 100,
        }),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to create goal')
    })
  })

  describe('Error handling', () => {
    it('should handle JSON parse errors', async () => {
      const mockUserId = 'test-user-id'
      mockAuth.mockReturnValue({ userId: mockUserId })

      const request = new NextRequest('http://localhost:3000/api/goals', {
        method: 'POST',
        body: 'invalid json',
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should handle user lookup failures', async () => {
      const mockUserId = 'test-user-id'
      mockAuth.mockReturnValue({ userId: mockUserId })
      mockDb.query.users.findFirst.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/goals')
      const response = await GET(request)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('User not found')
    })
  })
})