import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ProductCard, type Product } from "@/components/product-card";
import { ArrowRight, ShoppingBag, ShieldCheck, Zap } from "lucide-react";
import { fetchApi } from "@/lib/api";

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await fetchApi("/catalog/products?limit=4", {
      next: { revalidate: 60 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data || [];
  } catch (error) {
    console.error("Failed to fetch featured products", error);
    return [];
  }
}

async function getRecommendations(type: string): Promise<Product[]> {
  try {
    const res = await fetchApi(`/recommendations?type=${type}&limit=4`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error(`Failed to fetch ${type} recommendations`, error);
    return [];
  }
}

export default async function HomePage() {
  const t = await getTranslations("home");
  const products = await getFeaturedProducts();
  const trending = await getRecommendations("trending");
  const recommended = await getRecommendations("history");

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/20 py-24 md:py-32 lg:py-40 border-b">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
              {t("hero_title") || "Discover Extraordinary Items on GBay"}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              {t("hero_subtitle") || "The marketplace where quality meets passion. From rare collectibles to everyday essentials, find exactly what you're looking for or start selling to a global audience."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg" asChild>
                <Link href="/products">
                  {t("start_shopping") || "Start Shopping"} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full" asChild>
                <Link href="/seller/dashboard">
                  {t("become_seller") || "Become a Seller"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">{t("feature_variety_title") || "Endless Variety"}</h3>
              <p className="text-muted-foreground">{t("feature_variety_desc") || "Millions of items across thousands of categories."}</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">{t("feature_trust_title") || "Trusted Platform"}</h3>
              <p className="text-muted-foreground">{t("feature_trust_desc") || "Secure payments, escrow services, and buyer protection."}</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">{t("feature_fast_title") || "Fast & Easy"}</h3>
              <p className="text-muted-foreground">{t("feature_fast_desc") || "Smooth checkout and transparent shipping processes."}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24 bg-muted/30 border-t border-b">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold tracking-tight">{t("featured_products") || "Featured Products"}</h2>
            <Button variant="ghost" className="hidden sm:flex" asChild>
              <Link href="/products">
                {t("view_all") || "View All"} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-background rounded-xl border">
              <h3 className="text-lg font-medium">{t("no_products") || "No featured products available at the moment."}</h3>
            </div>
          )}
        </div>
      </section>

      {/* Trending Section */}
      {trending.length > 0 && (
        <section className="py-16 md:py-24 bg-background border-b">
          <div className="container px-4 md:px-6">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-bold tracking-tight">Trending Now</h2>
              <Button variant="ghost" className="hidden sm:flex" asChild>
                <Link href="/products">
                  {t("view_all") || "View All"} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {trending.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recommended for You Section */}
      {recommended.length > 0 && (
        <section className="py-16 md:py-24 bg-primary/5 border-b">
          <div className="container px-4 md:px-6">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-bold tracking-tight">Recommended for You</h2>
              <Button variant="ghost" className="hidden sm:flex" asChild>
                <Link href="/products">
                  {t("view_all") || "View All"} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {recommended.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
