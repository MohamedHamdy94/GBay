import { Controller, Get, Query, UseGuards, Inject } from '@nestjs/common';
import { SecurityService } from './security.service';
import { AdminGuard } from '../admin/admin.guard';
import { BearerAuthGuard } from '../seller/bearer-auth.guard';
import { IncidentFilter, SecuritySeverity } from './security.types';

@Controller('admin/security')
@UseGuards(BearerAuthGuard, AdminGuard)
export class SecurityController {
  constructor(
    @Inject(SecurityService)
    private readonly securityService: SecurityService
  ) {}

  @Get('log')
  async getIncidents(
    @Query('type') type?: string,
    @Query('severity') severity?: SecuritySeverity,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.securityService.getIncidents({
      type,
      severity,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('settings')
  async getSettings() {
    return this.securityService.getSecuritySettings();
  }
}
