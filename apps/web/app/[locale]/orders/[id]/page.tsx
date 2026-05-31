import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  Truck, 
  RotateCcw, 
  AlertTriangle, 
  MessageSquare, 
  ChevronLeft,
  Calendar,
  CreditCard,
  MapPin,
  Store
} from "lucide-react";
import Link from "next/link";

async function getOrder(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("gbay_token")?.value;

  if (!token) return null;

  try {
    const res = await fetchApi(`/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch order detail", error);
    return null;
  }
}

async function getShipment(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("gbay_token")?.value;

  try {
    const res = await fetchApi(`/orders/${id}/shipment`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations("orders");
  const order = await getOrder(id);
  const shipment = await getShipment(id);

  if (!order) {
    const cookieStore = await cookies();
    if (!cookieStore.get("gbay_token")?.value) {
      redirect("/login");
    }
    notFound();
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: order.currency || "EUR",
    }).format(cents / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateStr));
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PAID': return 'default';
      case 'SHIPPED': return 'secondary';
      case 'DELIVERED': return 'outline';
      case 'CANCELLED': return 'destructive';
      case 'RETURN_REQUESTED': return 'warning';
      case 'REFUNDED': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="container py-12 px-4 md:px-6">
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link href="/orders">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("title")}
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Order #{order.id.slice(-8).toUpperCase()}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge className="text-lg py-1 px-4" variant={getStatusVariant(order.status)}>
            {order.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Package className="h-5 w-5" />
                Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex gap-4">
                  <div className="h-20 w-20 bg-muted rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {item.listing?.product?.media?.[0] ? (
                      <img 
                        src={item.listing.product.media[0].url} 
                        alt={item.listing.product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold line-clamp-1">{item.listing?.product?.title}</h4>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    <p className="font-medium mt-1">{formatPrice(item.priceCents)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
            <Separator />
            <CardFooter className="flex flex-col items-end py-4 gap-2">
              <div className="flex justify-between w-full max-w-xs text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.totalAmountCents)}</span>
              </div>
              <div className="flex justify-between w-full max-w-xs text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <Separator className="w-full max-w-xs my-1" />
              <div className="flex justify-between w-full max-w-xs font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(order.totalAmountCents)}</span>
              </div>
            </CardFooter>
          </Card>

          {/* Shipment Tracking */}
          {shipment && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-primary">
                  <Truck className="h-5 w-5" />
                  Shipping & Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Carrier</p>
                    <p className="font-semibold">{shipment.carrier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tracking Number</p>
                    <p className="font-semibold font-mono">{shipment.trackingNumber}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  Track Package
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.status === 'DELIVERED' && (
              <Button variant="outline" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Request Return
              </Button>
            )}
            <Button variant="outline" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Contact Seller
            </Button>
            <Button variant="ghost" className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Report Issue / Open Dispute
            </Button>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{order.shippingAddress?.street}</p>
                  <p>{order.shippingAddress?.city}, {order.shippingAddress?.zip}</p>
                  <p>{order.shippingAddress?.country}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seller Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Store className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{order.seller?.displayName || "GBay Seller"}</p>
                  <Link href={`/seller/${order.sellerId}`} className="text-primary hover:underline text-xs">
                    Visit Store
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Credit Card</p>
                  <p className="text-xs text-muted-foreground italic">
                    GBay Escrow Protected
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
