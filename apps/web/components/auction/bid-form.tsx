"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Hammer, Loader2 } from "lucide-react";

interface BidFormProps {
  auctionId: string;
  minBidCents: number;
  currency: string;
  locale: string;
  onSuccess?: () => void;
}

export function BidForm({ auctionId, minBidCents, currency, locale, onSuccess }: BidFormProps) {
  const t = useTranslations("auctions");
  const { toast } = useToast();
  const [amount, setAmount] = useState<string>("");
  const [isProxy, setIsProxy] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(cents / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountCents) || amountCents < minBidCents) {
      toast({
        title: t("bid_error"),
        description: t("min_bid", { amount: formatPrice(minBidCents) }),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get token from cookie (client side)
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("gbay_token="))
        ?.split("=")[1];

      if (!token) {
        toast({
          title: t("bid_error"),
          description: "Please login to place a bid",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const res = await fetchApi(`/auctions/${auctionId}/bid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amountCents,
          isProxy,
          idempotencyKey: crypto.randomUUID(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || t("bid_error"));
      }

      toast({
        title: t("bid_success"),
        description: `Your bid of ${formatPrice(amountCents)} has been placed.`,
      });
      
      setAmount("");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: t("bid_error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bid-amount">{t("bid_amount")}</Label>
        <div className="relative">
          <Input
            id="bid-amount"
            type="number"
            step="0.01"
            placeholder={formatPrice(minBidCents)}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            className="pl-8"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            €
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("min_bid", { amount: formatPrice(minBidCents) })}
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="proxy-bid"
          checked={isProxy}
          onCheckedChange={(checked) => setIsProxy(checked === true)}
          disabled={loading}
        />
        <Label
          htmlFor="proxy-bid"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("use_proxy")}
        </Label>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("bidding")}
          </>
        ) : (
          <>
            <Hammer className="mr-2 h-4 w-4" />
            {t("place_bid")}
          </>
        )}
      </Button>
    </form>
  );
}
