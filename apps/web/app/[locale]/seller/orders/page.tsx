import { requireAuth } from "@/lib/auth";
import { fetchApi } from "@/lib/api";
import { getTranslations } from "next-intl/server";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ShipOrderButton } from "./ship-button";

async function getOrders(token: string) {
  const res = await fetchApi("/seller/orders", {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 }
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function SellerOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const token = await requireAuth();
  const orders = await getOrders(token);
  const t = await getTranslations("seller_orders");

  const formatCurrency = (cents: number, currency: string = "EUR") => 
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);

  return (
    <div className="container py-8 px-4 md:px-6">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href={`/${locale}/seller/dashboard`}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("back_to_dashboard") || "Back to Dashboard"}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{t("title") || "Seller Orders"}</h1>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table_id") || "Order ID"}</TableHead>
              <TableHead className="whitespace-nowrap">{t("table_date") || "Date"}</TableHead>
              <TableHead>{t("table_total") || "Total"}</TableHead>
              <TableHead>{t("table_status") || "Status"}</TableHead>
              <TableHead className="text-right">{t("table_actions") || "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length > 0 ? (
              orders.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id.slice(-8).toUpperCase()}</TableCell>
                  <TableCell className="whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString(locale)}</TableCell>
                  <TableCell>{formatCurrency(order.totalAmountCents, order.currency)}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === 'PAID' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status === 'PAID' && (
                      <ShipOrderButton orderId={order.id} />
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {t("no_orders") || "No orders found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
