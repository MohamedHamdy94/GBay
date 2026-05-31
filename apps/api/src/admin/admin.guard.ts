import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: { id: string; email: string | null; roles?: string[] } }>();
    
    const user = request.user;
    if (!user) {
      throw new ForbiddenException({ code: 'ADMIN_REQUIRED', message: 'Authentication required' });
    }

    if (!user.roles?.includes('ADMIN')) {
      throw new ForbiddenException({ code: 'ADMIN_FORBIDDEN', message: 'Admin role required' });
    }

    return true;
  }
}
