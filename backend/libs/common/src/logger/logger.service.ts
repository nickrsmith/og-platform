import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface LogContext {
  [key: string]: unknown;
  service?: string;
  requestId?: string;
  userId?: string;
  action?: string;
  [key: `x-${string}`]: unknown; // Allow custom fields with x- prefix
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly serviceName: string;
  private readonly minLevel: LogLevel;

  constructor(serviceName?: string, minLevel?: LogLevel) {
    this.serviceName = serviceName || process.env.SERVICE_NAME || 'unknown';
    if (minLevel) {
      this.minLevel = minLevel;
    } else if (process.env.LOG_LEVEL) {
      const envLevel = process.env.LOG_LEVEL.toUpperCase() as LogLevel;
      this.minLevel = Object.values(LogLevel).includes(envLevel) ? envLevel : LogLevel.INFO;
    } else {
      this.minLevel = LogLevel.INFO;
    }
  }

  /**
   * Log a message at DEBUG level
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log a message at INFO level
   */
  log(message: string, context?: LogContext): void;
  log(level: LogLevel, message: string, context?: LogContext): void;
  log(levelOrMessage: LogLevel | string, messageOrContext?: string | LogContext, context?: LogContext): void {
    if (typeof levelOrMessage === 'string') {
      // NestJS LoggerService interface compatibility
      const contextParam = typeof messageOrContext === 'object' ? messageOrContext : undefined;
      this.logMessage(LogLevel.INFO, levelOrMessage, contextParam);
      return;
    }
    const messageParam = typeof messageOrContext === 'string' ? messageOrContext : '';
    this.logMessage(levelOrMessage, messageParam, context);
  }

  /**
   * Log a message at INFO level
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a message at WARN level
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log a message at ERROR level
   */
  error(message: string, trace?: string, context?: LogContext): void {
    const fullContext: LogContext = {
      ...context,
      ...(trace && { trace }),
    };
    this.log(LogLevel.ERROR, message, fullContext);
  }

  /**
   * Log a message at CRITICAL level
   */
  critical(message: string, context?: LogContext): void {
    this.log(LogLevel.CRITICAL, message, context);
  }

  /**
   * Log a message at VERBOSE level (NestJS compatibility)
   */
  verbose(message: string, context?: LogContext): void {
    this.debug(message, context);
  }

  /**
   * Set the log level dynamically
   */
  setLogLevel(level: LogLevel): void {
    (this as unknown as { minLevel: LogLevel }).minLevel = level;
  }

  /**
   * Internal method to log a message
   */
  private logMessage(level: LogLevel, message: string, context?: LogContext): void {
    // Check if we should log this level
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry = this.formatLogEntry(level, message, context);
    const jsonString = JSON.stringify(logEntry);

    // Output to appropriate stream based on level
    if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
      console.error(jsonString);
    } else if (level === LogLevel.WARN) {
      console.warn(jsonString);
    } else {
      console.log(jsonString);
    }
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.CRITICAL,
    ];
    const minIndex = levels.indexOf(this.minLevel);
    const levelIndex = levels.indexOf(level);
    return levelIndex >= minIndex;
  }

  /**
   * Format a log entry as structured JSON
   */
  private formatLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): Record<string, unknown> {
    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      service: context?.service || this.serviceName,
      message: this.sanitizeMessage(message),
    };

    // Add context fields
    if (context) {
      // Add standard context fields
      if (context.requestId) {
        entry.requestId = context.requestId;
      }
      if (context.userId) {
        entry.userId = context.userId;
      }
      if (context.action) {
        entry.action = context.action;
      }

      // Add all other context fields (excluding service which we already set)
      Object.keys(context).forEach((key) => {
        if (
          key !== 'service' &&
          key !== 'requestId' &&
          key !== 'userId' &&
          key !== 'action'
        ) {
          entry[key] = this.sanitizeValue(context[key]);
        }
      });
    }

    // Add process metadata
    entry.pid = process.pid;
    entry.uptime = Math.floor(process.uptime());

    return entry;
  }

  /**
   * Sanitize message to prevent log injection
   */
  private sanitizeMessage(message: string): string {
    // Remove newlines and control characters that could break JSON
    return message.replace(/[\n\r\t]/g, ' ').trim();
  }

  /**
   * Sanitize values to prevent sensitive data leakage
   */
  private sanitizeValue(value: unknown): unknown {
    if (typeof value === 'string') {
      // Check for common sensitive patterns
      const sensitivePatterns = [
        /password/i,
        /secret/i,
        /token/i,
        /key/i,
        /credential/i,
        /authorization/i,
        /bearer\s+/i,
        /api[_-]?key/i,
      ];

      // If key suggests sensitive data, redact it
      if (sensitivePatterns.some((pattern) => pattern.test(String(value)))) {
        return '[REDACTED]';
      }

      // Limit string length to prevent log flooding
      const maxLength = 1000;
      if (value.length > maxLength) {
        return `${value.substring(0, maxLength)}... [TRUNCATED]`;
      }
    }

    // For objects, recursively sanitize
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const sanitized: Record<string, unknown> = {};
      Object.keys(value).forEach((key) => {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('password') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('token') ||
          lowerKey.includes('key') ||
          lowerKey.includes('credential')
        ) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeValue((value as Record<string, unknown>)[key]);
        }
      });
      return sanitized;
    }

    // For arrays, sanitize each element
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item));
    }

    return value;
  }
}

