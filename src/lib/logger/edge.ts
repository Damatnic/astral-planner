/**
 * Edge Runtime Compatible Logger
 * 
 * This logger works in both Node.js and Edge Runtime environments.
 * It replaces Winston for edge-compatible contexts (middleware, edge API routes).
 * 
 * Usage:
 * ```typescript
 * import { Logger } from '@/lib/logger/edge';
 * 
 * Logger.info('User logged in', { userId: '123' });
 * Logger.error('Database error', error);
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
  [key: string]: any;
}

class EdgeLogger {
  private readonly isDevelopment: boolean;
  private readonly minLevel: LogLevel;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, meta?: LogMetadata | Error): string {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);
    
    let metaStr = '';
    if (meta) {
      if (meta instanceof Error) {
        metaStr = `\n  Error: ${meta.message}\n  Stack: ${meta.stack}`;
      } else if (Object.keys(meta).length > 0) {
        try {
          metaStr = `\n  ${JSON.stringify(meta, null, 2)}`;
        } catch (e) {
          metaStr = `\n  [Circular or non-serializable object]`;
        }
      }
    }

    return `${timestamp} [${levelUpper}] ${message}${metaStr}`;
  }

  private log(level: LogLevel, message: string, meta?: LogMetadata | Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, meta);

    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.log(formattedMessage);
        break;
      case 'warn':
        // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.warn(formattedMessage);
        break;
      case 'error':
        // TODO: Replace with proper logging - // TODO: Replace with proper logging - console.error(formattedMessage);
        break;
    }
  }

  /**
   * Log debug messages (development only by default)
   */
  debug(message: string, meta?: LogMetadata): void {
    this.log('debug', message, meta);
  }

  /**
   * Log informational messages
   */
  info(message: string, meta?: LogMetadata): void {
    this.log('info', message, meta);
  }

  /**
   * Log warning messages
   */
  warn(message: string, meta?: LogMetadata | unknown): void {
    // Handle unknown type by converting if needed
    if (meta && typeof meta === 'object' && !(meta instanceof Error)) {
      this.log('warn', message, meta as LogMetadata);
    } else {
      this.log('warn', message, meta as LogMetadata);
    }
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | LogMetadata | unknown): void {
    // Handle unknown type by converting to Error if needed
    if (error && !(error instanceof Error) && typeof error === 'object') {
      this.log('error', message, error as LogMetadata);
    } else {
      this.log('error', message, error as Error | LogMetadata);
    }
  }

  /**
   * Create a child logger with a specific context
   */
  child(context: LogMetadata): EdgeLogger {
    const childLogger = new EdgeLogger();
    const originalLog = childLogger.log.bind(childLogger);
    
    childLogger.log = (level: LogLevel, message: string, meta?: LogMetadata | Error) => {
      const mergedMeta = meta instanceof Error 
        ? meta 
        : { ...context, ...(meta || {}) };
      originalLog(level, message, mergedMeta);
    };

    return childLogger;
  }
}

// Export singleton instance
export const Logger = new EdgeLogger();

// Export class for testing
export { EdgeLogger };

// Export types
export type { LogLevel, LogMetadata };

// Default export for convenience
export default Logger;
