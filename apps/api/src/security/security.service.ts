import { Injectable, Inject, Logger } from '@nestjs/common';
import { 
  SECURITY_REPOSITORY, 
  ISecurityRepository, 
  CreateSecurityIncidentDto, 
  IncidentFilter,
  SecurityIncident
} from './security.types';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    @Inject(SECURITY_REPOSITORY)
    private repository: ISecurityRepository,
  ) {}

  async logIncident(data: CreateSecurityIncidentDto): Promise<void> {
    try {
      await this.repository.logIncident(data);
      if (data.severity === 'CRITICAL' || data.severity === 'HIGH') {
        this.logger.warn(`Security incident detected: ${data.type} from IP ${data.ipAddress}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to log security incident: ${error.message}`);
    }
  }

  async getIncidents(filter: IncidentFilter): Promise<{ incidents: SecurityIncident[]; total: number }> {
    return this.repository.getIncidents(filter);
  }

  async getSecuritySettings() {
    return {
      rateLimiting: {
        general: '100 requests per minute',
        auth: '5 requests per minute',
        admin: '30 requests per minute',
      },
      headers: {
        helmet: 'Enabled',
        csp: 'Enabled (default)',
        hsts: 'Enabled',
      },
      validation: {
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      },
    };
  }
}
