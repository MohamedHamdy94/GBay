import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { 
  ISecurityRepository, 
  CreateSecurityIncidentDto, 
  IncidentFilter, 
  SecurityIncident,
  SecuritySeverity
} from './security.types';
import { FraudSeverity } from '@prisma/client';

@Injectable()
export class PrismaSecurityRepository implements ISecurityRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async logIncident(data: CreateSecurityIncidentDto): Promise<void> {
    await this.prisma.securityIncident.create({
      data: {
        type: data.type,
        severity: data.severity as FraudSeverity,
        ipAddress: data.ipAddress,
        userId: data.userId,
        userAgent: data.userAgent,
        endpoint: data.endpoint,
        details: data.details || {},
      },
    });
  }

  async getIncidents(filter: IncidentFilter): Promise<{ incidents: SecurityIncident[]; total: number }> {
    const where: any = {};
    if (filter.type) where.type = filter.type;
    if (filter.severity) where.severity = filter.severity as FraudSeverity;
    if (filter.from || filter.to) {
      where.createdAt = {};
      if (filter.from) where.createdAt.gte = filter.from;
      if (filter.to) where.createdAt.lte = filter.to;
    }

    const [incidents, total] = await Promise.all([
      this.prisma.securityIncident.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filter.limit || 50,
        skip: filter.offset || 0,
      }),
      this.prisma.securityIncident.count({ where }),
    ]);

    return { 
      incidents: incidents.map(i => ({
        ...i,
        severity: i.severity as SecuritySeverity,
        details: i.details || {},
      })), 
      total 
    };
  }
}
