import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { fetchApi } from "@/lib/api";

async function getSellerProducts(token: string) {
  try {
    const res = await fetchApi("/catalog/listings", {
      headers: {
        Authorization: `Bearer ${token}`
      },
      next: { revalidate: 0 }
    });
    if (!res.ok) return { items: [] };
    const data = await res.json();
    // we assume data.items are returned, filtering client-side or server side if it didn't filter
    return data;
  } catch (error) {
    console.error("Products fetch error", error);
    return { items: [] };
  }
}

export default async function SellerProductsPage() {
  const token = await requireAuth();
  const data = await getSellerProducts(token);
  const t = await getTranslations("seller_products");

  return (
    <div className="container py-8 px-4 md:px-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("title") || "Manage Products"}</h1>
        <Button asChild>
          <Link href="/seller/products/new">
            <Plus className="h-4 w-4 mr-2" /> {t("add_product") || "Add Product"}
          </Link>
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("product_name") || "Product Name"}</TableHead>
              <TableHead>{t("status") || "Status"}</TableHead>
              <TableHead>{t("type") || "Type"}</TableHead>
              <TableHead className="text-right">{t("price") || "Price"}</TableHead>
              <TableHead className="text-right">{t("actions") || "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  {t("no_products") || "You haven't added any products yet."}
                </TableCell>
              </TableRow>
            ) : (
              data.items?.map((product: any) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.title}</TableCell>
                  <TableCell>
                    <Badge variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{product.isAuction ? 'Auction' : 'Fixed Price'}</TableCell>
                  <TableCell className="text-right">
                    {(product.priceCents / 100).toFixed(2)} {product.currency || 'USD'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/seller/products/${product.id}/edit`}>{t("edit") || "Edit"}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
