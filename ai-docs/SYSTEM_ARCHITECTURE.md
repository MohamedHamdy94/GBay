# System Architecture

## Purpose
Defines the enterprise architecture for the GBay marketplace. Use this before implementing modules so code follows the same boundaries and consistency rules.

## Runtime Architecture

```text
Next.js 15 Web
  -> NestJS API Gateway/Modular Monolith
    -> Application services
      -> Domain aggregates and policies
      -> Prisma repositories
      -> Outbox publisher
    -> BullMQ workers
    -> Socket.IO gateways
  -> PostgreSQL primary/read replicas
  -> Redis cluster
  -> Meilisearch/Elasticsearch
  -> Stripe/PayPal/KYC/Shipping/R2
```

## Modular Monolith Boundaries
Each NestJS module has:
- `domain`: entities, value objects, state machines, domain events.
- `application`: commands, queries, handlers, ports.
- `infrastructure`: Prisma repositories, provider adapters, BullMQ processors.
- `interface`: REST controllers, WebSocket gateways, DTOs.

Modules communicate through application ports and events. Direct table access across module boundaries is not allowed except through read models.

## Consistency Classes

| Data | Consistency | Mechanism |
| --- | --- | --- |
| Ledger, wallet, payment, commission | Strong + auditable | DB transaction, idempotency key, immutable ledger entries |
| Inventory reservation | Strong | atomic update, row lock or segment lock, reservation expiry |
| Auction winning bid | Strong at write point | DB transaction, optimistic version, Redis lock only as throttle |
| Order lifecycle | Strong | state machine transition in transaction |
| Search, product browse, recommendations | Eventual | outbox to indexer, cache invalidation |
| Analytics | Eventual | event ingestion, materialized aggregates |

## Saga Pattern
Checkout is not one distributed transaction.

```text
Create checkout session
  -> reserve inventory locally
  -> create pending order locally
  -> authorize payment externally
  -> capture or escrow hold locally
  -> confirm order locally
  -> emit notifications/search updates

Compensation:
  payment failure -> release reservation -> cancel order
  order timeout -> void authorization -> release reservation
  shipment dispute -> freeze escrow -> open dispute
```

Daily reconciliation compares payment provider records, ledger entries, orders, reservations, and payouts.

## State Machines

### Auction
`DRAFT -> SCHEDULED -> LIVE -> ENDING -> ENDED -> SETTLED -> ARCHIVED`

Allowed transitions:
- `DRAFT -> SCHEDULED` after validation and moderation.
- `SCHEDULED -> LIVE` by scheduler.
- `LIVE -> ENDING` when anti-sniping window starts or close job fires.
- `ENDING -> LIVE` if anti-sniping extends the auction.
- `ENDING -> ENDED` when no extension applies.
- `ENDED -> SETTLED` after winner/order creation or reserve not met handling.
- `SETTLED -> ARCHIVED` after retention window.

Invalid examples: `LIVE -> DRAFT`, `ENDED -> LIVE` without explicit admin reversal event, `SETTLED -> CANCELLED`.

### Order
`PENDING_PAYMENT -> CONFIRMED -> AWAITING_SHIPMENT -> SHIPPED -> DELIVERED -> COMPLETED`
Terminal alternatives: `CANCELLED`, `REFUNDED`, `DISPUTED`.

### Payment
`INITIATED -> AUTHORIZED -> CAPTURED -> ESCROW_HELD -> RELEASED`
Failure alternatives: `FAILED`, `VOIDED`, `REFUNDED`, `PARTIALLY_REFUNDED`, `CHARGEBACK`.

### Refund
`REQUESTED -> REVIEWING -> APPROVED -> PROCESSING -> COMPLETED`
Alternatives: `REJECTED`, `FAILED`, `CANCELLED`.

### Seller Verification
`NOT_STARTED -> SUBMITTED -> IN_REVIEW -> APPROVED`
Alternatives: `NEEDS_MORE_INFO`, `REJECTED`, `SUSPENDED`.

### Dispute
`OPEN -> EVIDENCE_COLLECTION -> UNDER_REVIEW -> RESOLVED`
Alternatives: `ESCALATED`, `CLOSED`, `APPEALED`.

## Read/Write Separation
Writes use PostgreSQL primary. Browsing, dashboards, admin lists, search, and analytics use read replicas, Redis, materialized views, or search indexes. Public product pages tolerate stale counts; checkout revalidates price, stock, seller status, sanctions, and product status on primary.

## Failure Recovery
- Every command has an idempotency key.
- Every external callback has a provider event unique ID.
- Outbox records are retried until delivered.
- BullMQ jobs are idempotent and carry aggregate/version metadata.
- Reconciliation jobs detect stuck orders, stale reservations, missing ledger entries, and provider mismatches.

## Deployment
Frontend runs on Vercel. API workers and WebSocket nodes run on AWS ECS/Fargate, Railway, or equivalent. Redis is managed and clustered. PostgreSQL uses managed backups, PITR, read replicas, and connection pooling.
