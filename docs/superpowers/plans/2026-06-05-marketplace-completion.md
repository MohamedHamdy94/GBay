# Marketplace Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the end-to-end marketplace flow (Seller Dashboard, Orders, Dynamic Listings, Mock Checkout).

**Architecture:** 
- Enhance Next.js 15 pages with new API integrations.
- Implement server actions for order status updates.
- Create a mock payment interstitial for checkout.

**Tech Stack:** Next.js 15, Tailwind CSS, ShadCN/UI, NestJS (API).

---

### Task 1: Seller Dashboard Enhancements

**Files:**
- Modify: `apps/web/app/[locale]/seller/dashboard/page.tsx`
- Modify: `apps/api/src/seller/seller.service.ts`

- [ ] **Step 1: Update API to return recent orders in Dashboard**
Ensure `getDashboard` in `seller.service.ts` includes `recentOrders`. (Already planned in `2026-05-27-seller-dashboard.md`, let's verify implementation).

- [ ] **Step 2: Update Dashboard UI**
Add a "Recent Orders" table and "Quick Actions" section to the seller dashboard.

---

### Task 2: Seller Orders Page

**Files:**
- Create: `apps/web/app/[locale]/seller/orders/page.tsx`
- Create: `apps/web/app/[locale]/seller/orders/actions.ts`

- [ ] **Step 1: Create Orders Page**
Display a list of orders containing items from the logged-in seller.

- [ ] **Step 2: Implement "Mark as Shipped" Action**
Create a server action to call the API's shipment update endpoint.

---

### Task 3: Dynamic Product Listing & Categories

**Files:**
- Modify: `apps/web/app/[locale]/seller/products/new/page.tsx`
- Modify: `apps/web/app/[locale]/seller/products/new/actions.ts`

- [ ] **Step 1: Fetch and Display Categories**
Fetch categories from `/v1/catalog/categories` and update the Select component.

- [ ] **Step 2: Add Auction Fields**
Conditionally show "Starting Bid" and "Reserve Price" when listing type is "AUCTION".

---

### Task 4: Mock Payment & Checkout Flow

**Files:**
- Create: `apps/web/app/[locale]/checkout/payment/page.tsx`
- Create: `apps/web/app/[locale]/checkout/success/page.tsx`
- Modify: `apps/web/app/[locale]/checkout/page.tsx`

- [ ] **Step 1: Update Checkout Initiation**
Update the main checkout page to redirect to `/checkout/payment` upon "Place Order".

- [ ] **Step 2: Implement Payment Interstitial**
Create the payment page with a 2-second delay/animation before calling the confirmation API.

- [ ] **Step 3: Create Success Page**
Show order summary and success message.

---

### Task 5: Final Documentation & Verification

- [ ] **Step 1: Run End-to-End Manual Test**
- [ ] **Step 2: Write `gbay.md` with instructions and costs.**
- [ ] **Step 3: Final Status Update.**
