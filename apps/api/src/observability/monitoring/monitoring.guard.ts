import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class MonitoringGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // 1. Check for Admin Secret Key
    const adminActionKey = request.headers['x-admin-action-key'];
    if (adminActionKey && adminActionKey === process.env.ADMIN_ACTION_KEY) {
      return true;
    }

    // 2. Check for Admin User Role
    const user = request.user;
    if (user && user.roles?.includes('ADMIN')) {
      return true;
    }

    throw new ForbiddenException({ 
      code: 'ADMIN_REQUIRED', 
      message: 'Authentication required. Provide a valid admin token or x-admin-action-key header.' 
    });
  }
}
