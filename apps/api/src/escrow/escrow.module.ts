import { Module, Global } from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { EscrowController } from './escrow.controller';
import { ESCROW_REPOSITORY } from './escrow.types';
import { PrismaEscrowRepository } from './prisma-escrow.repository';
import { DatabaseModule } from '../database.module';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [EscrowController],
  providers: [
    EscrowService,
    {
      provide: ESCROW_REPOSITORY,
      useClass: PrismaEscrowRepository,
    },
  ],
  exports: [EscrowService],
})
export class EscrowModule {}
