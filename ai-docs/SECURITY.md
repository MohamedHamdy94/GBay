# Security Architecture & Mitigations

## Overview
GBay implements a multi-layered security strategy to protect user data, financial transactions, and system integrity.

## Layers of Defense

### 1. Network & Transport Layer
- **Secure Headers**: `helmet` is integrated to set secure HTTP headers:
  - `Content-Security-Policy`: Prevents XSS by restricting source of executable scripts.
  - `X-Content-Type-Options`: Prevents MIME type sniffing.
  - `Strict-Transport-Security`: Enforces HTTPS.
  - `X-Frame-Options`: Prevents clickjacking.
- **Rate Limiting**: `@nestjs/throttler` is applied globally and specifically:
  - **General**: 100 requests per minute per IP.
  - **Auth**: 5 requests per minute per IP (Register/Login/Refresh).
  - **Admin**: 30 requests per minute per IP.

### 2. Application Layer
- **Input Sanitization**: Global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` ensures only expected properties reach controllers, preventing mass assignment and some injection vectors.
- **Authentication**: JWT-based authentication with Access and Refresh tokens. Short-lived access tokens (15m) and secure refresh token rotation.
- **Authorization (RBAC)**: Fine-grained access control using `AdminGuard` and role-based permissions stored in PostgreSQL.
- **CSRF Protection**: Tokens enforced for state-changing operations in the frontend/backend bridge.

### 3. Data Layer
- **Prisma ORM**: Parameterized queries are used by default, protecting against SQL injection.
- **Data Encryption**: Passwords hashed using Argon2/BCrypt before storage.
- **Audit Logging**: Mandatory auditing for all administrative actions and security incidents.

## Security Incident Response
Potential attacks are monitored and logged in the `SecurityIncident` table:
- **RATE_LIMIT**: Triggered when a client exceeds allowed request frequency.
- **AUTH_FAILURE**: Excessive failed login attempts.
- **UNAUTHORIZED_ACCESS**: Attempts to access protected admin routes without valid credentials.

## Attack Vectors & Mitigations

| Attack Vector | Mitigation Strategy |
| --- | --- |
| **SQL Injection** | Use of Prisma ORM (parameterized queries) + strict validation. |
| **Cross-Site Scripting (XSS)** | `helmet` CSP headers + automatic output encoding in Next.js. |
| **Cross-Site Request Forgery (CSRF)** | SameSite cookie attributes + CSRF tokens. |
| **Brute Force** | Strict rate limiting on `/auth/*` endpoints. |
| **Clickjacking** | `X-Frame-Options: DENY` via `helmet`. |
| **Mass Assignment** | `ValidationPipe` with `whitelist: true`. |

## Compliance & Standards
- **OWASP Top 10**: Architecture aligned with OWASP best practices.
- **Audit Trail**: Every administrative change is logged with `adminId`, `timestamp`, and `details`.
