import { Module, Global } from '@nestjs/common';
import { trace, Tracer } from '@opentelemetry/api';

@Global()
@Module({
  providers: [
    {
      provide: 'TRACER',
      useFactory: () => {
        return trace.getTracer('gbay-api');
      },
    },
  ],
  exports: ['TRACER'],
})
export class TracingModule {}
