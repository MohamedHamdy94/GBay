import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ProductCard, type Product } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/api";

async function searchProducts(searchParams: { [key: string]: string | string[] | undefined }): Promise<{ items: Product[], total: number }> {
  const query = new URLSearchParams();
  if (searchParams.q) query.set("q", String(searchParams.q));
  if (searchParams.category) query.set("categoryId", String(searchParams.category));
  if (searchParams.status) query.set("status", String(searchParams.status));
  
  try {
    const res = await fetchApi(`/catalog/products?${query.toString()}`, {
      next: { revalidate: 30 }
    });
    if (!res.ok) return { items: [], total: 0 };
    const data = await res.json();
    return { 
      items: Array.isArray(data) ? data : [], 
      total: Array.isArray(data) ? data.length : 0 
    };
  } catch (error) {
    console.error("Failed to fetch products", error);
    return { items: [], total: 0 };
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations("products");
  const data = await searchProducts(resolvedSearchParams);
  
  return (
    <div className="container py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 space-y-6">
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="q">{t("search") || "Search"}</Label>
              <Input 
                id="q" 
                name="q" 
                defaultValue={resolvedSearchParams.q as string} 
                placeholder={t("search_placeholder") || "Search items..."} 
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t("status") || "Listing Type"}</Label>
              <Select name="status" defaultValue={(resolvedSearchParams.status as string) || "all"}>
                <SelectTrigger>
                  <SelectValue placeholder={t("all_types") || "All Types"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all_types") || "All Types"}</SelectItem>
                  <SelectItem value="AUCTION">{t("auction") || "Auction"}</SelectItem>
                  <SelectItem value="BUY_IT_NOW">{t("buy_it_now") || "Buy It Now"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full">{t("apply_filters") || "Apply Filters"}</Button>
          </form>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold tracking-tight">
              {t("title") || "Products"} <span className="text-muted-foreground text-lg font-normal">({data.total})</span>
            </h1>
            
            <Select defaultValue="newest">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("sort_by") || "Sort by"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("sort_newest") || "Newest Arrivals"}</SelectItem>
                <SelectItem value="price_asc">{t("price_low_high") || "Price: Low to High"}</SelectItem>
                <SelectItem value="price_desc">{t("price_high_low") || "Price: High to Low"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {data.items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-muted/20">
              <h3 className="text-xl font-medium mb-2">{t("no_results") || "No products found"}</h3>
              <p className="text-muted-foreground mb-6">
                {t("no_results_desc") || "Try adjusting your filters or search query."}
              </p>
              <Button asChild variant="outline">
                <Link href="/products">{t("clear_filters") || "Clear Filters"}</Link>
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
