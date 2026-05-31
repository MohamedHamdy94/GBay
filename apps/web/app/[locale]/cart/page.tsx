import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { cookies } from "next/headers";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { fetchApi } from "@/lib/api";
import { redirect } from "next/navigation";

async function getCart() {
  const cookieStore = await cookies();
  const token = cookieStore.get("gbay_token")?.value;
  const session = cookieStore.get("gbay_session")?.value;

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (session) headers["Cookie"] = `gbay_session=${session}`;

  try {
    const res = await fetchApi("/cart", { headers, next: { revalidate: 0 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch cart", error);
    return null;
  }
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("cart");
  const ct = await getTranslations("common");
  const cart = await getCart();

  const items = cart?.items || [];
  
  // Calculate total from items
  const subtotal = items.reduce((acc: number, item: any) => {
    const price = item.listing?.buyNowPriceCents || 0;
    return acc + (price * item.quantity);
  }, 0);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  if (items.length === 0) {
    return (
      <div className="container py-24 flex flex-col items-center justify-center text-center px-4">
        <div className="bg-muted p-6 rounded-full mb-6">
          <ShoppingCart className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-2">{t("empty")}</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          {t("empty_desc")}
        </p>
        <Button asChild size="lg" className="rounded-full">
          <Link href="/products">{t("start_shopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-12 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item: any) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4 flex gap-4">
                <div className="h-24 w-24 bg-muted rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                   {item.listing?.product?.media?.[0] ? (
                     <img 
                       src={item.listing.product.media[0].url} 
                       alt={item.listing.product.title}
                       className="h-full w-full object-cover"
                     />
                   ) : (
                     <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
                   )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">
                        <Link href={`/products/${item.listing?.productId}`} className="hover:text-primary">
                          {item.listing?.product?.title || "Product"}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.listing?.condition || "New"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(item.listing?.buyNowPriceCents || 0)}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center border rounded-md">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-r">
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-l">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("remove")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("shipping")}</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>{t("total")}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full h-12 text-lg rounded-full" size="lg">
                <Link href="/checkout">
                  {t("checkout")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex gap-4">
             <div className="bg-primary/10 p-2 rounded-full h-fit">
               <ArrowRight className="h-5 w-5 text-primary" />
             </div>
             <div>
               <h4 className="font-semibold text-sm">Secure Checkout</h4>
               <p className="text-xs text-muted-foreground mt-1">
                 Your data is protected by industry-standard encryption.
               </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
