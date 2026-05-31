export type Locale = 'en' | 'de';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  preferredLanguage: Locale;
  status: UserStatus;
  passwordHash?: string | null;
  roles?: string[];
}

export interface AuthSession {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name?: string;
  preferredLanguage: Locale;
}

export interface CreateSessionInput {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
}

export interface AuthRepository {
  findUserByEmail(email: string): Promise<AuthUser | null>;
  findUserById(id: string): Promise<AuthUser | null>;
  createUser(input: CreateUserInput): Promise<AuthUser>;
  createSession(input: CreateSessionInput): Promise<AuthSession>;
  findSessionByRefreshHash(refreshTokenHash: string): Promise<AuthSession | null>;
  revokeSession(sessionId: string): Promise<void>;
  touchLastLogin(userId: string): Promise<void>;
}
