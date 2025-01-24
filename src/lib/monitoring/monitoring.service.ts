import * as Sentry from '@sentry/nextjs';
import { datadogRum } from '@datadog/browser-rum';
import type { Event as SentryEvent, EventHint, Scope } from '@sentry/nextjs';
import type { RumInitConfiguration } from '@datadog/browser-rum';
import { PERFORMANCE_CONFIG } from '../config/performance.config';
import { logger } from '../utils/logger';

interface MetricPayload {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

interface ErrorPayload {
  error: Error;
  context?: Record<string, any>;
  tags?: Record<string, string>;
}

export class MonitoringService {
  private static isInitialized = false;

  static initialize(): void {
    if (this.isInitialized) return;

    // Initialize Sentry
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        tracesSampleRate: 0.2,
        environment: process.env.NODE_ENV,
        integrations: [
          new Sentry.Integrations.BrowserTracing({
            tracePropagationTargets: ['localhost', process.env.NEXT_PUBLIC_API_URL],
          }),
        ],
        beforeSend(event: SentryEvent, hint: EventHint) {
          // Sanitize sensitive data
          if (event.request?.cookies) {
            delete event.request.cookies;
          }
          return event;
        },
      });
    }

    // Initialize Datadog RUM
    if (process.env.NEXT_PUBLIC_DATADOG_APP_ID) {
      const config: RumInitConfiguration = {
        applicationId: process.env.NEXT_PUBLIC_DATADOG_APP_ID,
        clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN!,
        site: process.env.NEXT_PUBLIC_DATADOG_SITE as 'datadoghq.com' | 'datadoghq.eu' || 'datadoghq.com',
        service: 'gaiathon25-hub',
        env: process.env.NODE_ENV,
        version: process.env.NEXT_PUBLIC_APP_VERSION,
        sessionSampleRate: 100,
        sessionReplaySampleRate: 20,
        trackUserInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: 'mask-user-input',
      };
      datadogRum.init(config);
    }

    this.isInitialized = true;
  }

  static trackMetric({ name, value, tags = {} }: MetricPayload): void {
    try {
      // Send metric to Datadog
      datadogRum.addTiming(name, value);
      
      // Log metric if it exceeds thresholds
      const threshold = this.getThresholdForMetric(name);
      if (threshold && value > threshold) {
        logger.warn(`Performance threshold exceeded for ${name}`, {
          metric: name,
          value,
          threshold,
          tags,
        });
      }
    } catch (error) {
      logger.error('Error tracking metric', { error, metric: name });
    }
  }

  static trackError({ error, context = {}, tags = {} }: ErrorPayload): void {
    try {
      // Send error to Sentry
      Sentry.withScope((scope: Scope) => {
        scope.setTags(tags);
        scope.setContext('additional', context);
        Sentry.captureException(error);
      });

      // Log error
      logger.error(error.message, {
        error,
        context,
        tags,
      });
    } catch (err) {
      logger.error('Error tracking error', { error: err });
    }
  }

  static startSpan(name: string, tags: Record<string, string> = {}): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.trackMetric({
        name,
        value: duration,
        tags,
      });
    };
  }

  private static getThresholdForMetric(name: string): number | undefined {
    const { metrics, api } = PERFORMANCE_CONFIG;
    
    const thresholds: Record<string, number> = {
      'client.fcp': metrics.fcp,
      'client.lcp': metrics.lcp,
      'client.fid': metrics.fid,
      'client.cls': metrics.cls,
      'api.response': api.responseTime,
    };

    return thresholds[name];
  }

  // Utility methods for common metrics
  static trackPageLoad(route: string): void {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigationEntry) return;

    this.trackMetric({
      name: 'client.page_load',
      value: navigationEntry.loadEventEnd - navigationEntry.startTime,
      tags: { route },
    });
  }

  static trackApiCall(endpoint: string, duration: number): void {
    this.trackMetric({
      name: 'api.response',
      value: duration,
      tags: { endpoint },
    });
  }

  static trackDatabaseQuery(collection: string, operation: string, duration: number): void {
    this.trackMetric({
      name: 'db.query',
      value: duration,
      tags: { collection, operation },
    });
  }

  static trackCacheOperation(operation: string, hit: boolean, duration: number): void {
    this.trackMetric({
      name: 'cache.operation',
      value: duration,
      tags: { operation, hit: String(hit) },
    });
  }
} 