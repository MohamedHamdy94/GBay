export const SECURITY_REPOSITORY = 'SECURITY_REPOSITORY';

export interface ISecurityRepository {
  logIncident(data: CreateSecurityIncidentDto): Promise<void>;
  getIncidents(filter: IncidentFilter): Promise<{ incidents: SecurityIncident[]; total: number }>;
}

export interface CreateSecurityIncidentDto {
  type: string;
  severity: SecuritySeverity;
  ipAddress?: string;
  userId?: string;
  userAgent?: string;
  endpoint?: string;
  details?: any;
}

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityIncident {
  id: string;
  type: string;
  severity: SecuritySeverity;
  ipAddress: string | null;
  userId: string | null;
  userAgent: string | null;
  endpoint: string | null;
  details: any;
  createdAt: Date;
}

export interface IncidentFilter {
  type?: string;
  severity?: SecuritySeverity;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}
