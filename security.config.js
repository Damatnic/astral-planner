/**
 * GUARDIAN SECURITY CONFIGURATION
 * Production-ready security configuration for deployment
 */

const securityConfig = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Next.js inline scripts
        "'unsafe-eval'", // Required for Next.js in development
        "https://vercel.live",
        "https://va.vercel-scripts.com",
        // Allow specific script hashes from CSP errors
        "'sha256-6nvG1C/mEoCWAcSkHsFfaiJWmJ9SNk5yOvknC6V2Opk='",
        "'sha256-9lEWXf2Hn2ieCK1KQ/S66sQ4keHF188UUDCKoduzMsE='",
        "'sha256-OBTN3RiyCV4Bq7dFqZ5a2pAXjnCcCYeTJMO2I/LYKeo='",
        "'sha256-L9Kk9iAgvOo4F+tNuX+vA20eb3nmkdVgO3Lun5m0HKE='",
        "'sha256-hqUl3T/0qZRtIN8ucdJQg/QLY9Fpu9SEiSMuK6VscRM='",
        "'sha256-ODiyWGpk3ai4W7JKpPqCtydnW8TgOer/4fVOkzgVx+g='",
        "'sha256-vIqb4kNPhpAR1NRKMcLGzbkYO8krHm3ztJpRep2+oSM='",
        "'sha256-ZKRTrEp3SK3KTk9DuSopbgaICywsZFZJdPH6SN1vMWc='",
        "'sha256-TnkFpSNK5gikNZg0QSRIQ9bqtnioaENlqoyam0yFSRg='",
        "'sha256-zlmxiox02siGltNlorvFS7iuu75seOt8KYXvDCZ8rAA='",
        "'sha256-2UkHY4aL45zJS9ILl4BmSK5hPAdZhC+F3WDmXmwwO6k='",
        "'sha256-BgwPRjL3Y3O9chB5VYIiyBUZ7emEWzfwuzOT5fkypRs='",
        "'sha256-J4hDrKZaPjVCO2Nrf8PIJHLSoThQM+eaplEmvNFociw='",
        "'sha256-AYMkpfPmrAtiYXbZ+TZx/jPnAV5jy5fkR7fNf1rWZb0='",
        "'sha256-iqDQ5UmX/puDk+yOQ3YMg58GyYigW0+I3qtXCBbjwkw='",
        "'sha256-tTb/fLqlXhO4WxBRp9dm6/gpq2Ae5Jjp13ppccwnzDg='",
        "'sha256-H4K9zv0cLkIfOYR1NUNZI/USAfqhNWhh1AQWOMf2zF8='",
        "'sha256-w5OIGPTeC92edgorRuMUTqBE8Tw17hrrCY5jrqG4Kww='",
        "'sha256-I2nBKt5VIqh/HJimmWebdN53eP9axUaJglRSR4cj/BE='",
        (req, res) => `'nonce-${res.locals.nonce}'` // Dynamic nonce
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for styled-components and CSS-in-JS
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://r2cdn.perplexity.ai"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        "https:",
        "wss:",
        process.env.NODE_ENV === 'development' ? "ws://localhost:*" : null,
        process.env.NODE_ENV === 'development' ? "ws://127.0.0.1:*" : null
      ].filter(Boolean),
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production'
    }
  },

  // Security Headers
  securityHeaders: {
    // Strict Transport Security
    strictTransportSecurity: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },

    // X-Frame-Options
    xFrameOptions: 'DENY',

    // X-Content-Type-Options
    xContentTypeOptions: 'nosniff',

    // X-XSS-Protection
    xXSSProtection: '1; mode=block',

    // Referrer Policy
    referrerPolicy: 'strict-origin-when-cross-origin',

    // Permissions Policy
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: [],
      usb: [],
      magnetometer: [],
      gyroscope: [],
      accelerometer: [],
      autoplay: [],
      'encrypted-media': [],
      fullscreen: ['self'],
      'picture-in-picture': []
    },

    // Cross-Origin Policies
    crossOriginEmbedderPolicy: 'require-corp',
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-site'
  },

  // Rate Limiting Configuration
  rateLimiting: {
    // Global rate limits
    global: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Max requests per windowMs
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false
    },

    // API specific limits
    api: {
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 100, // Max API requests per minute
      message: 'API rate limit exceeded',
      skipSuccessfulRequests: false
    },

    // Authentication limits
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Max login attempts
      message: 'Too many login attempts',
      skipSuccessfulRequests: true
    },

    // File upload limits
    upload: {
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 10, // Max uploads per minute
      message: 'Upload rate limit exceeded'
    }
  },

  // CORS Configuration
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:7001',
        'https://your-domain.com'
      ];
      
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Token',
      'X-User-Data',
      'X-Demo-User',
      'X-Demo-Token'
    ]
  },

  // Input Validation Rules
  inputValidation: {
    // Maximum input lengths
    maxLengths: {
      title: 200,
      description: 2000,
      notes: 5000,
      email: 320,
      username: 50,
      password: 128,
      name: 100
    },

    // File upload restrictions
    fileUpload: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/json'
      ],
      quarantineTime: 24 * 60 * 60 * 1000, // 24 hours
      virusScanEnabled: true
    },

    // Content filtering
    contentFiltering: {
      enableProfanityFilter: false,
      enableSpamDetection: true,
      maxUrlsPerMessage: 3,
      maxMentionsPerMessage: 5
    }
  },

  // Session Management
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    name: 'astral.sid',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    },
    resave: false,
    saveUninitialized: false,
    rolling: true // Reset expiry on activity
  },

  // Encryption Settings
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
    iterations: 100000,
    
    // Data classification requirements
    classifications: {
      public: { algorithm: 'aes-128-gcm', iterations: 10000 },
      internal: { algorithm: 'aes-192-gcm', iterations: 50000 },
      confidential: { algorithm: 'aes-256-gcm', iterations: 100000 },
      restricted: { algorithm: 'aes-256-gcm', iterations: 200000 },
      topSecret: { algorithm: 'aes-256-gcm', iterations: 500000 }
    }
  },

  // Monitoring and Alerting
  monitoring: {
    // Security event thresholds
    thresholds: {
      failedLoginAttempts: 5,
      suspiciousRequestCount: 100,
      errorRatePercent: 10,
      responseTimeMs: 5000
    },

    // Alert settings
    alerts: {
      email: process.env.SECURITY_ALERT_EMAIL,
      webhook: process.env.SECURITY_WEBHOOK_URL,
      sms: process.env.SECURITY_ALERT_SMS
    },

    // Log retention
    logRetention: {
      security: 365, // days
      audit: 2555, // 7 years
      application: 90,
      performance: 30
    }
  },

  // Compliance Requirements
  compliance: {
    gdpr: {
      enabled: true,
      dataRetentionDays: 2555, // 7 years
      consentRequired: true,
      rightToDelete: true,
      dataPortability: true
    },

    soc2: {
      enabled: true,
      auditLogging: true,
      encryptionAtRest: true,
      encryptionInTransit: true,
      accessControls: true
    },

    iso27001: {
      enabled: true,
      riskAssessment: true,
      incidentResponse: true,
      businessContinuity: true,
      vendorManagement: true
    },

    pciDss: {
      enabled: false, // Enable if processing credit cards
      tokenization: true,
      cardDataStorage: false,
      networkSegmentation: true
    }
  },

  // Development vs Production Settings
  environment: {
    development: {
      allowInsecureHttp: true,
      debugMode: true,
      detailedErrors: true,
      rateLimitingRelaxed: true,
      corsRelaxed: true
    },

    production: {
      allowInsecureHttp: false,
      debugMode: false,
      detailedErrors: false,
      rateLimitingStrict: true,
      corsStrict: true,
      requireHttps: true,
      hsts: true
    }
  },

  // Emergency Procedures
  emergency: {
    lockdownEnabled: true,
    emergencyContacts: [
      process.env.EMERGENCY_CONTACT_1,
      process.env.EMERGENCY_CONTACT_2
    ],
    incidentResponsePlan: {
      escalationLevels: ['low', 'medium', 'high', 'critical'],
      responseTimeMinutes: {
        low: 240,    // 4 hours
        medium: 120,  // 2 hours
        high: 60,     // 1 hour
        critical: 15  // 15 minutes
      }
    }
  },

  // Backup and Recovery
  backup: {
    encryptionEnabled: true,
    compressionEnabled: true,
    retention: {
      daily: 30,   // days
      weekly: 12,  // weeks
      monthly: 12, // months
      yearly: 7    // years
    },
    testRecovery: true,
    offSiteStorage: true
  }
};

module.exports = securityConfig;