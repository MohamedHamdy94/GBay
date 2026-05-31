# AI Recommendations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a rule-based AI recommendation system that suggests products based on user history, similarity, trending status, and auction urgency.

**Architecture:** Hybrid approach with on-demand personalized recommendations (History) and pre-computed global patterns (Trending, Similarity). Includes a dual background processor (BullMQ + setInterval fallback).

**Tech Stack:** NestJS, Prisma, PostgreSQL, BullMQ (optional), ioredis (optional).

---

### Task 1: Update Prisma Schema

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

- [ ] **Step 1: Add InteractionType enum and UserInteraction model**

```prisma
enum InteractionType {
  VIEW
  SEARCH
  CLICK
}

model UserInteraction {
  id            String          @id @default(cuid())
  userId        String
  listingId     String?         
  interaction   InteractionType
  metadata      Json?           
  createdAt     DateTime        @default(now())

  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  listing       Listing?        @relation(fields: [listingId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt])
  @@index([listingId, createdAt])
}
```

- [ ] **Step 2: Add RecommendationType enum and RecommendationCache model**

```prisma
enum RecommendationType {
  BASED_ON_HISTORY
  SIMILAR_PRODUCTS
  TRENDING
  FREQUENTLY_BOUGHT_TOGETHER
  AUCTIONS_ENDING_SOON
}

model RecommendationCache {
  id            String             @id @default(cuid())
  userId        String
  productId     String             // ListingId
  type          RecommendationType
  score         Float              @default(0)
  reason        String?            
  expiresAt     DateTime
  createdAt     DateTime           @default(now())

  user          User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  product       Listing            @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId, type])
  @@index([userId, type, score(sort: Desc)])
  @@index([expiresAt])
}
```

- [ ] **Step 3: Add ProductSimilarity model**

```prisma
model ProductSimilarity {
  id              String   @id @default(cuid())
  productId       String   
  similarProductId String   
  score           Float    @default(0)
  reason          String?
  createdAt       DateTime @default(now())

  product         Listing  @relation("SimilaritySource", fields: [productId], references: [id], onDelete: Cascade)
  similarProduct  Listing  @relation("SimilarityTarget", fields: [similarProductId], references: [id], onDelete: Cascade)

  @@unique([productId, similarProductId])
  @@index([productId, score(sort: Desc)])
}
```

- [ ] **Step 4: Add TrendingProduct model**

```prisma
model TrendingProduct {
  id          String   @id @default(cuid())
  productId   String   @unique
  viewCount   Int      @default(0)
  orderCount  Int      @default(0)
  score       Float    @default(0)
  window      String   
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())

  product     Listing  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([window, score(sort: Desc)])
}
```

- [ ] **Step 5: Add relations to User and Listing models**
Modify `User` to add `interactions UserInteraction[]` and `recommendations RecommendationCache[]`.
Modify `Listing` to add `interactions UserInteraction[]`, `recommendations RecommendationCache[]`, `similarTo ProductSimilarity[] @relation("SimilaritySource")`, `similarFrom ProductSimilarity[] @relation("SimilarityTarget")`, and `trending TrendingProduct?`.

- [ ] **Step 6: Run Migration**

Run: `npm run db:migrate`
Expected: Migration successful in Neon.

### Task 2: Scaffold Recommendation Module

**Files:**
- Create: `apps/api/src/recommendation/recommendation.module.ts`
- Create: `apps/api/src/recommendation/recommendation.types.ts`
- Create: `apps/api/src/recommendation/dto.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Define Types**
In `recommendation.types.ts`, define `RECOMMENDATION_REPOSITORY` token and `IRecommendationRepository` interface.

- [ ] **Step 2: Define DTOs**
In `dto.ts`, define `GetRecommendationsDto` and `RefreshRecommendationsDto`.

- [ ] **Step 3: Create Module**
In `recommendation.module.ts`, set up the basic structure.

- [ ] **Step 4: Register in AppModule**
Add `RecommendationModule` to `AppModule` imports.

### Task 3: Implement Recommendation Repository

**Files:**
- Create: `apps/api/src/recommendation/prisma-recommendation.repository.ts`

- [ ] **Step 1: Implement methods**
- `trackInteraction(data)`
- `getRecentInteractions(userId, limit)`
- `upsertCache(data)`
- `getCachedRecommendations(userId, type, limit)`
- `updateProductSimilarity(pairs)`
- `updateTrendingProducts(data)`
- `getSimilarProducts(productId, limit)`
- `getTrendingProducts(limit)`

### Task 4: Implement Recommendation Service & Controller

**Files:**
- Create: `apps/api/src/recommendation/recommendation.service.ts`
- Create: `apps/api/src/recommendation/recommendation.controller.ts`

- [ ] **Step 1: Controller Endpoints**
Implement `GET /v1/recommendations` and `POST /v1/admin/recommendations/refresh`.

- [ ] **Step 2: Service Logic (Delegation)**
Implement `getRecommendations(userId, type, params)` that switches between history, trending, similar, etc.

### Task 5: Implement Recommendation Listeners

**Files:**
- Create: `apps/api/src/recommendation/recommendation.listeners.ts`
- Modify: `apps/api/src/search/search.controller.ts` (to emit product view)
- Modify: `apps/api/src/order/order.service.ts` (to emit order confirmation)

- [ ] **Step 1: Listeners**
Handle `product.viewed`, `order.confirmed`, `auction.bid`.
Call `repository.trackInteraction`.

- [ ] **Step 2: Emission**
Ensure events are emitted with correct payloads.

### Task 6: Implement Recommendation Processor (The Hybrid Engine)

**Files:**
- Create: `apps/api/src/recommendation/recommendation.processor.ts`

- [ ] **Step 1: BullMQ Worker (Optional)**
Set up `RecommendationProcessor` with `@Processor`.

- [ ] **Step 2: Fallback Scheduler**
Implement a `OnModuleInit` service that checks for Redis and sets up `setInterval` if missing.

### Task 7: Implement Algorithms

- [ ] **Step 1: History Algorithm**
Logic to extract categories/sellers and query listings.

- [ ] **Step 2: Similarity Algorithm**
Logic to compare Listing attributes (Category, Price, Condition).

- [ ] **Step 3: Trending Algorithm**
Logic to aggregate views/orders from `UserInteraction` and update `TrendingProduct`.

### Task 8: Verification

**Files:**
- Create: `scripts/seed-recommendations.ts`
- Create: `scripts/verify-recommendations.ts`

- [ ] **Step 1: Seed data**
- [ ] **Step 2: Run verification**
Expected: Recommendations returned correctly for each type.
