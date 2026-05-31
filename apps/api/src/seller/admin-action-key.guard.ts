import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminActionKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    const expected = process.env.ADMIN_ACTION_KEY ?? 'dev-admin-action-key';
    if (request.headers['x-admin-action-key'] !== expected) {
      throw new UnauthorizedException({ code: 'ADMIN_ACTION_KEY_REQUIRED' });
    }
    return true;
  }
}
