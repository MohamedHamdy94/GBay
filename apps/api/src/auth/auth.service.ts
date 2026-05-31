import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto';
import { AuthRepository, AuthUser } from './auth.types';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { MetricsService } from '../observability/metrics/metrics.service';

export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repository: AuthRepository,
    @Inject(PasswordService) private readonly passwordService: PasswordService,
    @Inject(TokenService) private readonly tokenService: TokenService,
    @Inject(MetricsService) private readonly metricsService: MetricsService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.repository.findUserByEmail(dto.email);
    if (existing) throw new ConflictException({ code: 'AUTH_EMAIL_ALREADY_REGISTERED' });

    const passwordHash = await this.passwordService.hash(dto.password);
    const user = await this.repository.createUser({
      email: dto.email,
      passwordHash,
      name: dto.name,
      preferredLanguage: dto.preferredLanguage ?? 'en',
    });
    
    this.metricsService.incrementUsers();
    
    return this.issueTokens(user);
  }

  async login(email: string, password: string) {
    const user = await this.repository.findUserByEmail(email);
    if (!user?.passwordHash || user.status !== 'ACTIVE') {
      throw new UnauthorizedException({ code: 'AUTH_INVALID_CREDENTIALS' });
    }
    const ok = await this.passwordService.verify(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException({ code: 'AUTH_INVALID_CREDENTIALS' });
    await this.repository.touchLastLogin(user.id);
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const refreshTokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const session = await this.repository.findSessionByRefreshHash(refreshTokenHash);
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException({ code: 'AUTH_INVALID_REFRESH_TOKEN' });
    }
    const user = await this.repository.findUserById(session.userId);
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException({ code: 'AUTH_INVALID_REFRESH_TOKEN' });

    await this.repository.revokeSession(session.id);
    return this.issueTokens(user);
  }

  private async issueTokens(user: AuthUser) {
    const refreshToken = this.tokenService.createRefreshToken();
    await this.repository.createSession({
      userId: user.id,
      refreshTokenHash: this.tokenService.hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    return {
      user: this.serializeUser(user),
      accessToken: this.tokenService.signAccessToken({
        userId: user.id,
        email: user.email,
        roles: user.roles,
      }),
      refreshToken,
      tokenType: 'Bearer',
      expiresInSeconds: 900,
    };
  }

  private serializeUser(user: AuthUser) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      preferredLanguage: user.preferredLanguage,
      status: user.status,
    };
  }
}
