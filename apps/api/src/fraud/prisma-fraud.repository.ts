import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FraudRule, FraudSignal, Prisma } from '@prisma/client';

@Injectable()
export class PrismaFraudRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createRule(data: Prisma.FraudRuleCreateInput): Promise<FraudRule> {
    return this.prisma.fraudRule.create({ data });
  }

  async getEnabledRules(): Promise<FraudRule[]> {
    return this.prisma.fraudRule.findMany({ where: { enabled: true } });
  }

  async createSignal(data: Prisma.FraudSignalCreateInput): Promise<FraudSignal> {
    return this.prisma.fraudSignal.create({ data });
  }

  async getSignals(filters: Prisma.FraudSignalWhereInput) {
    return this.prisma.fraudSignal.findMany({
      where: filters,
      include: { rule: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSignal(id: string, data: Prisma.FraudSignalUpdateInput): Promise<FraudSignal> {
    return this.prisma.fraudSignal.update({ where: { id }, data });
  }

  async getRuleByName(name: string): Promise<FraudRule | null> {
    return this.prisma.fraudRule.findUnique({ where: { name } });
  }

  async getRules() {
    return this.prisma.fraudRule.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRule(id: string, data: Prisma.FraudRuleUpdateInput): Promise<FraudRule> {
    return this.prisma.fraudRule.update({ where: { id }, data });
  }
}
