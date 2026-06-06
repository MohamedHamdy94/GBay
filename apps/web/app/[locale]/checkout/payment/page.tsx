"use client";

import { useEffect, useState, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { confirmOrderAction } from "../actions";

function PaymentContent() {
  const t = useTranslations("checkout");
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    async function processPayment() {
      // Simulate network delay for payment gateway
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      try {
        const result = await confirmOrderAction(sessionId as string);
        if (result.success) {
          setStatus("success");
          // Small delay to show success state before redirecting
          setTimeout(() => {
            router.push(`success?orderId=${result.orderIds?.[0] || ""}`);
          }, 1500);
        } else {
          setStatus("error");
          console.error("Order confirmation failed:", result.error);
        }
      } catch (err) {
        setStatus("error");
        console.error("Error confirming order:", err);
      }
    }

    processPayment();
  }, [router, sessionId]);

  return (
    <div className="container min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-none shadow-none bg-transparent">
        <CardContent className="flex flex-col items-center text-center space-y-6 pt-6">
          {status === "processing" && (
            <>
              <div className="relative">
                <div className="h-24 w-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className="h-10 w-10 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">{t("processing_payment")}</h1>
                <p className="text-muted-foreground text-sm max-w-[280px]">
                  {t("please_wait")}
                </p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in duration-300">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">{t("payment_success")}</h1>
                <p className="text-muted-foreground text-sm">
                  {t("redirecting")}
                </p>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center">
                <div className="h-12 w-12 rounded-full border-4 border-destructive flex items-center justify-center">
                   <span className="text-2xl font-bold text-destructive">!</span>
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-destructive">Payment Failed</h1>
                <p className="text-muted-foreground text-sm">
                  Something went wrong. Please try again or contact support.
                </p>
                <button 
                  onClick={() => router.push("../checkout")}
                  className="mt-4 text-primary font-medium hover:underline"
                >
                  Return to Checkout
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
