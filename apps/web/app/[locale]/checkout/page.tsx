import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, ShieldCheck, CreditCard } from "lucide-react";
import { redirect } from "next/navigation";
import { initiatePayment } from "./actions";

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

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("checkout");
  const cart = await getCart();

  if (!cart || !cart.items || cart.items.length === 0) {
    redirect("/cart");
  }

  const items = cart.items;
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

  return (
    <div className="container py-12 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-8">
          
          <form action={initiatePayment} id="checkout-form" className="space-y-8">
            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  {t("shipping_address")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="street">{t("street")}</Label>
                  <Input id="street" name="street" placeholder="Main St 123" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">{t("city")}</Label>
                  <Input id="city" name="city" placeholder="Berlin" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">{t("state")}</Label>
                  <Input id="state" name="state" placeholder="Berlin" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">{t("zip")}</Label>
                  <Input id="zip" name="zip" placeholder="10115" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">{t("country")}</Label>
                  <Input id="country" name="country" placeholder="Germany" required />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {t("payment_method")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border-2 border-primary bg-primary/5 rounded-lg flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-md">
                         <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Credit Card (Simulation)</p>
                        <p className="text-xs text-muted-foreground">Ending in 4242</p>
                      </div>
                   </div>
                   <div className="h-4 w-4 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                   </div>
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="card">{t("card_placeholder")}</Label>
                    <Input id="card" name="card" placeholder="4242 4242 4242 4242" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">{t("expiry")}</Label>
                      <Input id="expiry" name="expiry" placeholder="12/26" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">{t("cvv")}</Label>
                      <Input id="cvv" name="cvv" placeholder="123" required />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>

        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                 {items.map((item: any) => (
                   <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground line-clamp-1 flex-1 mr-4">
                        {item.quantity}x {item.listing?.product?.title}
                      </span>
                      <span className="font-medium whitespace-nowrap">
                        {formatPrice((item.listing?.buyNowPriceCents || 0) * item.quantity)}
                      </span>
                   </div>
                 ))}
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" form="checkout-form" className="w-full h-12 text-lg rounded-full" size="lg">
                {t("place_order")}
              </Button>
            </CardFooter>
          </Card>
          
          <div className="bg-muted p-4 rounded-xl flex gap-3 items-start">
             <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
             <p className="text-xs text-muted-foreground">
               Your purchase is covered by <strong>GBay Buyer Protection</strong>. If your item doesn't arrive or is significantly different, we'll help you get your money back.
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}
