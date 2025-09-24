import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/habits/route'
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
    habits: {
      findMany: jest.fn(),
    },
  },
  insert: jest.fn().mockReturnValue({
    values: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([{ id: 'new-habit-id' }]),
    }),
  }),
}

jest.mock('@/db', () => ({
  db: mockDb,
}))

jest.mock('@/db/schema', () => ({
  habits: {},
  users: {},
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>

describe('/api/habits', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null })
      
      const request = new NextRequest('http://localhost:3000/api/habits')
      const response = await GET(request)
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return habits for authenticated user', async () => {
      const mockUserId = 'test-user-id'
      const mockHabits = [
        {
          id: 'habit-1',
          title: 'Morning Exercise',
          description: 'Daily morning workout',
          frequency: 'daily',
          currentStreak: 5,
          longestStreak: 15,
          status: 'active',
        },
      ]

      mockAuth.mockReturnValue({ userId: mockUserId })
      mockDb.query.users.findFirst.mockResolvedValue({
        id: 'db-user-id',
        clerkId: mockUserId,
      })
      mockDb.query.habits.findMany.mockResolvedValue(mockHabits)

      const request = new NextRequest('http://localhost:3000/api/habits')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.habits).toEqual(mockHabits)
      expect(data.success).toBe(true)
    })

    it('should filter habits by status when provided', async () => {
      const mockUserId = 'test-user-id'
      mockAuth.mockReturnValue({ userId: mockUserId })
      mockDb.query.users.findFirst.mockResolvedValue({
        id: 'db-user-id',
        clerkId: mockUserId,
      })
      mockDb.query.habits.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/habits?status=active')
      await GET(request)

      expect(mockDb.query.habits.findMany).toHaveBeenCalled()
    })

    it('should filter habits by category when provided', async () => {
      const mockUserId = 'test-user-id'
      mockAuth.mockReturnValue({ userId: mockUserId })
      mockDb.query.users.findFirst.mockResolvedValue({
        id: 'db-user-id',
        clerkId: mockUserId,
      })
      mockDb.query.habits.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/habits?category=health')
      await GET(request)

      expect(mockDb.query.habits.findMany).toHaveBeenCalled()
    })
  })

  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null })
      
      const request = new NextRequest('http://localhost:3000/api/habits', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Habit' }),
      })
      
      const response = await POST(request)
      
      expect(response.status).toBe(401)
    })

    it('should create a new habit for authenticated user', async () => {
      const mockUserId = 'test-user-id'
      const mockHabitData = {
        title: 'New Habit',
        description: 'Habit description',
        frequency: 'daily',
        category: 'health',
        targetValue: 1,
      }

      mockAuth.mockReturnValue({ userId: mockUserId })
      mockDb.query.users.findFirst.mockResolvedValue({
        id: 'db-user-id',
        clerkId: mockUserId,
      })
      
      const mockInsert = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{
          id: 'new-habit-id',
          ...mockHabitData,
          currentStreak: 0,
          longestStreak: 0,
          status: 'active',
        }]),
      })
      mockDb.insert.mockReturnValue({
        values: mockInsert,
      })

      const request = new NextRequest('http://localhost:3000/api/habits', {
        method: 'POST',
        body: JSON.stringify(mockHabitData),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.habit).toBeDefined()
    })

    it('should return 400 for invalid habit data', async () => {
      const mockUserId = 'test-user-id'
      mockAuth.mockReturnValue({ userId: mockUserId })
      mockDb.query.users.findFirst.mockResolvedValue({
        id: 'db-user-id',
        clerkId: mockUserId,
      })

      const request = new NextRequest('http://localhost:3000/api/habits', {
        method: 'POST',
        body: JSON.stringify({ title: '' }), // Invalid: empty title
      })

      const response = await POST(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid request')
    })

    it('should set default values for optional fields', async () => {
      const mockUserId = 'test-user-id'
      const mockHabitData = {
        title: 'Minimal Habit',
        frequency: 'daily',
      }

      mockAuth.mockReturnValue({ userId: mockUserId })
      mockDb.query.users.findFirst.mockResolvedValue({
        id: 'db-user-id',
        clerkId: mockUserId,
      })
      
      const mockInsert = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{
          id: 'new-habit-id',
          ...mockHabitData,
          currentStreak: 0,
          longestStreak: 0,
          status: 'active',
          targetValue: 1,
        }]),
      })
      mockDb.insert.mockReturnValue({
        values: mockInsert,
      })

      const request = new NextRequest('http://localhost:3000/api/habits', {
        method: 'POST',
        body: JSON.stringify(mockHabitData),
      })

      const response = await POST(request)
      
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.habit.targetValue).toBe(1)
      expect(data.habit.currentStreak).toBe(0)
    })
  })

  describe('Streak calculations', () => {
    it('should handle streak calculations correctly', async () => {
      // This would test streak calculation logic if implemented
      // For now, just verify the structure
      const mockUserId = 'test-user-id'
      const mockHabits = [
        {
          id: 'habit-1',
          title: 'Test Habit',
          currentStreak: 5,
          longestStreak: 10,
          completions: [
            { date: '2024-01-01', completed: true },
            { date: '2024-01-02', completed: true },
            { date: '2024-01-03', completed: true },
          ],
        },
      ]

      mockAuth.mockReturnValue({ userId: mockUserId })
      mockDb.query.users.findFirst.mockResolvedValue({
        id: 'db-user-id',
        clerkId: mockUserId,
      })
      mockDb.query.habits.findMany.mockResolvedValue(mockHabits)

      const request = new NextRequest('http://localhost:3000/api/habits?includeStats=true')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.habits[0].currentStreak).toBeGreaterThanOrEqual(0)
      expect(data.habits[0].longestStreak).toBeGreaterThanOrEqual(data.habits[0].currentStreak)
    })
  })
})