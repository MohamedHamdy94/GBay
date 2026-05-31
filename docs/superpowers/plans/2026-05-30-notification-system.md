# Module 16: Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an internal notification system that alerts users to important events like new orders, messages, dispute updates, and auction results.

**Architecture:** Event-driven system using NestJS `EventEmitter2`. Notifications are stored in the database and fetched via REST APIs. A background job (BullMQ) handles cleanup of old notifications.

**Tech Stack:** NestJS, Prisma, BullMQ, EventEmitter2.

---

### Task 1: Database Schema Update

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

- [ ] **Step 1: Add NotificationType enum and Notification model**

```prisma
enum NotificationType {
  ORDER_CONFIRMED
  ORDER_SHIPPED
  ORDER_DELIVERED
  ORDER_CANCELLED
  RETURN_REQUESTED
  REFUND_COMPLETED
  DISPUTE_OPENED
  DISPUTE_RESOLVED
  MESSAGE_RECEIVED
  AUCTION_WON
  AUCTION_OUTBID
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  body      String
  data      Json?
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead, createdAt])
}
```

- [ ] **Step 2: Add Notification relation to User model**

```prisma
model User {
  // ... existing fields
  notifications     Notification[]
  // ...
}
```

- [ ] **Step 3: Run migration**

Run: `npm run db:migrate`

### Task 2: Enhance Event Emissions

**Files:**
- Modify: `apps/api/src/order/order.service.ts`
- Modify: `apps/api/src/refund/refund.service.ts`
- Modify: `apps/api/src/dispute/dispute.service.ts`
- Modify: `apps/api/src/messaging/messaging.service.ts`
- Modify: `apps/api/src/auction/auction-bidding.service.ts`

- [ ] **Step 1: Emit events in OrderService**
Add emissions for `order.shipped`, `order.delivered`, `order.cancelled`, `order.return_requested` in `updateStatus`.

- [ ] **Step 2: Emit events in RefundService**
Add emission for `refund.completed` in `completeRefund`.

- [ ] **Step 3: Emit events in DisputeService**
Add emission for `dispute.opened` in `openDispute` and `dispute.resolved` in `resolveDispute`.

- [ ] **Step 4: Emit events in MessagingService**
Add emission for `message.received` in `sendMessage`.

- [ ] **Step 5: Emit events in AuctionBiddingService**
Add emission for `auction.outbid` in `placeBid`. Note: `auction.won` will likely need a separate cron job or end-of-auction logic (Module 5 might have this, need to check).

### Task 3: Scaffold Notification Module

**Files:**
- Create: `apps/api/src/notification/notification.types.ts`
- Create: `apps/api/src/notification/dto.ts`
- Create: `apps/api/src/notification/prisma-notification.repository.ts`
- Create: `apps/api/src/notification/notification.service.ts`
- Create: `apps/api/src/notification/notification.controller.ts`
- Create: `apps/api/src/notification/notification.module.ts`

- [ ] **Step 1: Define types and DTOs**
- [ ] **Step 2: Implement PrismaNotificationRepository**
- [ ] **Step 3: Implement NotificationService**
- [ ] **Step 4: Implement NotificationController**
- [ ] **Step 5: Wire up NotificationModule**

### Task 4: Implement Event Listeners

**Files:**
- Create: `apps/api/src/notification/notification.listeners.ts`

- [ ] **Step 1: Implement listeners for all notification types**
Each listener should call `NotificationService.create()` with appropriate title, body, and payload.

### Task 5: Implement Cleanup Job (BullMQ)

**Files:**
- Create: `apps/api/src/notification/notification.processor.ts`

- [ ] **Step 1: Implement daily cron job to delete notifications older than 30 days**
Note: Keep BullMQ configuration commented out by default if Redis is not guaranteed.

### Task 6: Verification

**Files:**
- Create: `scripts/verify-notifications.ts`

- [ ] **Step 1: Run verification script**
Verify:
- List notifications with pagination and filters.
- Mark as read / mark all as read.
- Unread count.
- Automatic creation on system events.
- Permission checks.

- [ ] **Step 2: Update documentation**
Update `CHANGELOG_AI.md`, `IMPLEMENTATION_STATUS.md`, and `AI_MEMORY.md`.
