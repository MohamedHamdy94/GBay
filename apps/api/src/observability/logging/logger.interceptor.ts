import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { MonitoringService } from '../monitoring/monitoring.service';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly monitoringService: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        // Log successful requests if needed, but nestjs-pino already does this
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        
        // Log errors to our monitoring service for the admin dashboard
        if (this.monitoringService && (!(error instanceof HttpException) || error.getStatus() >= 500)) {
          this.monitoringService.logError({
            timestamp: new Date().toISOString(),
            message: error.message || 'Unknown error',
            stack: error.stack,
            path: url,
            method: method,
            userId: user?.id,
            traceId: request.headers['x-trace-id'] as string,
          });
        }
        
        return throwError(() => error);
      }),
    );
  }
}
