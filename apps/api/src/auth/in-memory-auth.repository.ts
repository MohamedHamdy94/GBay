import { randomUUID } from 'node:crypto';
import { AuthRepository, AuthSession, AuthUser, CreateSessionInput, CreateUserInput } from './auth.types';

export class InMemoryAuthRepository implements AuthRepository {
  private readonly users = new Map<string, AuthUser>();
  private readonly sessions = new Map<string, AuthSession>();

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const normalized = email.toLowerCase();
    return [...this.users.values()].find((user) => user.email === normalized) ?? null;
  }

  async findUserById(id: string): Promise<AuthUser | null> {
    return this.users.get(id) ?? null;
  }

  async createUser(input: CreateUserInput): Promise<AuthUser> {
    const existing = await this.findUserByEmail(input.email);
    if (existing) throw new Error('EMAIL_TAKEN');
    const user: AuthUser = {
      id: randomUUID(),
      email: input.email.toLowerCase(),
      name: input.name ?? null,
      preferredLanguage: input.preferredLanguage,
      status: 'ACTIVE',
      passwordHash: input.passwordHash,
    };
    this.users.set(user.id, user);
    return user;
  }

  async createSession(input: CreateSessionInput): Promise<AuthSession> {
    const session: AuthSession = {
      id: randomUUID(),
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async findSessionByRefreshHash(refreshTokenHash: string): Promise<AuthSession | null> {
    return [...this.sessions.values()].find((session) => session.refreshTokenHash === refreshTokenHash) ?? null;
  }

  async revokeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) this.sessions.set(sessionId, { ...session, revokedAt: new Date() });
  }

  async touchLastLogin(_userId: string): Promise<void> {}
}
