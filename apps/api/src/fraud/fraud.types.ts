import { FraudAction, FraudSeverity, FraudSignalStatus } from '@prisma/client';

export interface FraudRuleCondition {
  type: 'COUNT' | 'PATTERN' | 'VELOCITY';
  metric: string;
  threshold: number;
  windowMinutes: number;
  groupBy?: 'IP' | 'USER' | 'DEVICE';
}

export interface FraudSignalEvidence {
  metricValue: number;
  threshold: number;
  details: any;
  context: {
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
  };
}
