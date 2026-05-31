"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useActionState } from "react";
import { onboardSeller } from "./actions";

export default function SellerOnboardingPage() {
  const t = useTranslations("onboarding");
  const [state, formAction, pending] = useActionState(onboardSeller, { error: null });

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 md:px-6">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">{t("title") || "Become a Seller"}</CardTitle>
          <CardDescription>{t("desc") || "Start selling your products on GBay. We just need a few details."}</CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            {state?.error && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/90 rounded-md">
                {state.error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="storeName">{t("store_name") || "Store Name"}</Label>
              <Input id="storeName" name="storeName" required disabled={pending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">{t("business_type") || "Business Type"}</Label>
              <Input id="businessType" name="businessType" placeholder="e.g. Individual, LLC" required disabled={pending} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? (t("submitting") || "Submitting...") : (t("submit") || "Submit")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
