import { ImageLoaderProps } from 'next/image';

export const PERFORMANCE_CONFIG = {
  // Core Web Vitals thresholds
  metrics: {
    fcp: 1800, // First Contentful Paint < 1.8s
    lcp: 2500, // Largest Contentful Paint < 2.5s
    fid: 100,  // First Input Delay < 100ms
    cls: 0.1,  // Cumulative Layout Shift < 0.1
    ttfb: 800, // Time to First Byte < 800ms
  },

  // API performance thresholds
  api: {
    responseTime: 200, // < 200ms
    errorRate: 0.001,  // < 0.1%
    rateLimit: {
      window: 900000,  // 15 minutes
      max: 100,        // max requests per window
    },
  },

  // Cache configuration
  cache: {
    // Redis cache settings
    redis: {
      maxMemory: '2gb',
      evictionPolicy: 'allkeys-lru',
      keyExpiryTime: {
        default: 3600,        // 1 hour
        user: 86400,         // 24 hours
        team: 86400,         // 24 hours
        project: 3600,       // 1 hour
        notification: 1800,   // 30 minutes
        analytics: 300,      // 5 minutes
      },
    },
    // Browser cache settings
    browser: {
      staleWhileRevalidate: 60,  // 1 minute
      images: 604800,            // 1 week
      fonts: 604800,             // 1 week
      static: 86400,             // 24 hours
    },
  },

  // Image optimization
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 604800,
    loader: 'default',
    domains: [],
    quality: 75,
  },

  // Bundle optimization
  bundle: {
    // Maximum bundle size thresholds (in KB)
    size: {
      initial: 170,    // Initial JS < 170KB
      page: 120,       // Per-page JS < 120KB
      css: 50,         // CSS < 50KB
    },
    // Paths to be pre-compiled
    precompile: [
      '/app/dashboard',
      '/app/teams',
      '/app/projects',
    ],
  },

  // Database optimization
  database: {
    mongodb: {
      poolSize: 10,
      maxTimeMS: 5000,
      indexStats: {
        checkInterval: 86400000, // 24 hours
        threshold: 0.9,         // 90% index utilization
      },
      // Fields that should always be indexed
      requiredIndexes: [
        { collection: 'teams', fields: ['name', 'members.user'] },
        { collection: 'projects', fields: ['team', 'name', 'members.user'] },
        { collection: 'notifications', fields: ['recipient', 'isRead', 'createdAt'] },
        { collection: 'announcements', fields: ['team', 'validFrom', 'validUntil'] },
      ],
    },
  },

  // Load testing configuration
  loadTest: {
    concurrent: 10000,  // Target concurrent users
    rampUp: 300,       // Ramp up time in seconds
    duration: 1800,    // Test duration in seconds
    scenarios: {
      browse: 0.4,     // 40% users browsing
      interact: 0.3,   // 30% users interacting
      notify: 0.2,     // 20% users receiving notifications
      search: 0.1,     // 10% users searching
    },
  },
};

// Image optimization loader
export const imageLoader = ({ src, width, quality }: ImageLoaderProps): string => {
  // Use Vercel's Image Optimization API
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
}; 