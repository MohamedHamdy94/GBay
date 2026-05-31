import assert from 'node:assert/strict';
import { AuthService } from './auth.service';
import { LocaleDto } from './dto';
import { InMemoryAuthRepository } from './in-memory-auth.repository';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

const mockMetrics = {
  incrementUsers: () => {},
  incrementOrders: () => {},
  incrementBids: () => {},
  updateWebsocketConnections: () => {},
} as any;

async function run() {
  const service = new AuthService(
    new InMemoryAuthRepository(),
    new PasswordService(),
    new TokenService(),
    mockMetrics,
  );

  const registered = await service.register({
    email: 'buyer@example.com',
    password: 'CorrectHorse123',
    preferredLanguage: LocaleDto.de,
  });
  assert.equal(registered.user.email, 'buyer@example.com');
  assert.equal(registered.user.preferredLanguage, 'de');
  assert.ok(registered.accessToken);
  assert.ok(registered.refreshToken);

  const loggedIn = await service.login('buyer@example.com', 'CorrectHorse123');
  assert.ok(loggedIn.accessToken);

  const refreshed = await service.refresh(loggedIn.refreshToken);
  assert.ok(refreshed.accessToken);
  assert.notEqual(refreshed.refreshToken, loggedIn.refreshToken);

  console.log('auth service test passed');
}

void run();
