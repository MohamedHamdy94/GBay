# Auth And RBAC

## Purpose
Defines authentication, authorization, session management, and account security.

## Authentication
- NextAuth.js v5 supports email/password, phone OTP, Google OAuth, JWT access tokens, and refresh token rotation.
- Passwords use Argon2id with modern parameters.
- OTPs are short-lived, rate-limited, hashed at rest, and tied to purpose.
- Refresh tokens are stored hashed in `UserSession`; reuse detection revokes the token family.

## Authorization
Use role-based access control with permission checks at API and UI boundaries. Roles are convenience bundles; permissions are the source of truth.

Baseline roles:
- Buyer
- Seller
- Seller Support
- Trust And Safety
- Finance Admin
- Super Admin

## Session Security
- HTTP-only, secure, same-site cookies.
- CSRF protection for browser-originating mutations.
- Device fingerprint and IP risk signals.
- Session revocation on password change, suspicious login, or refresh reuse.

## Attack Vectors And Mitigations
| Vector | Mitigation |
| --- | --- |
| Credential stuffing | rate limits, breached password checks, MFA for admins |
| Token theft | refresh rotation, hashed tokens, short access token TTL |
| CSRF | same-site cookies, CSRF token, origin checks |
| XSS | React escaping, CSP, sanitized rich text, no unsafe HTML |
| Privilege escalation | permission middleware, audit logs, deny-by-default |
| Session fixation | rotate session on login and privilege changes |
