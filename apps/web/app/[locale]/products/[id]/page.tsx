import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, ShieldCheck, Heart, Gavel } from "lucide-react";
import type { Product } from "@/components/product-card";
import type { Metadata, ResolvingMetadata } from "next";
import { ProductJsonLd } from "@/components/structured-data/product-jsonld";
import { fetchApi } from "@/lib/api";

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetchApi(`/catalog/products/${id}`, {
      next: { revalidate: 30 }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch product", error);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string; locale: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const title = product.title;
  const description = product.description?.substring(0, 160);
  const images = product.mainImage ? [product.mainImage] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
    },
  };
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string, locale: string }>
}) {
  const { id } = await params;
  const product = await getProduct(id);
  
  if (!product) {
    notFound();
  }

  const t = await getTranslations("product");

  const activeListing = product.listings?.[0];
  const priceCents = activeListing?.buyNowPriceCents || 0;
  const currency = activeListing?.currency || "EUR";

  const formattedPrice = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency,
  }).format(priceCents / 100);

  const isAuction = product.status === 'AUCTION';

  return (
    <>
      <ProductJsonLd product={product} />
      <div className="container py-8 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-2xl overflow-hidden relative border shadow-sm flex items-center justify-center">
              {product.mainImage ? (
                <img 
                  src={product.mainImage} 
                  alt={product.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-muted-foreground">{t("no_image") || "No Image Available"}</span>
              )}
              {isAuction && (
                <Badge className="absolute top-4 left-4 text-sm px-3 py-1 bg-accent text-accent-foreground">
                  {t("live_auction") || "Live Auction"}
                </Badge>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="uppercase tracking-wider">
                  {product.condition}
                </Badge>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Heart className="h-5 w-5" />
                </Button>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {product.title}
              </h1>
              <p className="text-3xl font-semibold text-primary pt-2">
                {formattedPrice}
              </p>
            </div>

            <Separator />

            <div className="prose prose-sm dark:prose-invert">
              <h3 className="text-lg font-semibold">{t("description") || "Description"}</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            <Separator />

            <div className="space-y-4 pt-4">
              {isAuction ? (
                <div className="space-y-4 p-4 border rounded-xl bg-muted/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{t("current_bid") || "Current Bid"}</span>
                    <span className="text-xl font-bold">{formattedPrice}</span>
                  </div>
                  <div className="flex gap-4">
                    <Button size="lg" className="flex-1 text-lg">
                      <Gavel className="mr-2 h-5 w-5" /> {t("place_bid") || "Place Bid"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Button size="lg" className="flex-1 text-lg">
                    {t("buy_now") || "Buy It Now"}
                  </Button>
                  <Button size="lg" variant="secondary" className="flex-1 text-lg">
                    <ShoppingCart className="mr-2 h-5 w-5" /> {t("add_to_cart") || "Add to Cart"}
                  </Button>
                </div>
              )}
            </div>

            <Card className="mt-8 bg-muted/10">
              <CardContent className="p-4 flex items-center space-x-4">
                <ShieldCheck className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-semibold">{t("buyer_protection") || "GBay Buyer Protection"}</p>
                  <p className="text-sm text-muted-foreground">{t("buyer_protection_desc") || "Get the exact item you ordered, or your money back."}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
