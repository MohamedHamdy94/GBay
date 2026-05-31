import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AUTH_REPOSITORY, AuthService } from './auth.service';
import { InMemoryAuthRepository } from './in-memory-auth.repository';
import { PasswordService } from './password.service';
import { PrismaAuthRepository } from './prisma-auth.repository';
import { TokenService } from './token.service';
import { DatabaseModule } from '../database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    PrismaAuthRepository,
    {
      provide: AUTH_REPOSITORY,
      useFactory: (prismaRepository: PrismaAuthRepository) => {
        if (process.env.AUTH_REPOSITORY === 'memory' || !process.env.DATABASE_URL) {
          return new InMemoryAuthRepository();
        }
        return prismaRepository;
      },
      inject: [PrismaAuthRepository],
    },
  ],
  exports: [AuthService, TokenService, AUTH_REPOSITORY],
})
export class AuthModule {}
