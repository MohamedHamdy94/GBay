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
import { Badge } from "@/components/ui/badge";
import { Gavel, Clock, Store } from "lucide-react";
import { CancelAuctionButton } from "./cancel-button";

async function getAuctions(token: string, status?: string) {
  try {
    const statusQuery = status ? `&status=${status}` : "";
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1"}/admin/auctions?limit=50${statusQuery}`, {
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

export default async function AdminAuctionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; locale: string }>
}) {
  const token = await requireAuth();
  const params = await searchParams;
  const data = await getAuctions(token, params.status);
  const t = await getTranslations("admin");

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat(params.locale, {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'ENDED': return 'secondary';
      case 'CANCELLED': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Gavel className="h-8 w-8 text-primary" />
            {t("auctions") || "Auctions"}
          </h1>
          <p className="text-muted-foreground mt-1">Monitor and manage all system auctions.</p>
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Current Bid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead className="text-right">{t("actions") || "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No auctions found.
                </TableCell>
              </TableRow>
            ) : (
              data.items?.map((auction: any) => {
                const title = auction.listing?.product?.translations?.find((tr: any) => tr.locale === params.locale)?.title 
                  || auction.listing?.product?.translations?.[0]?.title 
                  || "Untitled";
                
                return (
                  <TableRow key={auction.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{title}</span>
                        <span className="text-xs text-muted-foreground font-mono">{auction.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        <span>{auction.seller?.displayName || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatPrice(auction.currentPriceCents)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(auction.status)}>
                        {auction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(auction.endTime).toLocaleString(params.locale)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {auction.status === 'ACTIVE' && (
                        <CancelAuctionButton auctionId={auction.id} token={token} />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
