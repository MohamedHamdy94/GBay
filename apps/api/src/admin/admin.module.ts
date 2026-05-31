import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ADMIN_REPOSITORY, AdminService } from './admin.service';
import { PrismaAdminRepository } from './prisma-admin.repository';
import { AdminAuditService } from './admin-audit.service';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database.module';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminAuditService,
    PrismaAdminRepository,
    {
      provide: ADMIN_REPOSITORY,
      useClass: PrismaAdminRepository,
    },
  ],
  exports: [AdminService, AdminAuditService],
})
export class AdminModule {}
