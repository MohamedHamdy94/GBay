# Seller Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a high-performance Seller Dashboard using a Summary Table (Read Model) that aggregates key metrics for sellers.

**Architecture:** Use a `SellerDashboardMetrics` table to store pre-calculated stats (total listings, active auctions, earnings, etc.) and low-stock alerts. This separates read and write concerns, ensuring the UI remains fast even as transaction volume grows.

**Tech Stack:** NestJS, Prisma, PostgreSQL (Neon).

---

### Task 1: Update Database Schema

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

- [ ] **Step 1: Add SellerDashboardMetrics model**

Add the following to `packages/database/prisma/schema.prisma`:

```prisma
model SellerDashboardMetrics {
  id                  String   @id @default(cuid())
  sellerId            String   @unique
  totalListings       Int      @default(0)
  activeAuctions      Int      @default(0)
  soldItemsThisMonth  Int      @default(0)
  pendingPayouts      Decimal  @default(0) @db.Decimal(20, 2)
  totalEarnings       Decimal  @default(0) @db.Decimal(20, 2)
  recentOrders        Json?    // Array of { id, status, amount, date }
  salesLast7Days      Json?    // Array of { date, count, amount }
  lowStockItems       Json?    // Array of { id, title, stock }
  updatedAt           DateTime @updatedAt
  
  sellerProfile       SellerProfile @relation(fields: [sellerId], references: [id], onDelete: Cascade)
}
```

Update `SellerProfile` model to include the relation:
```prisma
model SellerProfile {
  // ... existing fields
  dashboardMetrics SellerDashboardMetrics?
}
```

- [ ] **Step 2: Run Prisma migration**

Run the migration against the Neon database:
```bash
cd packages/database
npx prisma migrate dev --name add_seller_dashboard_metrics
```

---

### Task 2: Extend Seller Repository

**Files:**
- Modify: `apps/api/src/seller/seller.types.ts`
- Modify: `apps/api/src/seller/prisma-seller.repository.ts`
- Modify: `apps/api/src/seller/in-memory-seller.repository.ts`

- [ ] **Step 1: Update Repository Interfaces**

Add types and repository methods to `apps/api/src/seller/seller.types.ts`:

```typescript
export interface SellerDashboardMetricsView {
  sellerId: string;
  totalListings: number;
  activeAuctions: number;
  soldItemsThisMonth: number;
  pendingPayouts: string; // Decimal as string for JSON
  totalEarnings: string;
  recentOrders: any;
  salesLast7Days: any;
  lowStockItems: any;
  updatedAt: Date;
}

export interface SellerRepository {
  // ... existing methods
  getDashboardMetrics(sellerId: string): Promise<SellerDashboardMetricsView | null>;
  upsertDashboardMetrics(sellerId: string, data: Partial<SellerDashboardMetricsView>): Promise<SellerDashboardMetricsView>;
}
```

- [ ] **Step 2: Implement in PrismaSellerRepository**

Update `apps/api/src/seller/prisma-seller.repository.ts`:

```typescript
  async getDashboardMetrics(sellerId: string): Promise<SellerDashboardMetricsView | null> {
    const metrics = await this.prisma.sellerDashboardMetrics.findUnique({
      where: { sellerId },
    });
    if (!metrics) return null;
    return {
      ...metrics,
      pendingPayouts: metrics.pendingPayouts.toString(),
      totalEarnings: metrics.totalEarnings.toString(),
    } as SellerDashboardMetricsView;
  }

  async upsertDashboardMetrics(sellerId: string, data: Partial<SellerDashboardMetricsView>): Promise<SellerDashboardMetricsView> {
    const upserted = await this.prisma.sellerDashboardMetrics.upsert({
      where: { sellerId },
      create: {
        sellerId,
        totalListings: data.totalListings ?? 0,
        activeAuctions: data.activeAuctions ?? 0,
        soldItemsThisMonth: data.soldItemsThisMonth ?? 0,
        pendingPayouts: data.pendingPayouts ?? '0',
        totalEarnings: data.totalEarnings ?? '0',
        recentOrders: data.recentOrders ?? [],
        salesLast7Days: data.salesLast7Days ?? [],
        lowStockItems: data.lowStockItems ?? [],
      },
      update: {
        ...data,
      },
    });
    return {
      ...upserted,
      pendingPayouts: upserted.pendingPayouts.toString(),
      totalEarnings: upserted.totalEarnings.toString(),
    } as SellerDashboardMetricsView;
  }
```

- [ ] **Step 3: Implement in InMemorySellerRepository**

Update `apps/api/src/seller/in-memory-seller.repository.ts` to maintain test compatibility:

```typescript
  private readonly metrics = new Map<string, any>();

  async getDashboardMetrics(sellerId: string): Promise<any | null> {
    return this.metrics.get(sellerId) || null;
  }

  async upsertDashboardMetrics(sellerId: string, data: any): Promise<any> {
    const existing = this.metrics.get(sellerId) || { sellerId };
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.metrics.set(sellerId, updated);
    return updated;
  }
```

---

### Task 3: Update Seller Service and Controller

**Files:**
- Modify: `apps/api/src/seller/seller.service.ts`
- Modify: `apps/api/src/seller/seller.controller.ts`

- [ ] **Step 1: Update SellerService**

Add `getDashboard` method to `apps/api/src/seller/seller.service.ts`:

```typescript
  async getDashboard(userId: string) {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) throw new NotFoundException({ code: 'SELLER_PROFILE_NOT_FOUND' });
    
    let metrics = await this.repository.getDashboardMetrics(profile.id);
    
    // If no metrics exist yet, return an empty initialized state (or trigger initial sync)
    if (!metrics) {
      metrics = await this.repository.upsertDashboardMetrics(profile.id, {});
    }
    
    return metrics;
  }
```

- [ ] **Step 2: Update SellerController**

Add the endpoint to `apps/api/src/seller/seller.controller.ts`:

```typescript
  @UseGuards(BearerAuthGuard)
  @Get('seller/dashboard')
  getDashboard(@Req() request: AuthenticatedRequest) {
    return this.sellerService.getDashboard(request.user!.id);
  }
```

---

### Task 4: Verification and Seeding

**Files:**
- Create: `scripts/seed-dashboard-metrics.ts`

- [ ] **Step 1: Create Seed Script**

Create a script to populate fake data for the current user's seller profile.

```typescript
import { PrismaClient } from '@gbay/database';

const prisma = new PrismaClient();

async function main() {
  const seller = await prisma.sellerProfile.findFirst();
  if (!seller) {
    console.log('No seller found. Please create one first.');
    return;
  }

  await prisma.sellerDashboardMetrics.upsert({
    where: { sellerId: seller.id },
    update: {
      totalListings: 15,
      activeAuctions: 5,
      soldItemsThisMonth: 8,
      pendingPayouts: 1250.50,
      totalEarnings: 4500.00,
      recentOrders: [
        { id: 'ORD-1', status: 'COMPLETED', amount: 150.00, date: new Date().toISOString() },
        { id: 'ORD-2', status: 'SHIPPED', amount: 200.00, date: new Date().toISOString() }
      ],
      salesLast7Days: [
        { date: '2026-05-21', count: 1, amount: 100 },
        { date: '2026-05-22', count: 2, amount: 250 },
        { date: '2026-05-23', count: 0, amount: 0 },
        { date: '2026-05-24', count: 3, amount: 400 },
        { date: '2026-05-25', count: 1, amount: 150 },
        { date: '2026-05-26', count: 2, amount: 300 },
        { date: '2026-05-27', count: 1, amount: 50 }
      ],
      lowStockItems: [
        { id: 'PROD-1', title: 'Vintage Watch', stock: 2 },
        { id: 'PROD-2', title: 'Leather Bag', stock: 1 }
      ]
    },
    create: {
      sellerId: seller.id,
      totalListings: 15,
      activeAuctions: 5,
      soldItemsThisMonth: 8,
      pendingPayouts: 1250.50,
      totalEarnings: 4500.00,
      recentOrders: [],
      salesLast7Days: [],
      lowStockItems: []
    }
  });

  console.log('Dashboard metrics seeded for seller:', seller.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run Seed Script**

```bash
npx ts-node scripts/seed-dashboard-metrics.ts
```

- [ ] **Step 3: Verify with CURL**

Start the API server:
```bash
npm run dev:api
```

In another terminal, call the endpoint (using a valid token from previous steps):
```bash
curl -X GET http://localhost:3001/v1/seller/dashboard \
  -H "Authorization: Bearer <TOKEN>"
```

Expected: JSON response with the seeded metrics.

---

### Task 5: Documentation Update

- [ ] **Step 1: Update CHANGELOG_AI.md**
- [ ] **Step 2: Update IMPLEMENTATION_STATUS.md**
- [ ] **Step 3: Update AI_MEMORY.md**
