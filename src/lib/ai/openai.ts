import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface TaskSuggestion {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  estimatedHours: number
  category: string
  tags: string[]
}

export interface GoalBreakdown {
  title: string
  milestones: {
    title: string
    description: string
    deadline: string
    priority: 'low' | 'medium' | 'high'
  }[]
  suggestedTasks: TaskSuggestion[]
}

export async function generateTaskSuggestions(
  context: {
    userGoals?: string[]
    recentTasks?: string[]
    workContext?: string
    preferences?: any
  }
): Promise<TaskSuggestion[]> {
  try {
    const prompt = `
You are an AI productivity assistant. Based on the following context, suggest 5 relevant tasks that would help the user achieve their goals:

User Goals: ${context.userGoals?.join(', ') || 'General productivity'}
Recent Tasks: ${context.recentTasks?.join(', ') || 'None provided'}
Work Context: ${context.workContext || 'General'}
User Preferences: ${JSON.stringify(context.preferences) || 'None'}

Please suggest tasks that are:
1. Specific and actionable
2. Relevant to the user's goals and context
3. Appropriately prioritized
4. Include realistic time estimates
5. Include relevant tags and categories

Return the response as a JSON array of task objects with the following structure:
{
  "title": "string",
  "description": "string", 
  "priority": "low|medium|high",
  "estimatedHours": number,
  "category": "string",
  "tags": ["string"]
}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful productivity assistant that suggests relevant tasks based on user context. Always respond with valid JSON only.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    try {
      return JSON.parse(content)
    } catch (parseError) {
      // Fallback suggestions if JSON parsing fails
      return [
        {
          title: 'Review and prioritize current projects',
          description: 'Spend time evaluating ongoing projects and adjusting priorities based on current goals',
          priority: 'medium' as const,
          estimatedHours: 1,
          category: 'planning',
          tags: ['review', 'planning', 'prioritization']
        },
        {
          title: 'Schedule focused work blocks for this week',
          description: 'Block out dedicated time for deep work on important tasks',
          priority: 'high' as const,
          estimatedHours: 0.5,
          category: 'planning',
          tags: ['time-blocking', 'scheduling', 'focus']
        }
      ]
    }
  } catch (error) {
    console.error('OpenAI task suggestions error:', error)
    throw error
  }
}

export async function breakdownGoal(
  goalTitle: string,
  goalDescription: string,
  deadline?: string
): Promise<GoalBreakdown> {
  try {
    const prompt = `
Break down this goal into actionable milestones and tasks:

Goal: ${goalTitle}
Description: ${goalDescription}
Deadline: ${deadline || 'Not specified'}

Please provide:
1. 3-5 key milestones with deadlines
2. 5-10 specific tasks to achieve this goal
3. Realistic time estimates and priorities

Return as JSON with this structure:
{
  "title": "string",
  "milestones": [{
    "title": "string",
    "description": "string", 
    "deadline": "YYYY-MM-DD",
    "priority": "low|medium|high"
  }],
  "suggestedTasks": [{
    "title": "string",
    "description": "string",
    "priority": "low|medium|high", 
    "estimatedHours": number,
    "category": "string",
    "tags": ["string"]
  }]
}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a goal-setting expert that helps break down large goals into manageable milestones and tasks. Always respond with valid JSON only.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    return JSON.parse(content)
  } catch (error) {
    console.error('OpenAI goal breakdown error:', error)
    throw error
  }
}

export async function optimizeSchedule(
  tasks: Array<{
    id: string
    title: string
    priority: string
    estimatedHours: number
    dueDate?: string
    dependencies?: string[]
  }>,
  availableHours: number,
  preferences?: {
    workingHours?: { start: string; end: string }
    breakDuration?: number
    focusTime?: number
  }
): Promise<{
  schedule: Array<{
    taskId: string
    startTime: string
    endTime: string
    day: string
  }>
  insights: string[]
}> {
  try {
    const prompt = `
Optimize this task schedule:

Tasks: ${JSON.stringify(tasks)}
Available hours per day: ${availableHours}
Preferences: ${JSON.stringify(preferences)}

Please provide:
1. An optimized schedule spreading tasks across the week
2. Key insights about the schedule optimization

Consider:
- Task priorities and deadlines
- Available time constraints  
- Task dependencies
- Energy levels throughout the day
- Buffer time for breaks

Return as JSON:
{
  "schedule": [{
    "taskId": "string",
    "startTime": "HH:MM", 
    "endTime": "HH:MM",
    "day": "monday|tuesday|etc"
  }],
  "insights": ["string"]
}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a time management expert that optimizes task schedules. Always respond with valid JSON only.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 1500,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    return JSON.parse(content)
  } catch (error) {
    console.error('OpenAI schedule optimization error:', error)
    throw error
  }
}

export async function generateProductivityInsights(
  userStats: {
    completedTasks: number
    totalTasks: number
    averageCompletionTime: number
    mostProductiveHours: string[]
    commonTags: string[]
    streaks: { current: number; best: number }
  }
): Promise<{
  insights: string[]
  recommendations: string[]
  score: number
}> {
  try {
    const prompt = `
Analyze this productivity data and provide insights:

${JSON.stringify(userStats)}

Provide:
1. 3-5 key insights about productivity patterns
2. 3-5 actionable recommendations for improvement  
3. A productivity score from 0-100

Return as JSON:
{
  "insights": ["string"],
  "recommendations": ["string"],
  "score": number
}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a productivity analyst that provides insights and recommendations based on user behavior data. Always respond with valid JSON only.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 1000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    return JSON.parse(content)
  } catch (error) {
    console.error('OpenAI insights error:', error)
    throw error
  }
}