import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Hammer, Users } from "lucide-react";

async function getAuctions() {
  try {
    const res = await fetchApi("/auctions", { next: { revalidate: 10 } });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch auctions", error);
    return [];
  }
}

export default async function AuctionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("auctions");
  const auctions = await getAuctions();

  const formatPrice = (cents: number, currency: string = "EUR") => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(cents / 100);
  };

  return (
    <div className="container py-12 px-4 md:px-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-primary/10 p-3 rounded-full">
          <Hammer className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("anti_sniping")}</p>
        </div>
      </div>

      {auctions.length === 0 ? (
        <div className="text-center py-24 bg-muted/30 rounded-lg border-2 border-dashed">
          <Hammer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("no_auctions")}</h2>
          <Button asChild className="mt-4">
            <Link href="/products">{t("view_all", { ns: "home" })}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction: any) => (
            <Card key={auction.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted relative overflow-hidden">
                {auction.listing?.product?.media?.[0] ? (
                  <img
                    src={auction.listing.product.media[0].url}
                    alt={auction.listing.product.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Hammer className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                <Badge className="absolute top-3 right-3 bg-red-500 hover:bg-red-600">
                  LIVE
                </Badge>
              </div>

              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xl line-clamp-1">
                  <Link href={`/auctions/${auction.id}`} className="hover:text-primary">
                    {auction.listing?.product?.title || "Untitled Auction"}
                  </Link>
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {auction._count?.bids || 0} {t("bids")}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(auction.endTime).toLocaleDateString(locale)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("current_bid")}</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(auction.currentPriceCents, auction.currency)}
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/auctions/${auction.id}`}>{t("view_auction")}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
