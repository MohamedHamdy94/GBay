import { Injectable, Inject } from '@nestjs/common';
import { PrismaFraudRepository } from './prisma-fraud.repository';
import { CreateFraudRuleDto, ResolveFraudSignalDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FraudService {
  constructor(@Inject(PrismaFraudRepository) private readonly repository: PrismaFraudRepository) {}

  async getSignals(query: any) {
    // Basic filter implementation
    const filters: Prisma.FraudSignalWhereInput = {};
    if (query.status) filters.status = query.status;
    if (query.severity) filters.severity = query.severity;
    
    return this.repository.getSignals(filters);
  }

  async resolveSignal(id: string, userId: string, data: ResolveFraudSignalDto) {
    return this.repository.updateSignal(id, {
      ...data,
      resolvedById: userId,
      updatedAt: new Date(),
    });
  }

  async createRule(data: CreateFraudRuleDto) {
    return this.repository.createRule(data);
  }

  async getRules() {
    return this.repository.getRules();
  }

  async updateRule(id: string, data: any) {
    return this.repository.updateRule(id, data);
  }
}
