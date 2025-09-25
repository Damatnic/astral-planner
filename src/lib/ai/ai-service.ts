import Logger from '@/lib/logger';

// Configuration for AI service
const AI_CONFIG = {
  provider: process.env.AI_PROVIDER || 'openai', // 'openai', 'anthropic', 'local'
  apiKey: process.env.AI_API_KEY,
  model: process.env.AI_MODEL || 'gpt-4',
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1000'),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
};

export interface AIRequestContext {
  userId: string;
  userGoals?: any[];
  userHabits?: any[];
  recentActivity?: any[];
  userPreferences?: any;
}

export interface AITaskSuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  category: string;
  tags: string[];
  reasoning?: string;
}

export interface AIGoalBreakdown {
  milestones: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    deadline?: string;
    dependencies?: string[];
  }>;
  suggestedTasks: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    estimatedHours: number;
    milestone?: string;
  }>;
  timeline: {
    estimatedDuration: string;
    criticalPath: string[];
    riskFactors: string[];
  };
}

export interface AIProductivityInsight {
  score: number;
  insights: string[];
  recommendations: string[];
  trends: {
    productivity: 'improving' | 'declining' | 'stable';
    consistency: 'improving' | 'declining' | 'stable';
    goalCompletion: 'improving' | 'declining' | 'stable';
  };
  actionItems: Array<{
    action: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
  }>;
}

export class AIService {
  /**
   * Generate task suggestions based on user context
   */
  static async generateTaskSuggestions(context: AIRequestContext): Promise<AITaskSuggestion[]> {
    try {
      if (!AI_CONFIG.apiKey) {
        Logger.warn('AI API key not configured, using fallback suggestions');
        return AIService.getFallbackTaskSuggestions(context);
      }

      const prompt = AIService.buildTaskSuggestionPrompt(context);
      const response = await AIService.callAI(prompt);
      
      return AIService.parseTaskSuggestions(response);
    } catch (error) {
      Logger.error('Failed to generate AI task suggestions:', error);
      return AIService.getFallbackTaskSuggestions(context);
    }
  }

  /**
   * Generate goal breakdown with AI assistance
   */
  static async generateGoalBreakdown(
    goalTitle: string,
    goalDescription: string,
    context: AIRequestContext
  ): Promise<AIGoalBreakdown> {
    try {
      if (!AI_CONFIG.apiKey) {
        Logger.warn('AI API key not configured, using fallback goal breakdown');
        return AIService.getFallbackGoalBreakdown(goalTitle, goalDescription);
      }

      const prompt = AIService.buildGoalBreakdownPrompt(goalTitle, goalDescription, context);
      const response = await AIService.callAI(prompt);
      
      return AIService.parseGoalBreakdown(response);
    } catch (error) {
      Logger.error('Failed to generate AI goal breakdown:', error);
      return AIService.getFallbackGoalBreakdown(goalTitle, goalDescription);
    }
  }

  /**
   * Generate productivity insights
   */
  static async generateProductivityInsights(context: AIRequestContext): Promise<AIProductivityInsight> {
    try {
      if (!AI_CONFIG.apiKey) {
        Logger.warn('AI API key not configured, using fallback insights');
        return AIService.getFallbackProductivityInsights(context);
      }

      const prompt = AIService.buildInsightPrompt(context);
      const response = await AIService.callAI(prompt);
      
      return AIService.parseProductivityInsights(response);
    } catch (error) {
      Logger.error('Failed to generate AI productivity insights:', error);
      return AIService.getFallbackProductivityInsights(context);
    }
  }

  /**
   * Call AI service (OpenAI, Anthropic, etc.)
   */
  private static async callAI(prompt: string): Promise<string> {
    switch (AI_CONFIG.provider) {
      case 'openai':
        return await AIService.callOpenAI(prompt);
      case 'anthropic':
        return await AIService.callAnthropic(prompt);
      default:
        throw new Error(`Unsupported AI provider: ${AI_CONFIG.provider}`);
    }
  }

  /**
   * Call OpenAI API
   */
  private static async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: 'You are a productivity and goal-setting assistant. Provide helpful, actionable advice in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Call Anthropic Claude API
   */
  private static async callAnthropic(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': AI_CONFIG.apiKey!,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        max_tokens: AI_CONFIG.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * Build prompt for task suggestions
   */
  private static buildTaskSuggestionPrompt(context: AIRequestContext): string {
    return `
Generate 5 personalized task suggestions for a user based on their current context.

User Context:
- User has ${context.userGoals?.length || 0} active goals
- User has ${context.userHabits?.length || 0} habits they're tracking
- Recent activity shows: ${context.recentActivity?.length || 0} completed items

Please generate task suggestions that are:
1. Actionable and specific
2. Relevant to productivity and goal achievement
3. Varied in priority and time commitment
4. Categorized appropriately

Return as JSON array with this structure:
[{
  "title": "string",
  "description": "string", 
  "priority": "low|medium|high",
  "estimatedHours": number,
  "category": "string",
  "tags": ["string"],
  "reasoning": "string"
}]
    `.trim();
  }

  /**
   * Build prompt for goal breakdown
   */
  private static buildGoalBreakdownPrompt(goalTitle: string, goalDescription: string, context: AIRequestContext): string {
    return `
Break down this goal into actionable milestones and tasks:

Goal: ${goalTitle}
Description: ${goalDescription}

Please create a comprehensive breakdown with:
1. 3-5 major milestones with realistic timelines
2. 5-8 specific tasks to get started
3. Timeline estimation and risk assessment

Return as JSON with this structure:
{
  "milestones": [{"title": "string", "description": "string", "priority": "low|medium|high", "deadline": "ISO string", "dependencies": ["string"]}],
  "suggestedTasks": [{"title": "string", "description": "string", "priority": "low|medium|high", "estimatedHours": number, "milestone": "string"}],
  "timeline": {"estimatedDuration": "string", "criticalPath": ["string"], "riskFactors": ["string"]}
}
    `.trim();
  }

  /**
   * Build prompt for productivity insights
   */
  private static buildInsightPrompt(context: AIRequestContext): string {
    return `
Analyze productivity patterns and provide insights for a user with:
- ${context.userGoals?.length || 0} goals
- ${context.userHabits?.length || 0} habits
- Recent activity data available

Generate productivity insights including:
1. Overall productivity score (0-100)
2. Key insights about patterns and performance
3. Actionable recommendations
4. Trend analysis
5. Priority action items

Return as JSON with this structure:
{
  "score": number,
  "insights": ["string"],
  "recommendations": ["string"],
  "trends": {"productivity": "improving|declining|stable", "consistency": "improving|declining|stable", "goalCompletion": "improving|declining|stable"},
  "actionItems": [{"action": "string", "impact": "high|medium|low", "effort": "high|medium|low"}]
}
    `.trim();
  }

  /**
   * Parse AI response for task suggestions
   */
  private static parseTaskSuggestions(response: string): AITaskSuggestion[] {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      Logger.error('Failed to parse AI task suggestions:', error);
      return [];
    }
  }

  /**
   * Parse AI response for goal breakdown
   */
  private static parseGoalBreakdown(response: string): AIGoalBreakdown {
    try {
      return JSON.parse(response);
    } catch (error) {
      Logger.error('Failed to parse AI goal breakdown:', error);
      throw error;
    }
  }

  /**
   * Parse AI response for productivity insights
   */
  private static parseProductivityInsights(response: string): AIProductivityInsight {
    try {
      return JSON.parse(response);
    } catch (error) {
      Logger.error('Failed to parse AI productivity insights:', error);
      throw error;
    }
  }

  /**
   * Fallback task suggestions when AI is unavailable
   */
  private static getFallbackTaskSuggestions(context: AIRequestContext): AITaskSuggestion[] {
    return [
      {
        title: "Review and update your goals",
        description: "Take 15 minutes to review your current goals and update progress",
        priority: "medium",
        estimatedHours: 0.25,
        category: "Planning",
        tags: ["review", "goals"],
        reasoning: "Regular goal review maintains focus and momentum"
      },
      {
        title: "Plan your top 3 priorities for tomorrow",
        description: "Identify and write down the three most important tasks for tomorrow",
        priority: "high",
        estimatedHours: 0.15,
        category: "Planning",
        tags: ["planning", "priorities"],
        reasoning: "Daily planning improves focus and productivity"
      },
      {
        title: "Take a mindful 10-minute break",
        description: "Step away from work and practice mindfulness or light stretching",
        priority: "low",
        estimatedHours: 0.17,
        category: "Wellness",
        tags: ["break", "mindfulness"],
        reasoning: "Regular breaks prevent burnout and improve sustained performance"
      }
    ];
  }

  /**
   * Fallback goal breakdown when AI is unavailable
   */
  private static getFallbackGoalBreakdown(goalTitle: string, goalDescription: string): AIGoalBreakdown {
    return {
      milestones: [
        {
          title: "Planning and Research",
          description: `Complete initial planning and research for ${goalTitle}`,
          priority: "high",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          dependencies: []
        },
        {
          title: "Foundation Setup",
          description: "Establish necessary resources, tools, and initial framework",
          priority: "high",
          deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          dependencies: ["Planning and Research"]
        },
        {
          title: "Implementation",
          description: "Execute the main work towards achieving the goal",
          priority: "high",
          deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          dependencies: ["Foundation Setup"]
        }
      ],
      suggestedTasks: [
        {
          title: "Define success criteria",
          description: `Clearly define what success looks like for ${goalTitle}`,
          priority: "high",
          estimatedHours: 1,
          milestone: "Planning and Research"
        },
        {
          title: "Create action plan",
          description: "Break down the goal into specific, actionable steps",
          priority: "high",
          estimatedHours: 2,
          milestone: "Planning and Research"
        },
        {
          title: "Identify required resources",
          description: "List all tools, skills, and resources needed",
          priority: "medium",
          estimatedHours: 1,
          milestone: "Planning and Research"
        }
      ],
      timeline: {
        estimatedDuration: "8-12 weeks",
        criticalPath: ["Planning and Research", "Foundation Setup", "Implementation"],
        riskFactors: ["Unclear success criteria", "Insufficient resources", "Lack of accountability"]
      }
    };
  }

  /**
   * Fallback productivity insights when AI is unavailable
   */
  private static getFallbackProductivityInsights(context: AIRequestContext): AIProductivityInsight {
    return {
      score: 72,
      insights: [
        "You're maintaining consistent progress on your goals",
        "Your task completion rate shows room for improvement",
        "You work most effectively during focused time blocks"
      ],
      recommendations: [
        "Try time-blocking your most important tasks",
        "Set up regular review sessions to track progress",
        "Consider breaking larger tasks into smaller, manageable pieces"
      ],
      trends: {
        productivity: "stable",
        consistency: "improving", 
        goalCompletion: "stable"
      },
      actionItems: [
        {
          action: "Implement daily planning routine",
          impact: "high",
          effort: "low"
        },
        {
          action: "Set up progress tracking system",
          impact: "medium",
          effort: "medium"
        }
      ]
    };
  }
}

export default AIService;