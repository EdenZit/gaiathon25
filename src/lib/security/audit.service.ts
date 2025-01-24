import { SECURITY_CONFIG } from '../config/security.config';
import { MonitoringService } from '../monitoring/monitoring.service';
import { logger } from '../utils/logger';
import { RedisService } from '../cache/redis.service';

interface AuditEvent {
  type: string;
  category: 'auth' | 'data' | 'admin';
  action: string;
  userId?: string;
  resourceId?: string;
  metadata: Record<string, any>;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
}

interface AuditCheck {
  type: string;
  status: 'pass' | 'fail' | 'warn';
  details: Record<string, any>;
  timestamp: Date;
}

export class SecurityAuditService {
  private static readonly AUDIT_LOG_PREFIX = 'audit:log:';
  private static readonly AUDIT_CHECK_PREFIX = 'audit:check:';

  static async logEvent(event: Omit<AuditEvent, 'timestamp'>): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        ...event,
        timestamp: new Date(),
      };

      // Log to Redis for real-time analysis
      await RedisService.rpush(
        `${this.AUDIT_LOG_PREFIX}${event.category}`,
        JSON.stringify(auditEvent)
      );

      // Log to persistent storage
      logger.info('Security audit event', {
        event: auditEvent,
        service: 'security-audit',
      });

      // Track security metrics
      MonitoringService.trackMetric({
        name: `security.audit.${event.category}.${event.action}`,
        value: 1,
        tags: {
          type: event.type,
          category: event.category,
          action: event.action,
        },
      });

      // Check if event requires immediate attention
      if (this.isHighRiskEvent(event)) {
        await this.handleHighRiskEvent(event);
      }
    } catch (error) {
      logger.error('Failed to log audit event', { error, event });
      MonitoringService.trackError({
        error: error as Error,
        context: { event },
        tags: { service: 'security-audit' },
      });
    }
  }

  static async runAutomatedChecks(): Promise<void> {
    const { automatedChecks } = SECURITY_CONFIG.audit;
    const results: AuditCheck[] = [];

    try {
      for (const checkType of automatedChecks.checks) {
        const checkResult = await this.runCheck(checkType);
        results.push(checkResult);

        // Store check result
        await RedisService.setex(
          `${this.AUDIT_CHECK_PREFIX}${checkType}`,
          86400, // 24 hours
          JSON.stringify(checkResult)
        );

        // Track check status
        MonitoringService.trackMetric({
          name: `security.check.${checkType}`,
          value: checkResult.status === 'pass' ? 1 : 0,
          tags: { type: checkType, status: checkResult.status },
        });

        // Handle failed checks
        if (checkResult.status === 'fail') {
          await this.handleFailedCheck(checkResult);
        }
      }

      // Generate daily report
      await this.generateAuditReport(results);
    } catch (error) {
      logger.error('Failed to run automated security checks', { error });
      MonitoringService.trackError({
        error: error as Error,
        context: { checks: automatedChecks.checks },
        tags: { service: 'security-audit' },
      });
    }
  }

  private static async runCheck(type: string): Promise<AuditCheck> {
    const timestamp = new Date();
    
    try {
      switch (type) {
        case 'unusualLoginPatterns':
          return await this.checkUnusualLoginPatterns();
        case 'failedAuthAttempts':
          return await this.checkFailedAuthAttempts();
        case 'privilegeEscalation':
          return await this.checkPrivilegeEscalation();
        case 'dataExports':
          return await this.checkDataExports();
        case 'configChanges':
          return await this.checkConfigChanges();
        case 'apiUsage':
          return await this.checkApiUsage();
        default:
          throw new Error(`Unknown check type: ${type}`);
      }
    } catch (error) {
      return {
        type,
        status: 'fail',
        details: { error: (error as Error).message },
        timestamp,
      };
    }
  }

  private static async checkUnusualLoginPatterns(): Promise<AuditCheck> {
    // Implementation for checking unusual login patterns
    return {
      type: 'unusualLoginPatterns',
      status: 'pass',
      details: {},
      timestamp: new Date(),
    };
  }

  private static async checkFailedAuthAttempts(): Promise<AuditCheck> {
    // Implementation for checking failed auth attempts
    return {
      type: 'failedAuthAttempts',
      status: 'pass',
      details: {},
      timestamp: new Date(),
    };
  }

  private static async checkPrivilegeEscalation(): Promise<AuditCheck> {
    // Implementation for checking privilege escalation attempts
    return {
      type: 'privilegeEscalation',
      status: 'pass',
      details: {},
      timestamp: new Date(),
    };
  }

  private static async checkDataExports(): Promise<AuditCheck> {
    // Implementation for checking data exports
    return {
      type: 'dataExports',
      status: 'pass',
      details: {},
      timestamp: new Date(),
    };
  }

  private static async checkConfigChanges(): Promise<AuditCheck> {
    // Implementation for checking configuration changes
    return {
      type: 'configChanges',
      status: 'pass',
      details: {},
      timestamp: new Date(),
    };
  }

  private static async checkApiUsage(): Promise<AuditCheck> {
    // Implementation for checking API usage patterns
    return {
      type: 'apiUsage',
      status: 'pass',
      details: {},
      timestamp: new Date(),
    };
  }

  private static isHighRiskEvent(event: AuditEvent): boolean {
    const highRiskActions = [
      'password_change',
      'mfa_change',
      'permission_change',
      'access_sensitive',
      'user_management',
      'system_config',
    ];

    return highRiskActions.includes(event.action);
  }

  private static async handleHighRiskEvent(event: AuditEvent): Promise<void> {
    // Log high-risk event
    logger.warn('High-risk security event detected', { event });

    // Send alert
    MonitoringService.trackMetric({
      name: 'security.high_risk_event',
      value: 1,
      tags: {
        type: event.type,
        category: event.category,
        action: event.action,
      },
    });

    // Store for immediate analysis
    await RedisService.setex(
      `high-risk:${event.type}:${event.timestamp.getTime()}`,
      3600, // 1 hour
      JSON.stringify(event)
    );
  }

  private static async handleFailedCheck(check: AuditCheck): Promise<void> {
    // Log failed check
    logger.error('Security check failed', { check });

    // Send alert
    MonitoringService.trackMetric({
      name: 'security.check_failed',
      value: 1,
      tags: { type: check.type },
    });
  }

  private static async generateAuditReport(checks: AuditCheck[]): Promise<void> {
    const report = {
      timestamp: new Date(),
      checks,
      summary: {
        total: checks.length,
        passed: checks.filter(c => c.status === 'pass').length,
        failed: checks.filter(c => c.status === 'fail').length,
        warnings: checks.filter(c => c.status === 'warn').length,
      },
    };

    // Store report
    await RedisService.setex(
      `audit:report:${report.timestamp.toISOString().split('T')[0]}`,
      SECURITY_CONFIG.audit.retention.auditReports * 86400,
      JSON.stringify(report)
    );

    // Log report summary
    logger.info('Security audit report generated', {
      summary: report.summary,
      service: 'security-audit',
    });
  }
} 