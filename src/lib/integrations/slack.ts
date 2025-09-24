import { WebClient } from '@slack/web-api';
import { createEventAdapter } from '@slack/events-api';
import { db } from '@/db';
import { integrations, notifications, blocks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface SlackConfig {
  access_token: string;
  team_id: string;
  team_name: string;
  channel_id?: string;
  webhook_url?: string;
  bot_user_id?: string;
}

export class SlackIntegrationService {
  private client: WebClient | null = null;
  private signingSecret: string;

  constructor() {
    this.signingSecret = process.env.SLACK_SIGNING_SECRET || '';
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(userId: string): string {
    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.SLACK_REDIRECT_URI || '');
    const state = userId; // Pass user ID in state
    
    const scopes = [
      'channels:read',
      'channels:write',
      'chat:write',
      'users:read',
      'incoming-webhook',
      'commands'
    ].join(',');

    return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async handleCallback(code: string, userId: string): Promise<void> {
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: process.env.SLACK_REDIRECT_URI!
      })
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack OAuth failed: ${data.error}`);
    }

    // Store integration in database
    await db.insert(integrations).values({
      userId,
      provider: 'slack',
      enabled: true,
      config: {
        access_token: data.access_token,
        team_id: data.team.id,
        team_name: data.team.name,
        channel_id: data.incoming_webhook?.channel_id,
        webhook_url: data.incoming_webhook?.url,
        bot_user_id: data.bot_user_id,
        app_id: data.app_id,
        scope: data.scope
      } as SlackConfig,
      lastSyncAt: new Date()
    }).onConflictDoUpdate({
      target: [integrations.userId, integrations.provider],
      set: {
        config: {
          access_token: data.access_token,
          team_id: data.team.id,
          team_name: data.team.name,
          channel_id: data.incoming_webhook?.channel_id,
          webhook_url: data.incoming_webhook?.url,
          bot_user_id: data.bot_user_id,
          app_id: data.app_id,
          scope: data.scope
        },
        enabled: true,
        lastSyncAt: new Date()
      }
    });
  }

  /**
   * Initialize Slack client for user
   */
  async initializeClient(userId: string): Promise<boolean> {
    const integration = await db.query.integrations.findFirst({
      where: and(
        eq(integrations.userId, userId),
        eq(integrations.provider, 'slack')
      )
    });

    if (!integration?.config) {
      return false;
    }

    const config = integration.config as SlackConfig;
    this.client = new WebClient(config.access_token);
    return true;
  }

  /**
   * Send task notification to Slack
   */
  async sendTaskNotification(
    userId: string,
    task: {
      title: string;
      description?: string;
      dueDate?: Date;
      priority?: string;
      url?: string;
    }
  ): Promise<void> {
    const integration = await db.query.integrations.findFirst({
      where: and(
        eq(integrations.userId, userId),
        eq(integrations.provider, 'slack')
      )
    });

    if (!integration?.config) {
      throw new Error('Slack integration not found');
    }

    const config = integration.config as SlackConfig;

    // Create rich message blocks
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📋 New Task Created',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${task.title}*${task.description ? `\n${task.description}` : ''}`
        }
      }
    ];

    // Add task metadata
    if (task.dueDate || task.priority) {
      const fields = [];
      
      if (task.dueDate) {
        fields.push({
          type: 'mrkdwn',
          text: `*Due Date:*\n${new Date(task.dueDate).toLocaleDateString()}`
        });
      }
      
      if (task.priority) {
        const priorityEmoji = {
          low: '🟢',
          medium: '🟡',
          high: '🟠',
          urgent: '🔴'
        }[task.priority] || '⚪';
        
        fields.push({
          type: 'mrkdwn',
          text: `*Priority:*\n${priorityEmoji} ${task.priority}`
        });
      }
      
      blocks.push({
        type: 'section',
        fields
      });
    }

    // Add action buttons
    if (task.url) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Task',
              emoji: true
            },
            url: task.url,
            style: 'primary'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Mark Complete',
              emoji: true
            },
            action_id: `complete_task_${task.id}`,
            style: 'primary'
          }
        ]
      });
    }

    // Send via webhook if available, otherwise use Web API
    if (config.webhook_url) {
      await fetch(config.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks })
      });
    } else if (config.channel_id) {
      await this.initializeClient(userId);
      await this.client!.chat.postMessage({
        channel: config.channel_id,
        blocks
      });
    }

    // Log notification
    await db.insert(notifications).values({
      userId,
      type: 'task_created',
      title: 'Task notification sent to Slack',
      message: `Task "${task.title}" was shared to Slack`,
      channel: 'slack',
      status: 'sent',
      sentAt: new Date()
    });
  }

  /**
   * Send daily summary to Slack
   */
  async sendDailySummary(
    userId: string,
    summary: {
      tasksCompleted: number;
      tasksRemaining: number;
      upcomingEvents: Array<{ title: string; time: string }>;
      topPriorities: Array<{ title: string; priority: string }>;
      productivityScore?: number;
    }
  ): Promise<void> {
    const integration = await db.query.integrations.findFirst({
      where: and(
        eq(integrations.userId, userId),
        eq(integrations.provider, 'slack')
      )
    });

    if (!integration?.config) {
      throw new Error('Slack integration not found');
    }

    const config = integration.config as SlackConfig;

    // Create summary message
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '☀️ Daily Planning Summary',
          emoji: true
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `*${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}*`
          }
        ]
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*✅ Completed:*\n${summary.tasksCompleted} tasks`
          },
          {
            type: 'mrkdwn',
            text: `*📝 Remaining:*\n${summary.tasksRemaining} tasks`
          }
        ]
      }
    ];

    // Add productivity score if available
    if (summary.productivityScore !== undefined) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Productivity Score:* ${summary.productivityScore}% ${
            summary.productivityScore >= 80 ? '🎉' : 
            summary.productivityScore >= 60 ? '👍' : '💪'
          }`
        }
      });
    }

    // Add upcoming events
    if (summary.upcomingEvents.length > 0) {
      blocks.push(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*📅 Upcoming Events:*'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: summary.upcomingEvents
              .map(event => `• ${event.time} - ${event.title}`)
              .join('\n')
          }
        }
      );
    }

    // Add top priorities
    if (summary.topPriorities.length > 0) {
      blocks.push(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*🎯 Top Priorities:*'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: summary.topPriorities
              .map(task => {
                const emoji = {
                  urgent: '🔴',
                  high: '🟠',
                  medium: '🟡',
                  low: '🟢'
                }[task.priority] || '⚪';
                return `${emoji} ${task.title}`;
              })
              .join('\n')
          }
        }
      );
    }

    // Send message
    if (config.webhook_url) {
      await fetch(config.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks })
      });
    } else if (config.channel_id) {
      await this.initializeClient(userId);
      await this.client!.chat.postMessage({
        channel: config.channel_id,
        blocks
      });
    }
  }

  /**
   * Handle Slack slash commands
   */
  async handleSlashCommand(payload: any): Promise<any> {
    const { command, text, user_id, team_id } = payload;

    // Find user by Slack team ID
    const integration = await db.query.integrations.findFirst({
      where: eq(integrations.provider, 'slack'),
      // Additional filtering by team_id would be needed
    });

    if (!integration) {
      return {
        response_type: 'ephemeral',
        text: 'Please connect your Slack workspace first!'
      };
    }

    switch (command) {
      case '/task':
        return await this.handleTaskCommand(text, integration.userId);
      
      case '/today':
        return await this.handleTodayCommand(integration.userId);
      
      case '/focus':
        return await this.handleFocusCommand(text, integration.userId);
      
      default:
        return {
          response_type: 'ephemeral',
          text: `Unknown command: ${command}`
        };
    }
  }

  /**
   * Handle /task command
   */
  private async handleTaskCommand(text: string, userId: string): Promise<any> {
    if (!text) {
      return {
        response_type: 'ephemeral',
        text: 'Usage: /task [task description]'
      };
    }

    // Create task in database
    const [task] = await db.insert(blocks).values({
      type: 'task',
      title: text,
      workspaceId: 'default', // Would get from user's default workspace
      createdBy: userId,
      status: 'todo',
      priority: 'medium',
      position: 0
    }).returning();

    return {
      response_type: 'in_channel',
      text: `✅ Task created: "${text}"`,
      attachments: [{
        color: 'good',
        fields: [{
          title: 'Task ID',
          value: task.id,
          short: true
        }]
      }]
    };
  }

  /**
   * Handle /today command
   */
  private async handleTodayCommand(userId: string): Promise<any> {
    // Get today's tasks
    const tasks = await db.query.blocks.findMany({
      where: and(
        eq(blocks.createdBy, userId),
        eq(blocks.type, 'task'),
        eq(blocks.status, 'todo')
      ),
      limit: 10
    });

    if (tasks.length === 0) {
      return {
        response_type: 'ephemeral',
        text: 'No tasks for today! 🎉'
      };
    }

    return {
      response_type: 'ephemeral',
      text: `You have ${tasks.length} tasks for today:`,
      attachments: tasks.map(task => ({
        color: task.priority === 'high' ? 'danger' : 'good',
        text: `• ${task.title}`,
        footer: task.priority ? `Priority: ${task.priority}` : undefined
      }))
    };
  }

  /**
   * Handle /focus command
   */
  private async handleFocusCommand(text: string, userId: string): Promise<any> {
    const duration = parseInt(text) || 25; // Default 25 minutes

    return {
      response_type: 'in_channel',
      text: `🎯 Starting ${duration}-minute focus session`,
      attachments: [{
        color: 'warning',
        text: 'All notifications will be muted during this time.',
        actions: [{
          name: 'end_focus',
          text: 'End Focus',
          type: 'button',
          value: 'end',
          style: 'danger'
        }]
      }]
    };
  }

  /**
   * List Slack channels
   */
  async listChannels(userId: string): Promise<any[]> {
    const initialized = await this.initializeClient(userId);
    if (!initialized || !this.client) {
      throw new Error('Slack client not initialized');
    }

    const result = await this.client.conversations.list({
      types: 'public_channel,private_channel',
      limit: 100
    });

    return result.channels || [];
  }

  /**
   * Disconnect Slack integration
   */
  async disconnect(userId: string): Promise<void> {
    await db.delete(integrations).where(
      and(
        eq(integrations.userId, userId),
        eq(integrations.provider, 'slack')
      )
    );
  }
}

export const slackIntegration = new SlackIntegrationService();