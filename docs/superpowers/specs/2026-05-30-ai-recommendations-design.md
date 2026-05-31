# Design Spec: Module 18 - AI Recommendations

## 1. Overview
The AI Recommendations module provides personalized and global item suggestions to users. It uses a rule-based statistical approach for the MVP, tracking user interactions to build a profile and pre-computing global patterns like trending items and product similarity.

## 2. Success Criteria
- Users see products related to their recent browsing/purchase history.
- "Similar products" are displayed on product detail pages based on attributes.
- "Trending" products are identified and updated hourly.
- "Auctions ending soon" are prioritized by popularity.
- System functions with or without Redis (using BullMQ or a memory-based fallback).

## 3. Data Models (Prisma)

### Interaction Tracking
```prisma
enum InteractionType {
  VIEW        // Product detail page view
  SEARCH      // Search query execution
  CLICK       // Click on a recommendation
}

model UserInteraction {
  id            String          @id @default(cuid())
  userId        String
  listingId     String?         
  interaction   InteractionType
  metadata      Json?           // e.g., { "query": "iphone", "source": "trending" }
  createdAt     DateTime        @default(now())

  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  listing       Listing?        @relation(fields: [listingId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt])
  @@index([listingId, createdAt])
}
```

### Recommendation Read Models
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

model ProductSimilarity {
  id              String   @id @default(cuid())
  productId       String   
  similarProductId String   
  score           Float    @default(0) // 0 to 1
  reason          String?
  createdAt       DateTime @default(now())

  product         Listing  @relation("SimilaritySource", fields: [productId], references: [id], onDelete: Cascade)
  similarProduct  Listing  @relation("SimilarityTarget", fields: [similarProductId], references: [id], onDelete: Cascade)

  @@unique([productId, similarProductId])
  @@index([productId, score(sort: Desc)])
}

model TrendingProduct {
  id          String   @id @default(cuid())
  productId   String   @unique
  viewCount   Int      @default(0)
  orderCount  Int      @default(0)
  score       Float    @default(0)
  window      String   // "DAILY", "WEEKLY"
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())

  product     Listing  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([window, score(sort: Desc)])
}
```

## 4. Algorithms

### 4.1. Personalized (BASED_ON_HISTORY)
1. Fetch last 30 interactions for the user.
2. Extract top 3 categories and top 2 sellers.
3. Query active listings in those categories/sellers.
4. Exclude products already interacted with.
5. Rank by score: Click (3 pts) > View (1 pt).
6. Cache results for 15 minutes.

### 4.2. Similar Products
1. Compare active listings by:
   - Same `categoryId` (mandatory).
   - Price within +/- 25% range.
   - Same `condition`.
2. Weight: Same seller (0.5), different seller (1.0).
3. Store top 10 similarities in `ProductSimilarity`.

### 4.3. Trending
1. Equation: `Score = (views * 1) + (orders * 10)`.
2. Time Window: Last 24 hours.
3. Store in `TrendingProduct`.

### 4.4. Auctions Ending Soon
1. Direct query for auctions ending in < 6 hours.
2. Order by `bidCount` DESC.

## 5. System Architecture
- **RecommendationService**: Main entry point for the API.
- **RecommendationCacheService**: Handles CRUD and TTL for cached recommendations.
- **RecommendationProcessor**: 
  - If Redis is available: Uses BullMQ Workers.
  - If Redis is missing: Uses `setInterval` in a dedicated provider.
- **RecommendationListeners**: Listens to `product.viewed`, `order.confirmed`, and `auction.bid`.

## 6. Endpoints
- `GET /v1/recommendations?type=...&limit=...`
- `POST /v1/admin/recommendations/refresh` (Manual trigger)

## 7. Implementation Plan (High Level)
1. Update Prisma schema and migrate.
2. Scaffold `RecommendationModule`.
3. Implement View tracking listener.
4. Implement History recommendation logic.
5. Implement Background Processor (BullMQ + Fallback).
6. Implement Trending and Similarity algorithms.
7. Verify with `scripts/verify-recommendations.ts`.
