# Product Listing System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a robust product listing system with a product/listing split, localized content (i18n), category hierarchy, and moderated media.

**Architecture:** Use a `CatalogModule` in NestJS to manage products, categories, and media. Products are the physical items, while Listings represent the offer (price, type, etc.). Product content is localized using a `ProductTranslation` table.

**Tech Stack:** NestJS, Prisma, PostgreSQL (Neon).

---

### Task 1: Database Schema Updates

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

- [ ] **Step 1: Verify Category and Translation models**

Ensure `Category`, `CategoryTranslation`, `Product`, `ProductTranslation`, and `MediaAsset` models are correctly defined in `packages/database/prisma/schema.prisma` as per `DATABASE_SCHEMA.md`.

- [ ] **Step 2: Run Prisma migration**

Run the migration against the Neon database:
```bash
cd packages/database
npx prisma migrate dev --name add_catalog_core
```

---

### Task 2: Implement Catalog Module Skeleton

**Files:**
- Create: `apps/api/src/catalog/catalog.module.ts`
- Create: `apps/api/src/catalog/catalog.service.ts`
- Create: `apps/api/src/catalog/catalog.controller.ts`
- Create: `apps/api/src/catalog/catalog.types.ts`
- Create: `apps/api/src/catalog/dto.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Define Catalog types and DTOs**

In `apps/api/src/catalog/catalog.types.ts` and `apps/api/src/catalog/dto.ts`, define the interfaces for creating and updating products and categories, including translation support.

- [ ] **Step 2: Create Catalog Service and Controller**

Implement basic CRUD for categories and products. Categories should support parent-child relations.

- [ ] **Step 3: Register CatalogModule**

Add `CatalogModule` to the `imports` array in `apps/api/src/app.module.ts`.

---

### Task 3: Implement Seller Product Management

**Files:**
- Modify: `apps/api/src/catalog/catalog.service.ts`
- Modify: `apps/api/src/catalog/catalog.controller.ts`

- [ ] **Step 1: Add Seller Role Guard**

Ensure seller endpoints are protected. Only approved sellers can create/update products.

- [ ] **Step 2: Implement POST /v1/products**

Allow sellers to create a product with translations and media assets.

- [ ] **Step 3: Implement PATCH /v1/products/:id**

Allow sellers to update their own products.

- [ ] **Step 4: Implement GET /v1/seller/products**

Allow sellers to list their own products with status filtering.

---

### Task 4: Implement Public Product Browsing

**Files:**
- Modify: `apps/api/src/catalog/catalog.service.ts`
- Modify: `apps/api/src/catalog/catalog.controller.ts`

- [ ] **Step 1: Implement GET /v1/products**

Public endpoint for browsing products. Must support:
- Pagination (limit, offset)
- Locale-aware titles/descriptions
- Filtering by category, price range (via listings), and condition.

---

### Task 5: Verification and Seeding

**Files:**
- Create: `scripts/seed-catalog.ts`

- [ ] **Step 1: Create Seed Script**

Populate categories (e.g., Electronics, Fashion) and sample products for the existing seller.

- [ ] **Step 2: Run Seed Script**

```bash
node --import tsx --env-file=.env scripts/seed-catalog.ts
```

- [ ] **Step 3: Verify with CURL**

Test public browsing and seller management endpoints.

---

### Task 6: Documentation Update

- [ ] **Step 1: Update CHANGELOG_AI.md**
- [ ] **Step 2: Update IMPLEMENTATION_STATUS.md**
- [ ] **Step 3: Update AI_MEMORY.md**
