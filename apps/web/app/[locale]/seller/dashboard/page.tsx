import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  AlertCircle, 
  PlusCircle, 
  ListOrdered,
  ChevronRight
} from "lucide-react";
import { fetchApi } from "@/lib/api";
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

async function getDashboardData(token: string) {
  try {
    const res = await fetchApi("/seller/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`
      },
      next: { revalidate: 0 } // no cache for dashboard
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Dashboard fetch error", error);
    return null;
  }
}

export default async function SellerDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const token = await requireAuth();
  const data = await getDashboardData(token);
  const t = await getTranslations("seller_dashboard");

  if (!data) {
    return (
      <div className="container py-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold">{t("error_loading") || "Could not load dashboard data"}</h2>
        <p className="text-muted-foreground mt-2">{t("error_desc") || "Please ensure you have completed seller onboarding."}</p>
      </div>
    );
  }

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("title") || "Seller Dashboard"}</h1>
        
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/seller/products/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("add_product") || "Add Product"}
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/seller/orders">
              <ListOrdered className="mr-2 h-4 w-4" />
              {t("manage_orders") || "Manage Orders"}
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t("total_sales") || "Total Sales"}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.metrics?.totalSalesCents || 0)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t("active_listings") || "Active Listings"}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics?.activeListings || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t("pending_orders") || "Pending Orders"}</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics?.pendingOrders || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("recent_orders") || "Recent Orders"}</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/seller/orders" className="flex items-center">
              {t("view_all") || "View All"}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data.recentOrders?.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">{t("order_id") || "Order ID"}</TableHead>
                    <TableHead>{t("date") || "Date"}</TableHead>
                    <TableHead>{t("amount") || "Amount"}</TableHead>
                    <TableHead>{t("status") || "Status"}</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentOrders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        #{order.id.slice(-8).toUpperCase()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(order.createdAt)}</TableCell>
                      <TableCell>{formatCurrency(order.totalAmountCents)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/seller/orders`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              {t("no_recent_orders") || "No recent orders to display."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
