import winston from 'winston';

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

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports with production safety
const transports: winston.transport[] = [
  new winston.transports.Console(),
];

// Only add file transports in development or when logs directory is accessible
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
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
    // TODO: Replace with proper logging - console.warn('File logging disabled due to filesystem access issues:', fsError);
  }
}

// Create exception and rejection handlers safely
const exceptionHandlers: winston.transport[] = [new winston.transports.Console()];
const rejectionHandlers: winston.transport[] = [new winston.transports.Console()];

if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
  try {
    exceptionHandlers.push(new winston.transports.File({ filename: 'logs/exceptions.log' }));
    rejectionHandlers.push(new winston.transports.File({ filename: 'logs/rejections.log' }));
  } catch (fsError) {
    // Silently fall back to console only
  }
}

// Create logger - Edge Runtime compatible
let Logger: any;

if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  // Node.js environment
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
  // Edge Runtime environment - simple console logger
  Logger = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
    silly: console.log,
  };
}

export default Logger;

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