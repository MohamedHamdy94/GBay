import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@gbay/database';
import { AuthRepository, AuthSession, AuthUser, CreateSessionInput, CreateUserInput } from './auth.types';

@Injectable()
export class PrismaAuthRepository implements AuthRepository {
  private readonly prisma = new PrismaClient();

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { roles: { include: { role: true } } },
    });
    if (!user) return null;
    return {
      ...user,
      roles: user.roles.map((ur) => ur.role.key),
    } as unknown as AuthUser;
  }

  async findUserById(id: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    if (!user) return null;
    return {
      ...user,
      roles: user.roles.map((ur) => ur.role.key),
    } as unknown as AuthUser;
  }

  async createUser(input: CreateUserInput): Promise<AuthUser> {
    return this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        name: input.name,
        preferredLanguage: input.preferredLanguage,
      },
    }) as Promise<AuthUser>;
  }

  async createSession(input: CreateSessionInput): Promise<AuthSession> {
    return this.prisma.userSession.create({ data: input }) as Promise<AuthSession>;
  }

  async findSessionByRefreshHash(refreshTokenHash: string): Promise<AuthSession | null> {
    return this.prisma.userSession.findUnique({ where: { refreshTokenHash } }) as Promise<AuthSession | null>;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.userSession.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  }

  async touchLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  }
}
