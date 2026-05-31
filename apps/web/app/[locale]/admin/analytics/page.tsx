import { requireAuth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign,
  Activity,
  ArrowUpRight
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

async function getAnalyticsData(token: string) {
  const fetchOptions = {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 }
  };
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1";
  
  try {
    const [stats, topProducts, topSellers, events] = await Promise.all([
      fetch(`${baseUrl}/admin/analytics/dashboard`, fetchOptions).then(res => res.json()),
      fetch(`${baseUrl}/admin/analytics/top-products?limit=5`, fetchOptions).then(res => res.json()),
      fetch(`${baseUrl}/admin/analytics/top-sellers?limit=5`, fetchOptions).then(res => res.json()),
      fetch(`${baseUrl}/admin/analytics/events?limit=10`, fetchOptions).then(res => res.json())
    ]);
    
    return { stats, topProducts, topSellers, events };
  } catch (error) {
    return null;
  }
}

export default async function AdminAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const token = await requireAuth();
  const { locale } = await params;
  const data = await getAnalyticsData(token);
  const t = await getTranslations("admin");

  if (!data) return <div>Error loading analytics data.</div>;

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart className="h-8 w-8 text-primary" />
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">In-depth performance metrics and event tracking.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(data.stats.totalRevenueCents)}</div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Successful transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sellers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.activeSellers}</div>
            <p className="text-xs text-muted-foreground">Approved merchants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data.stats.totalOrders / Math.max(data.stats.totalViews, 1) * 100).toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Order/View ratio</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topProducts.map((p: any) => (
                  <TableRow key={p.productId}>
                    <TableCell className="font-medium truncate max-w-[200px]">{p.title}</TableCell>
                    <TableCell className="text-right font-bold">{p._count?.id || p.orderCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Sellers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-blue-500" />
              Top Sellers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topSellers.map((s: any) => (
                  <TableRow key={s.sellerId}>
                    <TableCell className="font-medium">{s.displayName}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">
                      {formatPrice(s.totalRevenueCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Event Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            System Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Context</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.events.items?.map((event: any) => (
                <TableRow key={event.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString(locale)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      {event.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono truncate max-w-[300px]">
                    {JSON.stringify(event.metadata)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
