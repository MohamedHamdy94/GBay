import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

async function getOrders() {
  const cookieStore = await cookies();
  const token = cookieStore.get("gbay_token")?.value;

  if (!token) return null;

  try {
    const res = await fetchApi("/order/buyer", {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch orders", error);
    return [];
  }
}

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("orders");
  const orders = await getOrders();

  if (orders === null) {
    redirect("/login");
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

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
    <div className="container py-12 px-4 md:px-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
      </div>

      {orders.length === 0 ? (
        <Card className="py-12 flex flex-col items-center justify-center text-center">
           <Package className="h-12 w-12 text-muted-foreground mb-4" />
           <h2 className="text-xl font-semibold mb-2">{t("no_orders")}</h2>
           <Button asChild variant="outline" className="mt-4">
             <Link href="/products">Start Shopping</Link>
           </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-muted p-3 rounded-full">
                       <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Order #{order.id.slice(-8).toUpperCase()}</span>
                        <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(order.createdAt)}
                        </span>
                        <span>{order.items?.length || 0} {t("items")}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-8">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{t("total")}</p>
                      <p className="font-bold text-lg">{formatPrice(order.totalAmountCents)}</p>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                       <Link href={`/orders/${order.id}`}>
                         <ChevronRight className="h-5 w-5" />
                       </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
