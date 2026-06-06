# Seller Dashboard UI Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the Seller Dashboard UI with a "Quick Actions" section and a "Recent Orders" table, including internationalization support.

**Architecture:** 
- Modify the existing Seller Dashboard page to fetch and display recent orders.
- Add a new "Quick Actions" component for common seller tasks.
- Update i18n message files for English and German.

**Tech Stack:** Next.js 15, Tailwind CSS, ShadCN/UI, next-intl.

---

### Task 1: Update i18n Messages

**Files:**
- Modify: `apps/web/messages/en.json`
- Modify: `apps/web/messages/de.json`

- [ ] **Step 1: Add new keys to `en.json`**

```json
  "seller_dashboard": {
    "error_loading": "Could not load dashboard data",
    "error_desc": "Please ensure you have completed seller onboarding.",
    "title": "Seller Dashboard",
    "total_sales": "Total Sales",
    "active_listings": "Active Listings",
    "pending_orders": "Pending Orders",
    "quick_actions": "Quick Actions",
    "add_product": "Add Product",
    "manage_orders": "Manage Orders",
    "recent_orders": "Recent Orders",
    "order_id": "Order ID",
    "date": "Date",
    "amount": "Amount",
    "status": "Status",
    "view_all": "View All",
    "no_recent_orders": "No recent orders to display."
  }
```

- [ ] **Step 2: Add new keys to `de.json`**

```json
  "seller_dashboard": {
    "error_loading": "Dashboard-Daten konnten nicht geladen werden",
    "error_desc": "Bitte stelle sicher, dass du den Verkäufer-Onboarding-Prozess abgeschlossen hast.",
    "title": "Verkäufer-Dashboard",
    "total_sales": "Gesamtumsatz",
    "active_listings": "Aktive Angebote",
    "pending_orders": "Ausstehende Bestellungen",
    "quick_actions": "Schnellzugriff",
    "add_product": "Produkt hinzufügen",
    "manage_orders": "Bestellungen verwalten",
    "recent_orders": "Aktuelle Bestellungen",
    "order_id": "Bestellnummer",
    "date": "Datum",
    "amount": "Betrag",
    "status": "Status",
    "view_all": "Alle ansehen",
    "no_recent_orders": "Keine aktuellen Bestellungen vorhanden."
  }
```

- [ ] **Step 3: Commit i18n changes**

```bash
git add apps/web/messages/en.json apps/web/messages/de.json
git commit -m "i18n: add translations for seller dashboard enhancements"
```

### Task 2: Enhance Seller Dashboard UI

**Files:**
- Modify: `apps/web/app/[locale]/seller/dashboard/page.tsx`

- [ ] **Step 1: Update Imports**
Add necessary UI components and icons.

```typescript
import { 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  AlertCircle, 
  PlusCircle, 
  ListOrdered,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
```

- [ ] **Step 2: Add Quick Actions Section**
Add a section with buttons for "Add Product" and "Manage Orders" before the metrics.

- [ ] **Step 3: Add Recent Orders Table**
Add a "Recent Orders" section with a table displaying `data.recentOrders`.

- [ ] **Step 4: Implement Formatting Helpers**
Ensure currency and date formatting follow the project's patterns.

- [ ] **Step 5: Verify and Commit**
Run build or lint if possible, then commit.

```bash
git add apps/web/app/[locale]/seller/dashboard/page.tsx
git commit -m "feat: enhance seller dashboard with quick actions and recent orders"
```
