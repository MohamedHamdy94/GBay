import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_REPOSITORY } from './admin.constants';
import { AdminRepository } from './admin.types';

@Injectable()
export class AdminAuditService {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly repository: AdminRepository,
  ) {}

  async log(adminId: string, action: string, targetType: string, targetId: string, details: any, reason?: string) {
    return this.repository.createAuditLog({
      adminId,
      action,
      targetType,
      targetId,
      details,
      reason,
    });
  }
}
