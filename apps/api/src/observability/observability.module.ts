import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { TracingModule } from './tracing/tracing.module';
import { SentryModule } from './sentry/sentry.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { TraceHeaderMiddleware } from './tracing/trace-header.middleware';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            query: req.query,
            params: req.params,
            userId: req.raw.user?.id,
          }),
        },
        customProps: (req) => ({
          traceId: req.headers['x-trace-id'],
        }),
      },
    }),
    HealthModule,
    MetricsModule,
    TracingModule,
    SentryModule,
    MonitoringModule,
  ],
  exports: [
    MonitoringModule,
    MetricsModule,
  ],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TraceHeaderMiddleware)
      .forRoutes('*');
  }
}
