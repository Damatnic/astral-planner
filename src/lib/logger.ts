// Edge Runtime compatibility - conditional import
let winston: any = null;
try {
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    winston = require('winston');
  }
} catch (error) {
  // Winston not available in Edge Runtime
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

if (winston) {
  winston.addColors(colors);
}

// Define log format
const format = winston ? winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info: any) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
) : null;

// Define transports with production safety
const transports: any[] = winston ? [
  new winston.transports.Console(),
] : [];

// Only add file transports in development or when logs directory is accessible
if (winston && (process.env.NODE_ENV !== 'production' || process.env.ENABLE_FILE_LOGGING === 'true')) {
  try {
    // Try to create a test log entry to verify filesystem access
    const fs = require('fs');
    const path = require('path');
    
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
      })
    );
  } catch (fsError) {
    // File logging disabled in serverless environments
    if (process.env.NODE_ENV === 'development') {
      console.warn('File logging disabled:', fsError);
    }
  }
}

// Create exception and rejection handlers safely
const exceptionHandlers: any[] = winston ? [new winston.transports.Console()] : [];
const rejectionHandlers: any[] = winston ? [new winston.transports.Console()] : [];

if (winston && (process.env.NODE_ENV !== 'production' || process.env.ENABLE_FILE_LOGGING === 'true')) {
  try {
    exceptionHandlers.push(new winston.transports.File({ filename: 'logs/exceptions.log' }));
    rejectionHandlers.push(new winston.transports.File({ filename: 'logs/rejections.log' }));
  } catch (fsError) {
    // Silently fall back to console only
  }
}

// Create logger - Edge Runtime compatible
let Logger: any;

if (winston && typeof process !== 'undefined' && process.versions && process.versions.node) {
  // Node.js environment with winston available
  Logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    levels,
    format,
    transports,
    exceptionHandlers,
    rejectionHandlers,
    exitOnError: false,
  });
} else {
  // Edge Runtime environment or winston not available - simple console logger
  Logger = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
    silly: console.log,
  };
}

export default Logger;

// Convenience exports
export const logger = Logger;
export const apiLogger = Logger;
export const dbLogger = Logger;
export const authLogger = Logger;
export const performanceLogger = Logger;

// Error handling utilities
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (error: Error | AppError): void => {
  Logger.error(error.message, {
    stack: error.stack,
    statusCode: (error as AppError).statusCode || 500,
  });

  if (process.env.NODE_ENV === 'production' && !(error as AppError).isOperational) {
    process.exit(1);
  }
};

export const logRequest = (req: any) => {
  Logger.http(`${req.method} ${req.url}`, {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });
};