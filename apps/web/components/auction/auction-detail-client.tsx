"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuctionSocket } from "@/hooks/use-auction-socket";
import { BidForm } from "./bid-form";
import { CountdownTimer } from "./countdown-timer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Hammer, Users, Trophy, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AuctionDetailClientProps {
  initialAuction: any;
  locale: string;
}

export function AuctionDetailClient({ initialAuction, locale }: AuctionDetailClientProps) {
  const t = useTranslations("auctions");
  const [auction, setAuction] = useState(initialAuction);
  const { lastBid, newEndTime, isEnded, winner, watchers } = useAuctionSocket(initialAuction.id);

  useEffect(() => {
    if (lastBid) {
      setAuction((prev: any) => ({
        ...prev,
        currentPriceCents: lastBid.amountCents,
        bids: [lastBid, ...(prev.bids || [])],
        _count: {
          ...prev._count,
          bids: (prev._count?.bids || 0) + 1,
        },
      }));
    }
  }, [lastBid]);

  useEffect(() => {
    if (newEndTime) {
      setAuction((prev: any) => ({
        ...prev,
        endTime: newEndTime,
      }));
    }
  }, [newEndTime]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: auction.currency || "EUR",
    }).format(cents / 100);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  const minNextBid = auction.currentPriceCents + 100; // Simplified min increment

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Product Images & Info */}
      <div className="lg:col-span-2 space-y-8">
        <div className="aspect-video bg-muted rounded-xl overflow-hidden border">
          {auction.listing?.product?.media?.[0] ? (
            <img
              src={auction.listing.product.media[0].url}
              alt={auction.listing.product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Hammer className="h-24 w-24 text-muted-foreground/30" />
            </div>
          )}
        </div>

        <Tabs defaultValue="description">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="description">{t("description", { ns: "product" })}</TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              {t("history")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="py-4">
            <div className="prose dark:prose-invert max-w-none">
              <p>{auction.listing?.product?.description || "No description provided."}</p>
            </div>
          </TabsContent>
          <TabsContent value="history" className="py-4">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">{t("bidder")}</th>
                    <th className="px-4 py-2 text-right">{t("amount")}</th>
                    <th className="px-4 py-2 text-right">{t("time")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {auction.bids?.length > 0 ? (
                    auction.bids.map((bid: any) => (
                      <tr key={bid.id}>
                        <td className="px-4 py-2">
                          {bid.bidder?.firstName ? `${bid.bidder.firstName} ***` : "Anonymous"}
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          {formatPrice(bid.amountCents)}
                        </td>
                        <td className="px-4 py-2 text-right text-muted-foreground text-xs">
                          {formatDate(bid.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground italic">
                        {t("no_bids")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right: Bidding Sidebar */}
      <div className="space-y-6">
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-start mb-2">
              <Badge variant={isEnded ? "secondary" : "destructive"}>
                {isEnded ? t("auction_ended") : "LIVE"}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{watchers} {t("watchers")}</span>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">
              {auction.listing?.product?.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {auction.listing?.condition || "New"}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">{t("current_bid")}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black text-primary">
                  {formatPrice(auction.currentPriceCents)}
                </p>
                <p className="text-sm text-muted-foreground">
                  [{auction._count?.bids || 0} {t("bids")}]
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("ends_in")}</p>
              <CountdownTimer endTime={auction.endTime} />
            </div>

            <Separator />

            {isEnded ? (
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg flex items-center gap-4">
                <Trophy className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-bold text-green-700">{t("auction_ended")}</p>
                  <p className="text-lg font-black">{formatPrice(auction.currentPriceCents)}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <BidForm
                  auctionId={auction.id}
                  minBidCents={minNextBid}
                  currency={auction.currency}
                  locale={locale}
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {t("anti_sniping")}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security/Trust Box */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4 flex gap-4">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Hammer className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{t("buyer_protection", { ns: "product" })}</p>
              <p className="text-xs text-muted-foreground">
                {t("buyer_protection_desc", { ns: "product" })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
