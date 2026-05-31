import { Module } from '@nestjs/common';
import { FraudService } from './fraud.service';
import { FraudController } from './fraud.controller';
import { PrismaFraudRepository } from './prisma-fraud.repository';
import { FraudRuleEngine } from './fraud.rule-engine';
import { FraudListeners } from './fraud.listeners';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FraudController],
  providers: [
    FraudService,
    PrismaFraudRepository,
    FraudRuleEngine,
    FraudListeners,
  ],
  exports: [FraudService],
})
export class FraudModule {}
