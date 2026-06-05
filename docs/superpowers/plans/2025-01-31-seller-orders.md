# Seller Orders Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a dedicated page for sellers to manage their orders, including status filtering and marking orders as shipped with tracking information.

**Architecture:** A server-side rendered page for listing orders with client-side components for filtering and action modals. Server actions will handle status updates.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, next-intl.

---

### Task 1: Add i18n Translations

**Files:**
- Modify: `apps/web/messages/en.json`
- Modify: `apps/web/messages/de.json`

- [ ] **Step 1: Update `en.json`**

Add `seller_orders` section:
```json
  "seller_orders": {
    "title": "Manage Orders",
    "back_to_dashboard": "Back to Dashboard",
    "filter_all": "All",
    "filter_pending": "Pending",
    "filter_shipped": "Shipped",
    "filter_delivered": "Delivered",
    "filter_cancelled": "Cancelled",
    "table_id": "Order ID",
    "table_date": "Date",
    "table_customer": "Customer",
    "table_total": "Total",
    "table_status": "Status",
    "table_actions": "Actions",
    "mark_shipped": "Mark as Shipped",
    "view_details": "View Details",
    "no_orders": "No orders found.",
    "ship_order_title": "Ship Order",
    "ship_order_desc": "Enter tracking information for order {orderId}",
    "carrier": "Carrier",
    "tracking_number": "Tracking Number",
    "confirm_ship": "Confirm Shipment",
    "cancel": "Cancel",
    "shipping_success": "Order marked as shipped",
    "shipping_error": "Failed to update order status"
  }
```

- [ ] **Step 2: Update `de.json`**

Add `seller_orders` section (translated):
```json
  "seller_orders": {
    "title": "Bestellungen verwalten",
    "back_to_dashboard": "Zurück zum Dashboard",
    "filter_all": "Alle",
    "filter_pending": "Ausstehend",
    "filter_shipped": "Versandt",
    "filter_delivered": "Geliefert",
    "filter_cancelled": "Storniert",
    "table_id": "Bestell-ID",
    "table_date": "Datum",
    "table_customer": "Kunde",
    "table_total": "Gesamt",
    "table_status": "Status",
    "table_actions": "Aktionen",
    "mark_shipped": "Als versandt markieren",
    "view_details": "Details anzeigen",
    "no_orders": "Keine Bestellungen gefunden.",
    "ship_order_title": "Bestellung versenden",
    "ship_order_desc": "Geben Sie die Tracking-Informationen für Bestellung {orderId} ein",
    "carrier": "Versandunternehmen",
    "tracking_number": "Sendungsnummer",
    "confirm_ship": "Versand bestätigen",
    "cancel": "Abbrechen",
    "shipping_success": "Bestellung als versandt markiert",
    "shipping_error": "Fehler beim Aktualisieren des Bestellstatus"
  }
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/messages/en.json apps/web/messages/de.json
git commit -m "i18n: add seller orders translations"
```

### Task 2: Create Ship Order Dialog Component

**Files:**
- Create: `apps/web/components/seller/ship-order-dialog.tsx`

- [ ] **Step 1: Implement the Dialog component**

```tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { markOrderAsShipped } from "@/app/[locale]/seller/orders/actions";
import { useToast } from "@/hooks/use-toast";

interface ShipOrderDialogProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShipOrderDialog({ orderId, isOpen, onClose }: ShipOrderDialogProps) {
  const t = useTranslations("seller_orders");
  const { toast } = useToast();
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    setIsLoading(true);
    try {
      const result = await markOrderAsShipped(orderId, carrier, trackingNumber);
      if (result.success) {
        toast({ title: t("shipping_success") });
        onClose();
      } else {
        toast({ title: t("shipping_error"), variant: "destructive" });
      }
    } catch (error) {
      toast({ title: t("shipping_error"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("ship_order_title")}</DialogTitle>
          <DialogDescription>
            {t("ship_order_desc", { orderId: orderId.slice(-8).toUpperCase() })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="carrier">{t("carrier")}</Label>
            <Input
              id="carrier"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="e.g. DHL, UPS"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trackingNumber">{t("tracking_number")}</Label>
            <Input
              id="trackingNumber"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. 1Z999AA10123456784"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !carrier || !trackingNumber}>
            {isLoading ? "..." : t("confirm_ship")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/seller/ship-order-dialog.tsx
git commit -m "feat: add ShipOrderDialog component"
```

### Task 3: Create Server Actions

**Files:**
- Create: `apps/web/app/[locale]/seller/orders/actions.ts`

- [ ] **Step 1: Implement `markOrderAsShipped` action**

```ts
"use server";

import { fetchApi } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function markOrderAsShipped(orderId: string, carrier: string, trackingNumber: string) {
  const token = await requireAuth();

  try {
    const res = await fetchApi(`/seller/orders/${orderId}/ship`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ carrier, trackingNumber }),
    });

    if (!res.ok) {
      return { success: false };
    }

    revalidatePath("/[locale]/seller/orders", "page");
    return { success: true };
  } catch (error) {
    console.error("Error shipping order:", error);
    return { success: false };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/[locale]/seller/orders/actions.ts
git commit -m "feat: add seller orders server actions"
```

### Task 4: Create Seller Orders Page

**Files:**
- Create: `apps/web/app/[locale]/seller/orders/page.tsx`

- [ ] **Step 1: Implement the Orders Page component**

```tsx
import { requireAuth } from "@/lib/auth";
import { fetchApi } from "@/lib/api";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { OrderRowActions } from "./order-row-actions";

async function getOrders(token: string) {
  try {
    const res = await fetchApi("/seller/orders", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Orders fetch error", error);
    return [];
  }
}

export default async function SellerOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const token = await requireAuth();
  const orders = await getOrders(token);
  const t = await getTranslations("seller_orders");

  const formatCurrency = (cents: number, currency: string = "EUR") =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
    }).format(new Date(dateStr));
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PAID': return 'default';
      case 'SHIPPED': return 'secondary';
      case 'DELIVERED': return 'outline';
      case 'CANCELLED': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="container py-8 px-4 md:px-6">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/seller/dashboard">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("back_to_dashboard")}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          {orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">{t("table_id")}</TableHead>
                  <TableHead>{t("table_date")}</TableHead>
                  <TableHead>{t("table_customer")}</TableHead>
                  <TableHead>{t("table_total")}</TableHead>
                  <TableHead>{t("table_status")}</TableHead>
                  <TableHead className="text-right pr-6">{t("table_actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium pl-6">
                      #{order.id.slice(-8).toUpperCase()}
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>{order.user?.email || "N/A"}</TableCell>
                    <TableCell>{formatCurrency(order.totalAmountCents)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <OrderRowActions order={order} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              {t("no_orders")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Create `OrderRowActions` component**

Create: `apps/web/app/[locale]/seller/orders/order-row-actions.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShipOrderDialog } from "@/components/seller/ship-order-dialog";
import { useTranslations } from "next-intl";

export function OrderRowActions({ order }: { order: any }) {
  const [isShipDialogOpen, setIsShipDialogOpen] = useState(false);
  const t = useTranslations("seller_orders");

  return (
    <div className="flex justify-end gap-2">
      {order.status === "PAID" && (
        <Button size="sm" onClick={() => setIsShipDialogOpen(true)}>
          {t("mark_shipped")}
        </Button>
      )}
      <ShipOrderDialog
        orderId={order.id}
        isOpen={isShipDialogOpen}
        onClose={() => setIsShipDialogOpen(false)}
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/[locale]/seller/orders/page.tsx apps/web/app/[locale]/seller/orders/order-row-actions.tsx
git commit -m "feat: implement seller orders page"
```

### Task 5: Final Verification

- [ ] **Step 1: Check build**

Run: `npm run build --workspace=apps/web`
Expected: Success

- [ ] **Step 2: Verify page access**

Manual check: Navigate to `/seller/orders` and verify the table and "Mark as Shipped" functionality (if test data is available).
