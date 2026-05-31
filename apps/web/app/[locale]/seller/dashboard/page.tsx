import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { Package, ShoppingBag, TrendingUp, AlertCircle } from "lucide-react";
import { fetchApi } from "@/lib/api";

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

export default async function SellerDashboardPage() {
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

  const formatCurrency = (cents: number, currency: string = "USD") => 
    new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);

  return (
    <div className="container py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold tracking-tight mb-8">{t("title") || "Seller Dashboard"}</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
      
      {/* Additional dashboard components can go here */}
    </div>
  );
}
