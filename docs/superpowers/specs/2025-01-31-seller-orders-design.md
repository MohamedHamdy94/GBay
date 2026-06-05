# Design Document: Seller Orders Page

This document outlines the design for the Seller Orders Page in the GBay marketplace.

## 1. Overview
Sellers need a dedicated page to manage their orders, track statuses, and mark orders as shipped. This page will be accessible from the Seller Dashboard.

## 2. Page Structure
**Location**: `apps/web/app/[locale]/seller/orders/page.tsx`

### Components:
- **Header**: Page title ("Manage Orders") and navigation back to the Seller Dashboard.
- **Filter Bar**: Simple status filtering (All, Pending, Shipped, Delivered, Cancelled).
- **Orders Table**:
    - **ID**: Order identifier (shortened).
    - **Date**: Order placement date.
    - **Customer**: Buyer information.
    - **Total**: Order amount.
    - **Status**: Current order status with visual indicators (Badges).
    - **Actions**: Contextual actions based on status.

## 3. Data Flow
- **Fetching**: Data will be fetched server-side from `GET /v1/seller/orders`.
- **Authentication**: Requires a valid seller session (handled via `requireAuth`).
- **Update Action**: "Mark as Shipped" will trigger a server action that calls `POST /v1/seller/orders/:id/ship`.

## 4. UI/UX Details
- **Status Badges**:
    - `PAID`: Blue/Primary
    - `SHIPPED`: Orange/Secondary
    - `DELIVERED`: Green/Outline
    - `CANCELLED`: Red/Destructive
- **Ship Order Dialog**: A modal that appears when "Mark as Shipped" is clicked, requiring:
    - Carrier (e.g., DHL, UPS, FedEx)
    - Tracking Number

## 5. i18n
New keys will be added to `en.json` and `de.json` under `seller_orders`.

## 6. Implementation Plan
1. Update i18n files with necessary translations.
2. Create `ShipOrderDialog` component.
3. Create `actions.ts` for server-side order updates.
4. Create the main `page.tsx` for the orders list.
5. Verify integration with the API.
