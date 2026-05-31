import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrismaFraudRepository } from './prisma-fraud.repository';
import { FraudSeverity } from '@prisma/client';

@Injectable()
export class FraudRuleEngine {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PrismaFraudRepository) private readonly repository: PrismaFraudRepository,
  ) {}

  async evaluateEvent(event: string, payload: any): Promise<void> {
    const enabledRules = await this.repository.getEnabledRules();
    if (enabledRules.length === 0) return;

    if (event === 'user.registered') {
      const { ipAddress, userId } = payload;
      if (!ipAddress) return;

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const count = await this.prisma.user.count({
        where: {
          createdAt: { gte: oneHourAgo },
          sessions: {
            some: {
              ipAddress,
            },
          },
        },
      });

      if (count > 5) {
        // Find a matching rule or use the first one as a fallback
        const rule = enabledRules.find((r) => r.name === 'Mass Registration') || enabledRules[0];
        
        await this.repository.createSignal({
          rule: { connect: { id: rule.id } },
          entityType: 'USER',
          entityId: userId,
          severity: FraudSeverity.MEDIUM,
          userId: userId,
          evidence: {
            registrationCount: count,
            ipAddress,
            threshold: 5,
          },
        });
      }
    }
  }
}
