"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { CheckCircle2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const t = useTranslations("checkout");
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="container py-20 px-4 md:px-6 flex justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
             <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
             </div>
          </div>
          <CardTitle className="text-3xl font-bold text-green-600">{t("order_complete")}</CardTitle>
          <p className="text-muted-foreground mt-2">{t("thank_you")}</p>
        </CardHeader>
        <CardContent className="text-center space-y-6">
           <div className="bg-muted p-4 rounded-lg inline-block w-full max-w-xs">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                {t("order_number")}
              </p>
              <p className="text-lg font-mono font-bold break-all">
                {orderId || "GB-12345-X"}
              </p>
           </div>
           
           <p className="text-sm text-muted-foreground">
             A confirmation email has been sent to your registered email address with all the details of your order.
           </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 pt-6">
           <Button asChild variant="outline" className="w-full sm:flex-1 rounded-full h-12">
              <Link href="/products">
                <ShoppingBag className="mr-2 h-4 w-4" />
                {t("back_to_shop")}
              </Link>
           </Button>
           <Button asChild className="w-full sm:flex-1 rounded-full h-12">
              <Link href="/profile">
                {t("view_orders")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
