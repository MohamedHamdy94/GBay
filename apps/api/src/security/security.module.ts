import { Module, Global } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { PrismaSecurityRepository } from './prisma-security.repository';
import { SECURITY_REPOSITORY } from './security.types';
import { DatabaseModule } from '../database.module';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [
    DatabaseModule,
    AdminModule,
    AuthModule,
  ],
  controllers: [SecurityController],
  providers: [
    SecurityService,
    {
      provide: SECURITY_REPOSITORY,
      useClass: PrismaSecurityRepository,
    },
  ],
  exports: [SecurityService],
})
export class SecurityModule {}
