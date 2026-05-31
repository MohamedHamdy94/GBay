# GBay Project Master Context

## Purpose
This is the canonical entry point for AI and human contributors. It preserves the product scope, architecture rules, module order, and documentation map for a production multi-vendor marketplace with auctions and Buy It Now.

## Architecture Principles
1. Consistency is a dial: ledgers are strongly consistent and auditable, inventory is atomic with no overselling, browsing/search/recommendations are eventually consistent and cached.
2. Long-lived transactions use sagas: stock reservation, order creation, payment authorization, payout, and refund are local transactions linked by events and compensating actions.
3. Hot spots are split: auctions and flash inventory use segmented counters, queues, Redis coordination, and proxy-bid computation to avoid one overloaded row.
4. Spikes are shaped: rate limits, BullMQ, Redis, CDN, graceful degradation, and cache pre-warming protect the system before scaling servers.
5. Money and inventory writes are idempotent: every mutation carries an idempotency key and unique constraint.
6. Reads and writes are physically separated: cached read models and replicas serve discovery while primary PostgreSQL handles transactional writes.
7. Lifecycles are state machines: auction, order, payment, refund, seller verification, and dispute transitions are explicit and rejected when invalid.

## 1. High-Level System Architecture

```text
Browser / Mobile Web
  |
  | HTTPS, RSC, Server Actions, localized routes /en and /de
  v
Next.js 15 Frontend (Vercel)
  |-- next-intl middleware, SEO, image optimization, CDN assets
  |-- NextAuth.js v5 edge/session integration
  |
  | REST v1 / WebSocket / signed upload URLs
  v
NestJS Modular Monolith API (AWS/Railway)
  |
  | Modules: Identity, Seller, Catalog, Auction, Cart, Order, Payment,
  | Escrow, Shipping, Wallet, Commission, Disputes, Messaging,
  | Notifications, Search, Recommendations, Reviews, Admin, Fraud,
  | Analytics, Security, SEO, Observability
  |
  | Local transactions + outbox events + BullMQ jobs
  v
PostgreSQL Primary  ---- logical replication/read replicas ---- Read APIs
  |
  | Prisma ORM, row locks for critical writes, audit tables, outbox
  v
Redis Cluster
  |-- cache, rate limits, sessions, Socket.IO adapter, hot auction state
  |-- BullMQ queues and delayed jobs
  v
External Systems
  |-- Stripe, PayPal, KYC provider, tax/shipping providers
  |-- Cloudflare R2/S3, Meilisearch/Elasticsearch
  |-- Sentry, Prometheus, Grafana, OpenTelemetry
```

This starts as a modular monolith because the domain is coupled and the team needs fast iteration. Boundaries are microservice-ready: every module owns its aggregate roots, application services, DTOs, events, jobs, policies, and read models.

## 2. DDD Domain Breakdown

| Bounded Context | Aggregate Roots | Strong Consistency | Eventual Consistency |
| --- | --- | --- | --- |
| Identity & Access | User, Session, Role, Permission | login, token rotation, RBAC grants | profile cache |
| Seller | SellerProfile, VerificationCase | KYC state, payout eligibility | seller dashboard summaries |
| Catalog | Product, Listing, MediaAsset | listing ownership, status transitions | public product cards |
| Auction | Auction, Bid, ProxyBid | bid acceptance, winner, reserve logic | bid feed, counters |
| Cart & Checkout | Cart, CheckoutSession | price snapshot, stock reservation | cart badge |
| Order | Order, OrderItem | order state, buyer/seller obligations | order timelines |
| Payment & Wallet | Payment, LedgerEntry, WalletAccount | all money writes | seller balance read model |
| Fulfillment | Shipment, ShippingLabel | label purchase, tracking attach | tracking webhooks |
| Trust & Safety | Dispute, FraudSignal, ModerationCase | enforcement actions | risk dashboards |
| Engagement | MessageThread, Notification, Review | message writes, review eligibility | notification counts |
| Discovery | SearchIndexDocument, Recommendation | none | search/recommendation indexes |
| Admin | AdminAction, FeatureFlag, AuditLog | privileged actions | analytics panels |

## 3. Complete Prisma Schema
The complete schema is maintained in [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md). It includes enums, constraints, indexes, optimistic locking fields, audit fields, soft deletes, localization tables, RBAC, auctions, bids, ledgers, payments, disputes, messages, notifications, analytics, and observability support.

## 4. Monorepo Folder Structure

```text
gbay/
  apps/
    web/                         # Next.js 15 App Router
      app/[locale]/              # /en and /de route tree
      app/[locale]/(buyer)/
      app/[locale]/seller/
      app/[locale]/admin/
      components/
      messages/en.json
      messages/de.json
      middleware.ts
    api/                         # NestJS modular monolith
      src/
        main.ts
        common/
        modules/
          identity/
          seller/
          catalog/
          auction/
          cart/
          order/
          payment/
          escrow/
          shipping/
          wallet/
          commission/
          dispute/
          messaging/
          notification/
          search/
          recommendation/
          review/
          admin/
          fraud/
          analytics/
          security/
          seo/
          observability/
  packages/
    database/                    # Prisma schema, migrations, seed
    contracts/                   # shared DTOs, zod schemas, event names
    i18n/                        # shared message keys and locale helpers
    ui/                          # shadcn/ui wrappers and design tokens
    config/                      # eslint, tsconfig, tailwind
  infra/
    docker/
    github-actions/
    terraform/
  ai-docs/
```

## 5. Internationalization Strategy
Use `next-intl` from day one with localized routes `/en/...` and `/de/...`. Middleware resolves locale in this order: route segment, authenticated `User.preferredLanguage`, `NEXT_LOCALE` cookie, `Accept-Language`, fallback `en`. Persist language changes to DB for authenticated users and to cookie for anonymous users. Product content uses translation tables with locale, fallback locale, and publish completeness checks. Emails, notifications, validation messages, admin copy, seller dashboard copy, auction events, and SEO metadata use shared message keys.

SEO uses canonical and hreflang tags per localized product page. Slugs are localized where available, with stable IDs to prevent broken links: `/en/item/{slug}-{id}` and `/de/artikel/{slug}-{id}`.

## 6. Admin Panel Architecture
The admin panel is a first-class product surface at `/[locale]/admin`. It uses granular RBAC, server-rendered list pages backed by paginated APIs, audit logging on every privileged write, and real-time risk queues for auctions, KYC, disputes, refunds, and payment failures. Full details are in [ADMIN_PANEL_SPEC.md](ADMIN_PANEL_SPEC.md).

## Core Module Design Summary

| # | Module | Boundary | Key Decisions |
| --- | --- | --- | --- |
| 1 | User System | Identity | NextAuth v5, RBAC, refresh rotation, device/IP sessions |
| 2 | Seller Onboarding | Seller | state machine, KYC provider abstraction, payout hold |
| 3 | Seller Dashboard | Seller read models | cached metrics, read replicas, no direct ledger math in UI |
| 4 | Product Listing | Catalog | product/listing split, localized content, moderated media |
| 5 | Auction | Auction | proxy bidding, row lock on auction close, Redis fanout |
| 6 | Buy It Now | Commerce | atomic reservation, price snapshots, idempotent checkout |
| 7 | Cart & Checkout | Cart/Order | saga, compensating reservation release |
| 8 | Order Management | Order | strict state machine, seller/buyer timelines |
| 9 | Escrow | Payment | ledger-backed holds, release rules, dispute freeze |
| 10 | Shipping | Fulfillment | provider adapters, tracking webhooks, label audit |
| 11 | Wallet | Wallet | double-entry ledger, no mutable balance truth |
| 12 | Payments | Payment | Stripe/PayPal adapters, webhook idempotency |
| 13 | Commission | Commission | versioned fee plans, ledger postings |
| 14 | Refunds & Disputes | Trust | state machines, evidence, partial refunds |
| 15 | Messaging | Engagement | thread ACL, abuse scanning, attachment limits |
| 16 | Notifications | Engagement | outbox, preferences, localized templates |
| 17 | Search & Discovery | Discovery | Meilisearch first, event-fed index, cache |
| 18 | AI Recommendations | Discovery | async features, privacy controls, fallbacks |
| 19 | Reviews & Ratings | Trust | purchase-gated, moderation, aggregate cache |
| 20 | Admin Panel | Admin | high priority, RBAC, audit, moderation queues |
| 21 | Fraud Detection | Trust | rules + risk scoring + manual review |
| 22 | Analytics | Analytics | event ingestion, materialized views |
| 23 | Security Layer | Security | defense-in-depth, rate limits, secure uploads |
| 24 | SEO | SEO | localized metadata, sitemaps, canonical IDs |
| 25 | Monitoring | Observability | logs, traces, metrics, health checks |

## Documentation Map
- [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md): system design, module boundaries, state machines, scaling model.
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md): complete Prisma schema and indexing strategy.
- [AUCTION_ENGINE_SPEC.md](AUCTION_ENGINE_SPEC.md): auction rules, concurrency, WebSocket, recovery.
- [ADMIN_PANEL_SPEC.md](ADMIN_PANEL_SPEC.md): enterprise admin IA, permissions, APIs, performance.
- [AUTH_AND_RBAC.md](AUTH_AND_RBAC.md): auth, session security, roles, permissions.
- [API_STANDARDS.md](API_STANDARDS.md): REST, DTOs, WebSocket events, errors, idempotency.
- [UI_UX_GUIDELINES.md](UI_UX_GUIDELINES.md): bilingual UX, Next.js routes, shadcn/ui patterns.
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md): module checklist and test log.
- [DECISIONS_AND_TRADEOFFS.md](DECISIONS_AND_TRADEOFFS.md): architectural decisions and alternatives.
- [CHANGELOG_AI.md](CHANGELOG_AI.md): append-only AI progress log.
- [AI_MEMORY.md](AI_MEMORY.md): resume instructions and active constraints.
