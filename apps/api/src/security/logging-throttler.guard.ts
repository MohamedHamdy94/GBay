import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { SecurityService } from './security.service';

@Injectable()
export class LoggingThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
    @Inject(SecurityService) private securityService: SecurityService,
  ) {
    super(options, storageService, reflector);
  }

  protected async throwThrottlingException(context: ExecutionContext, throttlerLimitDetail: any): Promise<void> {
    const req = context.switchToHttp().getRequest();
    const ip = req.ip;
    const user = req.user;
    
    await this.securityService.logIncident({
      type: 'RATE_LIMIT',
      severity: 'MEDIUM',
      ipAddress: ip,
      userId: user?.id,
      userAgent: req.headers['user-agent'],
      endpoint: req.url,
      details: {
        method: req.method,
        headers: req.headers,
        limitDetail: throttlerLimitDetail,
      },
    });

    return super.throwThrottlingException(context, throttlerLimitDetail);
  }
}
