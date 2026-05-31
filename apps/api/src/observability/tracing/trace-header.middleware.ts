import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { trace, context } from '@opentelemetry/api';

@Injectable()
export class TraceHeaderMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const span = trace.getSpan(context.active());
    const traceId = span?.spanContext().traceId;

    if (traceId) {
      res.setHeader('x-trace-id', traceId);
    } else if (req.headers['x-trace-id']) {
      res.setHeader('x-trace-id', req.headers['x-trace-id']);
    }

    next();
  }
}
