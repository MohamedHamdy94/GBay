# Decisions And Tradeoffs

## Purpose
Records architectural decisions so future sessions understand why the system is shaped this way.

## Decisions

### Modular Monolith First
Decision: Build a NestJS modular monolith with strict module boundaries.
Reason: The domain has many coupled workflows. A monolith keeps transactional integrity and team velocity while boundaries remain service-ready.
Alternative: Start with microservices.
Tradeoff: Microservices improve independent scaling later but add network failure modes, distributed tracing, and deployment complexity too early.

### PostgreSQL As Source Of Truth
Decision: PostgreSQL plus Prisma owns transactional state.
Reason: Auctions, orders, payments, ledgers, inventory, and audit logs need relational constraints and transactions.
Alternative: Event sourcing for everything.
Tradeoff: Full event sourcing increases auditability but adds read-model and replay complexity before the team needs it.

### Redis For Coordination, Not Truth
Decision: Redis handles cache, rate limits, queues, and Socket.IO fanout. PostgreSQL decides money, inventory, and auction winners.
Reason: Redis can fail or evict; financial and inventory truth must be durable.

### Meilisearch First
Decision: Use Meilisearch for MVP discovery, keep Elasticsearch-compatible abstraction.
Reason: Faster operational start. Elasticsearch can replace it when query complexity requires it.

### Idempotency Everywhere For Money And Inventory
Decision: Any write that can double-charge, oversell, or duplicate state requires an idempotency key.
Reason: retries and webhooks are normal, not exceptional.

### Localized Routes
Decision: Use `/en` and `/de` route prefixes.
Reason: Clear SEO, predictable caching, easier hreflang, and explicit language sharing.
