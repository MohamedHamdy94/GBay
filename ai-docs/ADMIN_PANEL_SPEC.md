# Admin Panel Spec

## Purpose
Defines the enterprise admin surface, information architecture, permissions, APIs, audit model, and performance expectations.

## Routes
```text
/{locale}/admin
/{locale}/admin/users
/{locale}/admin/sellers
/{locale}/admin/kyc
/{locale}/admin/products
/{locale}/admin/auctions
/{locale}/admin/orders
/{locale}/admin/payments
/{locale}/admin/refunds
/{locale}/admin/disputes
/{locale}/admin/fraud
/{locale}/admin/messages
/{locale}/admin/notifications
/{locale}/admin/commissions
/{locale}/admin/analytics
/{locale}/admin/audit-logs
/{locale}/admin/feature-flags
/{locale}/admin/settings
```

## Sidebar
- Overview
- Users
- Sellers & KYC
- Products & Listings
- Auctions
- Orders
- Payments & Escrow
- Refunds & Disputes
- Fraud Monitoring
- Messaging Reports
- Notifications
- Commissions & Payouts
- Analytics
- Audit Logs
- Feature Flags
- System Health

## Permissions
- `admin.dashboard.read`
- `admin.users.read`, `admin.users.suspend`
- `admin.sellers.review`, `admin.sellers.suspend`
- `admin.products.moderate`
- `admin.auctions.moderate`, `admin.auctions.cancel`
- `admin.orders.read`, `admin.orders.override`
- `admin.payments.read`, `admin.payments.reconcile`
- `admin.refunds.approve`
- `admin.disputes.resolve`
- `admin.fraud.review`
- `admin.audit.read`
- `admin.feature_flags.write`

## Data Access
Admin list pages use read replicas and cursor pagination. Privileged writes go to primary, require permissions, require reason text, and create `AuditLog` entries with before/after JSON.

## APIs
- `GET /v1/admin/dashboard`
- `GET /v1/admin/users?cursor=&status=&q=`
- `PATCH /v1/admin/users/{id}/suspend`
- `GET /v1/admin/sellers/verification-queue`
- `POST /v1/admin/sellers/{id}/verification/approve`
- `POST /v1/admin/sellers/{id}/verification/reject`
- `GET /v1/admin/products/moderation-queue`
- `POST /v1/admin/products/{id}/approve`
- `POST /v1/admin/auctions/{id}/cancel`
- `GET /v1/admin/fraud/signals`
- `POST /v1/admin/disputes/{id}/resolve`
- `GET /v1/admin/audit-logs`
- `PATCH /v1/admin/feature-flags/{key}`

## Performance
- Dashboard cards are materialized views refreshed every 1 to 5 minutes.
- Risk queues use indexed state columns and page by `(createdAt, id)`.
- Audit logs are append-only and partitioned monthly.
- Admin search uses Meilisearch/Elasticsearch for broad queries, then primary DB for final mutation validation.

## UX Rules
Admin pages are dense, table-first, and operational. Avoid marketing layout. Every destructive action opens a confirmation dialog requiring a reason. All timestamps show timezone and absolute date. All pages support English and German.
