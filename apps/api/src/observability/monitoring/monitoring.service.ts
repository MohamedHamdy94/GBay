import { Injectable } from '@nestjs/common';

export interface AppError {
  timestamp: string;
  message: string;
  stack?: string;
  path: string;
  method: string;
  userId?: string;
  traceId?: string;
}

@Injectable()
export class MonitoringService {
  private readonly recentErrors: AppError[] = [];
  private readonly MAX_ERRORS = 50;

  logError(error: AppError) {
    this.recentErrors.unshift(error);
    if (this.recentErrors.length > this.MAX_ERRORS) {
      this.recentErrors.pop();
    }
  }

  getRecentErrors(): AppError[] {
    return this.recentErrors;
  }
}
