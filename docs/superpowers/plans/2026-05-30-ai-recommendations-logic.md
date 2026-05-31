# AI Recommendations Implementation Plan (Tasks 4-8)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the logic, API endpoints, background processing, and algorithms for personalized and global product recommendations.

**Architecture:** A service-oriented approach where `RecommendationService` serves the API, `RecommendationProcessor` handles heavy computations (trending, similarity) in the background, and `RecommendationListeners` track user behavior via events.

**Tech Stack:** NestJS, Prisma, EventEmitter2 (NestJS events).

---

### Task 4: Recommendation Service & Controller

**Files:**
- Create: `apps/api/src/recommendation/recommendation.service.ts`
- Create: `apps/api/src/recommendation/recommendation.controller.ts`
- Create: `apps/api/src/recommendation/recommendation.service.spec.ts`
- Modify: `apps/api/src/recommendation/recommendation.module.ts`

- [ ] **Step 1: Implement RecommendationService**
Create the service that orchestrates recommendations, using the repository for data access.

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { RECOMMENDATION_REPOSITORY, IRecommendationRepository } from './recommendation.types';
import { RecommendationType, InteractionType } from './dto';

@Injectable()
export class RecommendationService {
  constructor(
    @Inject(RECOMMENDATION_REPOSITORY)
    private readonly repository: IRecommendationRepository,
  ) {}

  async getRecommendations(type: RecommendationType, userId?: string, productId?: string, limit: number = 10) {
    switch (type) {
      case RecommendationType.TRENDING:
        return this.repository.getTrendingProducts(limit);
      case RecommendationType.SIMILAR_PRODUCTS:
        if (!productId) return [];
        return this.repository.getSimilarProducts(productId, limit);
      case RecommendationType.BASED_ON_HISTORY:
        if (!userId) return [];
        // First try cache
        const cached = await this.repository.getCachedRecommendations(userId, type, limit);
        if (cached.length > 0) return cached;
        // Fallback or trigger refresh (for MVP, we'll return empty if not cached yet)
        return [];
      default:
        return [];
    }
  }

  async trackView(userId: string, productId: string) {
    await this.repository.trackInteraction({
      userId,
      listingId: productId,
      interaction: InteractionType.VIEW,
    });
  }

  async refreshAll() {
    // This will be used to trigger background jobs
    // For now, it's a placeholder for Task 6
    console.log('Refreshing all recommendations...');
  }
}
```

- [ ] **Step 2: Implement RecommendationController**
Create the controller with public and admin endpoints.

```typescript
import { Controller, Get, Post, Query, UseGuards, Req, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.types'; // Adjust based on project structure
import { RecommendationService } from './recommendation.service';
import { GetRecommendationsDto, RefreshRecommendationsDto } from './dto';

@Controller('v1/recommendations')
export class RecommendationController {
  constructor(private readonly service: RecommendationService) {}

  @Get()
  async getRecommendations(@Query() query: GetRecommendationsDto, @Req() req: any) {
    const userId = req.user?.id; // Optional user
    return this.service.getRecommendations(query.type, userId, query.productId, query.limit);
  }

  @Post('admin/refresh')
  @UseGuards(JwtAuthGuard) // Add AdminGuard if available
  async refresh(@Body() body: RefreshRecommendationsDto) {
    await this.service.refreshAll();
    return { message: 'Refresh triggered' };
  }
}
```

- [ ] **Step 3: Update RecommendationModule**
Register the service and controller.

- [ ] **Step 4: Write Unit Test for Service**
Verify `getRecommendations` logic.

- [ ] **Step 5: Verify build**
Run: `npm run build:api`

---

### Task 5: Recommendation Listeners

**Files:**
- Create: `apps/api/src/recommendation/recommendation.listeners.ts`
- Modify: `apps/api/src/recommendation/recommendation.module.ts`

- [ ] **Step 1: Implement RecommendationListeners**
Listen for `product.viewed` and `order.confirmed` events.

```typescript
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RecommendationService } from './recommendation.service';

@Injectable()
export class RecommendationListeners {
  constructor(private readonly service: RecommendationService) {}

  @OnEvent('product.viewed')
  async handleProductViewed(payload: { userId: string; productId: string }) {
    await this.service.trackView(payload.userId, payload.productId);
  }

  // Add more as needed
}
```

- [ ] **Step 2: Register Listeners in Module**
Add `RecommendationListeners` to `providers`.

---

### Task 6: Recommendation Processor (Background Logic)

**Files:**
- Create: `apps/api/src/recommendation/recommendation.processor.ts`
- Modify: `apps/api/src/recommendation/recommendation.module.ts`
- Modify: `apps/api/src/recommendation/recommendation.service.ts`

- [ ] **Step 1: Implement RecommendationProcessor**
This handles the heavy lifting. Since we are using a simplified version (no BullMQ yet unless verified), we'll use a service that runs periodically.

```typescript
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { RECOMMENDATION_REPOSITORY, IRecommendationRepository } from './recommendation.types';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RecommendationProcessor implements OnModuleInit {
  constructor(
    @Inject(RECOMMENDATION_REPOSITORY)
    private readonly repository: IRecommendationRepository,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    // Start periodic refreshes if needed, or wait for manual triggers
  }

  async computeTrending() {
    // Implement algorithm 4.3 from spec
  }

  async computeSimilarities() {
    // Implement algorithm 4.2 from spec
  }

  async computePersonalized(userId: string) {
    // Implement algorithm 4.1 from spec
  }
}
```

- [ ] **Step 2: Integrate Processor into Service**
Add `RecommendationProcessor` to `RecommendationService` to trigger refreshes.

---

### Task 7: Algorithm Implementation

**Files:**
- Modify: `apps/api/src/recommendation/recommendation.processor.ts`

- [ ] **Step 1: Implement Trending Logic**
Score = (views * 1) + (orders * 10).

- [ ] **Step 2: Implement Similarity Logic**
Same category, price +/- 25%, same condition.

- [ ] **Step 3: Implement Personalized Logic**
Top 3 categories from last 30 interactions.

---

### Task 8: Verification

**Files:**
- Create: `scripts/seed-recommendations.ts`
- Modify: `scripts/verify-recommendations.ts`

- [ ] **Step 1: Create Seed Script**
Generate some interactions to test recommendations.

- [ ] **Step 2: Run Verification Script**
Run: `npx ts-node scripts/verify-recommendations.ts`
Expected: Success logs showing recommendations are being served.

- [ ] **Step 3: Update Docs**
Update `CHANGELOG_AI.md` and `IMPLEMENTATION_STATUS.md`.
