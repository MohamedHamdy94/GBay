import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Response } from 'express';

@Catch()
export class SentryFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      console.error('Unhandled Exception:', exception);
      Sentry.captureException(exception, {
        extra: {
          url: request.url,
          method: request.method,
          body: request.body,
          query: request.query,
          userId: request.user?.id,
        },
      });
    }

    // Still let the default Nest exception handling work or return a custom response
    if (exception instanceof HttpException) {
      return response.status(status).json(exception.getResponse());
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      traceId: request.headers['x-trace-id'],
    });
  }
}
