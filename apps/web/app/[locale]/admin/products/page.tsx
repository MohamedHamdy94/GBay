import { requireAuth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Ban, Eye } from "lucide-react";
import Link from "next/link";

async function getListings(token: string, searchParams: { [key: string]: string | string[] | undefined }) {
  try {
    const q = searchParams.q ? `&q=${searchParams.q}` : "";
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1"}/admin/listings?limit=50${q}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      next: { revalidate: 0 }
    });
    if (!res.ok) return { items: [] };
    return await res.json();
  } catch (error) {
    return { items: [] };
  }
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const token = await requireAuth();
  const params = await searchParams;
  const data = await getListings(token, params);
  const t = await getTranslations("admin");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("products") || "Products & Listings"}</h1>
          <p className="text-muted-foreground mt-1">Moderate listings and product details.</p>
        </div>
        
        <form className="flex w-full md:max-w-sm items-center space-x-2">
          <Input type="search" name="q" placeholder={t("search") || "Search..."} defaultValue={params.q as string} />
          <Button type="submit" size="icon" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Listing ID</TableHead>
              <TableHead>Seller ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">{t("actions") || "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No listings found.
                </TableCell>
              </TableRow>
            ) : (
              data.items?.map((listing: any) => (
                <TableRow key={listing.id}>
                  <TableCell className="font-mono text-xs">{listing.id}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{listing.sellerId}</TableCell>
                  <TableCell>{listing.type}</TableCell>
                  <TableCell>
                    <Badge variant={
                      listing.status === 'ACTIVE' ? 'default' : 
                      listing.status === 'PENDING_REVIEW' ? 'secondary' : 
                      'outline'
                    }>
                      {listing.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/products/${listing.id}`} target="_blank">
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Ban className="h-4 w-4 mr-1" /> Suspend
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
