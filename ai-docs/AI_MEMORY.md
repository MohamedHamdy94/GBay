# AI Memory

## Purpose
Short resume guide for future AI sessions. Read this first, then `PROJECT_MASTER_CONTEXT.md`, then `IMPLEMENTATION_STATUS.md`, then `CHANGELOG_AI.md`.

## Current Project State
Backend MVP is 100% complete and verified. Frontend core pages and a full Admin Panel (Auctions, Refunds, Disputes, Audit, Analytics, Health, Flags) are functional with live data.

## Mandatory Working Rules
1. Work one module at a time.
2. After each module, run a small verification: test, type check, build, curl, or file existence check depending on what was changed.
3. Update `CHANGELOG_AI.md` immediately after verification.
4. Keep all docs in `/ai-docs` current when architecture changes.

## Next Recommended Module
Deployment Preparation: CORS configuration, production env variables, and deployment scripts for Vercel/Railway.

## Milestones
- Module 25 (Monitoring & Observability) is fully complete. Project backend MVP is finished.
- Frontend Build stabilized and backend integration fixed (2026-05-31).


## Non-Negotiable Architecture Rules
- No distributed transaction across checkout/payment/inventory.
- No direct balance mutation outside immutable ledger entries.
- No auction winner decision from Redis alone.
- No unlocalized user-visible strings.
- No privileged admin write without permission check and audit log.
