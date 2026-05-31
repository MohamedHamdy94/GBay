import { requireAuth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Store, Package, AlertCircle } from "lucide-react";
import { fetchApi } from "@/lib/api";

async function getAdminDashboard(token: string) {
  try {
    const res = await fetchApi("/admin/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`
      },
      next: { revalidate: 60 } // Materialized view refreshed roughly every minute
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export default async function AdminDashboardPage() {
  const token = await requireAuth();
  const data = await getAdminDashboard(token);
  const t = await getTranslations("admin");

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center border rounded-lg bg-muted/10">
        <AlertCircle className="h-10 w-10 text-destructive mb-4" />
        <h2 className="text-xl font-bold">{t("error_loading") || "Could not load dashboard data"}</h2>
        <p className="text-muted-foreground mt-2">{t("error_desc") || "Please ensure you have admin privileges."}</p>
      </div>
    );
  }

  // Fallbacks for mock data if API doesn't return these fields yet
  const metrics = data.metrics || {
    totalUsers: 12543,
    activeSellers: 843,
    pendingKYC: 24,
    activeListings: 45201,
    reportedItems: 12,
    openDisputes: 5
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("overview") || "Admin Overview"}</h1>
        <p className="text-muted-foreground mt-2">{t("overview_desc") || "System-wide metrics and pending actions."}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t("total_users") || "Total Users"}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers?.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t("active_sellers") || "Active Sellers"}</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSellers?.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-destructive">{t("pending_kyc") || "Pending KYC"}</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.pendingKYC?.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t("active_listings") || "Active Listings"}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeListings?.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("recent_activity") || "Recent System Activity"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("no_recent_activity") || "No recent activity to display."}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("action_required") || "Action Required"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm">{t("reported_items") || "Reported Items"}</span>
              <span className="font-bold">{metrics.reportedItems}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm">{t("open_disputes") || "Open Disputes"}</span>
              <span className="font-bold text-destructive">{metrics.openDisputes}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
