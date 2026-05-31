import { Module, Global } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

@Global()
@Module({
  providers: [
    {
      provide: 'SENTRY_OPTIONS',
      useValue: {
        dsn: process.env.SENTRY_DSN,
        integrations: [
          nodeProfilingIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: 1.0, //  Capture 100% of the transactions
        // Set sampling rate for profiling - this is relative to tracesSampleRate
        profilesSampleRate: 1.0,
      },
    },
  ],
})
export class SentryModule {
  onModuleInit() {
    const dsn = process.env.SENTRY_DSN;
    if (dsn) {
      Sentry.init({
        dsn,
        integrations: [
          nodeProfilingIntegration(),
        ],
        tracesSampleRate: 1.0,
        profilesSampleRate: 1.0,
      });
    }
  }
}
