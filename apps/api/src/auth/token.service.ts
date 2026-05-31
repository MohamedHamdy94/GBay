import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

interface JwtPayload {
  sub: string;
  email: string | null;
  roles?: string[];
  typ: 'access';
  exp: number;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

@Injectable()
export class TokenService {
  private readonly accessSecret = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me';

  signAccessToken(input: { userId: string; email: string | null; roles?: string[] }): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload: JwtPayload = {
      sub: input.userId,
      email: input.email,
      roles: input.roles,
      typ: 'access',
      exp: Math.floor(Date.now() / 1000) + 15 * 60,
    };
    const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
    const signature = createHmac('sha256', this.accessSecret).update(unsigned).digest('base64url');
    return `${unsigned}.${signature}`;
  }

  verifyAccessToken(token: string): JwtPayload {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) throw new UnauthorizedException('Invalid token');
    const expected = createHmac('sha256', this.accessSecret).update(`${header}.${payload}`).digest('base64url');
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      throw new UnauthorizedException('Invalid token signature');
    }
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as JwtPayload;
    if (parsed.exp < Math.floor(Date.now() / 1000)) throw new UnauthorizedException('Token expired');
    return parsed;
  }

  createRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  hashRefreshToken(refreshToken: string): string {
    return createHmac('sha256', process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me')
      .update(refreshToken)
      .digest('hex');
  }
}
