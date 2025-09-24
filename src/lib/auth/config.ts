export const authConfig = {
  debug: process.env.NODE_ENV === 'development',
  
  // JWT configuration
  jwtKey: process.env.CLERK_JWT_KEY,
  
  // Session configuration
  sessionTokenTemplate: 'custom',
  
  // Webhook configuration
  webhookSecret: process.env.CLERK_WEBHOOK_SECRET,
  
  // Custom claims
  beforeAuth: (auth: any, req: any) => {
    // Add custom logic before authentication
  },
  
  afterAuth: (auth: any, req: any, evt: any) => {
    // Add custom logic after authentication
    // Update user activity, log access, etc.
  }
};

// Role-based access control
export const permissions = {
  FREE: [
    'workspace:read:own',
    'workspace:create:limited',
    'block:read:own',
    'block:create:limited',
    'block:update:own',
    'block:delete:own',
    'goal:read:own',
    'goal:create:limited',
    'habit:read:own',
    'habit:create:limited',
    'export:basic',
    'integration:basic'
  ],
  
  PRO: [
    'workspace:read:own',
    'workspace:create:unlimited',
    'workspace:share',
    'block:read:own',
    'block:create:unlimited',
    'block:update:own',
    'block:delete:own',
    'block:archive',
    'goal:read:own',
    'goal:create:unlimited',
    'goal:share',
    'habit:read:own',
    'habit:create:unlimited',
    'habit:share',
    'analytics:advanced',
    'export:unlimited',
    'integration:unlimited',
    'ai:suggestions',
    'ai:planning',
    'collaboration:advanced',
    'templates:premium'
  ],
  
  TEAM: [
    'workspace:read:team',
    'workspace:create:unlimited',
    'workspace:share:team',
    'workspace:admin',
    'block:read:team',
    'block:create:unlimited',
    'block:update:team',
    'block:delete:team',
    'block:archive:team',
    'goal:read:team',
    'goal:create:unlimited',
    'goal:share:team',
    'habit:read:team',
    'habit:create:unlimited',
    'habit:share:team',
    'analytics:team',
    'export:unlimited',
    'integration:unlimited',
    'ai:suggestions',
    'ai:planning',
    'ai:team_insights',
    'collaboration:unlimited',
    'templates:premium',
    'team:admin',
    'billing:view'
  ],
  
  ADMIN: [
    '*' // All permissions
  ]
};

// Feature flags based on subscription
export const featureFlags = {
  FREE: {
    maxWorkspaces: 3,
    maxBlocksPerWorkspace: 100,
    maxGoals: 10,
    maxHabits: 5,
    aiSuggestions: false,
    collaboration: false,
    premiumTemplates: false,
    advancedAnalytics: false,
    customIntegrations: false,
    prioritySupport: false
  },
  
  PRO: {
    maxWorkspaces: 25,
    maxBlocksPerWorkspace: 5000,
    maxGoals: 100,
    maxHabits: 50,
    aiSuggestions: true,
    collaboration: true,
    premiumTemplates: true,
    advancedAnalytics: true,
    customIntegrations: true,
    prioritySupport: true
  },
  
  TEAM: {
    maxWorkspaces: 100,
    maxBlocksPerWorkspace: 20000,
    maxGoals: 500,
    maxHabits: 200,
    aiSuggestions: true,
    collaboration: true,
    premiumTemplates: true,
    advancedAnalytics: true,
    customIntegrations: true,
    prioritySupport: true,
    teamManagement: true,
    ssoIntegration: true,
    auditLogs: true
  },
  
  ADMIN: {
    maxWorkspaces: Infinity,
    maxBlocksPerWorkspace: Infinity,
    maxGoals: Infinity,
    maxHabits: Infinity,
    aiSuggestions: true,
    collaboration: true,
    premiumTemplates: true,
    advancedAnalytics: true,
    customIntegrations: true,
    prioritySupport: true,
    teamManagement: true,
    ssoIntegration: true,
    auditLogs: true,
    systemAdmin: true,
    allFeatures: true
  }
};

// Security configuration
export const securityConfig = {
  // Session configuration
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  maxSessions: 5, // Maximum concurrent sessions
  
  // Rate limiting
  rateLimits: {
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5
    },
    export: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10
    }
  },
  
  // Password requirements
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventReuse: 5,
    maxAge: 90 * 24 * 60 * 60 * 1000 // 90 days
  },
  
  // Account security
  accountSecurity: {
    maxFailedLogins: 5,
    lockoutDuration: 30 * 60 * 1000, // 30 minutes
    requireEmailVerification: true,
    require2FA: false, // Optional for PRO/TEAM
    allowedDomains: [], // For enterprise customers
    suspiciousActivityDetection: true
  }
};

// OAuth provider configuration
export const oauthProviders = {
  google: {
    enabled: true,
    scopes: ['email', 'profile', 'openid'],
    additionalParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  },
  
  github: {
    enabled: true,
    scopes: ['user:email', 'read:user']
  },
  
  microsoft: {
    enabled: true,
    scopes: ['openid', 'profile', 'email', 'User.Read']
  },
  
  apple: {
    enabled: true,
    scopes: ['email', 'name']
  }
};

export type Permission = string;
export type Role = keyof typeof permissions;
export type FeatureFlag = keyof typeof featureFlags.FREE;