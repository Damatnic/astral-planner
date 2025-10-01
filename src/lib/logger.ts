/**
 * Legacy logger re-export for backward compatibility
 */

import { Logger as EdgeLogger } from './logger/edge';

export default EdgeLogger;
export { EdgeLogger as Logger };
export const apiLogger = EdgeLogger.child({ component: 'api' });

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
