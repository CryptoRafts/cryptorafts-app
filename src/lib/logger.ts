// Central logging system for the application
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context, userId, sessionId } = entry;
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    const userStr = userId ? ` [user:${userId}]` : '';
    const sessionStr = sessionId ? ` [session:${sessionId}]` : '';
    
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${userStr}${sessionStr}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, userId?: string, sessionId?: string) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      userId,
      sessionId
    };

    const formattedMessage = this.formatMessage(entry);

    // Client-side logging
    if (this.isClient) {
      switch (level) {
        case 'debug':
          console.debug(formattedMessage);
          break;
        case 'info':
          console.info(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'error':
          console.error(formattedMessage);
          break;
      }
    } else {
      // Server-side logging
      switch (level) {
        case 'debug':
          console.debug(formattedMessage);
          break;
        case 'info':
          console.info(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'error':
          console.error(formattedMessage);
          break;
      }
    }

    // In production, send errors to external service
    if (!this.isDevelopment && level === 'error') {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry) {
    try {
      // Send to external logging service (e.g., Sentry, LogRocket, etc.)
      // This is a placeholder - implement based on your logging service
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      // Don't log errors from the logger itself to avoid infinite loops
      console.error('Failed to send log to external service:', error);
    }
  }

  debug(message: string, context?: Record<string, any>, userId?: string, sessionId?: string) {
    this.log('debug', message, context, userId, sessionId);
  }

  info(message: string, context?: Record<string, any>, userId?: string, sessionId?: string) {
    this.log('info', message, context, userId, sessionId);
  }

  warn(message: string, context?: Record<string, any>, userId?: string, sessionId?: string) {
    this.log('warn', message, context, userId, sessionId);
  }

  error(message: string, context?: Record<string, any>, userId?: string, sessionId?: string) {
    this.log('error', message, context, userId, sessionId);
  }

  // Specialized logging methods
  auth(message: string, context?: Record<string, any>, userId?: string) {
    this.info(`[AUTH] ${message}`, context, userId);
  }

  firestore(message: string, context?: Record<string, any>, userId?: string) {
    this.info(`[FIRESTORE] ${message}`, context, userId);
  }

  redirect(message: string, context?: Record<string, any>, userId?: string) {
    this.info(`[REDIRECT] ${message}`, context, userId);
  }

  performance(message: string, context?: Record<string, any>, userId?: string) {
    this.info(`[PERFORMANCE] ${message}`, context, userId);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other files
export type { LogLevel, LogEntry };
