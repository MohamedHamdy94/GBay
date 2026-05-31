"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActionState } from "react";
import { addProduct } from "./actions";

export default function NewProductPage() {
  const t = useTranslations("seller_products");
  const [state, formAction, pending] = useActionState(addProduct, { error: null });

  return (
    <div className="container py-8 px-4 md:px-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t("add_new_product") || "Add New Product"}</CardTitle>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-6">
            {state?.error && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/90 rounded-md">
                {state.error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="title">{t("product_title") || "Title"}</Label>
              <Input id="title" name="title" required disabled={pending} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">{t("description") || "Description"}</Label>
              <Input id="description" name="description" required disabled={pending} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">{t("price") || "Price (in Cents)"}</Label>
                <Input id="price" name="price" type="number" min={100} required disabled={pending} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{t("listing_type") || "Listing Type"}</Label>
                <Select name="status" defaultValue="BUY_IT_NOW">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY_IT_NOW">{t("buy_it_now") || "Buy It Now"}</SelectItem>
                    <SelectItem value="AUCTION">{t("auction") || "Auction"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="condition">{t("condition") || "Condition"}</Label>
              <Select name="condition" defaultValue="NEW">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">{t("new") || "New"}</SelectItem>
                  <SelectItem value="LIKE_NEW">{t("like_new") || "Like New"}</SelectItem>
                  <SelectItem value="USED">{t("used") || "Used"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? (t("saving") || "Saving...") : (t("save_product") || "Save Product")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
