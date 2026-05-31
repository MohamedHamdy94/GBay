import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../auth/token.service';

@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(@Inject(TokenService) private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string>; user?: { id: string; email: string | null; roles?: string[] } }>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException({ code: 'AUTH_REQUIRED' });
    const payload = this.tokenService.verifyAccessToken(authorization.slice('Bearer '.length));
    request.user = { id: payload.sub, email: payload.email, roles: payload.roles };
    return true;
  }
}
