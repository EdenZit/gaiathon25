import { z } from 'zod';

export const SECURITY_CONFIG = {
  // Authentication requirements
  auth: {
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90 * 24 * 60 * 60, // 90 days in seconds
      preventReuse: 5, // Last 5 passwords
    },
    session: {
      duration: 86400, // 24 hours
      extendOnActivity: true,
      maxConcurrent: 5,
      secure: true,
      httpOnly: true,
    },
    mfa: {
      required: true,
      methods: ['totp', 'email', 'sms'],
      gracePerion: 7 * 24 * 60 * 60, // 7 days to set up
    },
  },

  // Rate limiting
  rateLimit: {
    auth: {
      window: 900, // 15 minutes
      max: 5, // 5 attempts
      blockDuration: 1800, // 30 minutes
    },
    api: {
      window: 900, // 15 minutes
      max: 100, // requests per window
      blockDuration: 300, // 5 minutes
    },
  },

  // Headers and CORS
  headers: {
    csp: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.vercel-insights.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'https:', 'data:', 'blob:'],
        fontSrc: ["'self'"],
        connectSrc: [
          "'self'",
          'https://vitals.vercel-insights.com',
          'https://*.sentry.io',
          'https://*.datadog.com',
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
      reportOnly: false,
      reportUri: '/api/security/csp-report',
    },
    cors: {
      origins: ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowCredentials: true,
      maxAge: 86400,
    },
  },

  // Audit configuration
  audit: {
    // Events to be logged
    events: {
      auth: [
        'login',
        'logout',
        'password_change',
        'mfa_change',
        'token_refresh',
        'permission_change',
      ],
      data: [
        'create',
        'update',
        'delete',
        'export',
        'share',
        'access_sensitive',
      ],
      admin: [
        'settings_change',
        'user_management',
        'role_management',
        'system_config',
      ],
    },
    // Retention periods (in days)
    retention: {
      authLogs: 90,
      activityLogs: 365,
      errorLogs: 30,
      auditReports: 730,
    },
    // Automated checks
    automatedChecks: {
      frequency: 'daily',
      checks: [
        'unusualLoginPatterns',
        'failedAuthAttempts',
        'privilegeEscalation',
        'dataExports',
        'configChanges',
        'apiUsage',
      ],
    },
  },

  // Compliance requirements
  compliance: {
    dataProtection: {
      encryption: {
        atRest: {
          algorithm: 'AES-256-GCM',
          keyRotation: 90, // days
        },
        inTransit: {
          minTlsVersion: 'TLSv1.3',
          preferredCipherSuites: [
            'TLS_AES_256_GCM_SHA384',
            'TLS_CHACHA20_POLY1305_SHA256',
          ],
        },
      },
      dataRetention: {
        userAccounts: 730, // days after deletion
        activityLogs: 365,
        backups: 90,
      },
      dataDeletion: {
        method: 'secure_erase',
        verifyDeletion: true,
      },
    },
    accessControl: {
      rbac: {
        roles: ['admin', 'manager', 'member', 'guest'],
        reviewFrequency: 90, // days
      },
      sessionManagement: {
        timeout: 3600, // 1 hour
        forceLogoutOnRisk: true,
      },
    },
  },

  // Validation schemas
  schemas: {
    password: z.string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    
    mfaToken: z.string()
      .length(6, 'MFA token must be 6 digits')
      .regex(/^[0-9]+$/, 'MFA token must contain only numbers'),
    
    apiKey: z.string()
      .length(32, 'API key must be 32 characters')
      .regex(/^[A-Za-z0-9]+$/, 'API key must contain only alphanumeric characters'),
  },
}; 