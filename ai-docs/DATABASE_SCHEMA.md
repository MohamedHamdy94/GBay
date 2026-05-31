# Database Schema

## Purpose
Defines the Prisma schema baseline, indexing rules, scaling strategy, and constraints for the marketplace.

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Locale { en de }
enum Currency { EUR USD }
enum UserStatus { ACTIVE SUSPENDED DELETED }
enum SellerStatus { NOT_STARTED SUBMITTED IN_REVIEW NEEDS_MORE_INFO APPROVED REJECTED SUSPENDED }
enum ListingType { BUY_NOW AUCTION HYBRID }
enum ListingStatus { DRAFT PENDING_REVIEW ACTIVE PAUSED SOLD ENDED REJECTED DELETED }
enum AuctionStatus { DRAFT SCHEDULED LIVE ENDING ENDED SETTLED CANCELLED ARCHIVED }
enum BidStatus { ACCEPTED OUTBID WINNING REJECTED RETRACTED }
enum OrderStatus { PENDING_PAYMENT CONFIRMED AWAITING_SHIPMENT SHIPPED DELIVERED COMPLETED CANCELLED DISPUTED REFUNDED }
enum PaymentStatus { INITIATED AUTHORIZED CAPTURED ESCROW_HELD RELEASED FAILED VOIDED REFUNDED PARTIALLY_REFUNDED CHARGEBACK }
enum RefundStatus { REQUESTED REVIEWING APPROVED REJECTED PROCESSING COMPLETED FAILED CANCELLED }
enum DisputeStatus { OPEN EVIDENCE_COLLECTION UNDER_REVIEW ESCALATED RESOLVED CLOSED APPEALED }
enum InventoryReservationStatus { ACTIVE CONSUMED RELEASED EXPIRED }
enum LedgerEntryType { DEBIT CREDIT }
enum NotificationChannel { EMAIL SMS PUSH IN_APP }
enum ModerationStatus { PENDING APPROVED REJECTED ESCALATED }

model User {
  id                String      @id @default(cuid())
  email             String?     @unique
  phone             String?     @unique
  passwordHash      String?
  name              String?
  preferredLanguage Locale      @default(en)
  status            UserStatus  @default(ACTIVE)
  emailVerifiedAt   DateTime?
  phoneVerifiedAt   DateTime?
  lastLoginAt       DateTime?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  deletedAt         DateTime?
  version           Int         @default(0)
  sellerProfile     SellerProfile?
  sessions          UserSession[]
  roles             UserRole[]
  products          Product[]
  bids              Bid[]
  orders            Order[]     @relation("BuyerOrders")
  auditLogs         AuditLog[]

  @@index([status, createdAt])
  @@index([preferredLanguage])
}

model UserSession {
  id                 String   @id @default(cuid())
  userId             String
  refreshTokenHash   String   @unique
  deviceFingerprint  String?
  ipAddress          String?
  userAgent          String?
  expiresAt          DateTime
  revokedAt          DateTime?
  createdAt          DateTime @default(now())
  user               User     @relation(fields: [userId], references: [id])

  @@index([userId, expiresAt])
}

model Role {
  id          String @id @default(cuid())
  key         String @unique
  name        String
  description String?
  users       UserRole[]
  permissions RolePermission[]
}

model Permission {
  id          String @id @default(cuid())
  key         String @unique
  description String?
  roles       RolePermission[]
}

model UserRole {
  userId String
  roleId String
  user   User @relation(fields: [userId], references: [id])
  role   Role @relation(fields: [roleId], references: [id])
  @@id([userId, roleId])
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])
  @@id([roleId, permissionId])
}

model SellerProfile {
  id                String       @id @default(cuid())
  userId            String       @unique
  displayName       String
  status            SellerStatus @default(NOT_STARTED)
  countryCode       String       @default("DE")
  payoutCurrency    Currency     @default(EUR)
  stripeAccountId   String?
  paypalMerchantId  String?
  approvedAt        DateTime?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  version           Int          @default(0)
  user              User         @relation(fields: [userId], references: [id])
  products          Product[]
  listings          Listing[]

  @@index([status, createdAt])
  @@index([countryCode])
}

model Product {
  id             String      @id @default(cuid())
  sellerId       String
  sku            String?
  status         ListingStatus @default(DRAFT)
  categoryId     String?
  brand          String?
  condition      String
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  deletedAt      DateTime?
  version        Int         @default(0)
  seller         SellerProfile @relation(fields: [sellerId], references: [id])
  owner          User?       @relation(fields: [sellerUserId], references: [id])
  sellerUserId   String?
  translations   ProductTranslation[]
  media          MediaAsset[]
  listings       Listing[]

  @@index([sellerId, status])
  @@index([categoryId, status])
}

model ProductTranslation {
  id          String @id @default(cuid())
  productId   String
  locale      Locale
  title       String
  slug        String
  description String
  product     Product @relation(fields: [productId], references: [id])
  @@unique([productId, locale])
  @@unique([locale, slug])
}

model MediaAsset {
  id          String   @id @default(cuid())
  productId   String
  bucketKey   String   @unique
  contentType String
  sizeBytes   Int
  sortOrder   Int      @default(0)
  moderationStatus ModerationStatus @default(PENDING)
  createdAt   DateTime @default(now())
  product     Product  @relation(fields: [productId], references: [id])
  @@index([productId, sortOrder])
}

model Listing {
  id             String        @id @default(cuid())
  productId       String
  sellerId        String
  type            ListingType
  status          ListingStatus @default(DRAFT)
  currency        Currency
  buyNowPriceCents Int?
  quantityTotal   Int          @default(1)
  quantityAvailable Int        @default(1)
  startsAt        DateTime?
  endsAt          DateTime?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  deletedAt       DateTime?
  version         Int          @default(0)
  product         Product      @relation(fields: [productId], references: [id])
  seller          SellerProfile @relation(fields: [sellerId], references: [id])
  auction         Auction?
  reservations    InventoryReservation[]
  orderItems      OrderItem[]

  @@index([status, type, endsAt])
  @@index([sellerId, status])
  @@index([productId])
}

model InventorySegment {
  id                String @id @default(cuid())
  listingId          String
  segmentNo          Int
  availableQuantity  Int
  version            Int @default(0)
  @@unique([listingId, segmentNo])
  @@index([listingId, availableQuantity])
}

model InventoryReservation {
  id          String @id @default(cuid())
  listingId   String
  userId      String
  quantity    Int
  status      InventoryReservationStatus @default(ACTIVE)
  idempotencyKey String
  expiresAt   DateTime
  consumedAt  DateTime?
  releasedAt  DateTime?
  createdAt   DateTime @default(now())
  listing     Listing @relation(fields: [listingId], references: [id])
  @@unique([listingId, idempotencyKey])
  @@index([status, expiresAt])
  @@index([userId, status])
}

model Auction {
  id                  String @id @default(cuid())
  listingId            String @unique
  status               AuctionStatus @default(DRAFT)
  startPriceCents      Int
  reservePriceCents    Int?
  currentPriceCents    Int?
  bidIncrementCents    Int
  antiSnipeSeconds     Int @default(120)
  startsAt             DateTime
  endsAt               DateTime
  winnerUserId         String?
  highestBidId         String?
  closeJobId           String?
  version              Int @default(0)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  listing              Listing @relation(fields: [listingId], references: [id])
  bids                 Bid[]
  proxyBids            ProxyBid[]

  @@index([status, endsAt])
  @@index([winnerUserId])
}

model ProxyBid {
  id              String @id @default(cuid())
  auctionId        String
  bidderUserId     String
  maxAmountCents   Int
  idempotencyKey   String
  createdAt        DateTime @default(now())
  auction          Auction @relation(fields: [auctionId], references: [id])
  @@unique([auctionId, bidderUserId, idempotencyKey])
  @@index([auctionId, maxAmountCents])
}

model Bid {
  id             String @id @default(cuid())
  auctionId       String
  bidderUserId    String
  amountCents     Int
  status          BidStatus
  idempotencyKey  String
  ipAddress       String?
  createdAt       DateTime @default(now())
  auction         Auction @relation(fields: [auctionId], references: [id])
  bidder          User @relation(fields: [bidderUserId], references: [id])
  @@unique([auctionId, bidderUserId, idempotencyKey])
  @@index([auctionId, amountCents])
  @@index([bidderUserId, createdAt])
}

model Cart {
  id        String @id @default(cuid())
  userId    String?
  anonymousId String?
  currency  Currency @default(EUR)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  items     CartItem[]
  @@index([userId])
  @@index([anonymousId])
}

model CartItem {
  id        String @id @default(cuid())
  cartId    String
  listingId String
  quantity  Int
  priceSnapshotCents Int
  createdAt DateTime @default(now())
  cart      Cart @relation(fields: [cartId], references: [id])
  @@unique([cartId, listingId])
}

model Order {
  id              String @id @default(cuid())
  buyerUserId      String
  status           OrderStatus @default(PENDING_PAYMENT)
  currency         Currency
  subtotalCents    Int
  shippingCents    Int @default(0)
  taxCents         Int @default(0)
  totalCents       Int
  idempotencyKey   String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  version          Int @default(0)
  buyer            User @relation("BuyerOrders", fields: [buyerUserId], references: [id])
  items            OrderItem[]
  payments         Payment[]
  shipments        Shipment[]
  disputes         Dispute[]
  @@unique([buyerUserId, idempotencyKey])
  @@index([buyerUserId, createdAt])
  @@index([status, createdAt])
}

model OrderItem {
  id             String @id @default(cuid())
  orderId         String
  listingId       String
  sellerId        String
  quantity        Int
  unitPriceCents  Int
  totalCents      Int
  order           Order @relation(fields: [orderId], references: [id])
  listing         Listing @relation(fields: [listingId], references: [id])
  @@index([sellerId])
  @@index([listingId])
}

model Payment {
  id              String @id @default(cuid())
  orderId          String
  provider         String
  providerPaymentId String?
  status          PaymentStatus @default(INITIATED)
  amountCents     Int
  currency        Currency
  idempotencyKey  String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  order           Order @relation(fields: [orderId], references: [id])
  ledgerEntries   LedgerEntry[]
  @@unique([provider, providerPaymentId])
  @@unique([orderId, idempotencyKey])
  @@index([status, createdAt])
}

model WalletAccount {
  id        String @id @default(cuid())
  ownerUserId String?
  sellerId String?
  currency Currency
  createdAt DateTime @default(now())
  entries LedgerEntry[]
  @@unique([ownerUserId, currency])
  @@unique([sellerId, currency])
}

model LedgerEntry {
  id              String @id @default(cuid())
  walletAccountId  String
  paymentId        String?
  type             LedgerEntryType
  amountCents      Int
  currency         Currency
  referenceType    String
  referenceId      String
  idempotencyKey   String
  createdAt        DateTime @default(now())
  walletAccount    WalletAccount @relation(fields: [walletAccountId], references: [id])
  payment          Payment? @relation(fields: [paymentId], references: [id])
  @@unique([walletAccountId, idempotencyKey])
  @@index([referenceType, referenceId])
  @@index([createdAt])
}

model Shipment {
  id            String @id @default(cuid())
  orderId        String
  carrier        String?
  trackingNumber String?
  labelUrl       String?
  status         String
  shippedAt      DateTime?
  deliveredAt    DateTime?
  createdAt      DateTime @default(now())
  order          Order @relation(fields: [orderId], references: [id])
  @@index([orderId])
  @@index([trackingNumber])
}

model Dispute {
  id          String @id @default(cuid())
  orderId     String
  openedByUserId String
  status      DisputeStatus @default(OPEN)
  reason      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  order       Order @relation(fields: [orderId], references: [id])
  @@index([status, createdAt])
}

model Refund {
  id          String @id @default(cuid())
  paymentId   String
  status      RefundStatus @default(REQUESTED)
  amountCents Int
  reason      String
  idempotencyKey String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@unique([paymentId, idempotencyKey])
  @@index([status, createdAt])
}

model MessageThread {
  id        String @id @default(cuid())
  orderId   String?
  listingId String?
  createdAt DateTime @default(now())
  messages  Message[]
}

model Message {
  id        String @id @default(cuid())
  threadId  String
  senderUserId String
  body      String
  createdAt DateTime @default(now())
  thread    MessageThread @relation(fields: [threadId], references: [id])
  @@index([threadId, createdAt])
}

model Notification {
  id        String @id @default(cuid())
  userId    String
  channel   NotificationChannel
  locale    Locale
  templateKey String
  payload   Json
  readAt    DateTime?
  sentAt    DateTime?
  createdAt DateTime @default(now())
  @@index([userId, readAt, createdAt])
}

model Review {
  id        String @id @default(cuid())
  orderId   String
  reviewerUserId String
  sellerId  String
  rating    Int
  body      String?
  moderationStatus ModerationStatus @default(PENDING)
  createdAt DateTime @default(now())
  @@unique([orderId, reviewerUserId])
  @@index([sellerId, moderationStatus])
}

model FraudSignal {
  id          String @id @default(cuid())
  subjectType String
  subjectId   String
  score       Int
  reason      String
  metadata    Json
  createdAt   DateTime @default(now())
  @@index([subjectType, subjectId])
  @@index([score, createdAt])
}

model AuditLog {
  id          String @id @default(cuid())
  actorUserId String?
  action      String
  subjectType String
  subjectId   String
  before      Json?
  after       Json?
  ipAddress   String?
  createdAt   DateTime @default(now())
  actor       User? @relation(fields: [actorUserId], references: [id])
  @@index([actorUserId, createdAt])
  @@index([subjectType, subjectId])
}

model OutboxEvent {
  id          String @id @default(cuid())
  aggregateType String
  aggregateId   String
  eventType     String
  payload       Json
  publishedAt   DateTime?
  attempts      Int @default(0)
  createdAt     DateTime @default(now())
  @@index([publishedAt, createdAt])
  @@index([aggregateType, aggregateId])
}

model FeatureFlag {
  id          String @id @default(cuid())
  key         String @unique
  enabled     Boolean @default(false)
  rules       Json?
  updatedAt   DateTime @updatedAt
}
```

## Indexing And Partitioning
- Partition `Bid`, `AuditLog`, `OutboxEvent`, `LedgerEntry`, and analytics events by month once write volume grows.
- Use composite indexes for state queues: `(status, createdAt)`, `(status, endsAt)`, `(publishedAt, createdAt)`.
- Use partial indexes in SQL migrations for active reservations, unpublished outbox events, and non-deleted listings.
- Keep product browsing on search indexes/read replicas. Checkout always reads listing, inventory, seller status, and payment eligibility from primary.

## Money And Inventory Rules
- Ledger entries are immutable. Balances are derived or cached projections.
- Every payment, ledger, reservation, bid, and refund write has a unique idempotency key.
- Inventory decrements use atomic SQL updates or selected segment rows inside a transaction.
- Hot listings use `InventorySegment` so concurrent buyers do not lock one row.


## Schema Extension For Remaining Core Domains
The first schema block defines the transactional core. The following models complete the baseline for shipping addresses, escrow, commission, moderation, search, notification preferences, and analytics. When implemented, merge these into the primary Prisma schema block and generate migrations in small module-owned steps.

```prisma
enum AddressType { BILLING SHIPPING RETURN }
enum EscrowStatus { HELD RELEASE_PENDING RELEASED FROZEN REFUNDED CANCELLED }

model Address {
  id          String @id @default(cuid())
  userId      String
  type        AddressType
  fullName    String
  line1       String
  line2       String?
  city        String
  region      String?
  postalCode  String
  countryCode String
  phone       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([userId, type])
  @@index([countryCode])
}

model Category {
  id          String @id @default(cuid())
  parentId    String?
  key         String @unique
  sortOrder   Int @default(0)
  createdAt   DateTime @default(now())
  translations CategoryTranslation[]
  @@index([parentId, sortOrder])
}

model CategoryTranslation {
  id          String @id @default(cuid())
  categoryId  String
  locale      Locale
  name        String
  slug        String
  @@unique([categoryId, locale])
  @@unique([locale, slug])
}

model EscrowHold {
  id              String @id @default(cuid())
  orderId          String
  paymentId        String
  sellerId         String
  status           EscrowStatus @default(HELD)
  amountCents      Int
  currency         Currency
  releaseAfter     DateTime?
  releasedAt       DateTime?
  frozenAt         DateTime?
  idempotencyKey   String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  @@unique([paymentId, sellerId, idempotencyKey])
  @@index([sellerId, status])
  @@index([status, releaseAfter])
}

model CommissionPlan {
  id          String @id @default(cuid())
  key         String
  version     Int
  currency    Currency
  rules       Json
  activeFrom  DateTime
  activeTo    DateTime?
  createdAt   DateTime @default(now())
  @@unique([key, version])
  @@index([activeFrom, activeTo])
}

model CommissionCharge {
  id              String @id @default(cuid())
  orderItemId      String
  sellerId         String
  planId           String
  amountCents      Int
  currency         Currency
  idempotencyKey   String
  createdAt        DateTime @default(now())
  @@unique([orderItemId, idempotencyKey])
  @@index([sellerId, createdAt])
}

model NotificationPreference {
  id          String @id @default(cuid())
  userId      String
  channel     NotificationChannel
  templateKey String
  enabled     Boolean @default(true)
  updatedAt   DateTime @updatedAt
  @@unique([userId, channel, templateKey])
}

model ModerationCase {
  id               String @id @default(cuid())
  subjectType       String
  subjectId         String
  status            ModerationStatus @default(PENDING)
  reason            String?
  assignedToUserId  String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  @@index([status, createdAt])
  @@index([subjectType, subjectId])
}

model SearchIndexJob {
  id          String @id @default(cuid())
  entityType  String
  entityId    String
  operation   String
  payload     Json
  processedAt DateTime?
  attempts    Int @default(0)
  createdAt   DateTime @default(now())
  @@index([processedAt, createdAt])
  @@index([entityType, entityId])
}

model AnalyticsEvent {
  id          String @id @default(cuid())
  userId      String?
  eventName   String
  locale      Locale?
  properties  Json
  occurredAt  DateTime
  receivedAt  DateTime @default(now())
  @@index([eventName, occurredAt])
  @@index([userId, occurredAt])
}
```
